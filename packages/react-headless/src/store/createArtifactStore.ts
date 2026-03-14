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
      artifacts: {},

      openArtifact: (id, meta) => {
        const existing = get().artifacts[id];
        if (existing && get().activeArtifactId === id) {
          if (meta) {
            set({ artifacts: { ...get().artifacts, [id]: { ...existing, ...meta } } });
          }
          return;
        }
        set({
          activeArtifactId: id,
          artifacts: {
            ...get().artifacts,
            [id]: { ...(existing ?? {}), ...meta, id, activatedAt: Date.now() },
          },
        });
      },

      closeArtifact: (id) => {
        if (!(id in get().artifacts)) return;
        set({
          activeArtifactId: get().activeArtifactId === id ? null : get().activeArtifactId,
        });
      },

      removeArtifact: (id) => {
        if (!(id in get().artifacts)) return;
        const { [id]: _, ...rest } = get().artifacts;
        set({
          artifacts: rest,
          activeArtifactId: get().activeArtifactId === id ? null : get().activeArtifactId,
        });
      },

      resetArtifacts: () => {
        set({ activeArtifactId: null, artifacts: {} });
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
