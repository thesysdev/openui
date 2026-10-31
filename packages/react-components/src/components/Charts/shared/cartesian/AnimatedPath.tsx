"use client";

import clsx from "clsx";
import { useRef } from "react";

import { partVariable } from "../../utils/partVariable";
import { useIsomorphicLayoutEffect } from "../core/spring";

interface AnimatedPathProps {
  d: string;
  color: string;
  /** Base and entrance classes are supplied by the owning family's names and styles. */
  className: string;
  animatedClassName: string;
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
 * part's `--_openui-<component>-<part>-path-length` CSS var (see partVariable); it is measured
 * in a LAYOUT effect — a plain useEffect ran after paint, so `stroke-dasharray: var(…)` was
 * invalid-at-computed-value-time for one frame, fell back to `none`, and the
 * fully-drawn line flashed before the draw-on started.
 */
export function AnimatedPath({
  d,
  color,
  className,
  animatedClassName,
  isAnimationActive,
  pathRef,
}: AnimatedPathProps) {
  const internalRef = useRef<SVGPathElement>(null);
  const ref = pathRef ?? internalRef;

  useIsomorphicLayoutEffect(() => {
    const variable = partVariable(className, "path-length");
    if (isAnimationActive && ref.current && variable) {
      const length = ref.current.getTotalLength();
      ref.current.style.setProperty(variable, String(length));
    }
  }, [d, isAnimationActive, className]);

  return (
    <path
      ref={ref}
      className={clsx(className, isAnimationActive && animatedClassName)}
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={2}
    />
  );
}
