"use client";

import { readSourceTarget, type SourceTarget } from "@openuidev/react-lang";
import { Database } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { DataSourcesPanel } from "../DataSourcesPanel";
import { dockNames, dockStyles } from "../DataSourcesPanel/dataSourcesPanel.styles";
import { collectSources, humanize } from "../DataSourcesPanel/describe";
import type { DataSourcesComponent, DataSourcesPanelProps } from "../DataSourcesPanel/types";
import { ProvenanceContext, useArtifactProvenance, useProvenanceIndex } from "./contexts";

/** What an app can tell the default Sources panel, through the `Provenance` slot's props. */
export type SourcesOptions = Pick<
  DataSourcesPanelProps,
  "describeSource" | "scriptInputs" | "runCall"
>;

interface DockState {
  options: SourcesOptions;
  setOptions: (options: SourcesOptions) => void;
  /** An app passed its own panel to `Provenance`: the default one steps aside. */
  custom: number;
  setCustom: (update: (count: number) => number) => void;
  rootRef: RefObject<HTMLDivElement | null>;
}

export const SourcesDockContext = createContext<DockState | null>(null);

const NO_OPTIONS: SourcesOptions = {};

/** A component's name for people: its title, label or name prop, else its type. */
function labelOf(props: Record<string, unknown>, typeName: string) {
  for (const key of ["title", "label", "name"]) {
    const value = props[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return humanize(typeName);
}

function descriptionOf(props: Record<string, unknown>) {
  for (const key of ["subtitle", "hint", "description"]) {
    const value = props[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

/** The figure worth echoing: one short line, such as a KPI value. */
function shortText(element: Element | null | undefined) {
  const text = element?.textContent?.trim() ?? "";
  return text.length > 0 && text.length <= 32 && !text.includes("\n") ? text : undefined;
}

const INTERACTIVE = "button, a, input, select, textarea, [role=combobox], [role=menu]";

const unmark = (el: Element) => {
  el.removeAttribute("data-openui-inspectable");
  el.removeAttribute("data-openui-frame");
};

/** Marks each component's root on the dashboard while inspecting, and finds one by id. */
function useInspectables(rootRef: RefObject<HTMLDivElement | null>, active: boolean) {
  const elements = useRef(new Map<string, Element>());
  useEffect(() => {
    const root = rootRef.current;
    if (!active || !root) return;
    const content = root.querySelector(".openui-artifact-content");
    if (!content) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const scan = () => {
      const found = new Map<string, Element>();
      for (const el of content.querySelectorAll("*")) {
        const target = readSourceTarget(el, root);
        if (target && target.element === el && !found.has(target.id)) found.set(target.id, el);
      }
      for (const [id, el] of elements.current) {
        if (found.get(id) !== el) unmark(el);
      }
      for (const [id, el] of found) el.setAttribute("data-openui-inspectable", id);
      // A component frames itself only when it holds no other component and no marked number.
      for (const el of found.values()) {
        const holds = el.querySelector("[data-openui-inspectable], [data-openui-prop]");
        el.toggleAttribute("data-openui-frame", !holds);
      }
      elements.current = found;
    };
    scan();
    // Charts redraw often; scan again once the dashboard settles.
    const observer = new MutationObserver((records) => {
      if (records.every((record) => record.attributeName?.startsWith("data-openui-"))) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(scan, 150);
    });
    observer.observe(content, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
      for (const el of elements.current.values()) unmark(el);
      elements.current = new Map();
    };
  }, [rootRef, active]);
  return elements;
}

/** The label that follows the pointer while inspecting: what a click would show. */
function HoverTip({ setterRef }: { setterRef: RefObject<((tip: Tip | null) => void) | null> }) {
  const [tip, setTip] = useState<Tip | null>(null);
  useLayoutEffect(() => {
    setterRef.current = setTip;
    return () => {
      setterRef.current = null;
    };
  }, [setterRef]);
  if (!tip) return null;
  return (
    <div
      className={`${dockStyles.tip} ${dockNames.tip}`}
      role="tooltip"
      style={{ left: tip.x, top: tip.y }}
    >
      {tip.text}
    </div>
  );
}

interface Tip {
  text: string;
  x: number;
  y: number;
}

interface Chip {
  target: SourceTarget;
  x: number;
  y: number;
}

/**
 * The artifact's content with the Sources panel docked beside it. While inspecting, every
 * component is framed, the pointer shows what it reads, and the panel lists the sources or shows
 * the selected component's. With inspect mode off, clicking a number offers "See source".
 */
export function SourcesWorkspace({ children }: { children: ReactNode }) {
  const provenance = useContext(ProvenanceContext);
  const rootRef = useRef<HTMLDivElement>(null);
  const [options, setOptions] = useState<SourcesOptions>(NO_OPTIONS);
  const [custom, setCustom] = useState(0);
  const dock = useMemo<DockState>(
    () => ({ options, setOptions, custom, setCustom, rootRef }),
    [options, custom],
  );
  const inspecting = provenance?.isInspecting ?? false;
  const [chip, setChip] = useState<Chip | null>(null);

  // A number clicked with inspect mode off: offer its source.
  const onClick = useCallback(
    (event: React.MouseEvent) => {
      if (!provenance || inspecting) return;
      const element = event.target as Element;
      if (element.closest(INTERACTIVE) || window.getSelection()?.toString().trim()) return;
      const target = readSourceTarget(event.target, rootRef.current);
      if (!target?.propElement || !/\d/.test(target.propElement.textContent ?? "")) return;
      setChip({ target, x: event.clientX, y: event.clientY });
    },
    [provenance, inspecting],
  );
  useEffect(() => {
    if (!chip) return;
    const marked = chip.target.propElement;
    marked?.setAttribute("data-openui-picked", "");
    const dismiss = () => setChip(null);
    const outside = (event: PointerEvent) => {
      if (!(event.target as Element).closest(".openui-data-sources-chip")) dismiss();
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && dismiss();
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("pointerdown", outside);
    window.addEventListener("keydown", escape);
    return () => {
      marked?.removeAttribute("data-openui-picked");
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("pointerdown", outside);
      window.removeEventListener("keydown", escape);
    };
  }, [chip]);
  useEffect(() => {
    if (inspecting) setChip(null);
  }, [inspecting]);

  if (!provenance) return <>{children}</>;
  return (
    <SourcesDockContext.Provider value={dock}>
      <div
        ref={rootRef}
        className={`${dockStyles.workspace} ${dockNames.workspace}`}
        data-inspecting={inspecting || undefined}
        onClick={onClick}
      >
        {children}
        {custom === 0 && <DefaultSourcesDock />}
        {chip && (
          <div
            role="toolbar"
            aria-label="Selected value actions"
            className={`${dockStyles.chip} ${dockNames.chip}`}
            style={{
              left: Math.min(chip.x, window.innerWidth - 140),
              top: Math.max(8, chip.y - 48),
            }}
          >
            <button
              type="button"
              onClick={() => {
                provenance.setInspecting(true);
                provenance.select(chip.target);
                setChip(null);
              }}
            >
              <Database size={16} aria-hidden />
              See source
            </button>
          </div>
        )}
      </div>
    </SourcesDockContext.Provider>
  );
}

/** The Sources panel in its slot: docked, an overlay when narrow, a bottom sheet on phones. */
function DefaultSourcesDock() {
  const dock = useContext(SourcesDockContext)!;
  const provenance = useContext(ProvenanceContext)!;
  const { selection, sources, clearSelection, isInspecting, setInspecting } =
    useArtifactProvenance();
  const index = useProvenanceIndex();
  const { describeSource, scriptInputs, runCall } = dock.options;
  const elements = useInspectables(dock.rootRef, isInspecting);
  // A closed panel takes no focus or clicks. (`inert` as an attribute works in React 18 and 19.)
  const slotRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    slotRef.current?.toggleAttribute("inert", !isInspecting);
  }, [isInspecting]);

  const components = useMemo<DataSourcesComponent[]>(
    () =>
      index.components.map((entry) => ({
        id: entry.id,
        label: labelOf(entry.props, entry.typeName),
        description: descriptionOf(entry.props),
        typeName: entry.typeName,
        queries: entry.queries,
      })),
    [index.components],
  );

  const panelSelection = useMemo(() => {
    if (!selection) return null;
    const value =
      shortText(selection.propElement) ??
      shortText(selection.element.querySelector("[data-openui-prop]"));
    return { id: selection.id, prop: selection.prop, value };
  }, [selection]);

  const select = useCallback(
    (id: string) => {
      const root = dock.rootRef.current;
      const element =
        elements.current.get(id) ??
        root?.querySelector(`[data-openui-source="${CSS.escape(id)}"]:not([data-openui-prop])`);
      if (!element) return;
      provenance.select({ id, element });
      element.scrollIntoView({ block: "center", behavior: "smooth" });
    },
    [dock.rootRef, elements, provenance],
  );

  const close = useCallback(() => {
    setInspecting(false);
    clearSelection();
  }, [setInspecting, clearSelection]);

  useEffect(() => {
    if (!isInspecting) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) close();
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [isInspecting, close]);

  // The pointer label: the component and its first source.
  const tipRef = useRef<((tip: Tip | null) => void) | null>(null);
  const describeRef = useRef<(id: string) => string>(() => "");
  useLayoutEffect(() => {
    const all = collectSources(index.queries, components, describeSource);
    describeRef.current = (id) => {
      const component = components.find((item) => item.id === id);
      const first = component?.queries[0];
      if (!first) return "Computed in the dashboard";
      const source = all.find((item) => item.statementId === first);
      const label = source ? `${source.title} · ${source.kind}` : humanize(first);
      const more = (component?.queries.length ?? 0) - 1;
      return more > 0 ? `${label} +${more}` : label;
    };
  });
  useEffect(() => {
    const root = dock.rootRef.current;
    if (!isInspecting || !root) return;
    const move = (event: MouseEvent) => {
      const target = (event.target as Element).closest(".openui-data-sources-panel")
        ? null
        : readSourceTarget(event.target, root);
      tipRef.current?.(
        target
          ? { text: describeRef.current(target.id), x: event.clientX, y: event.clientY }
          : null,
      );
    };
    const leave = () => tipRef.current?.(null);
    root.addEventListener("mousemove", move, { passive: true });
    root.addEventListener("mouseleave", leave);
    // A click picks: the panel answers, so the label steps aside until the pointer moves.
    root.addEventListener("pointerdown", leave);
    return () => {
      root.removeEventListener("mousemove", move);
      root.removeEventListener("mouseleave", leave);
      root.removeEventListener("pointerdown", leave);
      leave();
    };
  }, [dock.rootRef, isInspecting]);

  return (
    <>
      <div
        ref={slotRef}
        className={`${dockStyles.slot} ${dockNames.slot}`}
        data-open={isInspecting}
        aria-hidden={!isInspecting}
      >
        <DataSourcesPanel
          queries={index.queries}
          components={components}
          selection={panelSelection}
          sources={sources}
          onSelect={select}
          onClearSelection={clearSelection}
          onClose={close}
          describeSource={describeSource}
          scriptInputs={scriptInputs}
          runCall={runCall}
        />
      </div>
      {isInspecting && <HoverTip setterRef={tipRef} />}
    </>
  );
}
