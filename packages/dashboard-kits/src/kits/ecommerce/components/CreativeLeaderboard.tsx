"use client";

// CreativeLeaderboard: ad creatives by spend, ROAS against break-even, and fatigue.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { ScrollRegion } from "../../../components/ScrollRegion";
import { formatCurrency, formatPercent } from "../../../core/format";
import { passed } from "../../../core/schemas";
import { Pending } from "../../../library/Pending";
import { Change } from "./shared";

interface Creative {
  name: string;
  platform: string;
  format: string;
  spend: number;
  revenue: number;
  roas: number;
  ctr: number;
  ctrChange: number;
  hookRate?: number;
  holdRate?: number;
  frequency?: number;
  fatigue: "Fresh" | "Watch" | "Fatigued";
  belowBreakEven: boolean;
}

const FATIGUE_TONE = { Fresh: "positive", Watch: "warning", Fatigued: "negative" } as const;

export const CreativeLeaderboard = defineComponent({
  name: "CreativeLeaderboard",
  description:
    "Ad creatives by spend: ROAS against break-even, CTR and its change, hook and hold rates for video, frequency, and a fatigue badge: CreativeLeaderboard(ads.creatives, ads.breakEvenRoas). LargeCard only.",
  props: z.object({
    creatives: z.array(passed("A creative from get_creatives")).default([]),
    breakEvenRoas: z.number().optional(),
  }),
  component: ({ props }) => {
    const creatives = (props.creatives ?? []) as unknown as Creative[];
    if (creatives.length === 0) return <Pending kind="list" rows={6} />;
    const rate = (v?: number) =>
      v == null ? (
        <span className="kit-muted">—</span>
      ) : (
        <span className="kit-creative__rate">
          <span className="kit-creative__meter" aria-hidden>
            <span style={{ width: `${Math.min(100, v * 200)}%` }} />
          </span>
          {formatPercent(v, 0)}
        </span>
      );
    return (
      <ScrollRegion label="Ad creatives table">
        <table className="kit-table kit-creatives">
          <thead>
            <tr>
              <th>Creative</th>
              <th className="kit-num">Spend</th>
              <th className="kit-num">ROAS</th>
              <th className="kit-num">CTR</th>
              <th>Hook</th>
              <th>Hold</th>
              <th className="kit-num">Frequency</th>
              <th>Fatigue</th>
            </tr>
          </thead>
          <tbody>
            {[...creatives]
              .sort((a, b) => b.spend - a.spend)
              .map((c) => (
                <tr key={c.name}>
                  <td>
                    <span className="kit-cell-title">{c.name}</span>
                    <span className="kit-muted kit-small">
                      {" "}
                      {c.platform} · {c.format}
                    </span>
                  </td>
                  <td className="kit-num">{formatCurrency(c.spend)}</td>
                  <td className={`kit-num ${c.belowBreakEven ? "kit-text-bad" : "kit-text-good"}`}>
                    {c.roas.toFixed(2)}x
                    {props.breakEvenRoas != null && c.belowBreakEven && (
                      <span className="kit-small kit-muted">
                        {" "}
                        &lt; {props.breakEvenRoas.toFixed(1)}x
                      </span>
                    )}
                  </td>
                  <td className="kit-num">
                    {formatPercent(c.ctr, 2)} <Change value={c.ctrChange} />
                  </td>
                  <td>{rate(c.hookRate)}</td>
                  <td>{rate(c.holdRate)}</td>
                  <td className="kit-num">{c.frequency != null ? c.frequency.toFixed(1) : "—"}</td>
                  <td>
                    <span className={`kit-status kit-status--${FATIGUE_TONE[c.fatigue]}`}>
                      <i className="kit-status__dot" />
                      {c.fatigue}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </ScrollRegion>
    );
  },
});
