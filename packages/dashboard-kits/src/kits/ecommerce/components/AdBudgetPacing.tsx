"use client";

// AdBudgetPacing: each ad platform's spend against its monthly budget.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { PaceCell } from "../../../components/PaceCell";
import { ScrollRegion } from "../../../components/ScrollRegion";
import { BurnDown } from "../../../components/charts/BurnDown";
import { formatCurrency } from "../../../core/format";
import { passed } from "../../../core/schemas";
import { Pending } from "../../../library/Pending";

interface AdBudget {
  name: string;
  budget: number;
  spent: number;
  burn: number[];
  elapsed: number;
  projected: number;
  pace: number;
  status: "under" | "on_track" | "over";
}

/** Spending faster than plan is the risk for a budget; slower is only worth a look. */
const BUDGET_LABEL = {
  under: { text: "Under pace", tone: "info" },
  on_track: { text: "On pace", tone: "positive" },
  over: { text: "Over pace", tone: "negative" },
} as const;

export const AdBudgetPacing = defineComponent({
  name: "AdBudgetPacing",
  description:
    "Each ad platform's spend against its monthly budget, with a burn-down to month end. Pass get_targets's budgets.",
  props: z.object({
    budgets: z.array(passed("A budget from get_targets")).default([]),
  }),
  component: ({ props }) => {
    const budgets = (props.budgets ?? []) as unknown as AdBudget[];
    // Only Amazon alone has no budgets: ad spend drives the store and app (see get_targets).
    if (budgets.length === 0)
      return (
        <Pending
          kind="table"
          rows={3}
          empty="No ad budgets: ads here drive the online store and app, and Amazon's selling costs are its fees."
        />
      );
    return (
      <ScrollRegion label="Ad budget pacing table">
        <table className="kit-table kit-commits">
          <thead>
            <tr>
              <th>Platform</th>
              <th>Pace</th>
              <th>Burn-down</th>
              <th className="kit-num">Month end</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((b) => {
              const label = BUDGET_LABEL[b.status];
              const over = b.projected - b.budget;
              return (
                <tr key={b.name}>
                  <th scope="row">
                    <span className="kit-commits__name">{b.name}</span>
                    <span className="kit-small kit-muted">
                      {formatCurrency(b.spent)} of {formatCurrency(b.budget)}
                    </span>
                  </th>
                  <td>
                    <PaceCell
                      pace={b.pace}
                      band={[98, 102]}
                      mark={b.status === "over" ? "bad" : b.status}
                      tone={label.tone}
                      label={label.text}
                    />
                  </td>
                  <td className="kit-commits__burn">
                    <BurnDown
                      burn={b.burn}
                      committed={b.budget}
                      elapsed={b.elapsed / 100}
                      projected={b.projected}
                      status={b.status}
                      overIsBad
                    />
                  </td>
                  <td className="kit-num">
                    {formatCurrency(b.projected)}
                    <span className={`kit-small ${over > 0 ? "kit-text-bad" : "kit-muted"}`}>
                      {" "}
                      {over > 0 ? `${formatCurrency(over)} over` : `${formatCurrency(-over)} left`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollRegion>
    );
  },
});
