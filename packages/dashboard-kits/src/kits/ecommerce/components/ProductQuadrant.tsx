"use client";

// ProductQuadrant: products by sell-through and gross margin, in four quadrants.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { QuadrantChart } from "../../../components/charts/QuadrantChart";
import { formatChange, formatCurrency } from "../../../core/format";
import { passed } from "../../../core/schemas";
import { Pending } from "../../../library/Pending";
import type { Product } from "./shared";

export const ProductQuadrant = defineComponent({
  name: "ProductQuadrant",
  description:
    "Products by sell-through and gross margin, sized by net sales, in four quadrants: Winners, Push (slow, high margin), Volume (fast, thin), Review. Pass get_product_performance's products with limit 16.",
  props: z.object({
    products: z.array(passed("A product from get_product_performance")).default([]),
  }),
  component: ({ props }) => {
    const products = (props.products ?? []) as unknown as Product[];
    if (products.length === 0) return <Pending kind="trend" />;
    const margins = products.map((p) => p.margin * 100);
    const lo = Math.floor(Math.min(...margins) / 5) * 5;
    const hi = Math.ceil(Math.max(...margins) / 5) * 5;
    return (
      <QuadrantChart
        points={products.map((p) => ({
          name: p.name,
          x: Math.round(p.sellThrough * 1000) / 10,
          y: Math.round(p.margin * 1000) / 10,
          size: p.revenue,
          change: { text: formatChange(p.change), good: p.change >= 0 },
        }))}
        x={{
          title: "Sell-through: % of available stock sold",
          domain: [0, 100],
          ticks: [0, 25, 50, 75, 100],
          format: (t) => `${t}%`,
        }}
        y={{
          title: "Gross margin",
          domain: [lo, hi],
          ticks: Array.from({ length: (hi - lo) / 5 + 1 }, (_, i) => lo + i * 5),
          format: (t) => `${t}%`,
        }}
        quadrants={{
          highHigh: "Winners",
          lowHigh: "Push",
          highLow: "Volume",
          lowLow: "Review",
        }}
        describe={(p) => [
          { name: "sell-through", value: `${p.x}%` },
          { name: "gross margin", value: `${p.y}%` },
          { name: "net sales", value: formatCurrency(p.size) },
        ]}
        sizeLabel="Bubble size: net sales"
      />
    );
  },
});
