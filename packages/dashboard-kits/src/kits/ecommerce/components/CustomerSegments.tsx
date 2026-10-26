"use client";

// CustomerSegments: the RFM customer segment tiles.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { formatCurrency, formatNumber, formatPercent } from "../../../core/format";
import { passed } from "../../../core/schemas";
import { Pending } from "../../../library/Pending";
import type { CustomerSegment } from "./shared";

const SEGMENT_TONE = {
  positive: { label: "Healthy", icon: "M3.5 8.5 6.5 11.5 12.5 4.5" },
  neutral: { label: "Growing", icon: "M8 3v10M3 8h10" },
  warning: { label: "Slipping", icon: "M8 3.2 14 13H2L8 3.2Zm0 4v2.6m0 1.9v.1" },
  negative: { label: "Lapsed", icon: "M4 4l8 8M12 4l-8 8" },
} as const;

export const CustomerSegments = defineComponent({
  name: "CustomerSegments",
  description:
    "RFM customer segment tiles: each segment's customers, its share of customers against its share of revenue, average orders and spend, days since the last order, a health status, and the recommended action.",
  props: z.object({
    segments: z.array(passed("A segment from get_customer_segments")).default([]),
  }),
  component: ({ props }) => {
    const segments = (props.segments ?? []) as unknown as CustomerSegment[];
    if (segments.length === 0) return <Pending kind="tiles" rows={4} />;
    const maxShare = Math.max(...segments.flatMap((s) => [s.customerShare, s.revenueShare]), 0.01);
    return (
      <div className="kit-segments">
        {segments.map((s) => {
          const tone = SEGMENT_TONE[s.tone] ?? SEGMENT_TONE.neutral;
          return (
            <div key={s.name} className="kit-segment">
              <div className="kit-segment__head">
                <span className="kit-segment__name">{s.name}</span>
                <span className={`kit-status kit-status--${s.tone}`}>
                  <svg viewBox="0 0 16 16" aria-hidden>
                    <path d={tone.icon} />
                  </svg>
                  {tone.label}
                </span>
              </div>
              <span className="kit-segment__count">{formatNumber(s.customers)}</span>
              <div className="kit-segment__bars">
                <span className="kit-segment__bar-label">Customers</span>
                <span className="kit-segment__bar">
                  <span
                    className="kit-segment__fill kit-segment__fill--muted"
                    style={{ width: `${(s.customerShare / maxShare) * 100}%` }}
                  />
                </span>
                <span className="kit-segment__pct">{formatPercent(s.customerShare, 0)}</span>
                <span className="kit-segment__bar-label">Revenue</span>
                <span className="kit-segment__bar">
                  <span
                    className="kit-segment__fill"
                    style={{ width: `${(s.revenueShare / maxShare) * 100}%` }}
                  />
                </span>
                <span className="kit-segment__pct">{formatPercent(s.revenueShare, 0)}</span>
              </div>
              <span className="kit-segment__stats">
                {s.avgOrders.toFixed(1)} orders · {formatCurrency(s.avgSpend)} · {s.daysSinceOrder}d
                since last order
              </span>
              <span className="kit-segment__action">→ {s.action}</span>
            </div>
          );
        })}
      </div>
    );
  },
});
