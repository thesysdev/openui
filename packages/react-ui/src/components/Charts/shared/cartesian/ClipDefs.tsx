import React from "react";

const CLIP_OVERFLOW = 6;

interface ClipDefsProps {
  chartId: string;
  chartWidth: number;
  chartHeight: number;
}

export const ClipDefs: React.FC<ClipDefsProps> = ({ chartId, chartWidth, chartHeight }) => {
  return (
    <clipPath id={`clip-${chartId}`}>
      <rect
        y={-CLIP_OVERFLOW}
        // Fit-mode SSR renders before the container is measured, so
        // chartWidth can be negative (0 − yAxisWidth) — an invalid SVG
        // attribute that logs a console error on every fit-mode deep link.
        width={Math.max(0, chartWidth)}
        height={chartHeight + CLIP_OVERFLOW}
      />
    </clipPath>
  );
};
