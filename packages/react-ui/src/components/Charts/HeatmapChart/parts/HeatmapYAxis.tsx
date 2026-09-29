import type { ScaleBand } from "d3-scale";

import { useCanvasContextForLabelSize } from "../../hooks/core/useCanvasContextForLabelSize";
import { LabelTooltip } from "../../shared/core/LabelTooltip/LabelTooltip";
import { truncateToWidth } from "../../utils/labelWrap";

// Mirrors the y-axis text inset used by the numeric YAxis (text at width − 8)
// and the measurement padding the orchestrator reserves.
const TEXT_INSET = 8;
const LABEL_PADDING = 10;

interface HeatmapYAxisProps {
  scale: ScaleBand<string>;
  /** Reserved y-axis width (the orchestrator measured the row labels). */
  width: number;
  classPrefix: string;
}

/**
 * Categorical row labels for the heatmap. The shared YAxis is linear-only
 * (`scale.ticks()`), so this hand-rolls its geometry: right-aligned text
 * centered in each band, truncated to the reserved width with a LabelTooltip
 * on truncation (the XAxis pattern). Needs a LabelTooltipProvider ancestor.
 */
export function HeatmapYAxis({ scale, width, classPrefix }: HeatmapYAxisProps) {
  const context = useCanvasContextForLabelSize();
  const maxTextWidth = Math.max(0, width - LABEL_PADDING);

  return (
    <g className={`${classPrefix}-y-axis`}>
      {scale.domain().map((rowKey) => {
        const label = truncateToWidth(context, rowKey, maxTextWidth);
        const truncated = label !== rowKey;
        const bandY = scale(rowKey) ?? 0;
        const centerY = bandY + scale.bandwidth() / 2;

        return (
          <LabelTooltip key={rowKey} content={rowKey} disabled={!truncated}>
            <g>
              {truncated && (
                <rect x={0} y={bandY} width={width} height={scale.bandwidth()} fill="transparent" />
              )}
              <text
                x={width - TEXT_INSET}
                y={centerY}
                textAnchor="end"
                dominantBaseline="middle"
                className={`${classPrefix}-y-tick`}
              >
                {label}
              </text>
            </g>
          </LabelTooltip>
        );
      })}
    </g>
  );
}
