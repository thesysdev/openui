"use client";

import { formatValue, type ValueFormat } from "../../../shared/format";
import { DeltaBadge } from "../../shared/DeltaBadge";
import { Empty } from "../../shared/States";

/* ---------- KeyValues ---------- */

export interface KeyValuesProps {
  rows: {
    label: string;
    value: number | string | null;
    format?: ValueFormat;
    previous?: number | null;
    goodWhen?: "up" | "down" | "neutral";
  }[];
}

export function KeyValues(props: KeyValuesProps) {
  const rows = Array.isArray(props.rows) ? props.rows.filter(Boolean) : [];
  if (!rows.length) return <Empty />;
  return (
    <dl className="openui-dashboard-kv">
      {rows.map((row, keyIndex) => (
        <div key={`${keyIndex}-${row.label}`} className="openui-dashboard-kv-row">
          <dt>{row.label}</dt>
          {/* Change first, value last: values sit flush right in one column. */}
          <dd>
            {typeof row.value === "number" ? (
              <DeltaBadge
                current={row.value}
                previous={row.previous}
                format={row.format}
                goodWhen={row.goodWhen}
                inline
              />
            ) : null}
            <span className="openui-dashboard-kv-value">
              {typeof row.value === "number"
                ? formatValue(row.value, row.format)
                : row.value || "—"}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
