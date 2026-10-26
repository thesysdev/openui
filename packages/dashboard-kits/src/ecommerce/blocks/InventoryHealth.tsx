"use client";

// InventoryHealth: every product's stock, most urgent first.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { ScrollRegion } from "../../blocks/ScrollRegion";
import { formatNumber } from "../../core/format";
import { passed } from "../../core/schemas";

interface CatalogItem {
  name: string;
  sku: string;
  category: string;
  abc: "A" | "B" | "C";
  revenue: number;
  stock: number;
  dailySales: number;
  daysOfCover: number;
  reorderAt: number;
  status: "Out of stock" | "Reorder now" | "Slow mover" | "Healthy";
  action: string;
}

const HEALTH_TONE = {
  "Out of stock": "negative",
  "Reorder now": "warning",
  "Slow mover": "info",
  Healthy: "positive",
} as const;
/** The days-of-cover bar runs to this, so a slow mover still reads against the reorder tick. */
const COVER_MAX = 90;

export const InventoryHealth = defineComponent({
  name: "InventoryHealth",
  description:
    "Every product's stock, most urgent first: ABC class, cover against the reorder point, status, next step: InventoryHealth(stock.catalog).",
  props: z.object({
    catalog: z.array(passed("A product from get_inventory_health's catalog")).default([]),
  }),
  component: ({ props }) => {
    const catalog = (props.catalog ?? []) as unknown as CatalogItem[];
    if (catalog.length === 0) return <Pending kind="table" rows={8} />;
    const at = (days: number) => `${(Math.min(days, COVER_MAX) / COVER_MAX) * 100}%`;
    return (
      <div className="kit-stockhealth">
        <ScrollRegion label="Inventory health table">
          <table className="kit-table kit-commits">
            <thead>
              <tr>
                <th>Product</th>
                <th title="By share of the last 30 days' revenue: A makes the first 80%">Class</th>
                <th>Days of cover · reorder at {catalog[0]!.reorderAt}</th>
                <th className="kit-num">Sales/day</th>
                <th>Status</th>
                <th>Next step</th>
              </tr>
            </thead>
            <tbody>
              {catalog.map((c) => (
                <tr key={c.sku}>
                  <th scope="row">
                    <span className="kit-commits__name">{c.name}</span>
                    <span className="kit-small kit-muted">
                      {c.sku} · {c.category}
                    </span>
                  </th>
                  <td>
                    <span className={`kit-abc kit-abc--${c.abc.toLowerCase()}`}>{c.abc}</span>
                  </td>
                  <td>
                    <span className="kit-cover">
                      <span className="kit-cover__track" aria-hidden>
                        <i
                          className={`kit-cover__bar kit-cover__bar--${HEALTH_TONE[c.status]}`}
                          style={{ width: at(c.daysOfCover) }}
                        />
                        <i className="kit-cover__tick" style={{ left: at(c.reorderAt) }} />
                      </span>
                      <span className="kit-num">{Math.round(c.daysOfCover)} days</span>
                    </span>
                  </td>
                  <td className="kit-num">{formatNumber(c.dailySales)}</td>
                  <td>
                    <span className={`kit-status kit-status--${HEALTH_TONE[c.status]}`}>
                      <i className="kit-status__dot" />
                      {c.status}
                    </span>
                  </td>
                  <td className="kit-small">{c.action || <span className="kit-muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      </div>
    );
  },
});
