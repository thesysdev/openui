"use client";

import { cn } from "@/lib/utils";
import { defineComponent } from "@openuidev/react-lang";
import { TrendingDown, TrendingUp } from "lucide-react";
import { z } from "zod";
import { formatDate, formatNumber, isDateLike } from "../format";

export const Metric = defineComponent({
  name: "Metric",
  props: z.object({
    label: z.string(),
    value: z.union([z.number(), z.string()]),
    format: z.enum(["number", "compact", "percent", "date"]).optional(),
    change: z.number().optional(),
    caption: z.string().optional(),
  }),
  description:
    'KPI tile: a label and one big value, such as total downloads or open issues. format: "number" (default), "compact" (1.2M), "percent", or "date". change is a percent shown as an up or down trend. Put several in a Stack row.',
  component: ({ props }) => {
    const raw = props.value;
    const value =
      typeof raw === "number"
        ? formatNumber(raw, props.format === "date" ? "number" : props.format)
        : raw != null && isDateLike(raw)
          ? formatDate(raw)
          : String(raw ?? "–");
    const change =
      typeof props.change === "number" && Number.isFinite(props.change) ? props.change : null;
    const up = change !== null && change >= 0;
    return (
      <div className="flex min-w-0 flex-col gap-1.5 rounded-xl border bg-card p-4 text-card-foreground shadow-xs">
        <p className="truncate text-sm text-muted-foreground">{props.label}</p>
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          {change !== null && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
                up
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-400",
              )}
            >
              {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {up ? "+" : ""}
              {formatNumber(Math.round(change * 10) / 10, "percent")}
            </span>
          )}
        </div>
        {props.caption && <p className="truncate text-xs text-muted-foreground">{props.caption}</p>}
      </div>
    );
  },
});
