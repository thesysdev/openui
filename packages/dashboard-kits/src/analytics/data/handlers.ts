// The tool handlers: one function per tool in tools.ts, plus the recommended
// actions, which read the feature engagement handler.

import { periodChangeInsight } from "../../core/explain";
import { formatCurrency, formatDuration, formatNumber } from "../../core/format";
import {
  AS_OF,
  between,
  bucket,
  dateLabel,
  dayLabels,
  dayOfWeek,
  mean,
  periodLabel,
  random,
  RANGE_DAYS,
  round,
  sum,
} from "../../core/sample-data";
import type { Insight } from "../../core/schemas";
import { PRODUCT_EVENTS } from "../calendar";
import { cohortNrr, quickRatio, retention, SEAT_CUTS } from "../revenue";
import {
  backTest,
  HEALTH_WEIGHTS,
  healthParts,
  healthScore,
  isAccountActive,
  isArrAtRisk,
  isExpansionReady,
  isSlipping,
  payingWorkspaces,
  workspaces,
  zoneOf,
  type HealthCategory,
} from "../workspaces";
import {
  healthDistribution,
  mrrHistory,
  newWorkspacesByMonth,
  NRR_BAND,
  payingByMonth,
  REVENUE_MONTHS,
  scoreHistory,
  unitEconomics,
} from "./accounts";
import { activationMoments } from "./activation";
import {
  activationCounts,
  activationRate,
  actives,
  byPlatform,
  dau,
  factor,
  mauRatio,
  PLANS,
  PLATFORM_LABEL,
  PLATFORMS,
  platformsFor,
  population,
  signups,
  take,
  workspaceCounts,
} from "./activity";
import { alertPreview } from "./alerts";
import { EVENTS, FEATURES, featureSpan, SOURCES, stickinessShares } from "./engagement";
import { EXPERIMENTS, scorecard } from "./experiments";
import { explainAnalytics, releaseImpact, type WhyMetric } from "./insights";
import { lifecycleStates } from "./lifecycle";
import { monetisation, usageCommits } from "./monetisation";
import {
  BRACKETS,
  cohort,
  flattening,
  retentionCurve,
  retentionRow,
  retentionRule,
  teamReach,
} from "./retention";
import { weeklyReview } from "./review";
import {
  AGAINST_TEXT,
  COMPARISON_LABEL,
  eventsFor,
  HISTORY,
  LAST_YEAR,
  metric,
  PRIOR_ONLY,
  ruleFor,
  SESSIONS_PER_ACTIVE_DAY,
  USAGE_PLAN,
  type Input,
  type Plan,
  type Platform,
} from "./shared";

/**
 * What to do next, from the data, biggest expected effect first. Effects are
 * estimates with their assumption in the text: a save rate for outreach, a
 * take rate for upgrade offers, the observed retention gap for a feature.
 */
function recommendedActions() {
  const list = payingWorkspaces();
  const slipping = list.filter(isSlipping);
  const slippingArr = sum(slipping.map((w) => w.mrr * 12));
  const ready = list.filter(isExpansionReady);
  const extraSeats = sum(ready.map((w) => Math.ceil(w.seats * 0.2)));
  const seatPrice = (w: (typeof list)[number]) => w.mrr / w.seats;
  const expansionArr = sum(ready.map((w) => Math.ceil(w.seats * 0.2) * seatPrice(w) * 12)) * 0.3;
  const features = analyticsHandlers.get_feature_engagement!({
    range: "30d",
    platform: "all",
    plan: "all",
  }) as { features: { name: string; breadth: number; adjustedGap: number; users: number }[] };
  const automations = features.features.find((f) => f.name === "Automations")!;
  const signed = activationCounts("all", "all", 30).signed;
  // A tenth of a month's signups more trying it, if its gap among activated users holds.
  const kept = signed * 0.1 * (automations.adjustedGap / 100);
  const pricing = scorecard(EXPERIMENTS.find((e) => e.name === "Pricing page redesign")!);
  const digest = scorecard(EXPERIMENTS.find((e) => e.name === "AI summaries on by default")!);
  const unsubscribes = digest.guardrails.find((g) => g.light === "red");
  // Android users who set up in the last 14 days but have not reached the aha moment.
  const android = activationCounts("android", "all", 14);
  const stuck = Math.round(android.setup - android.aha);
  const androidRate = (android.aha / android.setup) * 100;
  const webCounts = activationCounts("web", "all", 14);
  const webRate = (webCounts.aha / webCounts.setup) * 100;
  const gained = android.setup * (30 / 14) * ((webRate - androidRate) / 100) * 0.5;
  const actions = [
    {
      id: "android-audience",
      kind: "audience" as const,
      title: `Save ${formatNumber(stuck)} Android users stuck before the aha moment as a flag audience`,
      detail: `They set up in the last 14 days but have not invited 2 teammates. Android activates ${androidRate.toFixed(0)}% of users who set up, against ${webRate.toFixed(0)}% on web. The audience lets Growth target an invite prompt at them.`,
      // Ranked as ARR: a fifth of the extra activated users end up on a $20 seat.
      impact: gained * 0.2 * 20 * 12,
      impactText: `About ${formatNumber(gained)} more Android users activated a month if the prompt closes half the gap to web`,
      owner: "Growth",
      effort: "Low",
      effect: `Would save the flag audience android-setup-no-aha (${formatNumber(stuck)} users, refreshed daily)`,
    },
    {
      id: "save-slipping",
      kind: "task" as const,
      title: `Reach out to the admins of ${slipping.length} slipping workspaces`,
      detail: `No core action for over twice their usual gap; together ${formatCurrency(slippingArr)} ARR. Customer success calls the largest ten, the rest get the re-engagement email.`,
      impact: slippingArr * 0.2,
      impactText: `${formatCurrency(slippingArr * 0.2)} ARR kept if one in five stays`,
      owner: "Customer success",
      effort: "Medium",
      effect: `Would open ${slipping.length} customer success tasks, largest ARR first`,
    },
    {
      id: "offer-seats",
      kind: "task" as const,
      title: `Offer seat upgrades to ${ready.length} workspaces ready to expand`,
      detail: `Over 80% of their seats are active and they renew within 90 days. A 20% seat bump is ${formatNumber(extraSeats)} seats.`,
      impact: expansionArr,
      impactText: `${formatCurrency(expansionArr)} new ARR if three in ten accept`,
      owner: "Account management",
      effort: "Low",
      effect: `Would open ${ready.length} expansion tasks for account managers`,
    },
    {
      id: "promote-automations",
      kind: "experiment" as const,
      title: "Start an experiment: suggest an automation in onboarding",
      detail: `Automations reach ${automations.breadth.toFixed(0)}% of monthly users, but activated users who try one early are ${automations.adjustedGap.toFixed(0)} points likelier to be around in week 4. A gap, not proof: run it as an experiment.`,
      // Ranked as ARR: about a fifth of kept users end up on a $20 seat.
      impact: kept * 0.2 * 20 * 12,
      impactText: `About ${formatNumber(kept)} more users kept a month, if the gap holds`,
      owner: "Growth",
      effort: "Medium",
      effect:
        "Would draft the experiment Automation suggestion in onboarding: 50/50 on new signups, week-4 retention as the metric, support tickets as the guardrail",
    },
    ...(unsubscribes
      ? [
          {
            id: "hold-digest",
            kind: "change" as const,
            title: "Drop the digest email arm of the AI summaries test",
            detail: `${unsubscribes.name} rose ${unsubscribes.change}% against a ${unsubscribes.allowed}% limit, and the arm's retention lift is not clear yet.`,
            impact: 0,
            impactText: "Protects the email list while the test finishes",
            owner: "Product",
            effort: "Low",
            effect:
              "Would stop new users entering the digest email arm; the other arms keep running",
          },
        ]
      : []),
    ...(!pricing.split.ok
      ? [
          {
            id: "fix-pricing-split",
            kind: "change" as const,
            title: "Pause the Pricing page redesign and check assignment",
            detail: `Traffic split ${pricing.split.observed} against a planned ${pricing.split.planned}, so its lift can't be trusted. Restart once assignment is fixed.`,
            impact: 0,
            impactText: "Avoids a decision on broken data",
            owner: "Data",
            effort: "Low",
            effect:
              "Would pause the Pricing page redesign and open a Data task to check assignment",
          },
        ]
      : []),
  ];
  return actions.sort((a, b) => b.impact - a.impact);
}

export const analyticsHandlers: Record<string, (args: any) => unknown> = {
  get_usage_kpis({ range, platform, plan, active, compare }: Input<"get_usage_kpis">) {
    const days = RANGE_DAYS[range];
    // The plan is last year's same weekdays grown by the planned rates.
    const lastYear = compare !== "previous_period";
    const planned = compare === "plan";
    const then = lastYear ? LAST_YEAR : days;
    const grow = (values: number[], rate: number) =>
      planned ? values.map((v) => v * rate) : values;
    const against = compare === "previous_period" ? undefined : COMPARISON_LABEL[compare];
    const any = active === "any";
    const w = (window: 1 | 7 | 28, offset = 0) =>
      actives(window, platform, plan, active, days, offset);
    const wau = [w(7), grow(w(7, then), USAGE_PLAN.actives)];
    const daily = [w(1), grow(w(1, then), USAGE_PLAN.actives)];
    const monthly = [w(28), grow(w(28, then), USAGE_PLAN.actives)];
    const sign = [
      signups(platform, plan, days),
      grow(signups(platform, plan, days, then), USAGE_PLAN.signups),
    ];
    const act = [
      activationCounts(platform, plan, days),
      activationCounts(platform, plan, days, then),
    ];
    const actSeries = (offset: number) =>
      Array.from(
        { length: days },
        (_, i) => activationRate(platform, plan, offset + days - 1 - i) * 100,
      );
    const actThen = planned ? USAGE_PLAN.activation : act[1]!.rate * 100;
    const actThenSeries = planned
      ? new Array<number>(days).fill(USAGE_PLAN.activation)
      : actSeries(then);
    // Sessions: each active day is about 1.6 sessions, so sessions per user in
    // a week is active days ÷ weekly actives × 1.6; a session's length follows
    // the day's platform mix (our rules).
    const sessionsPerUser = (offset: number) => {
      const daily = dau(platform, plan, days + 6, offset);
      const weekly = w(7, offset);
      return weekly.map((v, i) => (sum(daily.slice(i, i + 7)) * SESSIONS_PER_ACTIVE_DAY) / v);
    };
    const medianSession = (offset: number) => {
      const byPlatform = platformsFor(platform).map((pf) => ({
        minutes: PLATFORMS[pf].session,
        dau: dau(pf, plan, days, offset),
      }));
      return Array.from(
        { length: days },
        (_, i) =>
          sum(byPlatform.map((p) => p.minutes * p.dau[i]!)) / sum(byPlatform.map((p) => p.dau[i]!)),
      );
    };
    const sessions = [sessionsPerUser(0), sessionsPerUser(days)];
    const lengths = [medianSession(0), medianSession(days)];
    const trend = bucket(dayLabels(days), wau, range, true);
    const pct = (v: number) => `${v.toFixed(1)}%`;
    const series = (pair: number[][]) => ({
      series: pair[0],
      previousSeries: pair[1],
      range,
      ...(against ? { comparisonLabel: against } : {}),
    });
    const stick = daily.map((d, k) => d.map((v, i) => (v / monthly[k]![i]!) * 100));
    const stickiness = (k: number) => (mean(daily[k]!) / mean(monthly[k]!)) * 100;
    return {
      periodLabel: periodLabel(range, AGAINST_TEXT[compare]),
      hero: metric(any ? "wau_any" : "wau", mean(wau[0]!), mean(wau[1]!), formatNumber, {
        series: wau[0],
        hint: ruleFor(active, "rolling 7 days"),
      }),
      heroTrend: {
        labels: trend.labels,
        current: trend.values[0]!.map(Math.round),
        previous: trend.values[1]!.map(Math.round),
        format: "number" as const,
        events: eventsFor(range, platform),
        asOf: AS_OF,
        partial: true,
        ...(against ? { comparisonLabel: against } : {}),
        // The lead: explain_change's sentence, on the same comparison.
        summary: explainAnalytics({ metric: "wau", range, platform, plan, active, compare })
          .summary,
      },
      metrics: [
        metric(any ? "dau_any" : "dau", mean(daily[0]!), mean(daily[1]!), formatNumber, {
          ...series(daily),
          chart: "number",
        }),
        metric(any ? "mau_any" : "mau", mean(monthly[0]!), mean(monthly[1]!), formatNumber, {
          ...series(monthly),
          chart: "number",
        }),
        // DAU/MAU as the glossary defines it: the period's average DAU ÷ its
        // average MAU, as explain_change reads it; the series is each day's.
        metric("stickiness", stickiness(0), stickiness(1), pct, {
          ...series(stick),
          hint: "SaaS average 15%, good 20%, great 30%",
          chart: "percent",
          band: { label: "Good to great 20–30%", from: 20, to: 30 },
        }),
        metric("signups", sum(sign[0]!), sum(sign[1]!), formatNumber, {
          ...series(sign),
          chart: "number",
          total: true,
        }),
        metric("activation", act[0]!.rate * 100, actThen, pct, {
          series: actSeries(0),
          previousSeries: actThenSeries,
          range,
          ...(against ? { comparisonLabel: against } : {}),
          hint: "Aha ÷ setup, within 7 days",
          chart: "percent",
        }),
        metric(
          "sessions_per_user",
          mean(sessions[0]!),
          mean(sessions[1]!),
          (v) => `${v.toFixed(1)} / week`,
          {
            series: sessions[0],
            previousSeries: sessions[1],
            range,
            chart: "number",
            ...(against ? { hint: PRIOR_ONLY } : {}),
          },
        ),
        metric("median_session", mean(lengths[0]!), mean(lengths[1]!), formatDuration, {
          series: lengths[0],
          previousSeries: lengths[1],
          range,
          chart: "duration",
          ...(against ? { hint: PRIOR_ONLY } : {}),
        }),
      ],
      rules: [
        ruleFor(active, "weekly actives over rolling 7 days"),
        planned
          ? `Plan: last year × ${USAGE_PLAN.actives} for actives, × ${USAGE_PLAN.signups} for signups, ${USAGE_PLAN.activation}% activation`
          : lastYear
            ? "Compared with the same weekdays last year"
            : `Compared with the prior ${days} days`,
        platform === "all" ? "Web, iOS, and Android" : PLATFORM_LABEL[platform as Platform],
        plan === "all" ? "All plans" : `${PLANS[plan as Plan].label} plan`,
      ],
    };
  },

  get_monetization({ range }: Input<"get_monetization">) {
    return monetisation(range);
  },

  get_usage_commits() {
    return usageCommits();
  },

  get_weekly_review() {
    return weeklyReview();
  },

  get_actions() {
    return { actions: recommendedActions() };
  },

  preview_alert({ metric, drop, confirm, quiet, window }: Input<"preview_alert">) {
    return alertPreview(metric, drop, confirm, quiet === "weekends", Number(window));
  },

  get_annotations({ range, platform }: Input<"get_annotations">) {
    return { events: eventsFor(range, platform) };
  },

  get_data_status({ range, platform }: Input<"get_data_status">) {
    const days = RANGE_DAYS[range];
    const inRange = (e: (typeof PRODUCT_EVENTS)[number]) =>
      e.to < days &&
      (!e.platforms || platform === "all" || e.platforms.includes(platform as Platform));
    const measurement = PRODUCT_EVENTS.filter((e) => e.kind === "measurement" && inRange(e));
    const restated = measurement.filter((e) => e.id === "oct-8-restatement");
    const breaks = measurement.filter((e) => e.id !== "oct-8-restatement");
    const events = sum(dau(platform, "all", days)) * 31;
    const items = [
      {
        label: "Complete through",
        value: AS_OF,
        tone: "good" as const,
        detail: "Events arrive within about 15 minutes; the last 15 minutes may still grow.",
      },
      ...restated.map((e) => ({
        label: "Restated",
        value: `${dateLabel(e.from)} +2.1%`,
        tone: "info" as const,
        detail: e.detail,
      })),
      {
        label: "Filtered",
        value: `${formatNumber(events * 0.034)} bot and internal events`,
        tone: "info" as const,
        detail:
          "3.4% of events came from bots, uptime checks, and 212 Relay staff accounts, and are left out of every number.",
      },
      {
        label: "Identified",
        value: "87% of users",
        tone: "good" as const,
        detail:
          "13% of events come from visitors who never signed in; they count toward any-event actives on web only.",
      },
      ...breaks.map((e) => ({
        label: "Tracking break",
        value: `${e.label}, ${dateLabel(e.from)}–${dateLabel(e.to)}`,
        tone: "warn" as const,
        detail: e.detail,
      })),
    ];
    return {
      items,
      summary: breaks.length
        ? `${breaks.length} tracking break in the period; core-action numbers are unaffected.`
        : "No tracking breaks in the period.",
    };
  },

  get_signup_goal({ platform }: Input<"get_signup_goal">) {
    // October so far: the 1st to today, the 10th, of a 31-day month.
    const elapsed = 10;
    const days = 31;
    let running = 0;
    const cumulative = signups(platform, "all", elapsed).map((v) => Math.round((running += v)));
    const projected = (running / elapsed) * days;
    const step = 10 ** (Math.floor(Math.log10(projected)) - 2);
    // The 80% range: the rest of the month moves as much as whole weeks have
    // over the last 8, independently week to week.
    const weeks = Array.from({ length: 8 }, (_, w) =>
      sum(signups(platform, "all", 7, elapsed + 7 * w)),
    );
    const cv = Math.sqrt(sum(weeks.map((v) => (v - mean(weeks)) ** 2)) / 7) / mean(weeks);
    const rest = projected - running;
    const spread = 1.2816 * cv * rest * Math.sqrt(7 / (days - elapsed));
    return {
      label: "October signup goal",
      goal: Math.round((projected * 0.97) / step) * step,
      format: "number" as const,
      labels: Array.from({ length: days }, (_, i) => dateLabel(elapsed - 1 - i)),
      cumulative,
      projected: Math.round(projected),
      range: [Math.round(projected - spread), Math.round(projected + spread)],
      asOf: AS_OF,
    };
  },

  get_active_users({ range, platform, plan, active }: Input<"get_active_users">) {
    const days = RANGE_DAYS[range];
    const { labels, values } = bucket(
      dayLabels(days),
      [1, 7, 28].map((w) => actives(w as 1 | 7 | 28, platform, plan, active, days)),
      range,
      true,
    );
    return {
      labels,
      dau: values[0]!.map(Math.round),
      wau: values[1]!.map(Math.round),
      mau: values[2]!.map(Math.round),
      events: eventsFor(range, platform),
      rule: ruleFor(active, "1, 7, and 28 days up to each day"),
    };
  },

  get_lifecycle({ platform, plan, weeks, view }: Input<"get_lifecycle">) {
    if (view === "states") return lifecycleStates(platform, plan);
    const pop = population(platform, plan);
    const out = {
      labels: [] as string[],
      newUsers: [] as number[],
      returning: [] as number[],
      resurrecting: [] as number[],
      dormant: [] as number[],
    };
    // Weeks end today. A week's actives are its new users, users also active
    // the week before (returning), and users back after a gap (resurrecting);
    // last week's actives who did not come back are dormant.
    for (let k = weeks - 1; k >= 0; k--) {
      const end = HISTORY - 1 - k * 7;
      const span = (values: Float64Array) => sum(Array.from(values.subarray(end - 6, end + 1)));
      const fresh = span(pop.signups);
      const returning = span(pop.returning);
      out.labels.push(`Wk of ${dateLabel(k * 7 + 6)}`);
      out.newUsers.push(Math.round(fresh));
      out.returning.push(Math.round(returning));
      out.resurrecting.push(Math.round(pop.wau[end]! - returning - fresh));
      out.dormant.push(-Math.round(pop.wau[end - 7]! - returning));
    }
    const last = weeks - 1;
    const quick =
      (out.newUsers[last]! + out.resurrecting[last]!) / Math.abs(out.dormant[last] || 1);
    return { ...out, quickRatio: quick.toFixed(2), rule: ruleFor("core", "weeks ending today") };
  },

  explain_change: explainAnalytics,

  get_release_impact() {
    return { releases: releaseImpact() };
  },

  find_activation_moment({ platform, plan }: Input<"find_activation_moment">) {
    return activationMoments(platform, plan);
  },

  get_activation_funnel({ range, platform, plan, unit }: Input<"get_activation_funnel">) {
    const days = RANGE_DAYS[range];
    const userCounts = [
      activationCounts(platform, plan, days),
      activationCounts(platform, plan, days, days),
    ];
    const [cur, prev] = unit === "workspace" ? userCounts.map(workspaceCounts) : userCounts;
    // Validity: the aha moment matters if activated users keep at least twice
    // as well. Read on the cohort that signed up five weeks ago.
    const check = cohort(platform, plan, 5 * 7 - 1);
    const a = check.activated[4]!;
    const n = check.notActivated[4]!;
    const steps: [string, keyof NonNullable<typeof cur>, string?][] =
      unit === "workspace"
        ? [
            ["New workspaces", "signed"],
            ["First project", "setup", "20m"],
            ["Team active: 3+ members in 14 days", "aha", "4 days"],
            ["Habit: active 3 of 4 weeks", "habit", "4 weeks"],
          ]
        : [
            ["Signed up", "signed"],
            ["Set up workspace and project", "setup", "14m"],
            ["Aha: invited 2+ teammates", "aha", "1.6 days"],
            ["Habit: active 3 of 4 weeks", "habit", "4 weeks"],
          ];
    return {
      steps: steps.map(([label, key, medianTime]) => ({
        label,
        value: Math.round(cur![key] as number),
        previous: Math.round(prev![key] as number),
        ...(medianTime ? { medianTime } : {}),
      })),
      activationRate: `${(cur!.rate * 100).toFixed(1)}%`,
      validity: {
        activated: `${(a * 100).toFixed(0)}%`,
        notActivated: `${(n * 100).toFixed(0)}%`,
        ratio: round(a / n, 1),
        pass: a / n >= 2,
        note: `Week-4 retention is ${(a * 100).toFixed(0)}% for activated users against ${(n * 100).toFixed(0)}% for the rest: ${(a / n).toFixed(1)}×, ${a / n >= 2 ? "so the aha moment predicts who stays" : "under the 2× bar, so look for a better aha moment"}.`,
      },
      ...byPlatform(plan, days, unit),
    };
  },

  get_retention_cohorts({ platform, plan, weeks, mode, unit }: Input<"get_retention_cohorts">) {
    const brackets = mode === "bracket" ? BRACKETS.filter(([, to]) => to < weeks) : undefined;
    // Calendar weeks from Monday, so this week is still in progress.
    const sinceMonday = (dayOfWeek(0) + 6) % 7;
    const cohorts = Array.from({ length: weeks }, (_, k) => {
      const startAgo = sinceMonday + (weeks - k) * 7;
      const row = retentionRow(platform, plan, startAgo, mode, unit, brackets);
      const shown = row.partial == null ? row.values : [...row.values, row.partial];
      return {
        cohort: `Wk of ${dateLabel(startAgo)}`,
        size: Math.round(row.size),
        values: shown.map((v) => round(v * 100, 1)),
        ...(row.partial == null ? {} : { partial: true }),
      };
    });
    return {
      periodLabels: brackets
        ? brackets.map(([from, to]) => (from === to ? `Week ${from}` : `Weeks ${from}–${to}`))
        : // The oldest cohort also has the week in progress.
          Array.from({ length: mode === "exact" ? weeks + 1 : weeks }, (_, i) => `Week ${i}`),
      cohorts,
      format: "percent" as const,
      rule: retentionRule(mode, unit),
    };
  },

  get_retention_curves({ platform, weeks, mode, unit }: Input<"get_retention_curves">) {
    // Brackets as the cohorts read them: only those the curve's weeks reach.
    const brackets = mode === "bracket" ? BRACKETS.filter(([, to]) => to <= weeks) : undefined;
    const curve = (plan: string) =>
      retentionRow(platform, plan, (weeks + 1) * 7 - 1, mode, unit, brackets)
        .values.slice(0, weeks + 1)
        .map((v) => round(v * 100, 1));
    const curves = {
      all: curve("all"),
      free: curve("free"),
      team: curve("team"),
      business: curve("business"),
    };
    const reads = (["business", "team", "free"] as const).map(
      (key) => `${PLANS[key].label} ${flattening(curves[key])}`,
    );
    const everyone = unit === "workspace" ? "All workspaces" : "All users";
    return {
      labels: brackets
        ? brackets.map(([from, to]) => (from === to ? `Week ${from}` : `Weeks ${from}–${to}`))
        : Array.from({ length: weeks + 1 }, (_, i) => `Week ${i}`),
      ...curves,
      // Unbounded counts later weeks, so a curve's last week always equals
      // exact retention, and brackets span several weeks: read flattening on
      // exact weeks only.
      flattened:
        mode === "exact"
          ? `${everyone} ${flattening(curves.all)}. ${reads.join("; ")}.`
          : mode === "bracket"
            ? "Brackets span several weeks each; read flattening on exact weeks."
            : "Unbounded counts any later week, so the newest weeks always drop; read flattening on exact weeks.",
      rule: retentionRule(mode, unit),
    };
  },

  get_stickiness({ platform, plan, window }: Input<"get_stickiness">) {
    const w = window as 7 | 28;
    const active = mean(take(population(platform, plan)[w === 7 ? "wau" : "mau"], 7));
    const shares = stickinessShares(platform, plan, w);
    const powerFrom = w === 7 ? 5 : 20;
    return {
      window: w,
      buckets: shares.map((s, i) => ({ days: i + 1, users: Math.round(active * s) })),
      powerUserShare: `${(sum(shares.slice(powerFrom - 1)) * 100).toFixed(1)}%`,
    };
  },

  get_feature_engagement({ range, platform, plan }: Input<"get_feature_engagement">) {
    const mobile = platform === "ios" || platform === "android";
    const span = featureSpan(RANGE_DAYS[range]);
    const active = mean(dau(platform, plan, 28)) * mauRatio(platform, plan) * span.actives;
    const engagement = factor(platform, plan, "retention");
    return {
      features: FEATURES.map((f) => {
        const monthly =
          Math.min(
            98,
            f.breadth *
              (mobile ? f.mobile : 1) *
              engagement ** 0.4 *
              between(`fb:${f.name}:${platform}:${plan}`, 0.94, 1.06),
          ) / 100;
        const breadth = Math.min(98, (1 - (1 - monthly) ** span.reach) * 100);
        return {
          name: f.name,
          breadth: round(breadth),
          frequency: round(
            Math.min(
              7,
              f.frequency *
                engagement ** 0.3 *
                between(`ff:${f.name}:${platform}`, 0.93, 1.07) *
                span.frequency,
            ),
          ),
          users: Math.round((active * breadth) / 100),
          retentionGap: round(f.gap * between(`fg:${f.name}:${platform}:${plan}`, 0.9, 1.1)),
          adjustedGap: round(f.adjusted * between(`fa:${f.name}:${platform}:${plan}`, 0.9, 1.1)),
          change: round(
            f.name === "AI summaries"
              ? 4.8
              : f.name === "Templates"
                ? -2.1
                : between(`fc:${f.name}:${range}`, -1.5, 3),
          ),
        };
      }).sort((a, b) => b.breadth - a.breadth),
    };
  },

  get_activity_heatmap({ range, platform, plan }: Input<"get_activity_heatmap">) {
    const avg = mean(dau(platform, plan, RANGE_DAYS[range]));
    const mobile = platform === "ios" || platform === "android";
    return {
      hourLabels: Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`),
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, d) => {
        const next = random(`heat:${day}:${range}:${platform}:${plan}`);
        const weekend = d >= 5;
        return {
          day,
          values: Array.from({ length: 24 }, (_, h) => {
            const work = Math.exp(-((h - 11) ** 2) / 14) + 0.85 * Math.exp(-((h - 15) ** 2) / 9);
            const evening = (mobile ? 0.55 : 0.2) * Math.exp(-((h - 21) ** 2) / 5);
            const commute = mobile ? 0.35 * Math.exp(-((h - 8) ** 2) / 1.5) : 0;
            const shape = (weekend ? 0.14 * work : work * (d === 4 ? 0.85 : 1)) + evening + commute;
            return Math.round(avg * 1.6 * (0.02 + shape) * (0.9 + next() * 0.2));
          }),
        };
      }),
    };
  },

  get_top_events({ range, platform, limit }: Input<"get_top_events">) {
    const days = RANGE_DAYS[range];
    const cur = sum(dau(platform, "all", days));
    const prev = sum(dau(platform, "all", days, days));
    return {
      events: EVENTS.map((e) => {
        const count = Math.round(
          cur * e.perUser * between(`ev:${e.name}:${range}:${platform}`, 0.92, 1.08),
        );
        const prevCount =
          prev * e.perUser * between(`evp:${e.name}:${range}:${platform}`, 0.92, 1.04);
        const users = Math.round(
          mean(dau(platform, "all", days)) * mauRatio(platform, "all") * e.reach,
        );
        return {
          name: e.name,
          count,
          users,
          perUser: round(count / users),
          change: round(((count - prevCount) / prevCount) * 100),
        };
      })
        .sort((a, b) => b.count - a.count)
        .slice(0, limit),
    };
  },

  get_user_paths({ range, platform }: Input<"get_user_paths">) {
    const mobile = platform === "ios" || platform === "android";
    const total = Math.round(sum(signups(platform, "all", RANGE_DAYS[range])));
    const paths = [
      {
        steps: ["workspace_created", "template_applied", "project_created", "teammate_invited"],
        share: 0.22,
        outcome: "activated",
        m: 0.7,
      },
      {
        steps: ["workspace_created", "project_created", "task_created", "session_ended"],
        share: 0.18,
        outcome: "in progress",
        m: 1,
      },
      { steps: ["workspace_created", "session_ended"], share: 0.15, outcome: "dropped", m: 1.5 },
      {
        steps: ["import_started", "import_completed", "project_created", "teammate_invited"],
        share: 0.11,
        outcome: "activated",
        m: 0.4,
      },
      {
        steps: ["workspace_created", "template_browsed", "session_ended"],
        share: 0.09,
        outcome: "dropped",
        m: 1.3,
      },
      {
        steps: ["invite_accepted", "board_viewed", "comment_added"],
        share: 0.08,
        outcome: "activated",
        m: 1.2,
      },
      {
        steps: ["workspace_created", "project_created", "teammate_invited", "task_created"],
        share: 0.07,
        outcome: "activated",
        m: 0.8,
      },
      {
        steps: ["app_permissions_prompt", "session_ended"],
        share: 0.04,
        outcome: "dropped",
        m: mobile ? 3 : 0.2,
      },
    ] as const;
    const weights = paths.map((p) => p.share * (mobile ? p.m : 1));
    const scale = 0.94 / sum(weights);
    return {
      start: "signup_completed",
      totalUsers: total,
      paths: paths.map((p, i) => ({
        steps: [...p.steps],
        users: Math.round(total * weights[i] * scale),
        share: round(weights[i] * scale, 4),
        outcome: p.outcome,
      })),
    };
  },

  get_signups_by_source({ range, platform }: Input<"get_signups_by_source">) {
    const days = RANGE_DAYS[range];
    // Each period's mix varies a little; counts add up to the period's signups.
    const split = (total: number, offset: number) => {
      const weights = SOURCES.map(
        (s) => s.share * between(`src:${s.label}:${days}:${offset}`, 0.92, 1.08),
      );
      const all = sum(weights);
      const raw = weights.map((w) => (w / all) * total);
      const counts = raw.map(Math.floor);
      // Largest remainders take the rounding, so the sum is exact.
      const order = raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
      const missing = Math.round(total) - sum(counts);
      for (let k = 0; k < missing; k++) counts[order[k]![1]]! += 1;
      return counts;
    };
    const counts = split(sum(signups(platform, "all", days)), 0);
    const before = split(sum(signups(platform, "all", days, days)), days);
    // Source rates are relative; scale them so the signup-weighted mean is the overall rate.
    const act = activationCounts(platform, "all", days).rate * 100;
    const relative = SOURCES.map((s) => s.activation);
    const mean = sum(relative.map((r, i) => r * counts[i]!)) / sum(counts);
    const rates = relative.map((r) => round(Math.min(85, (act * r) / mean)));
    const countTotal = sum(counts);
    return {
      labels: SOURCES.map((s) => s.label),
      signups: counts,
      activationRate: rates,
      items: SOURCES.map((s, i) => ({
        name: s.label,
        value: counts[i]!,
        share: round(counts[i]! / countTotal, 4),
        change: round(((counts[i]! - before[i]!) / before[i]!) * 100),
      })),
      activation: SOURCES.map((s, i) => ({ name: s.label, value: rates[i]! })),
    };
  },

  get_experiments({ status }: Input<"get_experiments">) {
    return {
      experiments: EXPERIMENTS.map(scorecard).filter(
        (e) =>
          status === "all" ||
          (status === "running" ? e.status === "running" : e.status !== "running"),
      ),
    };
  },

  get_account_health({ plan, list, limit }: Input<"get_account_health">) {
    const all = workspaces().filter((w) => plan === "all" || w.plan.toLowerCase() === plan);
    // Paying today: those that cancelled in the last 90 days stay only in the back-test.
    const paying = all.filter((w) => !w.churned);
    const scored = paying.map((w) => {
      const parts = healthParts(w);
      return { w, parts, score: healthScore(parts) };
    });
    const pick = {
      risk: () => [...scored].sort((a, b) => a.score - b.score),
      slipping: () => scored.filter((x) => isSlipping(x.w)).sort((a, b) => b.w.mrr - a.w.mrr),
      expansion: () =>
        scored.filter((x) => isExpansionReady(x.w)).sort((a, b) => b.w.mrr - a.w.mrr),
      power: () =>
        [...scored].sort((a, b) => b.w.breadth * b.w.active7 - a.w.breadth * a.w.active7),
      mrr: () => [...scored].sort((a, b) => b.w.mrr - a.w.mrr),
    }[list]();
    const pct = (v: number) => `${Math.round(v * 100)}%`;
    const reason = (x: (typeof scored)[number]) => {
      const { w } = x;
      if (list === "slipping")
        return `No core action for ${w.lastActiveDays} days; usual gap ${w.usualGap}`;
      if (list === "expansion")
        return `${pct(w.active28 / w.seats)} of seats active; renews in ${w.renewalInDays} days`;
      if (list === "power")
        return `${w.breadth} of 11 features; ${pct(w.active7 / w.seats)} of seats active this week`;
      if (list === "mrr") return `${formatCurrency(w.mrr * 12)} ARR; health ${x.score}`;
      const weakest = (Object.entries(x.parts) as [HealthCategory, number][]).sort(
        (a, b) => a[1] - b[1],
      )[0]!;
      return `Weakest: ${weakest[0]} ${Math.round(weakest[1])}; active seats ${w.active28 >= w.active28Before ? "up" : "down"} ${pct(Math.abs(w.active28 / w.active28Before - 1))} on 90 days ago`;
    };
    const seats = sum(paying.map((w) => w.seats));
    const active = sum(paying.map((w) => w.active28));
    const before = sum(paying.map((w) => w.active28Before));
    // Health is kept as of 90, 30, and 7 days ago and today; the seat rule is
    // read on today's 90-day comparison at every point (our rule).
    const scoreAt = [
      (w: (typeof paying)[number]) => w.score90Ago,
      (w: (typeof paying)[number]) => w.score30Ago,
      (w: (typeof paying)[number]) => w.scoreWeekAgo,
      (w: (typeof paying)[number]) => healthScore(healthParts(w)),
    ];
    const healthyAt = scoreAt.map(
      (score) => (paying.filter((w) => score(w) >= 70).length / Math.max(1, paying.length)) * 100,
    );
    const riskAt = scoreAt.map((score) =>
      sum(paying.filter((w) => isArrAtRisk(w, score(w))).map((w) => w.mrr * 12)),
    );
    const plansIn = plan === "all" ? (["team", "business"] as const) : ([plan] as const);
    const payingBefore = payingByMonth(plansIn, 2)[0]!;
    return {
      metrics: [
        metric("paying_workspaces", paying.length, payingBefore, formatNumber, {
          hint: "Team and Business",
        }),
        metric("healthy_share", healthyAt[3]!, healthyAt[1]!, (v) => `${Math.round(v)}%`, {
          series: healthyAt,
          hint: "Health score 70 or more",
        }),
        metric("arr_at_risk", riskAt[3]!, riskAt[1]!, formatCurrency, {
          series: riskAt,
          hint: "Scoring under 40, or active seats down 30%+",
        }),
        metric(
          "seat_utilization",
          (active / seats) * 100,
          (before / seats) * 100,
          (v) => `${v.toFixed(0)}%`,
          {
            hint: "Seats active in the last 28 days",
          },
        ),
      ],
      accounts: pick.slice(0, limit).map((x) => {
        const { w, parts, score } = x;
        return {
          name: w.name,
          plan: w.plan,
          seats: w.seats,
          activeSeats: w.active7,
          healthScore: score,
          zone: zoneOf(score),
          change: score - w.score30Ago,
          weekChange: score - w.scoreWeekAgo,
          reviewNow: w.scoreWeekAgo - score >= 15,
          mrr: w.mrr,
          arr: w.mrr * 12,
          renewalInDays: w.renewalInDays,
          lastActiveDays: w.lastActiveDays,
          reason: reason(x),
          breakdown: (Object.entries(HEALTH_WEIGHTS) as [HealthCategory, number][]).flatMap(
            ([category, weight]) =>
              parts[category] != null
                ? [{ category, score: Math.round(parts[category]!), weight }]
                : [],
          ),
          history: scoreHistory([
            [13, w.score90Ago],
            [4, w.score30Ago],
            [1, w.scoreWeekAgo],
            [0, score],
          ]),
        };
      }),
      distribution: healthDistribution(scored.map((x) => x.score)),
      backTest: backTest(all).map((b) => ({
        name: `${b.label} (${formatNumber(b.workspaces)} workspaces)`,
        value: round(b.rate * 100, 1),
      })),
    };
  },

  get_revenue_retention({ plan }: Input<"get_revenue_retention">) {
    const plans = plan === "all" ? (["team", "business"] as const) : ([plan] as const);
    const months = REVENUE_MONTHS;
    const history = mrrHistory(plans);
    const newCounts = newWorkspacesByMonth(plans, 12);
    // Whole months up to the latest: September 2026 when today is Oct 10.
    const month = (monthsAgo: number, style: "short" | "long" = "short") =>
      new Date(Date.UTC(2026, 8 - monthsAgo, 1)).toLocaleDateString("en-US", {
        month: style,
        timeZone: "UTC",
      });
    const monthName = (monthsAgo: number, style: "short" | "long" = "short") => {
      const year = new Date(Date.UTC(2026, 8 - monthsAgo, 1)).getUTCFullYear();
      return style === "long"
        ? month(monthsAgo, "long")
        : `${month(monthsAgo)} '${String(year).slice(2)}`;
    };
    const lastDay = new Date(Date.UTC(2026, 9, 0)).getUTCDate();
    const last = history[months - 1]!;
    const before = history[months - 2]!;
    const now = retention(history, months - 1);
    const then = retention(history, months - 2);
    const percent = (v: number) => `${(v * 100).toFixed(1)}%`;
    const year = history.slice(-12);
    const trailing = year.map((_, k) => retention(history, months - 12 + k));
    const usualContraction = mean(history.slice(-7, -1).map((m) => m.contraction / m.start));
    const cut = last.contraction / last.start / usualContraction;
    const steps = [
      { label: "New", value: last.new },
      { label: "Expansion", value: last.expansion },
      { label: "Reactivation", value: last.reactivation },
      { label: "Contraction", value: last.contraction, minus: true },
      { label: "Churn", value: last.churn, minus: true },
    ];
    return {
      metrics: [
        metric("mrr", last.end, last.start, formatCurrency, {
          series: year.map((m) => m.end),
          hint: `${formatCurrency(last.end * 12)} ARR`,
        }),
        metric("nrr", now.nrr * 100, then.nrr * 100, (v) => `${v.toFixed(1)}%`, {
          series: trailing.map((r) => r.nrr * 100),
          hint: NRR_BAND.label,
        }),
        metric("grr", now.grr * 100, then.grr * 100, (v) => `${v.toFixed(1)}%`, {
          series: trailing.map((r) => r.grr * 100),
        }),
        metric(
          "revenue_quick_ratio",
          quickRatio(last),
          quickRatio(before),
          (v) => `${v.toFixed(1)}×`,
          {
            series: year.map(quickRatio),
          },
        ),
        ...unitEconomics(plans, last, before, year),
      ],
      walk: [
        { label: `${month(0)} 1`, value: Math.round(last.start), kind: "base" as const },
        ...steps.map((s) => ({
          label: s.label,
          value: Math.round(s.value),
          kind: s.minus ? ("subtract" as const) : ("add" as const),
        })),
        { label: `${month(0)} ${lastDay}`, value: Math.round(last.end), kind: "total" as const },
      ],
      comparisonLabel: `${monthName(0, "long")} 1`,
      labels: Array.from({ length: 12 }, (_, k) => monthName(11 - k)),
      cohorts: cohortNrr(history, 12).map((row, k) => ({
        cohort: monthName(11 - k),
        // New paying workspaces that month, each plan's new MRR over its starting size.
        size: newCounts[k]!,
        values: row.map((v) => round(v * 100, 1)),
      })),
      cohortLabels: Array.from({ length: 12 }, (_, m) => `Month ${m}`),
      nrr: trailing.map((r) => round(r.nrr * 100, 1)),
      nrrBand: NRR_BAND,
      // Each movement by month, losses negative, for a diverging stacked ColumnChart.
      movements: [
        { name: "New", values: year.map((m) => Math.round(m.new)) },
        { name: "Expansion", values: year.map((m) => Math.round(m.expansion)) },
        { name: "Reactivation", values: year.map((m) => Math.round(m.reactivation)) },
        { name: "Contraction", values: year.map((m) => -Math.round(m.contraction)) },
        { name: "Churn", values: year.map((m) => -Math.round(m.churn)) },
      ],
      note:
        plans.includes(SEAT_CUTS.plan) && cut > 1.5
          ? `Contraction was ${cut.toFixed(1)}× its usual share in ${monthName(0, "long")} (${formatCurrency(last.contraction)}): Business workspaces cut seats at renewal. Net revenue retention ${percent(now.nrr)}, ${now.nrr >= then.nrr ? "up" : "down"} from ${percent(then.nrr)}.`
          : `MRR ${last.end >= last.start ? "grew" : "fell"} ${formatCurrency(Math.abs(last.end - last.start))} in ${monthName(0, "long")}, mostly from ${last.new >= last.expansion ? "new workspaces" : "expansion"}. Net revenue retention ${percent(now.nrr)}.`,
    };
  },

  get_account_activity({ plan, accountActive }: Input<"get_account_activity">) {
    const all = payingWorkspaces().filter((w) => plan === "all" || w.plan.toLowerCase() === plan);
    const next = random(`account-activity:${plan}`);
    // Each workspace's members active each week drift from 12 weeks ago to now.
    const weeks = 12;
    const active = Array.from({ length: weeks }, (_, k) => {
      const t = k / (weeks - 1);
      return all.filter((w) => {
        const then = w.members * (w.active28Before / Math.max(1, w.active28));
        const members = Math.round(then + (w.members - then) * t + (next() - 0.5) * 2);
        return isAccountActive(w, accountActive, members);
      }).length;
    });
    const paid = sum(all.map((w) => w.seats));
    const claimed = sum(all.map((w) => w.claimed));
    const used = sum(all.map((w) => w.active28));
    const usedBefore = sum(all.map((w) => w.active28Before));
    const team = activationCounts("all", plan === "all" ? "all" : plan, 30);
    const ruleText = {
      any: "1 or more members",
      team: "3 or more members",
      seats: "half the seats",
    }[accountActive];
    return {
      labels: Array.from(
        { length: weeks },
        (_, k) => `Wk of ${dateLabel((weeks - 1 - k) * 7 + 6)}`,
      ),
      active,
      seats: [
        { label: "Paid seats", value: paid },
        { label: "Claimed", value: claimed },
        { label: "Active in 28 days", value: used, previous: usedBefore },
      ],
      metrics: [
        metric("active_workspaces", active[weeks - 1]!, active[weeks - 5]!, formatNumber, {
          series: active,
          hint: `Active = ${ruleText} with a core action that week`,
        }),
        metric(
          "seat_utilization",
          (used / paid) * 100,
          (usedBefore / paid) * 100,
          (v) => `${v.toFixed(0)}%`,
          {
            hint: "Seats active in the last 28 days",
          },
        ),
        metric(
          "team_activation",
          teamReach(team) * 100,
          teamReach(activationCounts("all", plan === "all" ? "all" : plan, 30, 30)) * 100,
          (v) => `${v.toFixed(1)}%`,
          {
            // Each of the last 12 weeks' new workspaces.
            series: Array.from(
              { length: weeks },
              (_, k) =>
                teamReach(
                  activationCounts("all", plan === "all" ? "all" : plan, 7, (weeks - 1 - k) * 7),
                ) * 100,
            ),
            hint: "New workspaces with 3+ members active in 14 days",
          },
        ),
        metric(
          "expansion_ready",
          all.filter(isExpansionReady).length,
          // A month ago: renewal 30 days further off, and seat activity a third
          // of the way back to where it was 90 days ago.
          all.filter(
            (w) =>
              (w.active28 + (w.active28Before - w.active28) / 3) / w.seats > 0.8 &&
              w.renewalInDays + 30 <= 90,
          ).length,
          formatNumber,
          {
            hint: "80%+ of seats active, renewing within 90 days",
          },
        ),
      ],
      rule: `Active workspace = ${ruleText} with a core action in the week`,
    };
  },

  get_product_insights({
    range,
    platform,
    plan,
    compare,
    excluding,
  }: Input<"get_product_insights">) {
    const days = RANGE_DAYS[range];
    const insights: Insight[] = [];
    const why = (metric: WhyMetric) =>
      explainAnalytics({ metric, range, platform, plan, active: "core", compare });
    const against =
      compare === "plan"
        ? "against plan"
        : compare === "last_year"
          ? "on the same days last year"
          : `on the prior ${days} days`;

    // Beside explain_change, its metric's period change is already the lead.
    if (excluding !== "wau") {
      const wau = why("wau");
      insights.push(periodChangeInsight(wau, "Weekly active users", against));
    }

    const activation = why("activation");
    if (excluding !== "activation" && activation.confidence.level !== "Low") {
      insights.push({
        tone: activation.tone === "bad" ? "negative" : "positive",
        kind: activation.tone === "bad" ? "top_detractor" : "top_driver",
        title: `Activation ${activation.change >= 0 ? "up" : "down"} ${activation.delta} ${against}`,
        detail: activation.summary.split(". ").slice(1).join(". "),
        metric: activation.value,
      });
    }

    const bug = PRODUCT_EVENTS.find((e) => e.id === "ios-duplicate-events")!;
    if (bug.to < days && (platform === "all" || platform === "ios")) {
      insights.push({
        tone: "info",
        kind: "data_quality",
        title: `Any-event counts are inflated ${dateLabel(bug.from)}–${dateLabel(bug.to)}`,
        detail: `${bug.detail}. Use core actions to compare those days.`,
        metric: "iOS",
      });
    }

    if (plan !== "free") {
      const dropped = payingWorkspaces()
        .filter((w) => plan === "all" || w.plan.toLowerCase() === plan)
        .map((w) => ({ w, score: healthScore(healthParts(w)) }))
        .sort((a, b) => a.score - a.w.scoreWeekAgo - (b.score - b.w.scoreWeekAgo))[0]!;
      const drop = dropped.w.scoreWeekAgo - dropped.score;
      // Only a workspace on the filtered plan, and only when one actually slipped.
      if (drop > 0)
        insights.push({
          tone: "negative",
          kind: "workspace_risk",
          title: `${dropped.w.name}'s health fell ${drop} points in 7 days`,
          detail: `${dropped.w.active7} of its ${dropped.w.seats} seats were active this week and no one has done a core action for ${dropped.w.lastActiveDays} days. ${formatCurrency(dropped.w.mrr * 12)} ARR, renewing in ${dropped.w.renewalInDays} days.`,
          metric: `−${drop} pts`,
        });
    }

    if (platform === "all" || platform === "android") {
      const web = retentionCurve("web", plan, 4)[4]!;
      const android = retentionCurve("android", plan, 4)[4]!;
      insights.push({
        tone: "warning",
        kind: "trend_change",
        title: "Android users churn fastest",
        detail: `Week-4 retention is ${android.toFixed(0)}% on Android against ${web.toFixed(0)}% on web. The notification permission prompt ends 1 in 8 first sessions on mobile.`,
        metric: `${android.toFixed(0)}%`,
      });
    }

    insights.push({
      tone: "warning",
      kind: "trend_change",
      title: "Mobile quick-capture widget lost its test",
      detail:
        "It lowered mobile weekly active rate by 4.2% (95% CI −7.4% to −1.0%) and was rolled back.",
      metric: "−4.2%",
    });
    // Read from the same engagement the feature cards show, so the figures agree.
    const automations = (
      analyticsHandlers.get_feature_engagement!({ range, platform, plan }) as {
        features: { name: string; breadth: number; frequency: number }[];
      }
    ).features.find((f) => f.name === "Automations");
    if (automations) {
      insights.push({
        tone: "info",
        title: "Automations is a power feature",
        detail: `Only ${automations.breadth.toFixed(0)}% of the period's active users try it, but they use it ${automations.frequency.toFixed(1)} days a week. Surfacing it in the Team plan trial could widen its reach.`,
        metric: `${automations.frequency.toFixed(1)} d/wk`,
      });
    }
    const holiday = PRODUCT_EVENTS.find((e) => e.kind === "holiday")!;
    if (holiday.to < days * 2) {
      insights.push({
        tone: "info",
        kind: "trend_change",
        title: `${holiday.label}: actives fell, then came back`,
        detail: `${holiday.detail}. Most of those users came back the following week as resurrecting.`,
        metric: "Holiday",
      });
    }
    return { insights: insights.slice(0, 7) };
  },
};
