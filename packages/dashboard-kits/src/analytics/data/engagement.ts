// Engagement: feature breadth and retention gaps, tracked events, acquisition
// sources, and stickiness (days active in a week or 28 days).

import { mean, sum } from "../../core/sample-data";
import { factor, population, take } from "./activity";

// gap: week-4 retention of users who used the feature in their first 14 days
// minus those who didn't, in points; adjusted: the same gap among activated
// users only, which strips out "engaged users use more of everything".
export const FEATURES = [
  { name: "Boards", breadth: 91, frequency: 4.1, mobile: 1, gap: 18, adjusted: 2 },
  { name: "Tasks and comments", breadth: 74, frequency: 3.6, mobile: 1.05, gap: 22, adjusted: 9 },
  { name: "Timeline view", breadth: 46, frequency: 2.4, mobile: 0.5, gap: 9, adjusted: 3 },
  { name: "Docs", breadth: 38, frequency: 2.1, mobile: 0.7, gap: 12, adjusted: 5.5 },
  { name: "Templates", breadth: 33, frequency: 0.9, mobile: 0.6, gap: 6, adjusted: 1 },
  { name: "Mobile quick capture", breadth: 27, frequency: 2.2, mobile: 2.2, gap: 7, adjusted: 2 },
  { name: "AI summaries", breadth: 24, frequency: 1.3, mobile: 0.9, gap: 8, adjusted: 1.5 },
  { name: "Automations", breadth: 17, frequency: 4.3, mobile: 0.4, gap: 24, adjusted: 11 },
  { name: "Integrations", breadth: 13, frequency: 1.1, mobile: 0.3, gap: 19, adjusted: 8 },
  { name: "Dashboards", breadth: 12, frequency: 2.9, mobile: 0.5, gap: 14, adjusted: 6.5 },
  { name: "Guest access", breadth: 8, frequency: 1.4, mobile: 0.6, gap: 10, adjusted: 4 },
];

/**
 * How a feature's numbers scale from a 30-day window to `days` (our model).
 * Active users grow sublinearly with the window (7 days is about half of 30,
 * 90 days about 1.4×); a feature's breadth among them follows each user's
 * chance of using it at least once, 1 − (1 − monthly)^reach; and frequency
 * among its users falls as longer windows take in occasional users.
 */
export function featureSpan(days: number) {
  const t = days / 30;
  return {
    actives: t < 1 ? t ** 0.45 : t ** 0.3,
    reach: t ** 0.3,
    frequency: t ** -0.08,
  };
}

export const EVENTS = [
  { name: "board_viewed", perUser: 9.4, reach: 0.9 },
  { name: "task_updated", perUser: 6.1, reach: 0.78 },
  { name: "task_created", perUser: 3.2, reach: 0.66 },
  { name: "comment_added", perUser: 2.7, reach: 0.58 },
  { name: "automation_run", perUser: 1.9, reach: 0.17 },
  { name: "doc_edited", perUser: 1.4, reach: 0.34 },
  { name: "file_uploaded", perUser: 0.8, reach: 0.27 },
  { name: "ai_summary_generated", perUser: 0.6, reach: 0.21 },
  { name: "teammate_invited", perUser: 0.15, reach: 0.08 },
  { name: "integration_connected", perUser: 0.04, reach: 0.03 },
];

export const SOURCES = [
  { label: "Organic search", share: 0.26, activation: 0.92 },
  { label: "Teammate invites", share: 0.24, activation: 1.68 },
  { label: "Direct", share: 0.17, activation: 1.0 },
  { label: "Paid search", share: 0.13, activation: 0.74 },
  { label: "Social", share: 0.11, activation: 0.58 },
  { label: "Partner marketplace", share: 0.09, activation: 1.12 },
];

/**
 * Share of the window's actives by days active, 1 to `window`. The shape
 * (light users, a weekday hump) is tilted so its mean days active is
 * window × DAU ÷ WAU or MAU over the last 7 days: every user-day in the curve
 * is a daily active, so it agrees with the DAU/MAU KPI.
 */
export function stickinessShares(platform: string, plan: string, window: 7 | 28) {
  const engagement = factor(platform, plan, "retention");
  const pop = population(platform, plan);
  const target =
    (window * mean(take(pop.dau, 7))) / mean(take(pop[window === 7 ? "wau" : "mau"], 7));
  if (window === 7) {
    const base = [0.27, 0.16, 0.12, 0.1, 0.11, 0.11, 0.13];
    return tiltToMean(
      base.map((v, i) => v * engagement ** ((i - 3) / 3)),
      target,
    );
  }
  // A work tool's power users cluster near 20 of 28 days: every weekday.
  const raw = Array.from({ length: 28 }, (_, i) => {
    const d = i + 1;
    const light = 0.2 * Math.exp(-(d - 1) / 3);
    const work = 0.07 * engagement * Math.exp(-((d - 20) ** 2) / 8);
    const daily = d >= 26 ? 0.02 * engagement : 0;
    return light + work + daily + 0.008;
  });
  return tiltToMean(raw, target);
}

/** Weights (index i = i + 1 days) scaled by e^(θ·i) and normalised, θ found so the mean days is `target`. */
function tiltToMean(weights: number[], target: number): number[] {
  const tilted = (theta: number) => {
    const w = weights.map((v, i) => v * Math.exp(theta * i));
    const total = sum(w);
    return w.map((v) => v / total);
  };
  const meanDays = (shares: number[]) => sum(shares.map((v, i) => v * (i + 1)));
  let [low, high] = [-6, 6];
  for (let k = 0; k < 50; k++) {
    const mid = (low + high) / 2;
    if (meanDays(tilted(mid)) < target) low = mid;
    else high = mid;
  }
  return tilted((low + high) / 2);
}
