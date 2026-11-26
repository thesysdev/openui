"use client";

import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/react-dom";
import type { DataSources, SourceTarget } from "@openuidev/react-lang";
import clsx from "clsx";
import { ArrowLeft, Layers } from "lucide-react";
import {
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../components/ThemeProvider";
import { SourceDetail, sourceEntry, SourceList } from "../SourcesContents/ComponentSources";
import { componentLabel, type Describe } from "../SourcesContents/describe";
import { sourceIndex } from "../SourcesContents/sourceIndex";
import { anchorOf, POPOVER, ProvenanceContext, useArtifactProvenance } from "./contexts";
import { focusBack } from "./focus";
import { SourcesOverlay } from "./SourcesOverlay";
import { popoverNames, popoverStyles } from "./sourcesPopover.styles";

/** Longer than its exit will be, in case `transitionend` never comes. */
const EXIT_MS = 300;

/** What can take focus inside the popover, for its focus trap. */
const TABBABLE =
  "button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex='-1'])";

/**
 * CSS anchor positioning with try fallbacks (Chrome and Edge 125+, Safari 26; not Firefox yet).
 * Without it the popover falls back to floating-ui.
 */
function supportsAnchoring() {
  return (
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("anchor-name: --a") &&
    CSS.supports("position-try-fallbacks: flip-block")
  );
}

/** What the popover shows: its component, and the source open in it. Kept through its exit. */
interface Shown {
  target: SourceTarget;
  source: string | null;
}

/**
 * The selected component's Sources popover: anchored to its outlined element, a modal dialog
 * named after it. Its Sources chip, at its top-left corner, closes it from the list and goes
 * back to the list from a source. It stays mounted through its exit, `data-state="closed"`,
 * inert and hidden, so motion can play before it unmounts.
 */
export function SourcesPopover({
  describeSource,
  custom,
  onCustomHost,
}: {
  describeSource?: Describe;
  /** The app's own contents replace the list and detail: they go in this host. */
  custom: boolean;
  onCustomHost: (host: HTMLElement | null) => void;
}) {
  const provenance = useContext(ProvenanceContext)!;
  const { popover, setPopoverSource, closePopover, focusToggle, renderedIds } = provenance.internal;
  const { selection, sources, isInspecting } = useArtifactProvenance();
  const open = popover !== null && selection !== null;

  // Mounted while open, and through the exit, showing what it showed last.
  const [shown, setShown] = useState<Shown | null>(null);
  if (open && (shown?.target !== selection || shown.source !== popover.source)) {
    setShown({ target: selection, source: popover.source });
  }
  useEffect(() => {
    if (open || !shown) return;
    const timer = setTimeout(() => setShown(null), EXIT_MS);
    return () => clearTimeout(timer);
  }, [open, shown]);

  // Focus goes back to the component on close, or to the Sources toggle once inspect mode ended.
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const inspecting = useRef(isInspecting);
  inspecting.current = isInspecting;
  const returnTo = useRef<{ component: Element; opener?: Element | null } | null>(null);
  if (open) returnTo.current = { component: anchorOf(selection), opener: popover.returnTo };
  useEffect(() => {
    if (open || !root) return;
    const focused = document.activeElement;
    if (focused && focused !== document.body && !root.contains(focused)) return;
    if (inspecting.current) focusBack(returnTo.current?.component ?? null);
    else if (returnTo.current?.opener?.isConnected) focusBack(returnTo.current.opener);
    else focusToggle();
  }, [open, root, focusToggle]);

  if (!shown || !sources) return null;
  return (
    <Popover
      key={shown.target.id}
      shown={shown}
      open={open}
      sources={sources}
      describeSource={describeSource}
      custom={custom}
      onCustomHost={onCustomHost}
      renderedIds={renderedIds}
      onRoot={setRoot}
      onExited={() => setShown(null)}
      onOpenSource={setPopoverSource}
      onDismiss={closePopover}
      onChip={() => (shown.source !== null ? setPopoverSource(null) : closePopover())}
    />
  );
}

function Popover({
  shown,
  open,
  sources,
  describeSource,
  custom,
  onCustomHost,
  renderedIds,
  onRoot,
  onExited,
  onOpenSource,
  onDismiss,
  onChip,
}: {
  shown: Shown;
  open: boolean;
  sources: DataSources;
  describeSource?: Describe;
  custom: boolean;
  onCustomHost: (host: HTMLElement | null) => void;
  /** The components that render an element, found through React's tree as inspect mode finds them. */
  renderedIds: () => ReadonlySet<string>;
  onRoot: (root: HTMLElement | null) => void;
  onExited: () => void;
  onOpenSource: (name: string | null) => void;
  /** A click on the blur around it. */
  onDismiss: () => void;
  onChip: () => void;
}) {
  const { portalThemeClassName } = useTheme();
  const { target, source } = shown;
  const anchor = anchorOf(target);
  const [anchored] = useState(supportsAnchoring);
  const label = componentLabel(sources, target.id) ?? target.id;
  const value = target.propElement?.textContent?.trim() || undefined;

  const entries = useMemo(() => {
    const rendered = renderedIds();
    const index = sourceIndex(sources, { renders: (id) => rendered.has(id) });
    const names = index.components.get(target.id)?.sources ?? [];
    return names.flatMap((name) => {
      const each = index.sources.get(name);
      return each ? [sourceEntry(each, sources, describeSource)] : [];
    });
  }, [sources, target.id, renderedIds, describeSource]);
  const entry = source !== null ? entries.find((each) => each.name === source) : undefined;
  const view = entry ? `source\u0000${entry.name}` : "list";

  // Which way the view moved, for its motion: into a source is forward, back to the list is back.
  const travel = useRef<{ view: string; direction?: "forward" | "back"; from?: string }>({ view });
  if (travel.current.view !== view) {
    travel.current = {
      view,
      direction: view === "list" ? "back" : "forward",
      from: travel.current.view.startsWith("source") ? travel.current.view.slice(7) : undefined,
    };
  }

  // Focus moves in on open, and follows the view: a source's heading, or back on the list, the
  // row it came from (else the first).
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const element = ref.current;
    if (!element) return;
    const from = travel.current.from;
    const focus =
      element.querySelector<HTMLElement>("[data-heading]") ??
      (from ? element.querySelector<HTMLElement>(`[data-source="${CSS_ESCAPE(from)}"]`) : null) ??
      element.querySelector<HTMLElement>("[data-source]") ??
      element.querySelector<HTMLElement>(TABBABLE) ??
      element;
    focus.focus({ preventScroll: true });
  }, [open, view]);

  // The card grows out of its chip and shrinks back into it: its motion clips the card to the
  // chip's box, read here (in the card's coordinates) as the chip's label changes.
  const chip = useRef<HTMLButtonElement | null>(null);
  useLayoutEffect(() => {
    const card = ref.current;
    const face = chip.current;
    if (!card || !face) return;
    const set = (name: string, px: number) => card.style.setProperty(name, `${px}px`);
    set("--openui-sources-chip-x", face.offsetLeft);
    set("--openui-sources-chip-y", face.offsetTop);
    set("--openui-sources-chip-width", face.offsetWidth);
    set("--openui-sources-chip-height", face.offsetHeight);
  }, [view]);

  // Focus stays inside: Tab and Shift+Tab wrap around its controls.
  const trap = (event: ReactKeyboardEvent) => {
    if (event.key !== "Tab" || !ref.current) return;
    const tabbable = [...ref.current.querySelectorAll<HTMLElement>(TABBABLE)];
    if (!tabbable.length) {
      event.preventDefault();
      return;
    }
    const first = tabbable[0]!;
    const last = tabbable[tabbable.length - 1]!;
    const at = document.activeElement;
    const inside = at instanceof HTMLElement && tabbable.includes(at);
    if (event.shiftKey && (at === first || !inside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (at === last || !inside)) {
      event.preventDefault();
      first.focus();
    }
  };

  const setRef = (element: HTMLDivElement | null) => {
    ref.current = element;
    onRoot(element);
  };

  const body: ReactNode = custom ? (
    <div ref={onCustomHost} className={clsx(popoverStyles.custom, popoverNames.custom)} />
  ) : (
    <div
      key={view}
      className={clsx(popoverStyles.view, popoverNames.view)}
      data-view={entry ? "source" : "list"}
      data-direction={travel.current.direction}
    >
      {entry ? (
        <SourceDetail entry={entry} />
      ) : entries.length ? (
        <SourceList entries={entries} onOpen={onOpenSource} />
      ) : (
        <p>This is written in the program, not read from data.</p>
      )}
    </div>
  );

  const frame: FrameProps = {
    anchor,
    setRef,
    open,
    className: clsx(popoverStyles.root, popoverNames.root, portalThemeClassName),
    attributes: {
      role: "dialog",
      "aria-modal": true,
      "aria-label": `Sources for ${label}`,
      "aria-hidden": open ? undefined : true,
      inert: !open || undefined,
      [POPOVER]: "",
      "data-state": open ? "open" : "closed",
      onKeyDown: trap,
      onTransitionEnd: (event) => {
        if (!open && event.target === event.currentTarget) onExited();
      },
      onAnimationEnd: (event) => {
        if (!open && event.target === event.currentTarget) onExited();
      },
    },
    children: (
      <>
        <header className={clsx(popoverStyles.header, popoverNames.header)}>
          <button
            ref={chip}
            type="button"
            className={clsx(popoverStyles.chip, popoverNames.chip)}
            aria-label={entry ? "Back to all sources" : "Close Sources"}
            data-chip={entry ? "back" : "close"}
            onClick={onChip}
          >
            {/* Keyed, so a swap between the two plays its motion; not on open, which has its own. */}
            <span
              key={entry ? "back" : "close"}
              className={clsx(popoverStyles.chipFace, popoverNames.chipFace)}
              data-swapped={travel.current.direction ? "" : undefined}
            >
              {entry ? <ArrowLeft aria-hidden /> : <Layers aria-hidden />}
              <span>{entry ? "All sources" : "Sources"}</span>
            </span>
          </button>
          <span className={clsx(popoverStyles.meta, popoverNames.meta)}>
            {label}
            {value && (
              <>
                {" · "}
                <b>{value}</b>
              </>
            )}
          </span>
        </header>
        <hr className={clsx(popoverStyles.divider, popoverNames.divider)} />
        <div className={clsx(popoverStyles.body, popoverNames.body)}>{body}</div>
      </>
    ),
  };
  return (
    <>
      <SourcesOverlay
        anchor={anchor}
        open={open}
        themeClassName={portalThemeClassName}
        onDismiss={onDismiss}
      />
      {createPortal(
        anchored ? <AnchoredFrame {...frame} /> : <FloatingFrame {...frame} />,
        document.body,
      )}
    </>
  );
}

const CSS_ESCAPE = (value: string) =>
  typeof CSS !== "undefined" && typeof CSS.escape === "function"
    ? CSS.escape(value)
    : value.replace(/["\\]/g, "\\$&");

interface FrameProps {
  anchor: Element;
  setRef: (element: HTMLDivElement | null) => void;
  open: boolean;
  className: string;
  attributes: HTMLAttributes<HTMLDivElement> & Record<string, unknown>;
  children: ReactNode;
}

/**
 * Placed by the browser: the anchor gets a unique `anchor-name` while the popover shows, and the
 * popover sits above its top-left corner, trying the fallbacks in the styles when clipped. Its
 * position never goes through `transform`, which its motion will animate.
 */
function AnchoredFrame({ anchor, setRef, className, attributes, children }: FrameProps) {
  const name = `--openui-sources-popover-${useId().replace(/[^\w-]/g, "")}`;
  useLayoutEffect(() => {
    if (!(anchor instanceof HTMLElement || anchor instanceof SVGElement)) return;
    const { style } = anchor;
    const previous = style.getPropertyValue("anchor-name");
    const priority = style.getPropertyPriority("anchor-name");
    style.setProperty("anchor-name", name);
    return () => {
      if (previous) style.setProperty("anchor-name", previous, priority);
      else style.removeProperty("anchor-name");
    };
  }, [anchor, name]);
  return (
    <div
      ref={setRef}
      {...attributes}
      className={clsx(className, popoverStyles.anchored)}
      style={{ positionAnchor: name } as CSSProperties}
    >
      {children}
    </div>
  );
}

/** Placed by floating-ui, through `top` and `left`, with the same preferences. */
function FloatingFrame({ anchor, setRef, open, className, attributes, children }: FrameProps) {
  const { refs, floatingStyles, placement } = useFloating({
    strategy: "fixed",
    placement: "top-start",
    transform: false,
    open,
    elements: { reference: anchor },
    middleware: [
      offset(8),
      flip({ fallbackPlacements: ["top-end", "bottom-start", "bottom-end"], padding: 8 }),
      shift({ padding: 8, crossAxis: true }),
    ],
    whileElementsMounted: autoUpdate,
  });
  return (
    <div
      ref={(element) => {
        refs.setFloating(element);
        setRef(element);
      }}
      {...attributes}
      className={className}
      style={floatingStyles}
      data-placement={placement}
    >
      {children}
    </div>
  );
}
