"use client";

// ExchangeMatrix: size exchanges as a grid, size ordered against size swapped to.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { ScrollRegion } from "../../blocks/ScrollRegion";
import { passed } from "../../core/schemas";

export const ExchangeMatrix = defineComponent({
  name: "ExchangeMatrix",
  description:
    "Size exchanges as a grid, size ordered against size swapped to, with the share that went a size up: ExchangeMatrix(returns.exchanges).",
  props: z.object({
    exchanges: passed("get_returns' exchanges, passed whole").optional(),
  }),
  component: ({ props }) => {
    const m = props.exchanges as unknown as
      { category: string; sizes: string[]; counts: number[][] } | undefined;
    if (!m?.sizes?.length) return <Pending kind="list" rows={6} empty="No size exchanges here." />;
    const max = Math.max(1, ...m.counts.flat());
    const total = m.counts.flat().reduce((a, b) => a + b, 0) || 1;
    const up = m.counts.reduce((t, row, r) => t + row.slice(r + 1).reduce((a, b) => a + b, 0), 0);
    return (
      <div className="kit-exchange">
        <p className="kit-exchange__lead">
          <strong>{Math.round((up / total) * 100)}%</strong> of {m.category.toLowerCase()} exchanges
          went to a larger size
          {up / total > 0.55 ? ": it runs small." : "."}
        </p>
        <ScrollRegion className="kit-exchange__scroll" label={`${m.category} exchanges by size`}>
          <table className="kit-exchange__table">
            <caption className="kit-visually-hidden">
              {m.category} exchanges by size ordered and size swapped to
            </caption>
            <thead>
              <tr>
                <th scope="col" className="kit-exchange__corner">
                  Ordered → swapped to
                </th>
                {m.sizes.map((size) => (
                  <th key={size} scope="col">
                    {size}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {m.counts.map((row, r) => (
                <tr key={m.sizes[r]}>
                  <th scope="row">{m.sizes[r]}</th>
                  {row.map((count, c) => (
                    <td
                      key={c}
                      className={
                        c === r
                          ? "kit-exchange__cell kit-exchange__cell--same"
                          : "kit-exchange__cell"
                      }
                      style={{
                        // Capped at 72% so the ink count keeps 4.5:1 in both modes.
                        background: count
                          ? `color-mix(in srgb, var(--kit-s1) ${Math.round(8 + (count / max) * 64)}%, var(--kit-card))`
                          : undefined,
                      }}
                    >
                      {count || ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      </div>
    );
  },
});
