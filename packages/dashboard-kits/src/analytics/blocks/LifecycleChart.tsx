"use client";

// LifecycleChart: weekly growth accounting, gains stacked above zero and dormant users below.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { ColumnChart as ColumnChartView } from "../../charts/ColumnChart";
import { formatNumber } from "../../core/format";

const shortWeek = (label: string) => label.replace(/^Wk of /, "");

/**
 * Gains in shades of the accent, losses in the kit's down red: the same
 * polarity colors every gains-and-losses chart uses (see colorSeries).
 */
const LIFECYCLE = [
  { key: "returning", name: "Returning", color: "var(--kit-o3)" },
  { key: "newUsers", name: "New", color: "var(--kit-o5)" },
  { key: "resurrecting", name: "Resurrecting", color: "var(--kit-o1)" },
] as const;
const DORMANT = "var(--kit-down)";

export const LifecycleChart = defineComponent({
  name: "LifecycleChart",
  description:
    "Lifecycle (growth accounting) chart: per week, stacked columns of returning, new, and resurrecting users above zero and dormant users below it, with a tooltip per week and the latest quick ratio.",
  props: z.object({
    labels: z.array(z.string()).default([]),
    newUsers: z.array(z.number()).default([]),
    returning: z.array(z.number()).default([]),
    resurrecting: z.array(z.number()).default([]),
    dormant: z.array(z.number()).default([]),
    quickRatio: z.string().optional(),
  }),
  component: ({ props }) => {
    const labels = props.labels ?? [];
    if (labels.length === 0) return <Pending kind="columns" />;
    const returning = props.returning ?? [];
    const newUsers = props.newUsers ?? [];
    const resurrecting = props.resurrecting ?? [];
    const dormant = (props.dormant ?? []).map((v) => -Math.abs(v));
    const last = labels.length - 1;
    return (
      <div className="kit-lifecycle">
        <ColumnChartView
          labels={labels.map(shortWeek)}
          series={[
            ...LIFECYCLE.map((s) => ({ name: s.name, values: props[s.key] ?? [], color: s.color })),
            { name: "Dormant", values: dormant, color: DORMANT },
          ]}
          stacked
          yLabel="Users"
          height={280}
        />
        <div className="kit-chart-note">
          <span>
            Latest week: <strong>{formatNumber(returning[last] ?? 0)}</strong> returning,{" "}
            <strong>{formatNumber(newUsers[last] ?? 0)}</strong> new,{" "}
            <strong>{formatNumber(resurrecting[last] ?? 0)}</strong> resurrecting,{" "}
            <strong>{formatNumber(Math.abs(dormant[last] ?? 0))}</strong> went dormant.
          </span>
          {props.quickRatio && (
            <span className="kit-chart-note__figure">
              Quick ratio <strong>{props.quickRatio}</strong>
              <span className="kit-muted">
                {" "}
                · for every user who went dormant, {props.quickRatio} came in or came back
              </span>
            </span>
          )}
        </div>
      </div>
    );
  },
});
