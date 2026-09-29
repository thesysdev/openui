import type { ScaleBand } from "d3-scale";
import React from "react";
import { FadeFollower } from "../../shared/core/spring";
import { CHART_CLASS_PREFIX } from "../../utils/constants";

interface CrosshairProps {
  hoveredIndex: number | null;
  xScale: ScaleBand<string>;
  data: Array<Record<string, string | number>>;
  categoryKey: string;
  chartHeight: number;
}

/**
 * The hovered-column highlight. Kept mounted (the parent always renders it with a
 * possibly-null `hoveredIndex`), so the spring persists and the band GLIDES between
 * columns instead of snapping. The band is bar-width (`xScale.bandwidth()`), so
 * only its x springs; it jumps in on first show and fades out when nothing's
 * hovered.
 */
export const Crosshair: React.FC<CrosshairProps> = ({
  hoveredIndex,
  xScale,
  data,
  categoryKey,
  chartHeight,
}) => {
  const visible = hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < data.length;
  const row = visible ? data[hoveredIndex]! : undefined;
  const x = row ? (xScale(String(row[categoryKey])) ?? 0) : 0;
  const width = xScale.bandwidth();

  return (
    <FadeFollower x={x} visible={visible}>
      <rect
        className={`${CHART_CLASS_PREFIX}-bar-chart-hover-highlight`}
        x={0}
        y={0}
        width={width}
        height={chartHeight}
        rx={4}
      />
    </FadeFollower>
  );
};
