import { useCallback, useMemo } from "react";
import { useStore } from "zustand";
import { useArtifactStore } from "../store/ArtifactContext";
import type { ArtifactMeta, ArtifactMetaInput } from "../store/artifactTypes";

/**
 * Return type for {@link useArtifact}.
 *
 * @category Hooks
 */
type UseArtifactReturn = {
  /** Whether this artifact is the currently active (visible) one. */
  isActive: boolean;
  /** Stored metadata for this artifact, or `null` if it has never been opened. */
  meta: ArtifactMeta | null;
  /** Activates this artifact and optionally merges metadata. */
  open: (meta?: ArtifactMetaInput) => void;
  /** Deactivates this artifact. Metadata is preserved for later reuse. */
  close: () => void;
  /** Removes this artifact from the registry entirely, destroying its metadata. */
  remove: () => void;
  /** Toggles this artifact: opens if closed, closes if open. */
  toggle: (meta?: ArtifactMetaInput) => void;
  /**
   * Spread-ready props for a simple toggle button.
   *
   * Includes `aria-expanded`, `aria-controls`, and an `onClick` that calls `toggle()`.
   * For custom trigger behavior (e.g., open-only, close with confirmation, non-button
   * elements), use `open`, `close`, or `toggle` directly instead.
   *
   * @example
   * ```tsx
   * const { triggerProps } = useArtifact("preview");
   * return <button {...triggerProps}>Toggle Preview</button>;
   * ```
   */
  triggerProps: {
    "aria-expanded": boolean;
    "aria-controls": string;
    onClick: () => void;
  };
};

/**
 * Binds a component to a specific artifact by ID, providing activation state
 * and actions (open, close, toggle, remove).
 *
 * Multiple `useArtifact` hooks with different IDs can coexist —
 * only one artifact is active at a time. Metadata survives deactivation.
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
 *   const { isActive, triggerProps } = useArtifact(id);
 *   return <button {...triggerProps}>{isActive ? "Hide" : "Show"} Preview</button>;
 * }
 * ```
 */
export function useArtifact(artifactId: string): UseArtifactReturn {
  const store = useArtifactStore();
  const panelId = `openui-artifact-panel-${artifactId}`;

  const isActive = useStore(store, (s) => s.activeArtifactId === artifactId);
  const meta = useStore(store, (s) => s.artifacts[artifactId] ?? null);

  const open = useCallback(
    (meta?: ArtifactMetaInput) => {
      store.getState().openArtifact(artifactId, meta);
    },
    [store, artifactId],
  );

  const close = useCallback(() => {
    store.getState().closeArtifact(artifactId);
  }, [store, artifactId]);

  const remove = useCallback(() => {
    store.getState().removeArtifact(artifactId);
  }, [store, artifactId]);

  const toggle = useCallback(
    (meta?: ArtifactMetaInput) => {
      const state = store.getState();
      if (state.activeArtifactId === artifactId) {
        state.closeArtifact(artifactId);
      } else {
        state.openArtifact(artifactId, meta);
      }
    },
    [store, artifactId],
  );

  const triggerProps = useMemo(
    () => ({
      "aria-expanded": isActive,
      "aria-controls": panelId,
      onClick: () => toggle(),
    }),
    [isActive, panelId, toggle],
  );

  return { isActive, meta, open, close, remove, toggle, triggerProps };
}
