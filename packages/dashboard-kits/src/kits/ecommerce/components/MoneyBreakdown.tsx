"use client";

// MoneyBreakdown: a waterfall of money from a starting amount to a result.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { formatCurrency } from "../../../core/format";
import { ledgerLineSchema } from "../../../core/schemas";
import { Pending } from "../../../library/Pending";
import { Change } from "./shared";

const KIND_COLOR = {
  base: "var(--kit-total)",
  total: "var(--kit-total)",
  add: "var(--kit-up)",
  subtract: "var(--kit-down)",
} as const;

export const MoneyBreakdown = defineComponent({
  name: "MoneyBreakdown",
  description:
    "Waterfall of money from a starting amount to a result: each line adds (blue), subtracts (red), or subtotals (slate), drawn as floating bars on one scale with the amount and the change against the previous period.",
  props: z.object({
    lines: z.array(ledgerLineSchema).default([]),
  }),
  component: ({ props }) => {
    const lines = props.lines ?? [];
    if (lines.length === 0) return <Pending kind="list" rows={7} />;
    let running = 0;
    const spans = lines.map((line) => {
      const v = Math.abs(line.value);
      let from = 0;
      let to = v;
      if (line.kind === "add") [from, to] = [running, running + v];
      if (line.kind === "subtract") [from, to] = [running - v, running];
      running = line.kind === "subtract" ? running - v : line.kind === "add" ? running + v : v;
      return { line, from: Math.min(from, to), to: Math.max(from, to) };
    });
    const max = Math.max(1, ...spans.map((s) => s.to));
    return (
      <div className="kit-waterfall">
        {spans.map(({ line, from, to }, i) => {
          const sign = line.kind === "subtract" ? "−" : line.kind === "add" ? "+" : "";
          const change = line.previous
            ? ((line.value - line.previous) / Math.abs(line.previous)) * 100
            : undefined;
          return (
            <div
              key={`${line.label}-${i}`}
              className={`kit-waterfall__row kit-waterfall__row--${line.kind}`}
            >
              <span className="kit-waterfall__label">{line.label}</span>
              <span className="kit-waterfall__track">
                <span
                  className="kit-waterfall__bar"
                  style={{
                    left: `${(from / max) * 100}%`,
                    width: `${Math.max(0.6, ((to - from) / max) * 100)}%`,
                    background: KIND_COLOR[line.kind],
                  }}
                />
              </span>
              <span className="kit-waterfall__value">
                {sign}
                {formatCurrency(Math.abs(line.value))}
              </span>
              <span className="kit-waterfall__change">
                <Change value={change} goodDirection={line.kind === "subtract" ? "down" : "up"} />
              </span>
            </div>
          );
        })}
      </div>
    );
  },
});
