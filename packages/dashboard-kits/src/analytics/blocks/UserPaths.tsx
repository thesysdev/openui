"use client";

// UserPaths: the most common paths after a start event and how each ended.

import { defineComponent } from "@openuidev/react-lang";
import { Fragment } from "react";
import { z } from "zod/v4";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { formatNumber } from "../../core/format";
import { passed } from "../../core/schemas";
import type { UserPath } from "./shared";

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
