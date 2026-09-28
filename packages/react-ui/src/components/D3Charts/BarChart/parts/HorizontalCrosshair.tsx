import React from "react";

import { FadeFollower } from "../../shared/core/spring";
import { CHART_CLASS_PREFIX } from "../../utils/constants";

interface HorizontalCrosshairProps {
  /** Hovered category row index, or `null` when nothing is hovered. */
  hoveredIndex: number | null;
  /** Cumulative top (y, px) of each category row in the scrolling SVG's
   *  coordinate space — from the orchestrator (`rowOffsets`). */
  rowOffsets: number[];
  /** Height (px) of one whole category group (label band + bars). Uniform
   *  across rows — from the orchestrator (`groupHeight`). */
  groupHeight: number;
  /** Row-SVG width (px) — the band spans it. From the orchestrator
   *  (`chartWidth`). */
  chartWidth: number;
}

/**
 * The hovered-ROW highlight for the HORIZONTAL BarChart — the transpose of the
 * vertical `Crosshair`. Kept mounted (the parent always renders it with a
 * possibly-null `hoveredIndex`), so the spring persists and the band GLIDES
 * between rows instead of snapping. The band is full row width
 * (`chartWidth`) and one group tall (`groupHeight`), so only its Y springs; it
 * jumps in on first show and fades out when nothing's hovered.
 *
 * Ported from openui's HorizontalBarChart cursor (`fill: var(--openui-highlight)`,
 * `stroke: var(--openui-stroke-default)`) — here the fill/stroke live in
 * `horizontalBarChart.scss` (`-crosshair`), mirroring the vertical crosshair's
 * `-hover-highlight`.
 */
export const HorizontalCrosshair: React.FC<HorizontalCrosshairProps> = ({
  hoveredIndex,
  rowOffsets,
  groupHeight,
  chartWidth,
}) => {
  const visible = hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < rowOffsets.length;
  const y = visible ? (rowOffsets[hoveredIndex] ?? 0) : 0;

  return (
    <FadeFollower x={0} y={y} visible={visible}>
      <rect
        className={`${CHART_CLASS_PREFIX}-horizontal-bar-chart-crosshair`}
        x={0}
        y={0}
        width={Math.max(0, chartWidth)}
        height={groupHeight}
        rx={4}
      />
    </FadeFollower>
  );
};
