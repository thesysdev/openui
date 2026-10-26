"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Fragment, useId, useState } from "react";
import { z } from "zod/v4";
import { BurnDown } from "../components/Charts/BurnDown";
import { ColumnChart as ColumnChartView } from "../components/Charts/ColumnChart";
import { HeatGrid } from "../components/Charts/HeatGrid";
import { QuadrantChart } from "../components/Charts/QuadrantChart";
import { SegmentFlow as SegmentFlowView } from "../components/Charts/SegmentFlow";
import { SixTwelve } from "../components/Charts/SixTwelve";
import { Sparkline } from "../components/Charts/Sparkline";
import { MUTED_COLOR, SERIES_COLORS } from "../components/Charts/utils/constants";
import { PaceCell } from "../components/PaceCell";
import { ScrollRegion } from "../components/ScrollRegion";
import { formatChange, formatCurrency, formatNumber, formatPoints } from "../core/format";
import { passed } from "../core/schemas";
import { Pending } from "../genui-lib/Pending";
import { readOdds } from "./experiments";
import type {
  accountSchema,
  commitSchema,
  experimentSchema,
  featureSchema,
  pathSchema,
  paywallSchema,
  reviewMetricSchema,
  trackedEventSchema,
} from "./tools";

type Feature = z.infer<typeof featureSchema>;
type TrackedEvent = z.infer<typeof trackedEventSchema>;
type UserPath = z.infer<typeof pathSchema>;
type Experiment = z.infer<typeof experimentSchema>;
type Account = z.infer<typeof accountSchema>;
type Paywall = z.infer<typeof paywallSchema>;
type Commit = z.infer<typeof commitSchema>;
type ReviewMetric = z.infer<typeof reviewMetricSchema>;

// Props reuse the tool schemas, so a Query result plugs in without reshaping:
// LifecycleChart(life.labels, life.newUsers, life.returning, life.resurrecting, life.dormant, life.quickRatio).

const shortWeek = (label: string) => label.replace(/^Wk of /, "");

/**
 * Gains in shades of the accent, losses in the kit's down red: the same
 * polarity colors every gains-and-losses chart uses (see colorSeries).
 */
const LIFECYCLE = [
  { key: "returning", name: "Returning", color: "var(--kit-o3)" },
  { key: "newUsers", name: "New", color: "var(--kit-o5)" },
  { key: "resurrecting", name: "Resurrecting", color: "var(--kit-o1)" },
] as const;
const DORMANT = "var(--kit-down)";

export const LifecycleChart = defineComponent({
  name: "LifecycleChart",
  description:
    "Lifecycle (growth accounting) chart: per week, stacked columns of returning, new, and resurrecting users above zero and dormant users below it, with a tooltip per week and the latest quick ratio.",
  props: z.object({
    labels: z.array(z.string()).default([]),
    newUsers: z.array(z.number()).default([]),
    returning: z.array(z.number()).default([]),
    resurrecting: z.array(z.number()).default([]),
    dormant: z.array(z.number()).default([]),
    quickRatio: z.string().optional(),
  }),
  component: ({ props }) => {
    const labels = props.labels ?? [];
    if (labels.length === 0) return <Pending kind="columns" />;
    const returning = props.returning ?? [];
    const newUsers = props.newUsers ?? [];
    const resurrecting = props.resurrecting ?? [];
    const dormant = (props.dormant ?? []).map((v) => -Math.abs(v));
    const last = labels.length - 1;
    return (
      <div className="kit-lifecycle">
        <ColumnChartView
          labels={labels.map(shortWeek)}
          series={[
            ...LIFECYCLE.map((s) => ({ name: s.name, values: props[s.key] ?? [], color: s.color })),
            { name: "Dormant", values: dormant, color: DORMANT },
          ]}
          stacked
          yLabel="Users"
          height={280}
        />
        <div className="kit-chart-note">
          <span>
            Latest week: <strong>{formatNumber(returning[last] ?? 0)}</strong> returning,{" "}
            <strong>{formatNumber(newUsers[last] ?? 0)}</strong> new,{" "}
            <strong>{formatNumber(resurrecting[last] ?? 0)}</strong> resurrecting,{" "}
            <strong>{formatNumber(Math.abs(dormant[last] ?? 0))}</strong> went dormant.
          </span>
          {props.quickRatio && (
            <span className="kit-chart-note__figure">
              Quick ratio <strong>{props.quickRatio}</strong>
              <span className="kit-muted">
                {" "}
                · for every user who went dormant, {props.quickRatio} came in or came back
              </span>
            </span>
          )}
        </div>
      </div>
    );
  },
});

/** Lifecycle states best first, so a move toward an earlier one is an improvement. */
const FLOW_ORDER = ["Weekly active", "At risk", "Dormant", "Lapsed"];

export const LifecycleFlow = defineComponent({
  name: "LifecycleFlow",
  description:
    "Where users moved between lifecycle states over 28 days, as ribbons: LifecycleFlow(states.flow).",
  props: z.object({
    moves: z.array(passed("A move from get_lifecycle states")).default([]),
  }),
  component: ({ props }) => {
    const moves = (props.moves ?? []) as unknown as { from: string; to: string; users: number }[];
    if (moves.length === 0) return <Pending kind="columns" />;
    return (
      <SegmentFlowView
        links={moves.map((m) => ({ from: m.from, to: m.to, value: m.users }))}
        order={FLOW_ORDER}
        columns={["28 days ago", "Today"]}
        source="Signed up"
        sink="Lapsed"
        unit="users"
      />
    );
  },
});

export const PowerUserCurve = defineComponent({
  name: "PowerUserCurve",
  description:
    "Power user curve (stickiness): columns for the share of active users who were active on 1, 2, … N days of the last 7 or 28 days, with power users in the accent and everyone else in gray, and their share summarized.",
  props: z.object({
    buckets: z.array(z.object({ days: z.number(), users: z.number() })).default([]),
    window: z.number().optional(),
    powerUserShare: z.string().optional(),
  }),
  component: ({ props }) => {
    const buckets = props.buckets ?? [];
    if (buckets.length === 0) return <Pending kind="columns" />;
    const window = props.window ?? buckets.length;
    const powerFrom = window >= 28 ? 20 : Math.ceil((window * 5) / 7);
    const total = buckets.reduce((a, b) => a + b.users, 0) || 1;
    const shares = buckets.map((b) => Math.round((b.users / total) * 1000) / 10);
    return (
      <div className="kit-power">
        <p className="kit-power__summary">
          <strong>{props.powerUserShare ?? "—"}</strong> are power users, active {powerFrom}+ of{" "}
          {window} days.{" "}
          <span className="kit-muted">
            {Math.round(((buckets[0]?.users ?? 0) / total) * 100)}% came once.
          </span>
        </p>
        <ColumnChartView
          labels={buckets.map((b) => String(b.days))}
          series={[{ name: "Active users", values: shares }]}
          columnColors={buckets.map((b) => (b.days >= powerFrom ? SERIES_COLORS[0] : MUTED_COLOR))}
          keys={[
            { name: "Power users", color: SERIES_COLORS[0]!, kind: "rect" },
            { name: "Everyone else", color: MUTED_COLOR, kind: "rect" },
          ]}
          format="percent"
          xLabel={`Days active in the last ${window} days`}
          height={240}
        />
      </div>
    );
  },
});

export const EngagementMatrix = defineComponent({
  name: "EngagementMatrix",
  description:
    "Feature engagement matrix: each feature a bubble placed by breadth (percent of the period's active users) and frequency (days used per week), sized by users, split at the medians into Core, Power, Broad but infrequent, and Review or retire.",
  props: z.object({
    features: z.array(passed("A feature from get_feature_engagement")).default([]),
  }),
  component: ({ props }) => {
    const features = (props.features ?? []) as unknown as Feature[];
    if (features.length === 0) return <Pending kind="trend" />;
    const maxFrequency = Math.ceil(Math.max(...features.map((f) => f.frequency)) + 0.5);
    return (
      <QuadrantChart
        points={features.map((f) => ({
          name: f.name,
          x: f.breadth,
          y: f.frequency,
          size: f.users,
          change: { text: formatPoints(f.change), good: f.change >= 0 },
        }))}
        x={{
          title: "Breadth: % of active users",
          domain: [0, 100],
          ticks: [0, 25, 50, 75, 100],
          format: (t) => `${t}%`,
        }}
        y={{
          title: "Frequency: days per week",
          domain: [0, maxFrequency],
          ticks: Array.from({ length: maxFrequency + 1 }, (_, t) => t),
          format: (t) => `${t}d`,
        }}
        quadrants={{
          highHigh: "Core",
          lowHigh: "Power",
          highLow: "Broad, infrequent",
          lowLow: "Review or retire",
        }}
        describe={(p) => [
          { name: "of active users", value: `${p.x}%` },
          { name: "days per week", value: `${p.y}` },
          { name: "users", value: formatNumber(p.size) },
        ]}
      />
    );
  },
});

/** Our rule: 30% of active users is broad; 5 points of retention among activated users matters. */
const VALUE_SPLIT = { x: 30, y: 5 };

export const FeatureValue = defineComponent({
  name: "FeatureValue",
  description:
    "Feature value matrix: breadth against retention gap among activated users, in Protect, Promote, Don't gate, and Review quadrants, sized by days a week.",
  props: z.object({
    features: z.array(passed("A feature from get_feature_engagement")).default([]),
  }),
  component: ({ props }) => {
    const features = (props.features ?? []) as unknown as Feature[];
    if (features.length === 0 || features[0]!.adjustedGap == null) return <Pending kind="trend" />;
    const top = Math.ceil(Math.max(...features.map((f) => f.adjustedGap)) / 2) * 2 + 2;
    return (
      <div className="kit-feature-value">
        <QuadrantChart
          points={features.map((f) => ({
            name: f.name,
            x: f.breadth,
            y: f.adjustedGap,
            size: f.frequency,
          }))}
          x={{
            title: "Breadth: % of active users",
            domain: [0, 100],
            ticks: [0, 25, 50, 75, 100],
            format: (t) => `${t}%`,
          }}
          y={{
            title: "Retention gap among activated users, points",
            domain: [0, top],
            ticks: Array.from({ length: top / 2 + 1 }, (_, t) => t * 2),
            format: (t) => `+${t}`,
          }}
          split={VALUE_SPLIT}
          sizeLabel="Bubble size: days a week its users use it"
          quadrants={{
            highHigh: "Protect",
            lowHigh: "Promote",
            highLow: "Don't gate",
            lowLow: "Review",
          }}
          describe={(p) => {
            const f = features.find((x) => x.name === p.name)!;
            return [
              { name: "of active users", value: `${p.x}%` },
              { name: "retention gap, activated", value: formatPoints(f.adjustedGap) },
              { name: "retention gap, everyone", value: formatPoints(f.retentionGap) },
              { name: "days a week", value: `${p.size}` },
              { name: "users", value: formatNumber(f.users) },
            ];
          }}
        />
        <p className="kit-footnote">
          Week-4 retention of users who used a feature in their first 14 days, minus those who
          didn't, counted among activated users so that busy users using everything don't inflate
          it. A gap, not proof the feature causes it.
        </p>
      </div>
    );
  },
});

export const FeatureAdoption = defineComponent({
  name: "FeatureAdoption",
  description:
    "Feature adoption as ranked bars: percent of the period's active users who used each feature, with user counts, days per week, and the change in percentage points.",
  props: z.object({
    features: z.array(passed("A feature from get_feature_engagement")).default([]),
    limit: z.number().optional(),
  }),
  component: ({ props }) => {
    const features = ((props.features ?? []) as unknown as Feature[]).slice(0, props.limit ?? 20);
    if (features.length === 0) return <Pending kind="list" rows={8} />;
    return (
      <ul className="kit-barlist">
        {features.map((f) => (
          <li
            key={f.name}
            className="kit-barlist__row"
            title={`${f.name}: ${formatNumber(f.users)} users, ${f.frequency} days/week`}
          >
            <span className="kit-barlist__track">
              <span
                className="kit-barlist__fill"
                style={{ width: `${Math.min(100, f.breadth)}%` }}
              />
              <span className="kit-barlist__name">{f.name}</span>
            </span>
            <span className="kit-barlist__value">{f.breadth.toFixed(1)}%</span>
            <span
              className={`kit-barlist__meta ${f.change >= 0 ? "kit-text-good" : "kit-text-bad"}`}
            >
              {formatPoints(f.change)}
            </span>
          </li>
        ))}
      </ul>
    );
  },
});

export const EventTable = defineComponent({
  name: "EventTable",
  description:
    "Top tracked events as a table: event name, volume with a bar against the largest, unique users, events per user, and change against the prior period.",
  props: z.object({
    events: z.array(passed("An event from get_top_events")).default([]),
  }),
  component: ({ props }) => {
    const events = (props.events ?? []) as unknown as TrackedEvent[];
    if (events.length === 0) return <Pending kind="table" rows={8} />;
    const max = Math.max(1, ...events.map((e) => e.count));
    return (
      <ScrollRegion label="Events table">
        <table className="kit-table kit-events">
          <thead>
            <tr>
              <th>Event</th>
              <th className="kit-num">Events</th>
              <th aria-hidden />
              <th className="kit-num">Users</th>
              <th className="kit-num">Per user</th>
              <th className="kit-num">Change</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.name}>
                <td>
                  <code className="kit-step">{e.name}</code>
                </td>
                <td className="kit-num kit-cell-title">{formatNumber(e.count)}</td>
                <td className="kit-events__bar">
                  <span className="kit-meter">
                    <span
                      className="kit-meter__fill"
                      style={{ width: `${(e.count / max) * 100}%` }}
                    />
                  </span>
                </td>
                <td className="kit-num">{formatNumber(e.users)}</td>
                <td className="kit-num">{e.perUser.toFixed(1)}</td>
                <td className={`kit-num kit-text-${e.change >= 0 ? "good" : "bad"}`}>
                  {formatChange(e.change)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
    );
  },
});

interface Release {
  label: string;
  date: string;
  platforms: string;
  detail: string;
  metrics: {
    name: string;
    before: string;
    after: string;
    change: number;
    unit: "percent" | "points";
  }[];
}

/** Changes smaller than this read as no change, so noise isn't painted as a result. */
const STEADY = { percent: 0.5, points: 0.2 } as const;

export const ReleaseImpact = defineComponent({
  name: "ReleaseImpact",
  description:
    "Each launch or rollback with what it changed, the week before against the week after: ReleaseImpact(releases.releases).",
  props: z.object({
    releases: z.array(passed("A release from get_release_impact")).default([]),
  }),
  component: ({ props }) => {
    const releases = (props.releases ?? []) as unknown as Release[];
    if (releases.length === 0) return <Pending kind="list" rows={4} />;
    return (
      <div className="kit-releases-wrap">
        <div className="kit-releases">
          {releases.map((r) => (
            <section key={r.label} className="kit-release">
              <div className="kit-release__head">
                <span className="kit-release__date">{r.date}</span>
                <span className="kit-release__label">{r.label}</span>
                <span className="kit-small kit-muted">{r.platforms}</span>
              </div>
              <p className="kit-release__detail">{r.detail}</p>
              <dl className="kit-release__metrics">
                {r.metrics.map((m) => {
                  const steady = Math.abs(m.change) < STEADY[m.unit];
                  const tone = steady ? "neutral" : m.change > 0 ? "good" : "bad";
                  return (
                    <div key={m.name}>
                      <dt>{m.name}</dt>
                      <dd>
                        <span className="kit-muted">{m.before}</span>
                        <span aria-hidden> → </span>
                        <strong>{m.after}</strong>
                        <span className={`kit-num kit-text-${tone}`}>
                          {steady
                            ? "no change"
                            : m.unit === "points"
                              ? formatPoints(m.change)
                              : formatChange(m.change)}
                        </span>
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}
        </div>
        <p className="kit-small kit-muted">
          The 7 days before each release against the 7 after, launch day left out. Other things
          change too, so read this beside the experiment that decided it.
        </p>
      </div>
    );
  },
});

export const ActivityHeatmap = defineComponent({
  name: "ActivityHeatmap",
  description:
    "Weekday by hour heatmap of activity, shaded relative to the busiest hour, with the hovered cell read out.",
  props: z.object({
    days: z.array(z.object({ day: z.string(), values: z.array(z.number()) })).default([]),
    hourLabels: z.array(z.string()).optional(),
  }),
  component: ({ props }) => {
    const days = props.days ?? [];
    if (days.length === 0) return <Pending kind="grid" rows={7} />;
    const hours = Math.max(...days.map((d) => d.values.length));
    const labels = props.hourLabels ?? Array.from({ length: hours }, (_, h) => `${h}:00`);
    let peak = { d: 0, h: 0 };
    days.forEach((row, d) =>
      row.values.forEach((v, h) => v > days[peak.d].values[peak.h] && (peak = { d, h })),
    );
    return (
      <div className="kit-heat">
        <p className="kit-heat__readout">
          <span className="kit-muted">Busiest hour</span>{" "}
          <strong>
            {days[peak.d]?.day} {labels[peak.h]}
          </strong>{" "}
          · {formatNumber(days[peak.d]?.values[peak.h] ?? 0)} events
        </p>
        <HeatGrid
          rows={days.map((d) => ({ label: d.day, values: d.values }))}
          columns={labels.slice(0, hours)}
          unit="events"
        />
      </div>
    );
  },
});

const OUTCOME_TONE = {
  activated: "positive",
  "in progress": "neutral",
  dropped: "negative",
} as const;

export const UserPaths = defineComponent({
  name: "UserPaths",
  description:
    "Most common user paths after a start event: each path's steps in order, its share of users, and whether it ended activated, in progress, or dropped.",
  props: z.object({
    start: z.string().optional(),
    totalUsers: z.number().optional(),
    paths: z.array(passed("A path from get_user_paths")).default([]),
  }),
  component: ({ props }) => {
    const paths = (props.paths ?? []) as unknown as UserPath[];
    if (paths.length === 0) return <Pending kind="list" rows={6} />;
    const top = Math.max(...paths.map((p) => p.share), 0.01);
    const activated = paths
      .filter((p) => p.outcome === "activated")
      .reduce((a, p) => a + p.share, 0);
    const dropped = paths.filter((p) => p.outcome === "dropped").reduce((a, p) => a + p.share, 0);
    return (
      <div className="kit-paths">
        <div className="kit-paths__summary">
          {props.start && (
            <span>
              {props.totalUsers != null
                ? `${formatNumber(props.totalUsers)} users after `
                : "After "}
              <code className="kit-step kit-step--start">{props.start}</code>
            </span>
          )}
          <span className="kit-status kit-status--positive">
            <i className="kit-status__dot" />
            {Math.round(activated * 100)}% activated
          </span>
          <span className="kit-status kit-status--negative">
            <i className="kit-status__dot" />
            {Math.round(dropped * 100)}% dropped
          </span>
        </div>
        <ol className="kit-paths__list">
          {paths.map((p, i) => (
            <li key={i} className="kit-paths__item">
              <span className="kit-paths__share">
                <span className="kit-paths__pct">{Math.round(p.share * 100)}%</span>
                <span className="kit-meter">
                  <span style={{ width: `${(p.share / top) * 100}%` }} />
                </span>
                <span className="kit-paths__users">{formatNumber(p.users)}</span>
              </span>
              <span className="kit-paths__steps">
                {p.steps.map((step, j) => (
                  <Fragment key={j}>
                    {j > 0 && (
                      <svg className="kit-paths__arrow" viewBox="0 0 12 12" aria-hidden>
                        <path d="M2 6h8M7 3l3 3-3 3" />
                      </svg>
                    )}
                    <code className="kit-step">{step}</code>
                  </Fragment>
                ))}
                <span className={`kit-status kit-status--${OUTCOME_TONE[p.outcome]}`}>
                  <i className="kit-status__dot" />
                  {p.outcome}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  },
});

/** The badge: finished tests say how they ended; running ones say what to do next. */
const BADGE = {
  won: { label: "Shipped: significant win", tone: "positive" },
  lost: { label: "Rolled back: significant loss", tone: "negative" },
  ship: { label: "Ready to ship", tone: "positive" },
  dont_ship: { label: "Don't ship", tone: "negative" },
  fix_split: { label: "Split mismatch", tone: "negative" },
  discuss: { label: "Needs a call", tone: "warning" },
  extend: { label: "Too early to call", tone: "info" },
} as const;

const LIGHT = {
  grey: { label: "Within limit", tone: "neutral" },
  yellow: { label: "Could pass limit", tone: "warning" },
  red: { label: "Past limit", tone: "negative" },
} as const;

/** Past this many more days, a test is better stopped or redesigned than waited on. */
const MAX_WAIT = 60;

/** A chance as a reader takes it: never a flat 0% or 100% from a finite sample. */
const formatOdds = (p: number) =>
  p > 0.99 ? ">99%" : p < 0.01 ? "<1%" : `${Math.round(p * 100)}%`;

const significanceText = (s: number) =>
  s >= 0.999 ? "p < 0.001" : `p = ${(1 - s).toFixed(s >= 0.99 ? 3 : 2)}`;

export const ExperimentResults = defineComponent({
  name: "ExperimentResults",
  description:
    "A/B test scorecards: each variant's lift with its 95% interval, a split warning, guardrail lights, and the decision.",
  props: z.object({
    experiments: z.array(passed("An experiment from get_experiments")).default([]),
  }),
  component: ({ props }) => {
    const experiments = (props.experiments ?? []) as unknown as Experiment[];
    if (experiments.length === 0) return <Pending kind="table" rows={6} />;
    return (
      <div className="kit-experiments">
        {experiments.map((e) => {
          const badge =
            e.recommendation === "done"
              ? BADGE[e.status === "lost" ? "lost" : "won"]
              : BADGE[e.recommendation];
          const unreadable = !e.split.ok;
          const bounds = e.variants.flatMap((v) => [v.ciLow ?? 0, v.ciHigh ?? 0, v.lift ?? 0]);
          const span = Math.max(5, ...bounds.map(Math.abs)) * 1.15;
          const pos = (v: number) => `${((v + span) / (2 * span)) * 100}%`;
          return (
            <section key={e.name} className="kit-experiment">
              <header className="kit-experiment__head">
                <div>
                  <span className="kit-experiment__name">{e.name}</span>
                  <span className="kit-experiment__meta">
                    {e.metric} · {e.daysRunning} days
                  </span>
                </div>
                <span className={`kit-status kit-status--${badge.tone}`}>
                  <i className="kit-status__dot" />
                  {badge.label}
                </span>
              </header>
              <p className="kit-experiment__hypothesis">{e.hypothesis}</p>
              {unreadable && (
                <p className="kit-experiment__alert" role="note">
                  <strong>Sample ratio mismatch.</strong> Users split {e.split.observed} against a
                  planned {e.split.planned}, so the lift below can't be trusted.
                </p>
              )}
              <ScrollRegion
                label={`${e.name} variants`}
                className={`kit-experiment__variants${unreadable ? " kit-experiment__variants--muted" : ""}`}
              >
                {e.variants.map((v) => {
                  const odds =
                    v.lift != null && v.ciLow != null && v.ciHigh != null
                      ? readOdds(v.lift, v.ciLow, v.ciHigh, e.daysRunning)
                      : undefined;
                  const tone =
                    v.ciLow == null
                      ? "neutral"
                      : v.ciLow > 0
                        ? "good"
                        : (v.ciHigh ?? 0) < 0
                          ? "bad"
                          : "neutral";
                  return (
                    <div key={v.name} className="kit-variant">
                      <span className="kit-variant__name">{v.name}</span>
                      <span className="kit-variant__users">{formatNumber(v.users)} users</span>
                      <span className="kit-variant__metric">{v.conversion}%</span>
                      {v.lift == null ? (
                        <span className="kit-variant__baseline">Baseline</span>
                      ) : (
                        <span className="kit-ci">
                          <span className={`kit-ci__value kit-text-${tone}`}>
                            {formatChange(v.lift)}
                          </span>
                          <span className="kit-ci__track">
                            <i className="kit-ci__zero" style={{ left: pos(0) }} />
                            {v.ciLow != null && v.ciHigh != null && (
                              <span
                                className={`kit-ci__range kit-ci__range--${tone}`}
                                style={{
                                  left: pos(v.ciLow),
                                  width: `calc(${pos(v.ciHigh)} - ${pos(v.ciLow)})`,
                                }}
                              />
                            )}
                            <i
                              className={`kit-ci__dot kit-ci__dot--${tone}`}
                              style={{ left: pos(v.lift) }}
                            />
                          </span>
                          <span className="kit-ci__bounds">
                            {v.ciLow != null && v.ciHigh != null
                              ? `${formatChange(v.ciLow)} to ${formatChange(v.ciHigh)}`
                              : ""}
                          </span>
                        </span>
                      )}
                      <span
                        className={`kit-variant__sig${(v.significance ?? 0) >= 0.95 ? " kit-variant__sig--strong" : ""}`}
                      >
                        {v.significance != null ? significanceText(v.significance) : ""}
                        {odds && !unreadable && (
                          <span className="kit-variant__odds">
                            {formatOdds(odds.chanceBetter)} to beat control
                            {e.status === "running" && odds.moreDays != null && !unreadable
                              ? odds.moreDays > MAX_WAIT
                                ? " · too small to call at this traffic"
                                : ` · ~${odds.moreDays} more days to call`
                              : ""}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </ScrollRegion>
              {e.guardrails.length > 0 && (
                <ul className="kit-guardrails" aria-label="Guardrails">
                  {e.guardrails.map((g) => {
                    const light = LIGHT[g.light];
                    return (
                      <li key={g.name} className="kit-guardrail">
                        <span className={`kit-light kit-light--${light.tone}`} aria-hidden />
                        <span className="kit-guardrail__text">
                          <span className="kit-guardrail__name">{g.name}</span>
                          <span className="kit-guardrail__light">{light.label}</span>
                        </span>
                        <span className="kit-guardrail__value">
                          {formatChange(g.change)} ({formatChange(g.ciLow)} to{" "}
                          {formatChange(g.ciHigh)}) · limit {formatChange(g.allowed)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className={`kit-experiment__decision kit-experiment__decision--${badge.tone}`}>
                {e.decision}
              </p>
            </section>
          );
        })}
      </div>
    );
  },
});

function HealthRing({ score }: { score: number }) {
  const tone = score < 40 ? "negative" : score < 70 ? "warning" : "positive";
  const c = 2 * Math.PI * 14;
  return (
    <span className={`kit-ring kit-ring--${tone}`} aria-label={`Health ${score}`}>
      <svg viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" className="kit-ring__track" />
        <circle
          cx="18"
          cy="18"
          r="14"
          className="kit-ring__fill"
          strokeDasharray={`${(score / 100) * c} ${c}`}
        />
      </svg>
      <span>{score}</span>
    </span>
  );
}

interface Moment {
  rule: string;
  count: number;
  reach: number;
  precision: number;
  recall: number;
  phi: number;
  retentionByCount: number[];
  knee: number;
}

/** Retention for doing a behaviour 1 to 10 times, as small bars with the knee marked. */
function CountBars({ values, knee, count }: { values: number[]; knee: number; count: number }) {
  const max = Math.max(...values, 1);
  return (
    <span
      className="kit-moment__bars"
      role="img"
      aria-label={`Retention by count: ${values.map((v, i) => `${i + 1} time${i ? "s" : ""} ${v}%`).join(", ")}; knee at ${knee}`}
    >
      {values.map((v, i) => (
        <span
          key={i}
          className={`kit-moment__bar${i + 1 === count ? " kit-moment__bar--chosen" : ""}${i + 1 === knee ? " kit-moment__bar--knee" : ""}`}
          style={{ height: `${Math.max(6, (v / max) * 100)}%` }}
          title={`${i + 1}+: ${v}% retained`}
        />
      ))}
    </span>
  );
}

export const ActivationMoments = defineComponent({
  name: "ActivationMoments",
  description:
    "Candidate aha moments, best first: each behaviour's rule, a reach bar, week-4 retention of those who did it (precision), recall, phi, and retention by count with the knee marked, under the cohort and its baseline: ActivationMoments(moments). LargeCard only.",
  props: z.object({
    moments: passed("find_activation_moment's result, passed whole"),
  }),
  component: ({ props }) => {
    const m = props.moments as unknown as
      { cohort: string; baseline: string; candidates: Moment[]; note: string } | undefined;
    if (!m?.candidates?.length) return <Pending kind="list" rows={5} />;
    return (
      <div className="kit-moments">
        <p className="kit-moments__lead">
          {m.cohort}. <strong>{m.baseline}</strong> were still active in week 4.
        </p>
        <ol className="kit-moments__list">
          {m.candidates.map((c, i) => (
            <li key={c.rule} className={`kit-moment${i === 0 ? " kit-moment--best" : ""}`}>
              <div className="kit-moment__head">
                <span className="kit-moment__rule">{c.rule}</span>
                <span className="kit-moment__phi">phi {c.phi.toFixed(2)}</span>
              </div>
              <div className="kit-moment__body">
                <span className="kit-moment__stat">
                  <span className="kit-moment__reach" aria-hidden>
                    <span style={{ width: `${c.reach * 100}%` }} />
                  </span>
                  {(c.reach * 100).toFixed(0)}% do it
                </span>
                <span className="kit-moment__stat">
                  <strong>{(c.precision * 100).toFixed(0)}%</strong> of them retained
                </span>
                <span className="kit-moment__stat kit-muted">
                  {(c.recall * 100).toFixed(0)}% of retained users did it
                </span>
                <CountBars values={c.retentionByCount} knee={c.knee} count={c.count} />
              </div>
            </li>
          ))}
        </ol>
        <p className="kit-moments__note">{m.note}</p>
      </div>
    );
  },
});

const ZONE_TONE = { Healthy: "positive", Watch: "warning", "At risk": "negative" } as const;
const CATEGORY_LABEL: Record<string, string> = {
  engagement: "Engagement",
  seats: "Seats in use",
  breadth: "Feature breadth",
  support: "Support",
  trend: "Trend",
};

/** One workspace's weighted health: each category's score, its weight, and the 12-week line. */
function HealthBreakdown({ account }: { account: Account }) {
  const weights = account.breakdown.reduce((t, b) => t + b.weight, 0) || 1;
  return (
    <div className="kit-breakdown">
      <ul className="kit-breakdown__list">
        {account.breakdown.map((b) => (
          <li key={b.category} className="kit-breakdown__row">
            <span className="kit-breakdown__name">
              {CATEGORY_LABEL[b.category] ?? b.category}
              <span className="kit-muted">
                {" "}
                · {Math.round((b.weight / weights) * 100)}% of score
              </span>
            </span>
            <span className="kit-meter kit-breakdown__meter">
              <span style={{ width: `${b.score}%` }} />
            </span>
            <span className="kit-num kit-small">{b.score}</span>
          </li>
        ))}
      </ul>
      <div className="kit-breakdown__history">
        <span className="kit-small kit-muted">Last 12 weeks</span>
        <Sparkline values={account.history} />
      </div>
    </div>
  );
}

function AccountRows({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const detailId = `kit-account-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <ScrollRegion label="Workspace health table">
      <table className="kit-table kit-accounts">
        <thead>
          <tr>
            <th>Workspace</th>
            <th>Health</th>
            <th>Seats active, last 7 days</th>
            <th className="kit-num">ARR</th>
            <th>Renews</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a, i) => {
            const utilization = a.activeSeats / (a.seats || 1);
            const expanded = open === a.name;
            return (
              <Fragment key={a.name}>
                {/* The whole row toggles on click; the name is the keyboard and
                    screen-reader control (a table row can't carry aria-expanded),
                    and its click bubbles to the row. */}
                <tr
                  className={`kit-accounts__row${expanded ? " kit-accounts__row--open" : ""}`}
                  onClick={() => setOpen(expanded ? null : a.name)}
                >
                  <td>
                    <button
                      type="button"
                      className="kit-accounts__toggle kit-cell-title"
                      aria-expanded={expanded}
                      aria-controls={expanded ? `${detailId}-${i}` : undefined}
                    >
                      {a.name}
                    </button>
                    <span className="kit-tag">{a.plan}</span>
                    <span className="kit-accounts__reason">{a.reason}</span>
                  </td>
                  <td>
                    <span className="kit-health">
                      <HealthRing score={a.healthScore} />
                      <span
                        className={`kit-num kit-small ${a.change >= 0 ? "kit-text-good" : "kit-text-bad"}`}
                      >
                        {a.change >= 0 ? "+" : "−"}
                        {Math.abs(a.change)} pts
                      </span>
                    </span>
                  </td>
                  <td>
                    <span className="kit-seats">
                      <span className="kit-meter">
                        <span style={{ width: `${utilization * 100}%` }} />
                      </span>
                      <span className="kit-num kit-small kit-muted">
                        {formatNumber(a.activeSeats)} of {formatNumber(a.seats)} ·{" "}
                        {Math.round(utilization * 100)}%
                      </span>
                    </span>
                  </td>
                  <td className="kit-num kit-strong">{formatCurrency(a.arr)}</td>
                  <td className="kit-small">in {a.renewalInDays}d</td>
                  <td>
                    <span className={`kit-status kit-status--${ZONE_TONE[a.zone]}`}>
                      <i className="kit-status__dot" />
                      {a.reviewNow ? "Review now" : a.zone}
                    </span>
                  </td>
                </tr>
                {expanded && (
                  <tr id={`${detailId}-${i}`} className="kit-accounts__detail">
                    <td colSpan={6}>
                      <HealthBreakdown account={a} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </ScrollRegion>
  );
}

export const AccountHealth = defineComponent({
  name: "AccountHealth",
  description:
    "Paying workspaces with why each is listed, a health ring with its 30-day change, seats active, ARR, renewal, and status (Review now after a 15-point drop in 7 days); a row opens to its weighted health breakdown and 12-week line: AccountHealth(accounts.accounts).",
  props: z.object({
    accounts: z.array(passed("An account from get_account_health")).default([]),
  }),
  component: ({ props }) => {
    const accounts = (props.accounts ?? []) as unknown as Account[];
    if (accounts.length === 0)
      return <Pending kind="table" rows={6} empty="No workspaces on this list." />;
    return <AccountRows accounts={accounts} />;
  },
});

/** Our rule: a limit is busy at 500 hits a week, and converts well at 2% upgrading. */
const PAYWALL_SPLIT = { x: 500, y: 2 };

export const PaywallMatrix = defineComponent({
  name: "PaywallMatrix",
  description:
    "Free plan limits by weekly hits and the share that upgrade within 14 days, in Working, Show more, Friction, and Rethink quadrants.",
  props: z.object({
    paywalls: z.array(passed("A paywall from get_monetization")).default([]),
  }),
  component: ({ props }) => {
    const paywalls = (props.paywalls ?? []) as unknown as Paywall[];
    if (paywalls.length === 0) return <Pending kind="trend" />;
    const top = Math.ceil(Math.max(...paywalls.map((p) => p.upgradeRate)) + 1);
    const most = Math.ceil(Math.max(...paywalls.map((p) => p.hits)) / 500) * 500;
    return (
      <QuadrantChart
        points={paywalls.map((p) => ({
          name: p.name,
          x: p.hits,
          y: p.upgradeRate,
          size: (p.hits * p.upgradeRate) / 100,
        }))}
        x={{
          title: "Workspaces hitting it per week",
          domain: [0, most],
          ticks: Array.from({ length: most / 500 + 1 }, (_, t) => t * 500),
          format: (t) => formatNumber(t),
        }}
        y={{
          title: "Upgrade within 14 days",
          domain: [0, top],
          ticks: Array.from({ length: top + 1 }, (_, t) => t),
          format: (t) => `${t}%`,
        }}
        split={PAYWALL_SPLIT}
        quadrants={{
          highHigh: "Working",
          lowHigh: "Show more",
          highLow: "Friction",
          lowLow: "Rethink",
        }}
        sizeLabel="Bubble size: upgrades a week"
        describe={(p) => [
          { name: "hits a week", value: formatNumber(p.x) },
          { name: "upgrade within 14 days", value: `${p.y}%` },
          { name: "upgrades a week", value: formatNumber(p.size) },
        ]}
      />
    );
  },
});

const PACE_LABEL = {
  under: { text: "Under pace", tone: "warning" },
  on_track: { text: "On track", tone: "positive" },
  over: { text: "Over pace", tone: "info" },
} as const;

export const CommitPacing = defineComponent({
  name: "CommitPacing",
  description:
    "AI credit commits: each one's pace against a straight line through its term (80–110% on track), its burn-down with where this pace ends at renewal, and the renewal date.",
  props: z.object({
    commits: z.array(passed("A commit from get_usage_commits")).default([]),
  }),
  component: ({ props }) => {
    const commits = (props.commits ?? []) as unknown as Commit[];
    if (commits.length === 0) return <Pending kind="table" rows={6} />;
    return (
      <ScrollRegion label="Commit pacing table">
        <table className="kit-table kit-commits">
          <thead>
            <tr>
              <th>Workspace</th>
              <th>Pace</th>
              <th>Burn-down</th>
              <th className="kit-num">By renewal</th>
              <th className="kit-num">Renews</th>
            </tr>
          </thead>
          <tbody>
            {commits.map((c) => {
              const label = PACE_LABEL[c.status];
              return (
                <tr key={c.name}>
                  <th scope="row">
                    <span className="kit-commits__name">{c.name}</span>
                    <span className="kit-small kit-muted">
                      {formatNumber(c.committed)} credits · {formatCurrency(c.value)}
                    </span>
                  </th>
                  <td>
                    <PaceCell
                      pace={c.pace}
                      band={[80, 110]}
                      mark={c.status}
                      tone={label.tone}
                      label={label.text}
                    />
                  </td>
                  <td className="kit-commits__burn">
                    <BurnDown
                      burn={c.burn}
                      committed={c.committed}
                      elapsed={c.elapsed / 100}
                      projected={c.projected}
                      status={c.status}
                    />
                  </td>
                  <td className="kit-num">
                    {Math.round((c.projected / c.committed) * 100)}%
                    <span className="kit-small kit-muted"> of commit</span>
                  </td>
                  <td className="kit-num">{c.renewalInDays} days</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollRegion>
    );
  },
});

/** A row that is not an exception: on plan, or, for a metric with no plan, inside its usual range. */
export const reviewOkNote = (m: Pick<ReviewMetric, "vsPlan">) =>
  m.vsPlan === "No plan" ? "Within its usual range" : "On plan";

export const WeeklyReview = defineComponent({
  name: "WeeklyReview",
  description:
    "Weekly business review in the 6-12 shape: one row per metric with the last 6 weeks and 12 months, last year faded and the plan dashed, its latest week against plan and last year, and for exceptions the cause or the owner who must find it.",
  props: z.object({
    rows: z.array(passed("A row from get_weekly_review")).default([]),
  }),
  component: ({ props }) => {
    const metrics = (props.rows ?? []) as unknown as ReviewMetric[];
    if (metrics.length === 0) return <Pending kind="list" rows={5} />;
    return (
      <div className="kit-review">
        <div className="kit-review__key" aria-hidden>
          <span>
            <i className="kit-review__swatch kit-review__swatch--current" /> This year
          </span>
          <span>
            <i className="kit-review__swatch kit-review__swatch--year-ago" /> Last year
          </span>
          <span>
            <i className="kit-review__swatch kit-review__swatch--plan" /> Plan
          </span>
        </div>
        {metrics.map((m) => (
          <section
            key={m.key}
            className={`kit-review__row${m.status === "exception" ? " kit-review__row--exception" : ""}`}
          >
            <div className="kit-review__head">
              <span className="kit-review__label">{m.label}</span>
              <span className="kit-review__value">{m.value}</span>
              <span className="kit-small kit-muted">{m.vsPlan}</span>
              <span className="kit-small kit-muted">{m.vsLastYear}</span>
            </div>
            <SixTwelve weeks={m.weeks} months={m.months} format={m.format} />
            <div className="kit-review__note">
              {m.status === "exception" ? (
                <>
                  <span className={`kit-status kit-status--${m.good ? "positive" : "warning"}`}>
                    <i className="kit-status__dot" />
                    {m.flag}
                  </span>
                  <span className={m.cause === "Cause unknown" ? "kit-review__unknown" : undefined}>
                    {m.cause}
                  </span>
                  <span className="kit-small kit-muted">Owner: {m.owner}</span>
                </>
              ) : (
                <span className="kit-small kit-muted">
                  {reviewOkNote(m)} · {m.owner}
                </span>
              )}
            </div>
          </section>
        ))}
      </div>
    );
  },
});
