"use client";

// ActivationMoments: candidate aha moments with reach, precision, recall, and the knee.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { passed } from "../../core/schemas";

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
