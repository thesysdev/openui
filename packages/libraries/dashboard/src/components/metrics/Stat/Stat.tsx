"use client";

import { useCompare } from "../../../shared/compare";
import { formatValue, type ValueFormat } from "../../../shared/format";
import { DeltaBadge } from "../../shared/DeltaBadge";

/* ---------- Stat: a headline number inside a Card ---------- */

export interface StatProps {
  value: number | null;
  format?: ValueFormat;
  previous?: number | null;
  goodWhen?: "up" | "down" | "neutral";
  label?: string;
}

export function Stat(props: StatProps) {
  const compare = useCompare();
  // "This week" reads as "$104,200 this week" inline; acronyms keep their case.
  const label =
    props.label && /^[A-Z][a-z]/.test(props.label)
      ? props.label.charAt(0).toLowerCase() + props.label.slice(1)
      : props.label;
  return (
    <div className="openui-dashboard-stat">
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span className="openui-dashboard-card-headline" style={{ margin: 0 }}>
          {formatValue(props.value, props.format)}
        </span>
        {label ? (
          <span className="openui-dashboard-card-subtitle" style={{ margin: 0 }}>
            {label}
          </span>
        ) : null}
      </div>
      {typeof props.previous === "number" ? (
        <p
          className="openui-dashboard-card-subtitle"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <DeltaBadge
            current={props.value}
            previous={props.previous}
            format={props.format}
            goodWhen={props.goodWhen}
            inline
          />
          {/* Periods read "in previous 30 days"; a target reads "vs $285K plan". */}
          vs {formatValue(props.previous, props.format)}{" "}
          {/^(previous|same)\b/i.test(compare.label)
            ? `in ${compare.label.toLowerCase()}`
            : compare.label.toLowerCase()}
        </p>
      ) : null}
    </div>
  );
}
