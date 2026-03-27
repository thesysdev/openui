import { useCallback } from "react";
import { useStore } from "zustand";
import { useArtifactStore } from "../store/ArtifactContext";

/**
 * Provides access to the artifact portal target DOM node.
 *
 * This hook serves two roles:
 * - **Registering a portal target:** Call `setNode` from a ref callback to
 *   designate a DOM element as the render target for artifact content.
 *   Only one target should be registered at a time.
 * - **Reading the portal target:** Read `node` to get the current target
 *   element for use with `createPortal()`.
 *
 * Must be called within a `<ChatProvider>`.
 *
 * @category Hooks
 * @returns `{ setNode, node }` — setter for registration, getter for portal rendering
 *
 * @example
 * ```tsx
 * // Registering a portal target
 * function MyPortalTarget() {
 *   const { setNode } = useArtifactPortalTarget();
 *   return <div ref={setNode} />;
 * }
 *
 * // Building a custom artifact panel
 * function MyArtifactPanel({ artifactId, children }) {
 *   const { isActive } = useArtifact(artifactId);
 *   const { node } = useArtifactPortalTarget();
 *   if (!isActive || !node) return null;
 *   return createPortal(<div>{children}</div>, node);
 * }
 * ```
 */
export function useArtifactPortalTarget() {
  const store = useArtifactStore();
  const node = useStore(store, (s) => s._artifactPanelNode);

  const setNode = useCallback(
    (node: HTMLElement | null) => {
      store.getState()._setArtifactPanelNode(node);
    },
    [store],
  );

  return { setNode, node };
}
