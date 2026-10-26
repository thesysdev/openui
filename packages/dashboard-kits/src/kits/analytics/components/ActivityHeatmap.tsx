"use client";

// ActivityHeatmap: weekday by hour activity, shaded against the busiest hour.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { HeatGrid } from "../../../components/charts/HeatGrid";
import { formatNumber } from "../../../core/format";
import { Pending } from "../../../library/Pending";

export const ActivityHeatmap = defineComponent({
  name: "ActivityHeatmap",
  description:
    "Weekday by hour heatmap of activity, shaded relative to the busiest hour, with the hovered cell read out.",
  props: z.object({
    days: z.array(z.object({ day: z.string(), values: z.array(z.number()) })).default([]),
    hourLabels: z.array(z.string()).optional(),
  }),
  component: ({ props }) => {
    const days = props.days ?? [];
    if (days.length === 0) return <Pending kind="grid" rows={7} />;
    const hours = Math.max(...days.map((d) => d.values.length));
    const labels = props.hourLabels ?? Array.from({ length: hours }, (_, h) => `${h}:00`);
    let peak = { d: 0, h: 0 };
    days.forEach((row, d) =>
      row.values.forEach((v, h) => v > days[peak.d].values[peak.h] && (peak = { d, h })),
    );
    return (
      <div className="kit-heat">
        <p className="kit-heat__readout">
          <span className="kit-muted">Busiest hour</span>{" "}
          <strong>
            {days[peak.d]?.day} {labels[peak.h]}
          </strong>{" "}
          · {formatNumber(days[peak.d]?.values[peak.h] ?? 0)} events
        </p>
        <HeatGrid
          rows={days.map((d) => ({ label: d.day, values: d.values }))}
          columns={labels.slice(0, hours)}
          unit="events"
        />
      </div>
    );
  },
});
