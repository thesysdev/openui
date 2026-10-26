"use client";

// ChannelPerformance: the marketing channel table, with a total row.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Sparkline } from "../../../components/charts/Sparkline";
import { ScrollRegion } from "../../../components/ScrollRegion";
import { formatCurrency, formatNumber, formatPercent } from "../../../core/format";
import { passed } from "../../../core/schemas";
import { Pending } from "../../../library/Pending";
import { type MarketingChannel, Change } from "./shared";

export const ChannelPerformance = defineComponent({
  name: "ChannelPerformance",
  description:
    "Marketing channel table: spend, attributed revenue with a sparkline, ROAS against the target (with its change), CPA, new customers, and share of revenue, plus a total row.",
  props: z.object({
    channels: z.array(passed("A channel from get_marketing_performance")).default([]),
    targetRoas: z.number().optional(),
  }),
  component: ({ props }) => {
    const channels = (props.channels ?? []) as unknown as MarketingChannel[];
    if (channels.length === 0) return <Pending kind="table" rows={7} />;
    const target = props.targetRoas;
    const maxRoas = Math.max(
      (target ?? 1) * 2,
      ...channels.filter((c) => c.type === "paid" && c.roas != null).map((c) => c.roas! * 1.15),
    );
    const spend = channels.reduce((a, c) => a + c.spend, 0);
    const revenue = channels.reduce((a, c) => a + c.revenue, 0);
    const paid = channels.filter((c) => c.type === "paid");
    const paidSpend = paid.reduce((a, c) => a + c.spend, 0);
    const paidRevenue = paid.reduce((a, c) => a + c.revenue, 0);
    return (
      <ScrollRegion label="Channel performance table">
        <table className="kit-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th className="kit-num">Spend</th>
              <th className="kit-num">Revenue</th>
              <th>
                <span className="kit-sr">Revenue trend</span>
              </th>
              <th>ROAS{target ? ` · target ${target.toFixed(1)}x` : ""}</th>
              <th className="kit-num">CPA</th>
              <th className="kit-num">New customers</th>
              <th className="kit-num">Share</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((c) => {
              const below =
                target != null && c.roas != null && c.type === "paid" && c.roas < target;
              return (
                <tr key={c.channel}>
                  <td>
                    <span className="kit-cell-title">{c.channel}</span>
                    <span className={`kit-tag kit-tag--${c.type}`}>{c.type}</span>
                  </td>
                  <td className="kit-num">{c.spend ? formatCurrency(c.spend) : "—"}</td>
                  <td className="kit-num kit-strong">{formatCurrency(c.revenue)}</td>
                  <td className="kit-cell-spark">
                    {c.trend && <Sparkline values={c.trend} height={26} />}
                  </td>
                  <td>
                    {c.roas == null ? (
                      <span className="kit-muted">Organic</span>
                    ) : (
                      <span className="kit-roas">
                        <span className={`kit-roas__value${below ? " kit-text-bad" : ""}`}>
                          {below && <span aria-hidden>▾ </span>}
                          {c.roas.toFixed(2)}x
                        </span>
                        <span className="kit-roas__track">
                          <span
                            className={`kit-roas__bar${below ? " kit-roas__bar--below" : ""}`}
                            style={{ width: `${Math.min(100, (c.roas / maxRoas) * 100)}%` }}
                          />
                          {target != null && (
                            <i
                              className="kit-roas__target"
                              style={{ left: `${(target / maxRoas) * 100}%` }}
                            />
                          )}
                        </span>
                        <Change value={c.roasChange} />
                      </span>
                    )}
                  </td>
                  <td className="kit-num">{c.cpa != null ? formatCurrency(c.cpa) : "—"}</td>
                  <td className="kit-num">{formatNumber(c.newCustomers)}</td>
                  <td className="kit-num">{formatPercent(c.share)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="kit-strong">All channels</td>
              <td className="kit-num kit-strong">{formatCurrency(spend)}</td>
              <td className="kit-num kit-strong">{formatCurrency(revenue)}</td>
              <td />
              <td className="kit-muted">
                {paidSpend ? `Paid ads ${(paidRevenue / paidSpend).toFixed(2)}x` : ""}
              </td>
              <td />
              <td className="kit-num kit-strong">
                {formatNumber(channels.reduce((a, c) => a + c.newCustomers, 0))}
              </td>
              <td className="kit-num">100%</td>
            </tr>
          </tfoot>
        </table>
      </ScrollRegion>
    );
  },
});
