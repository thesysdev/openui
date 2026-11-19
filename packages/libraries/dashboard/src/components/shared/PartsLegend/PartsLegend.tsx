"use client";

import { type ValueFormat } from "../../../shared/format";
import { columnFormatter } from "../../../shared/scales";

export type PartsLegendProps = {
  parts: { label: string; value: number; color: string }[];
  format?: ValueFormat | null;
  /** Values that are already shares (percent) skip the computed share, which would repeat them. */
  sharesGiven?: boolean;
  active?: string | null;
  onHover?: (label: string | null) => void;
};

/**
 * The legend under part-to-whole charts (Donut, SegmentedBar): columns of at
 * least 240px split by dotted rules, each row a swatch and label, then the
 * muted share and the value at the right edge, one precision per column.
 * Hovering a row reports its label so the chart can fade the other parts.
 */
export function PartsLegend({ parts, format, sharesGiven, active, onHover }: PartsLegendProps) {
  const total = parts.reduce((sum, part) => sum + part.value, 0) || 1;
  const shareText = columnFormatter(
    parts.map((part) => (part.value / total) * 100),
    "percent",
  );
  const valueText = columnFormatter(
    parts.map((part) => part.value),
    format,
  );
  return (
    <div className="openui-dashboard-parts-legend">
      {parts.map((part, keyIndex) => (
        <div
          key={`${keyIndex}-${part.label}`}
          data-hover={active === part.label ? "" : undefined}
          onMouseEnter={() => onHover?.(part.label)}
          onMouseLeave={() => onHover?.(null)}
        >
          <span className="openui-dashboard-parts-label">
            <span className="openui-dashboard-legend-swatch" style={{ background: part.color }} />
            <span className="openui-dashboard-parts-name">{part.label}</span>
          </span>
          <span className="openui-dashboard-parts-nums">
            {sharesGiven ? null : (
              <span className="openui-dashboard-parts-share">
                {shareText((part.value / total) * 100)}
              </span>
            )}
            <span className="openui-dashboard-parts-value">{valueText(part.value)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
