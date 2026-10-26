// Relay: a demo team workspace app. One simulated population per platform and
// plan (see population.ts) drives every count of users, so daily, weekly, and
// monthly actives, lifecycle, activation, and retention agree by construction.
//
// Shared by the data modules: tool input types, the simulated history's
// length, comparison labels, the KPI builder, chart events, and the active rule.

import type { z } from "zod/v4";
import { metricKpis, type MetricDefinition } from "../../../core/metrics";
import { calendarEvents } from "../../../core/sample-data";
import type { ChartEvent, Range } from "../../../core/schemas";
import { PRODUCT_EVENTS } from "../calendar";
import { METRICS, type MetricId } from "../metrics";
import { analyticsTools } from "../tools";

type Tools = typeof analyticsTools;
export type Input<N extends Tools[number]["name"]> = z.output<
  Extract<Tools[number], { name: N }>["input"]
>;
export type Platform = "web" | "ios" | "android";
export type Plan = "free" | "team" | "business";
export type Active = "core" | "any";
type Compare = Input<"get_usage_kpis">["compare"];

/**
 * Days simulated: 12 months and the same 12 months a year earlier for the
 * weekly review, and room for 28-day windows and cohorts.
 */
export const HISTORY = 770;
/** Sessions a user starts on a day they are active (our rule). */
export const SESSIONS_PER_ACTIVE_DAY = 1.6;
/** Sessions are only kept for 90 days, so they compare with the prior period whatever $compare says. */
export const PRIOR_ONLY = "Against the prior period: sessions are kept 90 days";
/** This year's plan against the same weekdays last year (our numbers for Relay). */
export const USAGE_PLAN = { actives: 1.22, signups: 1.15, activation: 30 };
/** Same weekdays 52 weeks earlier. */
export const LAST_YEAR = 364;
/** What each comparison is called on charts, walks, and why-cards. */
export const COMPARISON_LABEL: Record<Compare, string> = {
  previous_period: "Prior period",
  last_year: "Last year",
  plan: "Plan",
};
/** The comparison in a period label; the prior period goes unsaid. */
export const AGAINST_TEXT: Record<Compare, string | undefined> = {
  previous_period: undefined,
  last_year: "same days last year",
  plan: "plan",
};

/** A KPI for a registered metric: label, direction, and definition from METRICS. */
export const metric = metricKpis(METRICS as Record<MetricId, MetricDefinition>);

/** The calendar as chart events for the period, on the platform filtered to. */
export const eventsFor = (range: Range, platform = "all"): ChartEvent[] =>
  calendarEvents(
    range,
    PRODUCT_EVENTS.filter(
      (e) => !e.platforms || platform === "all" || e.platforms.includes(platform as Platform),
    ),
  );

/** One line naming the active rule, for the card that shows the numbers. */
export const ruleFor = (active: Active, window: string) =>
  `Active = ${active === "core" ? "core action" : "any event"} · ${window} · UTC`;
