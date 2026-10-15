import clsx from "clsx";
import { ArrowDown, ArrowUp } from "lucide-react";
import { forwardRef } from "react";

export type MetricVariant = "horizontal" | "vertical";
export type MetricSize = "sm" | "default" | "large";
export type MetricDeltaTone = "positive" | "negative" | "neutral";

export interface MetricProps {
  value: string;
  delta?: string;
  /** An earlier value shown struck through after the current one (was → now). */
  previous?: string;
  variant?: MetricVariant;
  size?: MetricSize;
  className?: string;
}

/** A leading "+" reads as positive and a leading "-" (or "−") as negative. */
export function getDeltaTone(delta?: string): MetricDeltaTone {
  const first = delta?.trim()[0];
  if (first === "+") return "positive";
  if (first === "-" || first === "−") return "negative";
  return "neutral";
}

/** Up or down arrow for a +/- change, with the sign dropped in favor of it. */
const MetricDelta = ({ delta }: { delta: string }) => {
  const tone = getDeltaTone(delta);
  const Arrow = tone === "positive" ? ArrowUp : tone === "negative" ? ArrowDown : null;
  const text = Arrow ? delta.trim().slice(1).trim() : delta;
  return (
    <span className={clsx("openui-metric__delta", `openui-metric__delta--${tone}`)}>
      {Arrow && <Arrow className="openui-metric__delta-arrow" aria-hidden />}
      {Arrow && <span className="openui-metric__sr">{tone === "positive" ? "up " : "down "}</span>}
      {text}
    </span>
  );
};

/**
 * A standalone value with an optional change. Labels are composed around it
 * (Text, Heading, card titles). Horizontal puts the change beside the value;
 * vertical puts it underneath.
 */
export const Metric = forwardRef<HTMLDivElement, MetricProps>(
  ({ value, delta, previous, variant, size, className }, ref) => (
    <div
      ref={ref}
      className={clsx(
        "openui-metric",
        // `??` rather than parameter defaults: the agent sends null for skipped args.
        `openui-metric--${variant ?? "horizontal"}`,
        `openui-metric--size-${size ?? "default"}`,
        className,
      )}
    >
      <span className="openui-metric__main">
        <span className="openui-metric__value">{value}</span>
        {previous && (
          <s className="openui-metric__previous">
            <span className="openui-metric__sr">was </span>
            {previous}
          </s>
        )}
      </span>
      {delta && <MetricDelta delta={delta} />}
    </div>
  ),
);

Metric.displayName = "Metric";
