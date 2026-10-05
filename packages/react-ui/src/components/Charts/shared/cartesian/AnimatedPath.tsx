import { useRef } from "react";

import { useIsomorphicLayoutEffect } from "../core/spring";

interface AnimatedPathProps {
  d: string;
  color: string;
  /** Base element class; the `--animated` modifier is appended when animating. */
  className: string;
  isAnimationActive?: boolean;
  /**
   * External ref so the owning series can write `d` imperatively (the spring
   * data morph regenerates path data per ticker tick). Optional — without it
   * the component measures through its own ref as before.
   */
  pathRef?: React.RefObject<SVGPathElement | null>;
}

/**
 * A series line that can draw itself on. The stroke-dash draw-on keyframe
 * (`${CHART_CLASS_PREFIX}-draw-line`, chartBase.scss) needs the path's length in the
 * `--path-length` CSS var; it is measured in a LAYOUT effect — a plain
 * useEffect ran after paint, so `stroke-dasharray: var(--path-length)` was
 * invalid-at-computed-value-time for one frame, fell back to `none`, and the
 * fully-drawn line flashed before the draw-on started.
 */
export function AnimatedPath({
  d,
  color,
  className,
  isAnimationActive,
  pathRef,
}: AnimatedPathProps) {
  const internalRef = useRef<SVGPathElement>(null);
  const ref = pathRef ?? internalRef;

  useIsomorphicLayoutEffect(() => {
    if (isAnimationActive && ref.current) {
      const length = ref.current.getTotalLength();
      ref.current.style.setProperty("--path-length", String(length));
    }
  }, [d, isAnimationActive]);

  return (
    <path
      ref={ref}
      className={`${className}${isAnimationActive ? ` ${className}--animated` : ""}`}
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={2}
    />
  );
}
