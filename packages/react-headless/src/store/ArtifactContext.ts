import { createContext, useContext } from "react";
import type { StoreApi } from "zustand";
import type { ArtifactStore } from "./artifactTypes";

/** @internal React context holding the artifact Zustand store. Provided by `ChatProvider`. */
export const ArtifactContext = createContext<StoreApi<ArtifactStore> | null>(null);

/**
 * Returns the raw artifact Zustand store for advanced use cases.
 *
 * Prefer {@link useArtifact} or {@link useActiveArtifact} for most cases —
 * this hook is an escape hatch when you need direct store access.
 *
 * @category Hooks
 * @returns The Zustand `StoreApi<ArtifactStore>` instance
 * @throws Error if called outside a `<ChatProvider>`
 */
export const useArtifactStore = (): StoreApi<ArtifactStore> => {
  const store = useContext(ArtifactContext);
  if (!store) {
    throw new Error("useArtifactStore must be used within a <ChatProvider>");
  }
  return store;
};
