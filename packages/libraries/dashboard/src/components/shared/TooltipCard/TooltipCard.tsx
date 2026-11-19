"use client";

import { type ReactNode } from "react";
import { formatValue, type ValueFormat } from "../../../shared/format";
import { type GoodWhen } from "../DeltaBadge";
import { DeltaBadge } from "../DeltaBadge/DeltaBadge";

export type TooltipCardProps = {
  title: string;
  rows: TooltipRow[];
  format?: ValueFormat | null;
  goodWhen?: GoodWhen;
  previousLabel?: string;
  /** A footnote under the rows (a verdict, a share of everyone). */
  note?: string;
};

/* ---------- Tooltip ---------- */

export type TooltipRow = {
  name: string;
  color: string;
  value: number | null | undefined;
  previous?: number | null;
  /** A muted share (0–100) ahead of the value, e.g. what part of a step moved on. */
  share?: number | null;
  /** Printed in place of the formatted value (a signed change, a range); null prints no value (a row that names a state). */
  text?: string | null;
  dashed?: boolean;
  /** The mark this row describes, drawn in place of the swatch (a whisker cap, a box shade); null for no mark. */
  mark?: ReactNode;
  /** This row's own format, when it counts something other than the card's measure (a cohort's size). */
  format?: ValueFormat | null;
  /** This row's own direction of good news, when it differs from the card's (a step's losses: fewer is better). */
  goodWhen?: GoodWhen;
};

export function TooltipCard({
  title,
  rows,
  format,
  goodWhen,
  previousLabel,
  note,
}: TooltipCardProps) {
  return (
    <div className="openui-dashboard-tooltip">
      <div className="openui-dashboard-tooltip-title">{title}</div>
      {rows.map((row, i) => (
        <div key={i} className="openui-dashboard-tooltip-row">
          <span>
            {row.mark !== undefined ? (
              row.mark
            ) : row.dashed ? (
              <span
                className="openui-dashboard-legend-line"
                style={{ borderTopColor: row.color }}
              />
            ) : (
              <span className="openui-dashboard-legend-swatch" style={{ background: row.color }} />
            )}
            {row.name}
          </span>
          {/* The change first, the value last, so values line up at the right edge. */}
          {row.text === null ? null : (
            <span className="openui-dashboard-tooltip-value">
              {typeof row.previous === "number" && typeof row.value === "number" ? (
                <DeltaBadge
                  current={row.value}
                  previous={row.previous}
                  format={row.format === undefined ? format : row.format}
                  goodWhen={row.goodWhen ?? goodWhen}
                  inline
                />
              ) : null}
              {typeof row.share === "number" ? (
                <span className="openui-dashboard-tooltip-share">
                  {formatValue(row.share, "percent")}
                </span>
              ) : null}
              <span>
                {row.text ?? formatValue(row.value, row.format === undefined ? format : row.format)}
              </span>
            </span>
          )}
        </div>
      ))}
      {note ? <div className="openui-dashboard-tooltip-sub">{note}</div> : null}
      {previousLabel ? (
        <div className="openui-dashboard-tooltip-sub">vs {previousLabel.toLowerCase()}</div>
      ) : null}
    </div>
  );
}
