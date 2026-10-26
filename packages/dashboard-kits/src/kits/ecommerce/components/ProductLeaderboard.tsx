"use client";

// ProductLeaderboard: ranked best sellers.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Sparkline } from "../../../components/charts/Sparkline";
import { DeltaPill } from "../../../components/DeltaPill";
import { formatCurrency, formatNumber } from "../../../core/format";
import { passed } from "../../../core/schemas";
import { Pending } from "../../../library/Pending";
import { type Product, Monogram, STOCK_TONE } from "./shared";

export const ProductLeaderboard = defineComponent({
  name: "ProductLeaderboard",
  description:
    "Ranked best sellers with revenue, a sparkline, any stock warning, units, category, a bar against the leader, and the change.",
  props: z.object({
    products: z.array(passed("A product: {name, revenue, units?, category?, change?}")).default([]),
    limit: z.number().optional(),
  }),
  component: ({ props }) => {
    const products = ((props.products ?? []) as unknown as Product[]).slice(0, props.limit ?? 10);
    if (products.length === 0) return <Pending kind="list" />;
    const top = Math.max(...products.map((p) => p.revenue), 1);
    return (
      <ol className="kit-leaderboard">
        {products.map((product, i) => (
          <li key={`${product.name}-${i}`} className="kit-leaderboard__item">
            <Monogram name={product.name} category={product.category ?? ""} />
            <span className="kit-leaderboard__body">
              <span className="kit-leaderboard__line">
                <span className="kit-leaderboard__name">{product.name}</span>
                {product.stockStatus && product.stockStatus !== "In stock" && (
                  <span
                    className={`kit-status kit-status--${STOCK_TONE[product.stockStatus]} kit-leaderboard__stock`}
                    title={product.stockStatus}
                  >
                    <i className="kit-status__dot" />
                    {product.stockStatus === "Out of stock" ? "Out" : "Low"}
                  </span>
                )}
                {product.trend && product.trend.length > 1 && (
                  <span className="kit-leaderboard__spark" aria-hidden>
                    <Sparkline values={product.trend} height={20} />
                  </span>
                )}
                <span className="kit-num kit-strong">{formatCurrency(product.revenue)}</span>
              </span>
              <span className="kit-meter">
                <span style={{ width: `${(product.revenue / top) * 100}%` }} />
              </span>
              <span className="kit-leaderboard__line kit-small">
                <span className="kit-muted">
                  {[
                    product.category,
                    product.units != null && `${formatNumber(product.units)} sold`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <DeltaPill change={product.change} />
              </span>
            </span>
          </li>
        ))}
      </ol>
    );
  },
});
