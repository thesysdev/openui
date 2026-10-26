"use client";

// WeeklyReview: the weekly business review in the 6-12 shape.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { SixTwelve } from "../../../components/charts/SixTwelve";
import { passed } from "../../../core/schemas";
import { Pending } from "../../../library/Pending";
import type { ReviewMetric } from "./shared";

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
