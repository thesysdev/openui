import { useRef, type RefObject, type SVGProps } from "react";
import { useIsomorphicLayoutEffect } from "../../../hooks/useIsomorphicLayoutEffect";

// Ported from react-ui's AnimatedPath (components/Charts/shared/cartesian/
// AnimatedPath.tsx), widened to take any path attributes.

type AnimatedPathProps = Omit<SVGProps<SVGPathElement>, "ref"> & {
  d: string;
  /** Base element class; the `--animated` modifier is appended when animating. */
  className: string;
  isAnimationActive?: boolean;
  /** So the owning series can write `d` imperatively on each morph tick. */
  pathRef?: RefObject<SVGPathElement | null>;
};

/**
 * A series line that draws itself on, left to right, when it first shows. The
 * draw-on keyframe (`kit-draw-line`, shared/_motion.scss) needs the path's
 * length in `--path-length`; it is measured in a layout effect, before paint,
 * so the fully drawn line never flashes for a frame before the draw starts.
 */
export function AnimatedPath({
  d,
  className,
  isAnimationActive,
  pathRef,
  ...rest
}: AnimatedPathProps) {
  const internalRef = useRef<SVGPathElement | null>(null);
  const ref = pathRef ?? internalRef;

  useIsomorphicLayoutEffect(() => {
    if (isAnimationActive && ref.current) {
      ref.current.style.setProperty("--path-length", String(ref.current.getTotalLength()));
    }
  }, [d, isAnimationActive]);

  return (
    <path
      ref={ref}
      d={d}
      className={`${className}${isAnimationActive ? ` ${className}--animated` : ""}`}
      {...rest}
    />
  );
}
