"use client";

// InventoryAlerts: products to restock, most urgent first.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { formatCurrency, formatNumber } from "../../core/format";
import { passed } from "../../core/schemas";
import type { InventoryItem } from "./shared";

export const InventoryAlerts = defineComponent({
  name: "InventoryAlerts",
  description:
    "Products to restock, most urgent first: a days-of-cover timeline with the reorder point, when the open order lands, and any gap; the order-by date; sales at risk; and ad spend still pointing at it.",
  props: z.object({
    items: z.array(passed("An item from get_inventory_health")).default([]),
  }),
  component: ({ props }) => {
    const items = (props.items ?? []) as unknown as InventoryItem[];
    if (items.length === 0)
      return <Pending kind="list" empty="Every product is above its reorder point." />;
    return (
      <ul className="kit-alerts">
        {items.map((item) => {
          const severity = item.stock === 0 ? "out" : item.daysOfCover < 7 ? "critical" : "low";
          const tag = { out: "Out of stock", critical: "Critical", low: "Low" }[severity];
          const reorderDays = item.reorderPoint / (item.dailySales || 1);
          const lands = item.incomingInDays;
          // One timeline for every row's marks: today on the left, days ahead to the right.
          const span = Math.max(30, reorderDays + 4, (lands ?? 0) + 4);
          const at = (days: number) => `${Math.min(100, (days / span) * 100)}%`;
          const gapStart = item.daysOfCover;
          const gapEnd = gapStart + item.stockoutGapDays;
          const atRisk = item.revenueAtRisk + (item.lostRevenue ?? 0);
          return (
            <li key={item.sku} className="kit-alert">
              <div className="kit-alert__head">
                <span>
                  <span className="kit-cell-title">{item.name}</span>
                  <span className="kit-muted kit-small"> {item.sku}</span>
                </span>
                <span
                  className={`kit-status kit-status--${severity === "low" ? "warning" : "negative"}`}
                >
                  <i className="kit-status__dot" />
                  {tag}
                </span>
              </div>
              <div className="kit-alert__cover">
                <span className="kit-alert__days">
                  {item.daysOfCover.toFixed(1)}
                  <small> days left</small>
                </span>
                <span
                  className="kit-alert__timeline"
                  role="img"
                  aria-label={`${item.daysOfCover.toFixed(1)} days of cover; reorder point at ${Math.round(reorderDays)} days${lands != null ? `; order lands in ${lands} days` : ""}${item.stockoutGapDays > 0 ? `; ${Math.ceil(item.stockoutGapDays)} days with nothing to sell` : ""}`}
                >
                  <span
                    className={`kit-alert__fill kit-alert__fill--${severity}`}
                    style={{ width: at(item.daysOfCover) }}
                  />
                  {item.stockoutGapDays > 0 && (
                    <span
                      className="kit-alert__gap"
                      style={{ left: at(gapStart), width: `calc(${at(gapEnd)} - ${at(gapStart)})` }}
                    />
                  )}
                  <span className="kit-alert__tick" style={{ left: at(reorderDays) }} />
                  {lands != null && (
                    <span
                      className="kit-alert__po"
                      style={{ left: at(lands) }}
                      title="Order lands"
                    />
                  )}
                </span>
              </div>
              <div className="kit-alert__meta">
                <span>
                  {formatNumber(item.stock)} on hand · {item.dailySales.toFixed(0)}/day ·{" "}
                  {item.incoming
                    ? `${formatNumber(item.incoming)} land in ${lands}d`
                    : "no open order"}
                  {item.stockoutGapDays > 0 && (
                    <span className="kit-text-bad">
                      {" "}
                      · {Math.ceil(item.stockoutGapDays)}-day gap
                    </span>
                  )}
                </span>
                <span className={item.daysLate ? "kit-text-bad kit-strong" : "kit-strong"}>
                  {item.replenishBy === "Now"
                    ? `Order now${item.daysLate ? ` (${item.daysLate}d late)` : ""}`
                    : `Order by ${item.replenishBy}`}
                  {item.suggestedOrder ? ` · ${formatNumber(item.suggestedOrder)} units` : ""}
                </span>
              </div>
              {(atRisk > 0 || item.adSpendPerDay > 0) && (
                <div className="kit-alert__meta">
                  {atRisk > 0 ? (
                    <span className="kit-text-bad">
                      {formatCurrency(atRisk)} {item.lostRevenue ? "lost or at risk" : "at risk"}
                    </span>
                  ) : (
                    <span />
                  )}
                  {item.adSpendPerDay > 0 && (
                    <span className="kit-muted">
                      Ads still running: {formatCurrency(item.adSpendPerDay)}/day
                    </span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  },
});
