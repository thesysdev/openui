import { useRef } from "react";
import { formatPercent } from "../../../../core/format";
import { useIsomorphicLayoutEffect } from "../../../../hooks";
import { springPresets, useSpring } from "../../shared/spring";
import { KIT_CHART_PREFIX } from "../../utils/constants";
import { gaugeArc, gaugeMarker } from "../goalGeometry";
import type { PaceTone } from "../types";

const P = `${KIT_CHART_PREFIX}-goal-pace`;
const SIZE = 120;
const R = 46;
const THICKNESS = 10;
const INNER = R - THICKNESS / 2;
const OUTER = R + THICKNESS / 2;

/**
 * A 270° gauge of the share of the goal reached, with a marker where the pace
 * says it should be by now. Track and fill are d3 arcs; the fill's end angle
 * rides a spring, so it fills up from empty when the gauge first shows and
 * eases to a new share when a filter changes it (reduced motion snaps).
 */
export function GoalGauge({
  reached,
  expected,
  tone,
  label,
  isAnimationActive = true,
}: {
  reached: number;
  expected: number;
  tone: PaceTone;
  label: string;
  isAnimationActive?: boolean;
}) {
  const fillRef = useRef<SVGPathElement>(null);
  const spring = useSpring(springPresets.value, (share) => {
    fillRef.current?.setAttribute("d", gaugeArc(share, INNER, OUTER));
  });
  useIsomorphicLayoutEffect(() => {
    if (isAnimationActive) spring.set(reached);
    else spring.jump(reached);
  }, [reached, isAnimationActive, spring]);

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={`${P}-gauge`} role="img" aria-label={label}>
      <g transform={`translate(${SIZE / 2},${SIZE / 2})`}>
        <path d={gaugeArc(1, INNER, OUTER)} className={`${P}-track`} />
        <path
          ref={fillRef}
          d={gaugeArc(isAnimationActive ? 0 : reached, INNER, OUTER)}
          className={`${P}-fill ${P}-fill--${tone}`}
        />
        <line {...gaugeMarker(expected, R)} className={`${P}-marker`} />
        <text y={0} textAnchor="middle" className={`${P}-pct`}>
          {formatPercent(reached, 0)}
        </text>
        <text y={18} textAnchor="middle" className={`${P}-of`}>
          of goal
        </text>
      </g>
    </svg>
  );
}
