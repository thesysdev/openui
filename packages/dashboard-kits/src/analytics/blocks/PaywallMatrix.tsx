"use client";

// PaywallMatrix: free plan limits by weekly hits and the share that upgrade.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { QuadrantChart } from "../../charts/QuadrantChart";
import { formatNumber } from "../../core/format";
import { passed } from "../../core/schemas";
import type { Paywall } from "./shared";

/** Our rule: a limit is busy at 500 hits a week, and converts well at 2% upgrading. */
const PAYWALL_SPLIT = { x: 500, y: 2 };

export const PaywallMatrix = defineComponent({
  name: "PaywallMatrix",
  description:
    "Free plan limits by weekly hits and the share that upgrade within 14 days, in Working, Show more, Friction, and Rethink quadrants.",
  props: z.object({
    paywalls: z.array(passed("A paywall from get_monetization")).default([]),
  }),
  component: ({ props }) => {
    const paywalls = (props.paywalls ?? []) as unknown as Paywall[];
    if (paywalls.length === 0) return <Pending kind="trend" />;
    const top = Math.ceil(Math.max(...paywalls.map((p) => p.upgradeRate)) + 1);
    const most = Math.ceil(Math.max(...paywalls.map((p) => p.hits)) / 500) * 500;
    return (
      <QuadrantChart
        points={paywalls.map((p) => ({
          name: p.name,
          x: p.hits,
          y: p.upgradeRate,
          size: (p.hits * p.upgradeRate) / 100,
        }))}
        x={{
          title: "Workspaces hitting it per week",
          domain: [0, most],
          ticks: Array.from({ length: most / 500 + 1 }, (_, t) => t * 500),
          format: (t) => formatNumber(t),
        }}
        y={{
          title: "Upgrade within 14 days",
          domain: [0, top],
          ticks: Array.from({ length: top + 1 }, (_, t) => t),
          format: (t) => `${t}%`,
        }}
        split={PAYWALL_SPLIT}
        quadrants={{
          highHigh: "Working",
          lowHigh: "Show more",
          highLow: "Friction",
          lowLow: "Rethink",
        }}
        sizeLabel="Bubble size: upgrades a week"
        describe={(p) => [
          { name: "hits a week", value: formatNumber(p.x) },
          { name: "upgrade within 14 days", value: `${p.y}%` },
          { name: "upgrades a week", value: formatNumber(p.size) },
        ]}
      />
    );
  },
});
