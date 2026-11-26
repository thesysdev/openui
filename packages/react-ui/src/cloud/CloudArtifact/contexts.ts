import type { ArtifactBuildStep, ArtifactSummary } from "@openuidev/react-headless";
import type { DataSources, OpenUIError, SourceTarget } from "@openuidev/react-lang";
import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { ArtifactError } from "./errors";

/**
 * The renderer's state and controls, from `useArtifactRenderer()`. `isOwner`
 * and `isEditable` are undefined until the storage says.
 */
export interface ArtifactRendererState extends Pick<ArtifactSummary, "isOwner" | "isEditable"> {
  id: string | null;
  title?: string;
  /** Nothing to show yet: the tool call that makes it is still running, or the build hasn't started writing it. */
  isPending: boolean;
  /** The artifact's content is being generated. */
  isStreaming: boolean;
  /** Its data tools are running. */
  isFetching: boolean;
  /** Any of the three. */
  isLoading: boolean;
  /**
   * What a dashboard being built is doing, until it starts writing: the data tools it called and
   * the scripts it's saving.
   */
  step?: ArtifactBuildStep;
  /** A newer version finished streaming in over the one on screen in the last few seconds. */
  justUpdated: boolean;
  /** Why the artifact can't be shown (`source: "artifact"`), or a data tool's failure (`source: "query"`). */
  error: ArtifactError | OpenUIError | null;
  /** Retries what failed. Undefined when there's nothing to retry. */
  retry?: () => void;
  /** Whether the artifact is open from its preview. */
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** `true` with a preview card; `false` in standalone mode. */
  preview: boolean;
}

export const RendererStateContext = createContext<ArtifactRendererState | null>(null);

/**
 * The renderer's state and controls. Call it anywhere inside an artifact
 * renderer, such as in a slot's children.
 *
 * @category Hooks
 */
export function useArtifactRenderer(): ArtifactRendererState {
  const state = useContext(RendererStateContext);
  if (!state) {
    throw new Error("useArtifactRenderer() must be called inside an artifact renderer.");
  }
  return state;
}

/** How the `Content` slot renders the artifact itself. Set by each renderer. */
export interface ContentConfig {
  render: () => ReactNode;
  /** Nothing to show yet: the first content hasn't arrived. */
  isEmpty: boolean;
}

export const ContentConfigContext = createContext<ContentConfig | null>(null);

/** Values a region passes down to its default parts, when given as props. */
export interface PreviewOverrides {
  title?: string;
  description?: string;
}
export interface ChromeOverrides {
  title?: string;
  actions?: ReactNode;
}

export const PreviewOverridesContext = createContext<PreviewOverrides>({});
export const ChromeOverridesContext = createContext<ChromeOverrides>({});

/** The regions a slot sits in. Parts only render inside their own region. */
export type Region = "preview" | "chrome" | "content";

export const RegionContext = createContext<ReadonlySet<Region>>(new Set());

// ─── Provenance ──────────────────────────────────────────────────────────

/** Inspect mode, the selected component and where data comes from, from `useArtifactProvenance()`. */
export interface ArtifactProvenanceState {
  /**
   * While on, every data-bound component is outlined and in the tab order, and a click (or Enter)
   * on one selects it and opens its Sources popover beside it. The dashboard itself doesn't act.
   */
  isInspecting: boolean;
  /**
   * Turning it on closes the All sources menu; turning it off closes any Sources popover and
   * clears the selection.
   */
  setInspecting: (on: boolean) => void;
  /**
   * The data-bound component, and the prop it's outlined on, last picked in inspect mode. It
   * stays after its popover closes, and stays solid until another component is hovered.
   */
  selection: SourceTarget | null;
  /** Clears the selection, closing its popover. */
  clearSelection: () => void;
  /** Whether a data-bound component's Sources popover is open. */
  isPopoverOpen: boolean;
  /**
   * Whether the All sources menu is open. (`useArtifactRenderer().isOpen` is the dashboard's.)
   * Only one of the two is open at a time.
   */
  isAllSourcesOpen: boolean;
  /**
   * Opens the All sources menu, closing any popover, e.g. from your own toolbar's button. It
   * opens under that button, and focus goes back to it on close.
   */
  openAllSources: () => void;
  /**
   * Where the program's data comes from: every component's sources and every query, with live
   * values. Null unless inspecting, something is selected or the menu is open.
   */
  sources: DataSources | null;
}

/** A value with listeners: a write re-renders only its readers. */
export interface ValueStore<T> {
  get: () => T;
  set: (next: T) => void;
  subscribe: (listener: () => void) => () => void;
}

function createValueStore<T>(initial: T): ValueStore<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next) => {
      if (next === value) return;
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

/**
 * Where the bridge inside `Renderer` puts the sources. A store, not the root's state: a write
 * re-renders only `useArtifactProvenance()` readers, never the root or `Renderer`, so it can't
 * loop back to the bridge.
 */
export type SourcesStore = ValueStore<DataSources | null>;

export const createSourcesStore = (): SourcesStore => createValueStore<DataSources | null>(null);

/** The selected item's Sources popover, while open. */
export interface PopoverState {
  /** The source open in it, by name; null on its list of sources. */
  source: string | null;
  /**
   * Where focus goes on close outside inspect mode, where the component takes none: what opened
   * the All sources menu, for a popover opened from its Used by.
   */
  returnTo?: Element | null;
}

/** On the Sources popover's element: an Escape inside it steps back through the popover. */
export const POPOVER = "data-openui-sources-popover";

/** The All sources menu, while open. */
export interface MenuState {
  /** The source open in it, by name; null on its list. */
  source: string | null;
  /** What opened it: the menu sits under it, and focus goes back to it on close. */
  opener: Element | null;
}

/** On the All sources menu's element: an Escape inside it steps back through the menu. */
export const MENU = "data-openui-sources-menu";

/** What only the renderer's own parts use, kept out of `useArtifactProvenance()`. */
export interface ProvenanceInternals {
  /** Where the bridge writes the sources. */
  sourcesStore: SourcesStore;
  /** The selection's popover; null when closed. */
  popover: PopoverState | null;
  /** In the open popover, opens a source's detail, or (null) goes back to the list. */
  setPopoverSource: (name: string | null) => void;
  /** Closes the popover, keeping inspect mode and the selection. */
  closePopover: () => void;
  /** The All sources menu; null when closed. */
  menu: MenuState | null;
  /** In the open menu, opens a source's detail, or (null) goes back to the list. */
  setMenuSource: (name: string | null) => void;
  /** Closes the menu, keeping inspect mode. */
  closeMenu: () => void;
  /**
   * A Used by link: closes the menu, scrolls the component into view and opens its popover on
   * `source`, whether or not inspect mode is on, which stays as it was.
   */
  openUsedBy: (id: string, source: string) => void;
  /** The ids of the program's components that render an element on the page right now. */
  renderedIds: () => ReadonlySet<string>;
  /** Moves focus to the Sources toggle, or off the page's elements if there is none. */
  focusToggle: () => void;
}

/** The renderer's provenance state: the public fields, and its parts' `internal` ones. */
export interface ProvenanceContextValue extends Omit<ArtifactProvenanceState, "sources"> {
  internal: ProvenanceInternals;
}

/** Where a pick shows on the page: its marked prop's element, else the component's. */
export const anchorOf = (target: SourceTarget): Element => target.propElement ?? target.element;

/** Null when `enableProvenance` is off. */
export const ProvenanceContext = createContext<ProvenanceContextValue | null>(null);

const noop = () => {};
const INERT_PROVENANCE: ArtifactProvenanceState = Object.freeze({
  isInspecting: false,
  setInspecting: noop,
  selection: null,
  clearSelection: noop,
  isPopoverOpen: false,
  isAllSourcesOpen: false,
  openAllSources: noop,
  sources: null,
});
const INERT_STORE = createSourcesStore();
const getNoSources = () => null;

/**
 * Inspect mode, the selection and where the program's data comes from, for a live artifact with
 * `enableProvenance`. Call it inside the renderer, such as in a slot's children. With provenance
 * off it returns an inert state: not inspecting, nothing selected, and setters that do nothing.
 *
 * @category Hooks
 */
export function useArtifactProvenance(): ArtifactProvenanceState {
  const provenance = useContext(ProvenanceContext);
  const store = provenance?.internal.sourcesStore ?? INERT_STORE;
  const sources = useSyncExternalStore(store.subscribe, store.get, getNoSources);
  return useMemo(() => {
    if (!provenance) return INERT_PROVENANCE;
    const { internal: _internal, ...state } = provenance;
    return { ...state, sources };
  }, [provenance, sources]);
}
