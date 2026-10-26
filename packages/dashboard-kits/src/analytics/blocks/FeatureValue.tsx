"use client";

// FeatureValue: feature breadth against the retention gap among activated users.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { QuadrantChart } from "../../charts/QuadrantChart";
import { formatNumber, formatPoints } from "../../core/format";
import { passed } from "../../core/schemas";
import type { Feature } from "./shared";

/** Our rule: 30% of active users is broad; 5 points of retention among activated users matters. */
const VALUE_SPLIT = { x: 30, y: 5 };

export const FeatureValue = defineComponent({
  name: "FeatureValue",
  description:
    "Feature value matrix: breadth against retention gap among activated users, in Protect, Promote, Don't gate, and Review quadrants, sized by days a week.",
  props: z.object({
    features: z.array(passed("A feature from get_feature_engagement")).default([]),
  }),
  component: ({ props }) => {
    const features = (props.features ?? []) as unknown as Feature[];
    if (features.length === 0 || features[0]!.adjustedGap == null) return <Pending kind="trend" />;
    const top = Math.ceil(Math.max(...features.map((f) => f.adjustedGap)) / 2) * 2 + 2;
    return (
      <div className="kit-feature-value">
        <QuadrantChart
          points={features.map((f) => ({
            name: f.name,
            x: f.breadth,
            y: f.adjustedGap,
            size: f.frequency,
          }))}
          x={{
            title: "Breadth: % of active users",
            domain: [0, 100],
            ticks: [0, 25, 50, 75, 100],
            format: (t) => `${t}%`,
          }}
          y={{
            title: "Retention gap among activated users, points",
            domain: [0, top],
            ticks: Array.from({ length: top / 2 + 1 }, (_, t) => t * 2),
            format: (t) => `+${t}`,
          }}
          split={VALUE_SPLIT}
          sizeLabel="Bubble size: days a week its users use it"
          quadrants={{
            highHigh: "Protect",
            lowHigh: "Promote",
            highLow: "Don't gate",
            lowLow: "Review",
          }}
          describe={(p) => {
            const f = features.find((x) => x.name === p.name)!;
            return [
              { name: "of active users", value: `${p.x}%` },
              { name: "retention gap, activated", value: formatPoints(f.adjustedGap) },
              { name: "retention gap, everyone", value: formatPoints(f.retentionGap) },
              { name: "days a week", value: `${p.size}` },
              { name: "users", value: formatNumber(f.users) },
            ];
          }}
        />
        <p className="kit-footnote">
          Week-4 retention of users who used a feature in their first 14 days, minus those who
          didn't, counted among activated users so that busy users using everything don't inflate
          it. A gap, not proof the feature causes it.
        </p>
      </div>
    );
  },
});
