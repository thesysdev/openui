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
  /** While on, a click on a component selects it and opens the Sources dialog on it, instead of acting. */
  isInspecting: boolean;
  /** Turning it off also closes the Sources dialog and clears the selection. */
  setInspecting: (on: boolean) => void;
  /**
   * The component, and prop, last clicked in inspect mode. It stays after the dialog closes, and
   * stays outlined until another component is hovered.
   */
  selection: SourceTarget | null;
  /** In the dialog, back to the list of every query. */
  clearSelection: () => void;
  /** Whether the Sources dialog is open. */
  isOpen: boolean;
  /** Opens the Sources dialog on the list of every query, e.g. from your own "All queries" button. */
  openList: () => void;
  /**
   * Where the program's data comes from: every component's sources and every query, with live
   * values. Null unless inspecting or something is selected.
   */
  sources: DataSources | null;
}

/**
 * Where the bridge inside `Renderer` puts the sources. A store, not the root's state: a write
 * re-renders only `useArtifactProvenance()` readers, never the root or `Renderer`, so it can't
 * loop back to the bridge.
 */
export interface SourcesStore {
  get: () => DataSources | null;
  set: (next: DataSources | null) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createSourcesStore(): SourcesStore {
  let value: DataSources | null = null;
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

/** The renderer's provenance state: the public fields, and what only the renderer's parts use. */
export interface ProvenanceContextValue extends Omit<ArtifactProvenanceState, "sources"> {
  /** Where the bridge writes the sources. */
  sourcesStore: SourcesStore;
  /** Closes the dialog, keeping inspect mode and the selection. */
  closeDialog: () => void;
}

/** Null when `enableProvenance` is off. */
export const ProvenanceContext = createContext<ProvenanceContextValue | null>(null);

const noop = () => {};
const INERT_PROVENANCE: ArtifactProvenanceState = Object.freeze({
  isInspecting: false,
  setInspecting: noop,
  selection: null,
  clearSelection: noop,
  isOpen: false,
  openList: noop,
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
    const { sourcesStore: _store, closeDialog: _close, ...state } = provenance;
    return { ...state, sources };
  }, [provenance, sources]);
}
