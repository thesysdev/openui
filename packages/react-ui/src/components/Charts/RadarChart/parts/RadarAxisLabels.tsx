import { useCanvasContextForLabelSize } from "../../hooks/core/useCanvasContextForLabelSize";
import { LabelTooltip } from "../../shared/core/LabelTooltip/LabelTooltip";
import type { ChartData } from "../../types";
import { CHART_CLASS_PREFIX } from "../../utils/constants";
import { parseLineHeight, truncateToWidth, wrapLabelLines } from "../../utils/labelWrap";
import { MIN_RADAR_LABEL_BUDGET, radarLabelLayout } from "../../utils/radarLabelLayout";

interface RadarAxisLabelsProps<T extends ChartData> {
  data: T;
  catKey: string;
  numAxes: number;
  maxRadius: number;
  chartSize: number;
  containerWidth: number;
}

const BASELINE = {
  top: "hanging",
  middle: "middle",
  bottom: "auto",
} as const;

// Truncated labels get a LabelTooltip; stop chart-hover events on their group
// so the axis ChartTooltip doesn't co-fire underneath it (labels live inside
// the hover-owning <g> in RadarChart.tsx).
// Known follow-up: if a browser doesn't deliver pointer events on overflow-painted svg content (Safari/Firefox unverified), truncated labels fall back to aria-label only — the axis tooltip is deliberately stopped here.
const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

/**
 * Category labels as native SVG text (multi-line via tspans, measured-trim
 * ellipsis — the XAxis pattern). Budgets come from radarLabelLayout and are
 * container-relative: the svg has overflow:visible (radarChart.scss), so
 * labels legitimately paint outside the square chart, bounded by the
 * container edges. Pre-hydration the measuring ctx is a zero-width stub, so
 * everything "fits": full labels render server-side and one post-hydration
 * re-render applies real truncation.
 */
export function RadarAxisLabels<T extends ChartData>({
  data,
  catKey,
  numAxes,
  maxRadius,
  chartSize,
  containerWidth,
}: RadarAxisLabelsProps<T>) {
  const ctx = useCanvasContextForLabelSize();
  const lineHeight = parseLineHeight(ctx.font);

  return (
    <g className={`${CHART_CLASS_PREFIX}-radar-chart-axis-labels`}>
      {data.map((row, i) => {
        const label = String(row[catKey]);
        const layout = radarLabelLayout(i, numAxes, {
          chartSize,
          maxRadius,
          containerWidth,
          lineHeight,
        });
        if (layout.maxWidth < MIN_RADAR_LABEL_BUDGET) return null;

        const lines =
          layout.maxLines === 1
            ? [truncateToWidth(ctx, label, layout.maxWidth)]
            : wrapLabelLines(ctx, label, layout.maxWidth, layout.maxLines);
        const truncated = lines.some((line) => line.endsWith("…"));

        // First-line dy places the whole wrapped block per vAlign: 'top'
        // (hanging) grows down, 'bottom' (auto) grows up so the LAST baseline
        // sits at the anchor, 'middle' splits the block across the anchor.
        const firstDy =
          layout.vAlign === "top"
            ? 0
            : layout.vAlign === "bottom"
              ? -(lines.length - 1) * lineHeight
              : (-(lines.length - 1) / 2) * lineHeight;

        const text = (
          <text
            x={layout.x}
            y={layout.y}
            textAnchor={layout.hAlign}
            dominantBaseline={BASELINE[layout.vAlign]}
            className={`${CHART_CLASS_PREFIX}-radar-chart-axis-label`}
            aria-label={truncated ? label : undefined}
          >
            {lines.map((line, li) => (
              <tspan key={li} x={layout.x} dy={li === 0 ? firstDy : lineHeight}>
                {line}
              </tspan>
            ))}
          </text>
        );

        if (!truncated) {
          return <g key={`${label}-${i}`}>{text}</g>;
        }

        const blockWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
        const blockHeight = lines.length * lineHeight;
        const rectX =
          layout.hAlign === "start"
            ? layout.x
            : layout.hAlign === "end"
              ? layout.x - blockWidth
              : layout.x - blockWidth / 2;
        const rectY =
          layout.vAlign === "top"
            ? layout.y
            : layout.vAlign === "bottom"
              ? layout.y - blockHeight
              : layout.y - blockHeight / 2;

        return (
          <LabelTooltip key={`${label}-${i}`} content={label} disabled={false}>
            <g onMouseMove={stop} onTouchMove={stop}>
              <rect
                x={rectX}
                y={rectY}
                width={blockWidth}
                height={blockHeight}
                fill="transparent"
              />
              {text}
            </g>
          </LabelTooltip>
        );
      })}
    </g>
  );
}
