import { useActiveArtifact } from "@openuidev/react-headless";
import clsx from "clsx";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { useMultipleRefs } from "../../../hooks/useMultipleRefs";
import { ArtifactPortalTarget } from "./ArtifactPortalTarget";

/**
 * Props for {@link ArtifactOverlay}.
 *
 * @category Components
 */
export type ArtifactOverlayProps = {
  /** Additional CSS class name(s) applied to the overlay container. */
  className?: string;
};

/**
 * Shared overlay wrapper for the artifact portal target.
 * Used by CopilotShell, BottomTray, and Shell (mobile) layouts.
 * Renders an absolute-positioned overlay with slide-in/slide-out animations.
 *
 * @category Components
 */
export const ArtifactOverlay = forwardRef<HTMLDivElement, ArtifactOverlayProps>(
  ({ className }, ref) => {
    const { isArtifactActive } = useActiveArtifact();
    const [shouldRender, setShouldRender] = useState(isArtifactActive);
    const [isExiting, setIsExiting] = useState(false);
    const internalRef = useRef<HTMLDivElement>(null);
    const mergedRef = useMultipleRefs<HTMLDivElement>(ref, internalRef);

    useEffect(() => {
      if (isArtifactActive) {
        // Opening: mount immediately, cancel any in-progress exit
        setShouldRender(true);
        setIsExiting(false);
      } else if (shouldRender) {
        // Closing: start exit animation, defer unmount
        setIsExiting(true);
      }
    }, [isArtifactActive]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAnimationEnd = useCallback(
      (e: React.AnimationEvent<HTMLDivElement>) => {
        // Only react to our own animation, not children's animations bubbling up
        if (e.target !== internalRef.current) return;
        if (isExiting) {
          setShouldRender(false);
          setIsExiting(false);
        }
      },
      [isExiting],
    );

    if (!shouldRender) return null;

    return (
      <div
        ref={mergedRef}
        className={clsx(
          "openui-artifact-overlay",
          { "openui-artifact-overlay--exiting": isExiting },
          className,
        )}
        onAnimationEnd={handleAnimationEnd}
      >
        <ArtifactPortalTarget />
      </div>
    );
  },
);

ArtifactOverlay.displayName = "ArtifactOverlay";
