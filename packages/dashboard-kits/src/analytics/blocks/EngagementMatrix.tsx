"use client";

// EngagementMatrix: features as bubbles by breadth and frequency, split at the medians.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { QuadrantChart } from "../../charts/QuadrantChart";
import { formatNumber, formatPoints } from "../../core/format";
import { passed } from "../../core/schemas";
import type { Feature } from "./shared";

export const EngagementMatrix = defineComponent({
  name: "EngagementMatrix",
  description:
    "Feature engagement matrix: each feature a bubble placed by breadth (percent of the period's active users) and frequency (days used per week), sized by users, split at the medians into Core, Power, Broad but infrequent, and Review or retire.",
  props: z.object({
    features: z.array(passed("A feature from get_feature_engagement")).default([]),
  }),
  component: ({ props }) => {
    const features = (props.features ?? []) as unknown as Feature[];
    if (features.length === 0) return <Pending kind="trend" />;
    const maxFrequency = Math.ceil(Math.max(...features.map((f) => f.frequency)) + 0.5);
    return (
      <QuadrantChart
        points={features.map((f) => ({
          name: f.name,
          x: f.breadth,
          y: f.frequency,
          size: f.users,
          change: { text: formatPoints(f.change), good: f.change >= 0 },
        }))}
        x={{
          title: "Breadth: % of active users",
          domain: [0, 100],
          ticks: [0, 25, 50, 75, 100],
          format: (t) => `${t}%`,
        }}
        y={{
          title: "Frequency: days per week",
          domain: [0, maxFrequency],
          ticks: Array.from({ length: maxFrequency + 1 }, (_, t) => t),
          format: (t) => `${t}d`,
        }}
        quadrants={{
          highHigh: "Core",
          lowHigh: "Power",
          highLow: "Broad, infrequent",
          lowLow: "Review or retire",
        }}
        describe={(p) => [
          { name: "of active users", value: `${p.x}%` },
          { name: "days per week", value: `${p.y}` },
          { name: "users", value: formatNumber(p.size) },
        ]}
      />
    );
  },
});
