import { useCallback } from "react";
import { useStore } from "zustand";
import { useArtifactStore } from "../store/ArtifactContext";

/**
 * Return type for {@link useArtifact}.
 *
 * @category Hooks
 */
type UseArtifactReturn = {
  /** Whether this artifact is the currently active (visible) one. */
  isActive: boolean;
  /** Activates this artifact. */
  open: () => void;
  /** Deactivates this artifact. */
  close: () => void;
  /** Toggles this artifact: opens if closed, closes if open. */
  toggle: () => void;
};

/**
 * Binds a component to a specific artifact by ID, providing activation state
 * and actions (open, close, toggle).
 *
 * Multiple `useArtifact` hooks with different IDs can coexist —
 * only one artifact is active at a time.
 *
 * Must be called within a `<ChatProvider>`.
 *
 * @category Hooks
 * @param artifactId - Unique identifier for the artifact
 * @returns {@link UseArtifactReturn}
 *
 * @example
 * ```tsx
 * function PreviewButton({ id }: { id: string }) {
 *   const { isActive, toggle } = useArtifact(id);
 *   return (
 *     <button onClick={() => toggle()}>
 *       {isActive ? "Hide" : "Show"} Preview
 *     </button>
 *   );
 * }
 * ```
 */
export function useArtifact(artifactId: string): UseArtifactReturn {
  const store = useArtifactStore();

  const isActive = useStore(store, (s) => s.activeArtifactId === artifactId);

  const open = useCallback(() => {
    store.getState().openArtifact(artifactId);
  }, [store, artifactId]);

  const close = useCallback(() => {
    store.getState().closeArtifact(artifactId);
  }, [store, artifactId]);

  const toggle = useCallback(() => {
    const state = store.getState();
    if (state.activeArtifactId === artifactId) {
      state.closeArtifact(artifactId);
    } else {
      state.openArtifact(artifactId);
    }
  }, [store, artifactId]);

  return { isActive, open, close, toggle };
}
