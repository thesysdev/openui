"use client";

// FeatureAdoption: ranked bars of each feature's share of active users.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { formatNumber, formatPoints } from "../../core/format";
import { passed } from "../../core/schemas";
import type { Feature } from "./shared";

export const FeatureAdoption = defineComponent({
  name: "FeatureAdoption",
  description:
    "Feature adoption as ranked bars: percent of the period's active users who used each feature, with user counts, days per week, and the change in percentage points.",
  props: z.object({
    features: z.array(passed("A feature from get_feature_engagement")).default([]),
    limit: z.number().optional(),
  }),
  component: ({ props }) => {
    const features = ((props.features ?? []) as unknown as Feature[]).slice(0, props.limit ?? 20);
    if (features.length === 0) return <Pending kind="list" rows={8} />;
    return (
      <ul className="kit-barlist">
        {features.map((f) => (
          <li
            key={f.name}
            className="kit-barlist__row"
            title={`${f.name}: ${formatNumber(f.users)} users, ${f.frequency} days/week`}
          >
            <span className="kit-barlist__track">
              <span
                className="kit-barlist__fill"
                style={{ width: `${Math.min(100, f.breadth)}%` }}
              />
              <span className="kit-barlist__name">{f.name}</span>
            </span>
            <span className="kit-barlist__value">{f.breadth.toFixed(1)}%</span>
            <span
              className={`kit-barlist__meta ${f.change >= 0 ? "kit-text-good" : "kit-text-bad"}`}
            >
              {formatPoints(f.change)}
            </span>
          </li>
        ))}
      </ul>
    );
  },
});
