import type { OpenUIError } from "@openuidev/react-lang";
import { createContext, useContext } from "react";
import type { ArtifactError } from "./errors";

/** The renderer's state and controls, from `useArtifactRenderer()`. */
export interface ArtifactRendererState {
  id: string | null;
  title?: string;
  /** The artifact's content is being generated. */
  isStreaming: boolean;
  /** Its data tools are running. */
  isFetching: boolean;
  /** Either of the two. */
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
