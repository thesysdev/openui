"use client";

// ProductPerformance: the product table for merchandising.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Sparkline } from "../../../components/charts/Sparkline";
import { ScrollRegion } from "../../../components/ScrollRegion";
import { formatCurrency, formatNumber, formatPercent } from "../../../core/format";
import { passed } from "../../../core/schemas";
import { Pending } from "../../../library/Pending";
import { type Product, Change, Monogram, STOCK_TONE } from "./shared";

export const ProductPerformance = defineComponent({
  name: "ProductPerformance",
  description:
    "Product table for merchandising: revenue with change, a units sparkline, page views, add-to-cart rate, view-to-purchase rate, return rate (flagged when high), gross margin, and stock status.",
  props: z.object({
    products: z.array(passed("A product from get_product_performance")).default([]),
  }),
  component: ({ props }) => {
    const products = (props.products ?? []) as unknown as Product[];
    if (products.length === 0) return <Pending kind="table" rows={8} />;
    const views = products.some((p) => p.views != null);
    return (
      <ScrollRegion label="Product performance table">
        <table className="kit-table">
          <thead>
            <tr>
              <th>Product</th>
              <th className="kit-num">Revenue</th>
              <th>Units sold</th>
              {views && <th className="kit-num">Views</th>}
              {views && <th className="kit-num">Add to cart</th>}
              {views && <th className="kit-num">Purchase</th>}
              <th className="kit-num">Returns</th>
              <th className="kit-num">Margin</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.sku ?? p.name}>
                <td>
                  <span className="kit-product">
                    <Monogram name={p.name} category={p.category} />
                    <span className="kit-product__text">
                      <span className="kit-cell-title">{p.name}</span>
                      <span className="kit-muted kit-small">
                        {p.category} · {p.sku}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="kit-num">
                  <span className="kit-stack">
                    <span className="kit-strong">{formatCurrency(p.revenue)}</span>
                    <Change value={p.change} />
                  </span>
                </td>
                <td>
                  <span className="kit-units">
                    {p.trend && <Sparkline values={p.trend} height={22} />}
                    <span className="kit-num">{formatNumber(p.units)}</span>
                  </span>
                </td>
                {views && (
                  <td className="kit-num">{p.views != null ? formatNumber(p.views) : "—"}</td>
                )}
                {views && (
                  <td className="kit-num">
                    {p.addToCartRate != null ? formatPercent(p.addToCartRate) : "—"}
                  </td>
                )}
                {views && (
                  <td className="kit-num">
                    {p.conversionRate != null ? formatPercent(p.conversionRate) : "—"}
                  </td>
                )}
                <td className="kit-num">
                  <span className={p.returnRate >= 0.12 ? "kit-flag" : ""}>
                    {formatPercent(p.returnRate)}
                  </span>
                </td>
                <td className="kit-num">{formatPercent(p.margin, 0)}</td>
                <td>
                  <span className={`kit-status kit-status--${STOCK_TONE[p.stockStatus]}`}>
                    <i className="kit-status__dot" />
                    {p.stockStatus}
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
