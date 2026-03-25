import { useCallback } from "react";
import { useStore } from "zustand";
import { useArtifactStore } from "../store/ArtifactContext";

/**
 * Return type for {@link useActiveArtifact}.
 *
 * @category Hooks
 */
type UseActiveArtifactReturn = {
  /** Whether any artifact is currently active (panel is open). */
  isArtifactActive: boolean;
  /** The ID of the currently active artifact, or `null` if none. */
  activeArtifactId: string | null;
  /** Closes whichever artifact is currently active. No-op if none is active. */
  closeArtifact: () => void;
};

/**
 * Returns global artifact activation state — whether *any* artifact is open,
 * and a close action that dismisses it.
 *
 * Use this in layout components that react to artifact presence (resizing panels,
 * showing overlays) without needing to know *which* artifact is active.
 * For per-artifact state and actions, use {@link useArtifact} instead.
 *
 * Must be called within a `<ChatProvider>`.
 *
 * @category Hooks
 * @returns {@link UseActiveArtifactReturn}
 */
export function useActiveArtifact(): UseActiveArtifactReturn {
  const store = useArtifactStore();

  const activeArtifactId = useStore(store, (s) => s.activeArtifactId);
  const isArtifactActive = activeArtifactId !== null;

  const closeArtifact = useCallback(() => {
    const state = store.getState();
    if (state.activeArtifactId) {
      state.closeArtifact(state.activeArtifactId);
    }
  }, [store]);

  return { isArtifactActive, activeArtifactId, closeArtifact };
}
