import { createStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { ArtifactStore } from "./artifactTypes";

/**
 * Creates a Zustand store managing artifact state.
 * Instantiated once by `ChatProvider` — consumers should not call this directly.
 *
 * @internal
 */
export const createArtifactStore = () => {
  return createStore<ArtifactStore>()(
    subscribeWithSelector((set, get) => ({
      activeArtifactId: null,

      openArtifact: (id) => {
        set({ activeArtifactId: id });
      },

      closeArtifact: (id) => {
        if (get().activeArtifactId === id) {
          set({ activeArtifactId: null });
        }
      },

      resetArtifacts: () => {
        set({ activeArtifactId: null });
      },

      _artifactPanelNode: null,
      _setArtifactPanelNode: (node) => {
        if (
          process.env["NODE_ENV"] !== "production" &&
          node &&
          get()._artifactPanelNode &&
          get()._artifactPanelNode !== node
        ) {
          console.warn(
            "[OpenUI] Multiple ArtifactPortalTarget instances detected. " +
              "Only one should be mounted at a time.",
          );
        }
        set({ _artifactPanelNode: node });
      },
    })),
  );
};
