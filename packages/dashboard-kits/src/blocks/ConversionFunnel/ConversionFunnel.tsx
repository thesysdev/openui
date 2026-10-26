import { Fragment } from "react";
import {
  changeTone,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatPoints,
} from "../../core/format";
import type { FunnelStep } from "../../core/schemas";

export interface ConversionFunnelProps {
  steps: FunnelStep[];
  format?: "number" | "currency";
}

/** Below this many points of change, a step's rate counts as steady. */
const STEADY_POINTS = 0.5;

/**
 * The step a reader should look at, by its index (the step it arrives at):
 * the step whose rate fell most against the prior period, when one fell; else
 * the biggest leak, the step that loses the largest share. Undefined for a
 * funnel of two steps, where there is nothing to pick between.
 */
export function funnelFocus(
  steps: FunnelStep[],
): { index: number; kind: "fell" | "leak"; points?: number } | undefined {
  if (steps.length < 3) return undefined;
  let fell: { index: number; points: number } | undefined;
  let leak = { index: 1, rate: Infinity };
  steps.forEach((step, i) => {
    const prior = steps[i - 1];
    if (!prior) return;
    const rate = step.value / (prior.value || 1);
    if (rate < leak.rate) leak = { index: i, rate };
    if (prior.previous && step.previous != null) {
      const points = (rate - step.previous / prior.previous) * 100;
      if (points <= -STEADY_POINTS && (!fell || points < fell.points)) fell = { index: i, points };
    }
  });
  return fell
    ? { index: fell.index, kind: "fell", points: fell.points }
    : { index: leak.index, kind: "leak" };
}

/**
 * An ordered funnel as a step list: one bar per step on the ordinal ramp, the
 * share that continues and drops off between steps, the median time between
 * them, the change in step conversion against the prior period, and the
 * overall conversion. One grid for the whole funnel keeps every bar on the
 * same edge however long a step name is.
 */
export function ConversionFunnel({ steps, format }: ConversionFunnelProps) {
  const fmt = format === "currency" ? formatCurrency : formatNumber;
  const first = steps[0].value || 1;
  const last = steps[steps.length - 1];
  const overall = last.value / first;
  const prevOverall =
    steps[0].previous && last.previous != null ? last.previous / steps[0].previous : undefined;
  const focus = funnelFocus(steps);
  const ramp = (i: number) =>
    `var(--kit-o${Math.min(5, Math.round((i / Math.max(1, steps.length - 1)) * 4) + 1)})`;
  return (
    <div className="kit-funnel">
      {steps.map((step, i) => {
        const prior = steps[i - 1];
        const rate = prior ? step.value / (prior.value || 1) : 1;
        const prevRate =
          prior?.previous && step.previous != null ? step.previous / prior.previous : undefined;
        const delta = prevRate != null ? (rate - prevRate) * 100 : undefined;
        return (
          <Fragment key={`${step.label}-${i}`}>
            {prior && (
              <div
                className={`kit-funnel__step${focus?.index === i ? " kit-funnel__step--focus" : ""}`}
              >
                <span className="kit-funnel__rate">{formatPercent(rate)}</span>
                <span className="kit-funnel__drop">
                  continue · {formatPercent(1 - rate)} drop off
                  {step.medianTime && <> · {step.medianTime}</>}
                </span>
                {delta != null && Math.abs(delta) >= 0.05 && (
                  <span className={`kit-text-${changeTone(delta)} kit-num`}>
                    {formatPoints(delta)}
                  </span>
                )}
              </div>
            )}
            <div className="kit-funnel__row">
              <span className="kit-funnel__label">
                <span className="kit-funnel__index">{i + 1}</span>
                {step.label}
              </span>
              <span className="kit-funnel__track">
                <span
                  className="kit-funnel__bar"
                  style={{
                    width: `${Math.max(1.5, (step.value / first) * 100)}%`,
                    background: ramp(i),
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              </span>
              <span className="kit-funnel__value">{fmt(step.value)}</span>
            </div>
          </Fragment>
        );
      })}
      {focus && (
        <p className="kit-funnel__note">
          <strong>
            {focus.kind === "fell" ? "Biggest change" : "Biggest leak"}:{" "}
            {steps[focus.index - 1]!.label.toLowerCase()} →{" "}
            {steps[focus.index]!.label.toLowerCase()}
          </strong>
          {focus.kind === "fell"
            ? `, ${formatPoints(focus.points!)} on the prior period.`
            : `, ${formatPercent(1 - steps[focus.index]!.value / (steps[focus.index - 1]!.value || 1))} drop off.`}
        </p>
      )}
      <div className="kit-funnel__total">
        <span>Overall conversion</span>
        <span className="kit-funnel__overall">
          {formatPercent(overall, 2)}
          {prevOverall != null && (
            <span className={`kit-text-${changeTone((overall - prevOverall) * 100)}`}>
              {formatPoints((overall - prevOverall) * 100, 2)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
