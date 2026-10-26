"use client";

// ExperimentResults: A/B test scorecards with lift, interval, guardrails, and decision.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { ScrollRegion } from "../../../components/ScrollRegion";
import { formatChange, formatNumber } from "../../../core/format";
import { passed } from "../../../core/schemas";
import { Pending } from "../../../library/Pending";
import { readOdds } from "../experiments";
import type { Experiment } from "./shared";

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
