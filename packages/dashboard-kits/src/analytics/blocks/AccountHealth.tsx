"use client";

// AccountHealth: paying workspaces with a health ring and its weighted breakdown.

import { defineComponent } from "@openuidev/react-lang";
import { Fragment, useId, useState } from "react";
import { z } from "zod/v4";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { ScrollRegion } from "../../blocks/ScrollRegion";
import { Sparkline } from "../../charts/Sparkline";
import { formatCurrency, formatNumber } from "../../core/format";
import { passed } from "../../core/schemas";
import type { Account } from "./shared";

function HealthRing({ score }: { score: number }) {
  const tone = score < 40 ? "negative" : score < 70 ? "warning" : "positive";
  const c = 2 * Math.PI * 14;
  return (
    <span className={`kit-ring kit-ring--${tone}`} aria-label={`Health ${score}`}>
      <svg viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" className="kit-ring__track" />
        <circle
          cx="18"
          cy="18"
          r="14"
          className="kit-ring__fill"
          strokeDasharray={`${(score / 100) * c} ${c}`}
        />
      </svg>
      <span>{score}</span>
    </span>
  );
}

const ZONE_TONE = { Healthy: "positive", Watch: "warning", "At risk": "negative" } as const;
const CATEGORY_LABEL: Record<string, string> = {
  engagement: "Engagement",
  seats: "Seats in use",
  breadth: "Feature breadth",
  support: "Support",
  trend: "Trend",
};

/** One workspace's weighted health: each category's score, its weight, and the 12-week line. */
function HealthBreakdown({ account }: { account: Account }) {
  const weights = account.breakdown.reduce((t, b) => t + b.weight, 0) || 1;
  return (
    <div className="kit-breakdown">
      <ul className="kit-breakdown__list">
        {account.breakdown.map((b) => (
          <li key={b.category} className="kit-breakdown__row">
            <span className="kit-breakdown__name">
              {CATEGORY_LABEL[b.category] ?? b.category}
              <span className="kit-muted">
                {" "}
                · {Math.round((b.weight / weights) * 100)}% of score
              </span>
            </span>
            <span className="kit-meter kit-breakdown__meter">
              <span style={{ width: `${b.score}%` }} />
            </span>
            <span className="kit-num kit-small">{b.score}</span>
          </li>
        ))}
      </ul>
      <div className="kit-breakdown__history">
        <span className="kit-small kit-muted">Last 12 weeks</span>
        <Sparkline values={account.history} />
      </div>
    </div>
  );
}

function AccountRows({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const detailId = `kit-account-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <ScrollRegion label="Workspace health table">
      <table className="kit-table kit-accounts">
        <thead>
          <tr>
            <th>Workspace</th>
            <th>Health</th>
            <th>Seats active, last 7 days</th>
            <th className="kit-num">ARR</th>
            <th>Renews</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a, i) => {
            const utilization = a.activeSeats / (a.seats || 1);
            const expanded = open === a.name;
            return (
              <Fragment key={a.name}>
                {/* The whole row toggles on click; the name is the keyboard and
                    screen-reader control (a table row can't carry aria-expanded),
                    and its click bubbles to the row. */}
                <tr
                  className={`kit-accounts__row${expanded ? " kit-accounts__row--open" : ""}`}
                  onClick={() => setOpen(expanded ? null : a.name)}
                >
                  <td>
                    <button
                      type="button"
                      className="kit-accounts__toggle kit-cell-title"
                      aria-expanded={expanded}
                      aria-controls={expanded ? `${detailId}-${i}` : undefined}
                    >
                      {a.name}
                    </button>
                    <span className="kit-tag">{a.plan}</span>
                    <span className="kit-accounts__reason">{a.reason}</span>
                  </td>
                  <td>
                    <span className="kit-health">
                      <HealthRing score={a.healthScore} />
                      <span
                        className={`kit-num kit-small ${a.change >= 0 ? "kit-text-good" : "kit-text-bad"}`}
                      >
                        {a.change >= 0 ? "+" : "−"}
                        {Math.abs(a.change)} pts
                      </span>
                    </span>
                  </td>
                  <td>
                    <span className="kit-seats">
                      <span className="kit-meter">
                        <span style={{ width: `${utilization * 100}%` }} />
                      </span>
                      <span className="kit-num kit-small kit-muted">
                        {formatNumber(a.activeSeats)} of {formatNumber(a.seats)} ·{" "}
                        {Math.round(utilization * 100)}%
                      </span>
                    </span>
                  </td>
                  <td className="kit-num kit-strong">{formatCurrency(a.arr)}</td>
                  <td className="kit-small">in {a.renewalInDays}d</td>
                  <td>
                    <span className={`kit-status kit-status--${ZONE_TONE[a.zone]}`}>
                      <i className="kit-status__dot" />
                      {a.reviewNow ? "Review now" : a.zone}
                    </span>
                  </td>
                </tr>
                {expanded && (
                  <tr id={`${detailId}-${i}`} className="kit-accounts__detail">
                    <td colSpan={6}>
                      <HealthBreakdown account={a} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </ScrollRegion>
  );
}

export const AccountHealth = defineComponent({
  name: "AccountHealth",
  description:
    "Paying workspaces with why each is listed, a health ring with its 30-day change, seats active, ARR, renewal, and status (Review now after a 15-point drop in 7 days); a row opens to its weighted health breakdown and 12-week line: AccountHealth(accounts.accounts).",
  props: z.object({
    accounts: z.array(passed("An account from get_account_health")).default([]),
  }),
  component: ({ props }) => {
    const accounts = (props.accounts ?? []) as unknown as Account[];
    if (accounts.length === 0)
      return <Pending kind="table" rows={6} empty="No workspaces on this list." />;
    return <AccountRows accounts={accounts} />;
  },
});
