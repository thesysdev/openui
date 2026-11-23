import type {
  DataSourceIndex,
  DataSources,
  OpenUIError,
  SourceTarget,
} from "@openuidev/react-lang";
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

/** Where the selected component's data comes from: `useDataSources` for its statement. */
export type ProvenanceSources = DataSources | null;

/** Inspect mode and the selected component, from `useArtifactProvenance()`. */
export interface ArtifactProvenanceState {
  /** While on, a click on a component selects it instead of acting. */
  isInspecting: boolean;
  setInspecting: (on: boolean) => void;
  /** The component, and prop, last clicked in inspect mode. */
  selection: SourceTarget | null;
  clearSelection: () => void;
  /** Where the selection's data comes from. Null without a selection. */
  sources: ProvenanceSources;
}

/** The sources the bridge inside `Renderer` found, for the selection with this id. */
interface ResolvedSources {
  id?: string;
  sources: ProvenanceSources;
}

/**
 * Where the bridge puts the sources it finds. A store, not the root's state: a write re-renders
 * only `useArtifactProvenance()` readers, never the root or `Renderer`, so it can't loop back
 * to the bridge.
 */
export interface SourcesStore {
  get: () => ResolvedSources;
  set: (next: ResolvedSources) => void;
  subscribe: (listener: () => void) => () => void;
}

const NO_SOURCES: ResolvedSources = Object.freeze({ sources: null });

export function createSourcesStore(): SourcesStore {
  let value = NO_SOURCES;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next) => {
      if (next.id === value.id && next.sources === value.sources) return;
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
  /** Every query and component in the program, which the index bridge writes while inspecting. */
  indexStore: ValueStore<DataSourceIndex>;
  /** Select a component, as a click in inspect mode does. */
  select: (target: SourceTarget) => void;
}

/** A value that readers subscribe to, so a write re-renders only them. */
export interface ValueStore<T> {
  get: () => T;
  set: (next: T) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createValueStore<T>(initial: T): ValueStore<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next) => {
      if (Object.is(next, value)) return;
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

export const EMPTY_INDEX: DataSourceIndex = Object.freeze({ queries: [], components: [] });
const INERT_INDEX_STORE = createValueStore(EMPTY_INDEX);

/** The program's queries and components, for the Sources panel. Empty until inspecting. */
export function useProvenanceIndex(): DataSourceIndex {
  const store = useContext(ProvenanceContext)?.indexStore ?? INERT_INDEX_STORE;
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

/** Null when `enableProvenance` is off. */
export const ProvenanceContext = createContext<ProvenanceContextValue | null>(null);

const noop = () => {};
const INERT_PROVENANCE: ArtifactProvenanceState = Object.freeze({
  isInspecting: false,
  setInspecting: noop,
  selection: null,
  clearSelection: noop,
  sources: null,
});
const INERT_STORE = createSourcesStore();
const getNoSources = () => NO_SOURCES;

/**
 * Inspect mode and where the selected component's data comes from, for a live artifact with
 * `enableProvenance`. Call it inside the renderer, such as in a slot's children. With provenance
 * off it returns an inert state: not inspecting, nothing selected, and setters that do nothing.
 *
 * @category Hooks
 */
export function useArtifactProvenance(): ArtifactProvenanceState {
  const provenance = useContext(ProvenanceContext);
  const store = provenance?.sourcesStore ?? INERT_STORE;
  const resolved = useSyncExternalStore(store.subscribe, store.get, getNoSources);
  return useMemo(() => {
    if (!provenance) return INERT_PROVENANCE;
    const { sourcesStore: _store, indexStore: _index, select: _select, ...state } = provenance;
    // Sources count only for the current selection.
    const sources = state.selection && resolved.id === state.selection.id ? resolved.sources : null;
    return { ...state, sources };
  }, [provenance, resolved]);
}
