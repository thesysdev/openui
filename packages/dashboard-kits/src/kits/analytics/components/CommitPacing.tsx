"use client";

// CommitPacing: AI credit commits, each one's pace and burn-down to renewal.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { BurnDown } from "../../../components/charts/BurnDown";
import { PaceCell } from "../../../components/PaceCell";
import { ScrollRegion } from "../../../components/ScrollRegion";
import { formatCurrency, formatNumber } from "../../../core/format";
import { passed } from "../../../core/schemas";
import { Pending } from "../../../library/Pending";
import type { Commit } from "./shared";

const PACE_LABEL = {
  under: { text: "Under pace", tone: "warning" },
  on_track: { text: "On track", tone: "positive" },
  over: { text: "Over pace", tone: "info" },
} as const;

export const CommitPacing = defineComponent({
  name: "CommitPacing",
  description:
    "AI credit commits: each one's pace against a straight line through its term (80–110% on track), its burn-down with where this pace ends at renewal, and the renewal date.",
  props: z.object({
    commits: z.array(passed("A commit from get_usage_commits")).default([]),
  }),
  component: ({ props }) => {
    const commits = (props.commits ?? []) as unknown as Commit[];
    if (commits.length === 0) return <Pending kind="table" rows={6} />;
    return (
      <ScrollRegion label="Commit pacing table">
        <table className="kit-table kit-commits">
          <thead>
            <tr>
              <th>Workspace</th>
              <th>Pace</th>
              <th>Burn-down</th>
              <th className="kit-num">By renewal</th>
              <th className="kit-num">Renews</th>
            </tr>
          </thead>
          <tbody>
            {commits.map((c) => {
              const label = PACE_LABEL[c.status];
              return (
                <tr key={c.name}>
                  <th scope="row">
                    <span className="kit-commits__name">{c.name}</span>
                    <span className="kit-small kit-muted">
                      {formatNumber(c.committed)} credits · {formatCurrency(c.value)}
                    </span>
                  </th>
                  <td>
                    <PaceCell
                      pace={c.pace}
                      band={[80, 110]}
                      mark={c.status}
                      tone={label.tone}
                      label={label.text}
                    />
                  </td>
                  <td className="kit-commits__burn">
                    <BurnDown
                      burn={c.burn}
                      committed={c.committed}
                      elapsed={c.elapsed / 100}
                      projected={c.projected}
                      status={c.status}
                    />
                  </td>
                  <td className="kit-num">
                    {Math.round((c.projected / c.committed) * 100)}%
                    <span className="kit-small kit-muted"> of commit</span>
                  </td>
                  <td className="kit-num">{c.renewalInDays} days</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollRegion>
    );
  },
});
