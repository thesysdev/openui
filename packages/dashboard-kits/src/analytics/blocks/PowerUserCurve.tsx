"use client";

// PowerUserCurve: the share of actives by days active in the last 7 or 28 days.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { ColumnChart as ColumnChartView } from "../../charts/ColumnChart";
import { MUTED_COLOR, SERIES_COLORS } from "../../charts/utils/constants";

export const PowerUserCurve = defineComponent({
  name: "PowerUserCurve",
  description:
    "Power user curve (stickiness): columns for the share of active users who were active on 1, 2, … N days of the last 7 or 28 days, with power users in the accent and everyone else in gray, and their share summarized.",
  props: z.object({
    buckets: z.array(z.object({ days: z.number(), users: z.number() })).default([]),
    window: z.number().optional(),
    powerUserShare: z.string().optional(),
  }),
  component: ({ props }) => {
    const buckets = props.buckets ?? [];
    if (buckets.length === 0) return <Pending kind="columns" />;
    const window = props.window ?? buckets.length;
    const powerFrom = window >= 28 ? 20 : Math.ceil((window * 5) / 7);
    const total = buckets.reduce((a, b) => a + b.users, 0) || 1;
    const shares = buckets.map((b) => Math.round((b.users / total) * 1000) / 10);
    return (
      <div className="kit-power">
        <p className="kit-power__summary">
          <strong>{props.powerUserShare ?? "—"}</strong> are power users, active {powerFrom}+ of{" "}
          {window} days.{" "}
          <span className="kit-muted">
            {Math.round(((buckets[0]?.users ?? 0) / total) * 100)}% came once.
          </span>
        </p>
        <ColumnChartView
          labels={buckets.map((b) => String(b.days))}
          series={[{ name: "Active users", values: shares }]}
          columnColors={buckets.map((b) => (b.days >= powerFrom ? SERIES_COLORS[0] : MUTED_COLOR))}
          keys={[
            { name: "Power users", color: SERIES_COLORS[0]!, kind: "rect" },
            { name: "Everyone else", color: MUTED_COLOR, kind: "rect" },
          ]}
          format="percent"
          xLabel={`Days active in the last ${window} days`}
          height={240}
        />
      </div>
    );
  },
});
