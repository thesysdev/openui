import type { OpenUIError, SourceTarget, useDataSources } from "@openuidev/react-lang";
import { createContext, useContext, type ReactNode } from "react";
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
export type ProvenanceSources = ReturnType<typeof useDataSources>;

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

/** The renderer's provenance state; `setSources` is for the bridge inside `Renderer`. */
export interface ProvenanceContextValue extends ArtifactProvenanceState {
  setSources: (sources: ProvenanceSources, statementId: string | undefined) => void;
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

/**
 * Inspect mode and where the selected component's data comes from, for a live artifact with
 * `enableProvenance`. Call it inside the renderer, such as in a slot's children. With provenance
 * off it returns an inert state: not inspecting, nothing selected, and setters that do nothing.
 *
 * @category Hooks
 */
export function useArtifactProvenance(): ArtifactProvenanceState {
  return useContext(ProvenanceContext) ?? INERT_PROVENANCE;
}
