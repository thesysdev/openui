import { useArtifactPortalTarget } from "@openuidev/react-headless";
import { forwardRef, useCallback, useRef } from "react";

/**
 * Props for {@link ArtifactPortalTarget}.
 */
export type ArtifactPortalTargetProps = {
  /** Additional CSS class name(s) applied to the container element. */
  className?: string;
};

/**
 * Registers a DOM node as the render target for {@link ArtifactPanel} portals.
 *
 * Mount exactly one instance in your layout. Renders a `<div>` with
 * `display: contents` so it doesn't affect layout flow.
 *
 * @category Components
 */
export const ArtifactPortalTarget = forwardRef<HTMLDivElement, ArtifactPortalTargetProps>(
  ({ className }, ref) => {
    const { setNode } = useArtifactPortalTarget();
    const forwardedRef = useRef(ref);
    forwardedRef.current = ref;

    const callbackRef = useCallback(
      (node: HTMLDivElement | null) => {
        setNode(node);
        const fRef = forwardedRef.current;
        if (typeof fRef === "function") {
          fRef(node);
        } else if (fRef) {
          fRef.current = node;
        }
      },
      [setNode],
    );

    return <div ref={callbackRef} className={className} style={{ display: "contents" }} />;
  },
);

ArtifactPortalTarget.displayName = "ArtifactPortalTarget";
