// Experiments: the running and finished tests and their scorecards.

import { round, sum } from "../../core/sample-data";
import { guardrailLight, liftOf, sampleRatio } from "../experiments";

interface ExperimentSpec {
  name: string;
  hypothesis: string;
  metric: string;
  daysRunning: number;
  /** Finished experiments carry what was done. */
  done?: { status: "won" | "lost"; decision: string };
  planned: number[];
  arms: { name: string; users: number; conversions: number }[];
  guardrails: {
    name: string;
    lift: number;
    low: number;
    high: number;
    allowed: number;
    higherIsBad: boolean;
  }[];
}

export const EXPERIMENTS: ExperimentSpec[] = [
  {
    name: "Onboarding checklist v2",
    hypothesis: "A four-step checklist that ends with inviting a teammate raises activation.",
    metric: "Activation: aha within 7 days of setup",
    daysRunning: 28,
    done: { status: "won", decision: "Shipped to everyone on Sep 22." },
    planned: [0.5, 0.5],
    arms: [
      { name: "Control", users: 12410, conversions: 3872 },
      { name: "Checklist v2", users: 12388, conversions: 4286 },
    ],
    guardrails: [
      {
        name: "Week-2 retention",
        lift: 0.012,
        low: -0.004,
        high: 0.028,
        allowed: 0.01,
        higherIsBad: false,
      },
      {
        name: "Support tickets per 1K users",
        lift: -0.03,
        low: -0.09,
        high: 0.03,
        allowed: 0.05,
        higherIsBad: true,
      },
    ],
  },
  {
    name: "Mobile quick-capture widget",
    hypothesis: "A home-screen widget for adding tasks makes mobile users return more often.",
    metric: "Mobile weekly active rate",
    daysRunning: 21,
    done: {
      status: "lost",
      decision: "Rolled back: widget users added tasks but opened the app less.",
    },
    planned: [0.5, 0.5],
    arms: [
      { name: "Control", users: 6020, conversions: 3148 },
      { name: "Widget", users: 5987, conversions: 2999 },
    ],
    guardrails: [
      {
        name: "App crash rate",
        lift: 0.01,
        low: -0.04,
        high: 0.06,
        allowed: 0.1,
        higherIsBad: true,
      },
    ],
  },
  {
    name: "AI summaries on by default",
    hypothesis:
      "Showing AI summaries without opt-in, with or without a daily digest email, improves week-2 retention.",
    metric: "Week-2 retention",
    daysRunning: 24,
    planned: [1 / 3, 1 / 3, 1 / 3],
    arms: [
      { name: "Control", users: 9104, conversions: 3733 },
      { name: "On by default", users: 9087, conversions: 3671 },
      { name: "On + digest email", users: 9122, conversions: 3840 },
    ],
    guardrails: [
      {
        name: "Email unsubscribes (digest arm)",
        lift: 0.18,
        low: 0.05,
        high: 0.31,
        allowed: 0.1,
        higherIsBad: true,
      },
      {
        name: "AI cost per active user",
        lift: 0.06,
        low: 0.03,
        high: 0.09,
        allowed: 0.15,
        higherIsBad: true,
      },
    ],
  },
  {
    name: "Annual plan as default on upgrade",
    hypothesis:
      "Preselecting annual billing on the upgrade page raises paid conversion without hurting it.",
    metric: "Upgrade to paid within 14 days",
    daysRunning: 12,
    planned: [0.5, 0.5],
    arms: [
      { name: "Control", users: 4120, conversions: 128 },
      { name: "Annual default", users: 4096, conversions: 136 },
    ],
    guardrails: [
      {
        name: "Refund requests",
        lift: 0.04,
        low: -0.2,
        high: 0.28,
        allowed: 0.25,
        higherIsBad: true,
      },
    ],
  },
  {
    name: "Pricing page redesign",
    hypothesis: "A simpler pricing page with a plan comparison table lifts trial starts.",
    metric: "Trial started from the pricing page",
    daysRunning: 9,
    planned: [0.5, 0.5],
    arms: [
      { name: "Control", users: 10840, conversions: 477 },
      { name: "Redesign", users: 10008, conversions: 490 },
    ],
    guardrails: [
      {
        name: "Page load, 75th percentile",
        lift: 0.02,
        low: -0.01,
        high: 0.05,
        allowed: 0.1,
        higherIsBad: true,
      },
    ],
  },
];

/**
 * An experiment's scorecard, all from its counts: each arm's rate, lift, and
 * interval; whether traffic split as planned; guardrail lights; whether it is
 * too early or ready to decide; and a recommendation (our rule): fix the
 * split first, ship a clear winner with green guardrails, don't ship a clear
 * loser, extend when unclear and under two weeks, otherwise discuss.
 */
export function scorecard(e: ExperimentSpec) {
  const [control, ...treatments] = e.arms;
  const lifts = treatments.map((t) => liftOf(control!, t));
  const srm = sampleRatio(
    e.arms.map((a) => a.users),
    e.planned,
  );
  const total = sum(e.arms.map((a) => a.users));
  const guardrails = e.guardrails.map((g) => ({
    name: g.name,
    change: round(g.lift * 100, 1),
    ciLow: round(g.low * 100, 1),
    ciHigh: round(g.high * 100, 1),
    // Signed in the bad direction: −1% for a metric that should not fall.
    allowed: round((g.higherIsBad ? 1 : -1) * g.allowed * 100, 1),
    light: guardrailLight(g, g.allowed, g.higherIsBad),
  }));
  const best = lifts.reduce((a, b) => (b.lift > a.lift ? b : a));
  const significant = best.p < 0.05;
  const red = guardrails.some((g) => g.light === "red");
  const recommendation = e.done
    ? ("done" as const)
    : !srm.ok
      ? ("fix_split" as const)
      : significant && best.low > 0 && !red
        ? ("ship" as const)
        : significant && best.high < 0
          ? ("dont_ship" as const)
          : red
            ? ("discuss" as const)
            : e.daysRunning < 14
              ? ("extend" as const)
              : ("discuss" as const);
  const split = e.arms.map((a) => Math.round((a.users / total) * 100)).join("/");
  const decision = {
    done: e.done?.decision ?? "",
    fix_split: `Don't read this yet: traffic split ${split} against a planned ${e.planned.map((p) => Math.round(p * 100)).join("/")} (p < 0.001). Check how users are assigned.`,
    ship: "Ship it: a clear lift with every guardrail inside its limit.",
    dont_ship: "Don't ship: a clear drop.",
    discuss: red
      ? `Discuss before shipping: ${guardrails.find((g) => g.light === "red")!.name} is past its limit.`
      : "Discuss: no clear winner after two weeks.",
    extend: `Keep running: no clear result after ${e.daysRunning} days.`,
  }[recommendation];
  return {
    name: e.name,
    hypothesis: e.hypothesis,
    metric: e.metric,
    status: e.done
      ? e.done.status
      : significant && best.lift > 0 && !red && srm.ok
        ? ("won" as const)
        : ("running" as const),
    daysRunning: e.daysRunning,
    variants: e.arms.map((a, k) => {
      const l = k === 0 ? undefined : lifts[k - 1]!;
      return {
        name: a.name,
        users: a.users,
        conversion: round((a.conversions / a.users) * 100, 2),
        ...(l
          ? {
              lift: round(l.lift * 100, 1),
              ciLow: round(l.low * 100, 1),
              ciHigh: round(l.high * 100, 1),
              significance: round(1 - l.p, 3),
            }
          : {}),
      };
    }),
    split: {
      observed: split,
      planned: e.planned.map((p) => Math.round(p * 100)).join("/"),
      p: round(srm.p, 4),
      ok: srm.ok,
    },
    guardrails,
    tooEarly: e.daysRunning < 1,
    ready: e.daysRunning >= 7 && srm.ok,
    recommendation,
    decision,
  };
}
