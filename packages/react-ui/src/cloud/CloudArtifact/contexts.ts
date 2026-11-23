import type { DataSources, OpenUIError, SourceTarget } from "@openuidev/react-lang";
import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { ArtifactError } from "./errors";

/** The renderer's state and controls, from `useArtifactRenderer()`. */
export interface ArtifactRendererState {
  id: string | null;
  title?: string;
  /** No artifact yet: the tool call that makes it is still running. */
  isPending: boolean;
  /** The artifact's content is being generated. */
  isStreaming: boolean;
  /** Its data tools are running. */
  isFetching: boolean;
  /** Any of the three. */
  isLoading: boolean;
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

/** Where the program's data comes from: `useDataSources()`. Null until something reads it. */
export type ProvenanceSources = DataSources | null;

/** Inspect mode, the selected component and where data comes from, from `useArtifactProvenance()`. */
export interface ArtifactProvenanceState {
  /** While on, a click on a component selects it instead of acting. */
  isInspecting: boolean;
  setInspecting: (on: boolean) => void;
  /** The component, and prop, last clicked in inspect mode, or passed to `select`. */
  selection: SourceTarget | null;
  /**
   * Select a component by id, as a click does. One with no element on screen, such as a chart's
   * series or a hidden branch, selects the component it is in; an unknown id does nothing.
   */
  select: (id: string) => void;
  /** Each component's elements on screen, by id, e.g. to frame them all. One scan per call. */
  getElements: () => Map<string, Element[]>;
  clearSelection: () => void;
  /**
   * Where the program's data comes from: every component's and query's sources, both ways, with
   * live values. Null unless inspecting or something is selected.
   */
  sources: ProvenanceSources;
}

/**
 * Where the bridge inside `Renderer` puts the sources. A store, not the root's state: a write
 * re-renders only `useArtifactProvenance()` readers, never the root or `Renderer`, so it can't
 * loop back to the bridge.
 */
export interface SourcesStore {
  get: () => ProvenanceSources;
  set: (next: ProvenanceSources) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createSourcesStore(): SourcesStore {
  let value: ProvenanceSources = null;
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

/** The renderer's provenance state: the public fields, and the store the bridge writes. */
export interface ProvenanceContextValue extends Omit<ArtifactProvenanceState, "sources"> {
  sourcesStore: SourcesStore;
}

/** Null when `enableProvenance` is off. */
export const ProvenanceContext = createContext<ProvenanceContextValue | null>(null);

const noop = () => {};
const INERT_PROVENANCE: ArtifactProvenanceState = Object.freeze({
  isInspecting: false,
  setInspecting: noop,
  selection: null,
  select: noop,
  getElements: () => new Map(),
  clearSelection: noop,
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
  const store = provenance?.sourcesStore ?? INERT_STORE;
  const sources = useSyncExternalStore(store.subscribe, store.get, getNoSources);
  return useMemo(() => {
    if (!provenance) return INERT_PROVENANCE;
    const { sourcesStore: _store, ...state } = provenance;
    return { ...state, sources };
  }, [provenance, sources]);
}
