"use client";

// ReleaseImpact: each launch or rollback, the week before against the week after.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { formatChange, formatPoints } from "../../core/format";
import { passed } from "../../core/schemas";

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
