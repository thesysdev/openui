"use client";

// ChannelProfit: sales channels side by side, net sales to contribution profit.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { ScrollRegion } from "../../blocks/ScrollRegion";
import { formatCurrency, formatPercent, formatPoints } from "../../core/format";
import { passed } from "../../core/schemas";

interface ChannelProfitRow {
  name: string;
  net: number;
  productCost: number;
  feesAndFulfillment: number;
  marketing: number;
  contribution: number;
  margin: number;
  marginBefore: number;
}

export const ChannelProfit = defineComponent({
  name: "ChannelProfit",
  description:
    "Sales channels side by side, net sales to contribution profit and margin: ChannelProfit(profit.byChannel).",
  props: z.object({
    channels: z.array(passed("A channel from get_profit_bridge's byChannel")).default([]),
  }),
  component: ({ props }) => {
    const rows = (props.channels ?? []) as unknown as ChannelProfitRow[];
    if (rows.length === 0) return <Pending kind="table" rows={3} />;
    const top = Math.max(0.01, ...rows.map((r) => Math.max(r.margin, r.marginBefore)));
    return (
      <ScrollRegion label="Channel profit table">
        <table className="kit-table kit-commits">
          <thead>
            <tr>
              <th>Channel</th>
              <th className="kit-num">Net sales</th>
              <th className="kit-num">Product cost</th>
              <th className="kit-num">Fees, shipping, returns</th>
              <th className="kit-num">Marketing</th>
              <th className="kit-num">Contribution</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const points = (r.margin - r.marginBefore) * 100;
              return (
                <tr key={r.name}>
                  <th scope="row">
                    <span className="kit-commits__name">{r.name}</span>
                  </th>
                  <td className="kit-num">{formatCurrency(r.net)}</td>
                  <td className="kit-num kit-muted">−{formatCurrency(r.productCost)}</td>
                  <td className="kit-num kit-muted">−{formatCurrency(r.feesAndFulfillment)}</td>
                  <td className="kit-num kit-muted">
                    {r.marketing ? `−${formatCurrency(r.marketing)}` : "—"}
                  </td>
                  <td className="kit-num kit-strong">{formatCurrency(r.contribution)}</td>
                  <td>
                    <span className="kit-cover">
                      <span className="kit-cover__track" aria-hidden>
                        <i
                          className="kit-cover__bar kit-cover__bar--positive"
                          style={{ width: `${(Math.max(0, r.margin) / top) * 100}%` }}
                        />
                        <i
                          className="kit-cover__tick"
                          style={{ left: `${(Math.max(0, r.marginBefore) / top) * 100}%` }}
                        />
                      </span>
                      <span className="kit-num">{formatPercent(r.margin, 1)}</span>
                      {Math.abs(points) >= 0.1 && (
                        <span
                          className={`kit-small kit-num kit-text-${points >= 0 ? "good" : "bad"}`}
                        >
                          {formatPoints(points)}
                        </span>
                      )}
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
