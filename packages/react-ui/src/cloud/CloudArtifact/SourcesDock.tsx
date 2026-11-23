"use client";

import { readSourceTarget, type SourceTarget } from "@openuidev/react-lang";
import { Database } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DataSourcesPanel } from "../DataSourcesPanel";
import { dockNames, dockStyles } from "../DataSourcesPanel/dataSourcesPanel.styles";
import type { DataSourcesPanelProps } from "../DataSourcesPanel/types";
import { ProvenanceContext, useArtifactProvenance } from "./contexts";

/** What an app can tell the default Sources panel, through the `Provenance` slot's props. */
export type SourcesOptions = Pick<DataSourcesPanelProps, "describeSource">;

interface DockState {
  options: SourcesOptions;
  setOptions: (options: SourcesOptions) => void;
  /** An app passed its own panel to `Provenance`: the default one steps aside. */
  custom: number;
  setCustom: (update: (count: number) => number) => void;
}

export const SourcesDockContext = createContext<DockState | null>(null);

const NO_OPTIONS: SourcesOptions = {};
const INTERACTIVE = "button, a, input, select, textarea, [role=combobox], [role=menu]";

interface Chip {
  target: SourceTarget;
  x: number;
  y: number;
}

/**
 * The artifact's content with the Sources panel docked beside it. With inspect mode off, clicking
 * a marked number offers "See source", which turns inspect mode on and selects that number.
 */
export function SourcesWorkspace({ children }: { children: ReactNode }) {
  const provenance = useContext(ProvenanceContext);
  const rootRef = useRef<HTMLDivElement>(null);
  const [options, setOptions] = useState<SourcesOptions>(NO_OPTIONS);
  const [custom, setCustom] = useState(0);
  const dock = useMemo<DockState>(
    () => ({ options, setOptions, custom, setCustom }),
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
      if (!(event.target as Element).closest(`.${dockNames.chip}`)) dismiss();
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

  // "See source": inspect mode on, then the same click on the number selects it, as a click in
  // inspect mode does. Two frames, so the renderer's inspect handlers are attached first.
  const seeSource = () => {
    if (!provenance || !chip) return;
    const element = chip.target.propElement ?? chip.target.element;
    provenance.setInspecting(true);
    setChip(null);
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })),
      ),
    );
  };

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
            <button type="button" onClick={seeSource}>
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
  const { selection, sources, clearSelection, isInspecting, setInspecting } =
    useArtifactProvenance();

  // A closed panel takes no focus or clicks. (`inert` as an attribute works in React 18 and 19.)
  const slotRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    slotRef.current?.toggleAttribute("inert", !isInspecting);
  }, [isInspecting]);

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

  const panelSelection = useMemo(
    () => (selection ? { id: selection.id, prop: selection.prop } : null),
    [selection],
  );

  return (
    <div
      ref={slotRef}
      className={`${dockStyles.slot} ${dockNames.slot}`}
      data-open={isInspecting}
      aria-hidden={!isInspecting}
    >
      <DataSourcesPanel
        sources={sources}
        selection={panelSelection}
        onBack={clearSelection}
        onClose={close}
        describeSource={dock.options.describeSource}
      />
    </div>
  );
}
