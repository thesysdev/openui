// Activation moments: which early behaviour, how often and how soon, predicts retention.

import { formatNumber } from "../../core/format";
import { dateLabel, round } from "../../core/sample-data";
import { knee, MAX_REACH, MIN_REACH, score, tableFor } from "../moments";
import { activationCounts } from "./activity";
import { cohort } from "./retention";

/**
 * Early behaviours a new user might do, as the chance of doing one at least
 * `k` times within `w` days of signup, for users who reach the aha moment and
 * for the rest. The aha moment itself (2+ invites in 7 days) is in the list,
 * so the search has a right answer to find.
 */
const BEHAVIOURS: {
  id: string;
  rule: (k: number, w: number) => string;
  did: (k: number, w: number) => { activated: number; rest: number };
}[] = [
  {
    id: "invites",
    rule: (k, w) => `Invited ${k}+ teammate${k === 1 ? "" : "s"} in ${w} days`,
    did: (k, w) => {
      const late = w === 3 ? 0.7 : 1;
      const more = 0.55 ** Math.max(0, k - 2);
      return {
        activated: k <= 2 ? late : late * more,
        rest:
          k === 1 ? (w === 3 ? 0.18 : w === 7 ? 0.3 : 0.38) : w === 14 ? 0.08 * 0.4 ** (k - 2) : 0,
      };
    },
  },
  {
    id: "tasks",
    rule: (k, w) => `Created ${k}+ tasks in ${w} days`,
    did: (k, w) => ({
      activated: Math.exp(-(k - 1) / ((12 * w) / 7)),
      rest: 0.85 * Math.exp(-(k - 1) / ((4 * w) / 7)),
    }),
  },
  {
    id: "comments",
    rule: (k, w) => `Commented ${k}+ times in ${w} days`,
    did: (k, w) => ({
      activated: 0.9 * Math.exp(-(k - 1) / ((5 * w) / 7)),
      rest: 0.5 * Math.exp(-(k - 1) / ((1.5 * w) / 7)),
    }),
  },
  {
    id: "templates",
    rule: (k, w) => `Used ${k}+ template${k === 1 ? "" : "s"} in ${w} days`,
    did: (k, w) => ({
      activated: 0.45 * (w / 7) ** 0.3 * 0.3 ** (k - 1),
      rest: 0.35 * (w / 7) ** 0.3 * 0.3 ** (k - 1),
    }),
  },
  {
    id: "integrations",
    rule: (k, w) => `Connected ${k}+ integration${k === 1 ? "" : "s"} in ${w} days`,
    did: (k, w) => ({
      activated: 0.12 * (w / 7) ** 0.5 * 0.2 ** (k - 1),
      rest: 0.02 * (w / 7) ** 0.5 * 0.2 ** (k - 1),
    }),
  },
  {
    id: "mobile",
    rule: (k, w) => `Opened the mobile app on ${k}+ day${k === 1 ? "" : "s"} in ${w} days`,
    did: (k, w) => ({
      activated: Math.min(1, 0.5 * (w / 7) ** 0.4) * 0.7 ** (k - 1),
      rest: Math.min(1, 0.3 * (w / 7) ** 0.4) * 0.6 ** (k - 1),
    }),
  },
];
const WINDOWS = [3, 7, 14];
const COUNTS = Array.from({ length: 10 }, (_, i) => i + 1);

/**
 * Scores every behaviour × count × window on the users who signed up 5 to 9
 * weeks ago (old enough for week 4), keeps each behaviour's best count and
 * window, and returns the five that best tell retained users apart.
 */
export function activationMoments(platform: string, plan: string) {
  const startAgo = 9 * 7 - 1;
  const counts = activationCounts(platform, plan, 28, 5 * 7);
  const n = counts.signed;
  const share = counts.aha / counts.signed;
  const check = cohort(platform, plan, 5 * 7 - 1);
  const retained = { activated: check.activated[4]!, rest: check.notActivated[4]! };
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const candidates = BEHAVIOURS.flatMap((b) =>
    WINDOWS.map((w) => {
      const scored = COUNTS.map((k) => {
        const did = b.did(k, w);
        const table = tableFor(
          n,
          share,
          { activated: clamp(did.activated), rest: clamp(did.rest) },
          retained,
        );
        return { k, ...score(table) };
      });
      const byCount = scored.map((s) => s.precision);
      const usable = scored.filter((s) => s.reach >= MIN_REACH && s.reach <= MAX_REACH);
      const best = usable.sort((x, y) => y.phi - x.phi)[0];
      return (
        best && {
          behaviour: b.id,
          rule: b.rule(best.k, w),
          count: best.k,
          window: w,
          ...best,
          byCount,
        }
      );
    }),
  ).filter((c): c is NonNullable<typeof c> => !!c);
  // One per behaviour, at its best window, so the list compares behaviours.
  const top = [...candidates]
    .sort((x, y) => y.phi - x.phi)
    .filter((c, i, all) => all.findIndex((x) => x.behaviour === c.behaviour) === i)
    .slice(0, 5);
  const baseline = share * retained.activated + (1 - share) * retained.rest;
  return {
    cohort: `${formatNumber(n)} users who signed up ${dateLabel(startAgo)} – ${dateLabel(5 * 7)}`,
    users: Math.round(n),
    baseline: `${(baseline * 100).toFixed(0)}%`,
    candidates: top.map((c) => ({
      rule: c.rule,
      behaviour: c.behaviour,
      count: c.count,
      window: c.window,
      reach: round(c.reach, 3),
      precision: round(c.precision, 3),
      recall: round(c.recall, 3),
      phi: round(c.phi, 3),
      retentionByCount: c.byCount.map((v) => round(v * 100, 1)),
      knee: knee(c.byCount),
    })),
    note: "Correlation, not cause: confirm the moment with an experiment before building onboarding around it.",
  };
}
