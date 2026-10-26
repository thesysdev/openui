// Monetisation: paywalls, free-to-paid and trial conversion, and usage commits
// (credits per seat and their pacing).

import { formatCurrency, formatNumber } from "../../core/format";
import { between, dateLabel, RANGE_DAYS, round, sum } from "../../core/sample-data";
import type { Range } from "../../core/schemas";
import { pacing } from "../revenue";
import { payingWorkspaces } from "../workspaces";
import { activationCounts } from "./activity";
import { teamReach } from "./retention";
import { metric } from "./shared";

/**
 * Free plan limits: weekly hits and the share of workspaces that upgrade
 * within 14 days of hitting one. Automations converts best but few reach it;
 * version history and AI summaries annoy many and convert few.
 */
const PAYWALLS = [
  { name: "Members: 5 on Free", hits: 1940, rate: 3.1 },
  { name: "AI summaries: 20 a month", hits: 1510, rate: 1.1 },
  { name: "Version history: 7 days", hits: 1260, rate: 0.6 },
  { name: "Timeline view", hits: 880, rate: 2.6 },
  { name: "Integrations: 2 apps", hits: 640, rate: 1.4 },
  { name: "Automations: 3 rules", hits: 410, rate: 4.8 },
  { name: "Guest access", hits: 230, rate: 3.4 },
  { name: "Storage: 2 GB", hits: 150, rate: 0.9 },
  { name: "Dashboards", hits: 120, rate: 1.7 },
];
/** Of team-active workspaces, the share that hit a Free limit (product-qualified), then the shares that pay and expand. */
const MONETISATION = { pql: 0.55, paidOfPql: 0.28, expandedOfPaid: 0.21 };
/** Business trials: the share of new paying workspaces that start one, extend it, and convert once it ends. */
const TRIALS = { startShare: 0.35, extendShare: 0.07, conversion: 0.15 };
const TRIAL_DAYS = 14;
const FREE_TO_PAID_BAND = {
  label: "Freemium self-serve: good 3–5%, great 6–8% (Lenny Rachitsky, Kyle Poyar)",
  from: 3,
  to: 8,
};

export function monetisation(range: Range) {
  const days = RANGE_DAYS[range];
  // Each window's own conversion varies a little, as real weeks do.
  const funnelFor = (offset: number, span = days) => {
    const counts = activationCounts("all", "all", span, offset);
    const created = counts.setup * 0.55;
    const team = created * teamReach(counts);
    const pql = team * MONETISATION.pql;
    const paid = pql * MONETISATION.paidOfPql * between(`paid:${offset}:${span}`, 0.93, 1.07);
    const expanded =
      paid * MONETISATION.expandedOfPaid * between(`expanded:${offset}:${span}`, 0.92, 1.08);
    return { created, team, pql, paid, expanded };
  };
  // Business trials: a share of new paying Team workspaces start one, for 14
  // days. Trials that reached day 14 within the window (started 14 days
  // earlier) either extend or end converted or expired; those started in the
  // 14 days to the window's end are still running (our rules). Measuring
  // outcomes by when trials end keeps every count real for a 7-day window.
  const trialsFor = (offset: number, span = days) => {
    const due = funnelFor(offset + TRIAL_DAYS, span).paid * TRIALS.startShare;
    const trialing = funnelFor(offset, TRIAL_DAYS).paid * TRIALS.startShare;
    const extended = due * TRIALS.extendShare;
    const ended = due - extended;
    const converted = ended * TRIALS.conversion * between(`trial:${offset}:${span}`, 0.9, 1.1);
    return { due, trialing, extended, converted, expired: ended - converted, ended };
  };
  const now = funnelFor(0);
  const then = funnelFor(days);
  const trials = trialsFor(0);
  // The weeks covering the period (at least 4, so there is a trend), each a
  // 28-day window ending that week.
  const count = Math.max(4, Math.ceil(days / 7));
  const weeks = Array.from({ length: count }, (_, k) => (count - 1 - k) * 7);
  // Free to paid for workspaces created in the 28 days before each week's 90-day wait.
  const freeToPaidAt = (ago: number) => {
    const f = funnelFor(ago + 90, 28);
    return (f.paid / f.created) * 100;
  };
  const freeToPaid = weeks.map(freeToPaidAt);
  const steps = [
    { label: "New workspaces", value: now.created, previous: then.created },
    { label: "Team active: 3+ members", value: now.team, previous: then.team },
    { label: "Product-qualified: hit a Free limit", value: now.pql, previous: then.pql },
    { label: "Paying within 90 days", value: now.paid, previous: then.paid },
    { label: "Expanded within 90 days", value: now.expanded, previous: then.expanded },
  ].map((s) => ({ ...s, value: Math.round(s.value), previous: Math.round(s.previous) }));
  const pct = (v: number) => `${v.toFixed(1)}%`;
  const trialRate = (t: ReturnType<typeof trialsFor>) => (t.converted / t.ended) * 100;
  return {
    metrics: [
      metric("free_to_paid", freeToPaid[count - 1]!, freeToPaidAt(Math.round(days / 7) * 7), pct, {
        series: freeToPaid,
        hint: FREE_TO_PAID_BAND.label,
      }),
      metric("pqls", now.pql, then.pql, formatNumber, {
        series: weeks.map((ago) => funnelFor(ago, 28).pql),
      }),
      metric("trial_conversion", trialRate(trials), trialRate(trialsFor(days)), pct, {
        series: weeks.map((ago) => trialRate(trialsFor(ago, 28))),
        hint: "Free trial: good 8–12%, great 15–25%",
      }),
      metric(
        "expanded_90d",
        (now.expanded / now.paid) * 100,
        (then.expanded / then.paid) * 100,
        pct,
        {
          series: weeks.map((ago) => {
            const f = funnelFor(ago, 28);
            return (f.expanded / f.paid) * 100;
          }),
        },
      ),
    ],
    funnel: steps,
    trials: [
      { name: "Converted", value: Math.round(trials.converted) },
      { name: "Expired", value: Math.round(trials.expired) },
      { name: "Still in trial", value: Math.round(trials.trialing) },
      { name: "Extended", value: Math.round(trials.extended) },
    ],
    paywalls: PAYWALLS.map((p) => ({
      name: p.name,
      hits: Math.round(p.hits * between(`pw:${p.name}:${range}`, 0.94, 1.06)),
      upgradeRate: round(p.rate * between(`pr:${p.name}:${range}`, 0.95, 1.05), 1),
    })),
    labels: weeks.map((ago) => dateLabel(ago + 6)),
    freeToPaid: freeToPaid.map((v) => round(v, 2)),
    band: FREE_TO_PAID_BAND,
  };
}

/** Credits a seat commits to a year, and what a credit costs. */
const CREDITS_PER_SEAT = 1_000;
const CREDIT_PRICE = 0.02;

/** Every Business workspace's AI credit commit, built once. */
let commitCache: ReturnType<typeof buildCommits> | undefined;
const allCommits = () => (commitCache ??= buildCommits());

export function usageCommits() {
  const commits = allCommits().filter((c) => c.elapsed >= 8);
  return commitSummary(commits);
}

function buildCommits() {
  // About two thirds of Business workspaces commit to AI credits; the named ones all do.
  const business = payingWorkspaces().filter(
    (w) =>
      w.plan === "Business" &&
      (w.id.startsWith("named") || between(`commit:${w.name}`, 0, 1) < 0.66),
  );
  const shares = business.map((w) => w.active28 / w.seats).sort((a, b) => a - b);
  const typical = shares[Math.floor(shares.length / 2)]!;
  const commits = business.map((w) => {
    const committed = w.seats * CREDITS_PER_SEAT;
    const elapsed = (365 - w.renewalInDays) / 365;
    // AI use follows how much of the workspace is active against a typical
    // Business workspace, with its own noise.
    const pace =
      // Credit use strays half as far from typical as seat activity does.
      Math.max(0.3, Math.min(1.7, 0.5 + 0.5 * (w.active28 / w.seats / typical))) *
      between(`credits:${w.name}`, 0.9, 1.1) *
      (w.name === "Brightline Health" ? 0.62 : 1);
    const used = committed * elapsed * pace;
    const p = pacing(used, committed, elapsed);
    // A month ago the workspace ran at a slightly different pace.
    const paceBefore = pace * between(`credits-before:${w.name}`, 0.92, 1.08);
    const elapsedBefore = Math.max(0, elapsed - 30 / 365);
    const before = pacing(committed * elapsedBefore * paceBefore, committed, elapsedBefore);
    const months = Math.max(1, Math.round(elapsed * 12));
    // Use bends toward the recent pace: steeper lately if it sped up.
    const bend = pace / paceBefore;
    return {
      name: w.name,
      committed: Math.round(committed),
      used: Math.round(used),
      elapsed: round(elapsed * 100, 0),
      pace: round(p.pace * 100, 0),
      projected: Math.round(p.projected),
      status: p.status,
      renewalInDays: w.renewalInDays,
      value: Math.round(committed * CREDIT_PRICE),
      burn: Array.from({ length: months }, (_, m) => Math.round(used * ((m + 1) / months) ** bend)),
      statusBefore: before.status,
      expectedBefore: committed * elapsedBefore,
      usedBefore: committed * elapsedBefore * paceBefore,
    };
  });
  return commits;
}

function commitSummary(commits: ReturnType<typeof buildCommits>) {
  const under = commits.filter((c) => c.status === "under");
  const over = commits.filter((c) => c.status === "over");
  const unused = (c: (typeof commits)[number]) =>
    Math.max(0, c.committed - c.projected) * CREDIT_PRICE;
  const extra = (c: (typeof commits)[number]) =>
    Math.max(0, c.projected - c.committed) * CREDIT_PRICE;
  const shelfware = sum(under.map(unused));
  const overage = sum(over.map(extra));
  const totalUsed = sum(commits.map((c) => c.used));
  const expected = sum(commits.map((c) => (c.committed * c.elapsed) / 100));
  const paceBefore =
    (sum(commits.map((c) => c.usedBefore)) / sum(commits.map((c) => c.expectedBefore))) * 100;
  const countBefore = (status: string) => commits.filter((c) => c.statusBefore === status).length;
  return {
    metrics: [
      metric("credit_pacing", (totalUsed / expected) * 100, paceBefore, (v) => `${v.toFixed(0)}%`, {
        hint: `${commits.length} Business commits`,
      }),
      metric("commits_under", under.length, countBefore("under"), formatNumber, {
        hint: `${formatCurrency(shelfware)} of credits likely unused at renewal`,
      }),
      metric("commits_over", over.length, countBefore("over"), formatNumber, {
        hint: `${formatCurrency(overage)} of overage or upgrade by renewal`,
      }),
    ],
    // Under-pacing renewing soonest first, two weeks out or more so customer
    // success can still help,
    // then the largest overages (an upgrade conversation), then the largest on track.
    commits: [
      ...under
        .filter((c) => c.renewalInDays >= 14)
        .sort((a, b) => a.renewalInDays - b.renewalInDays)
        .slice(0, 6),
      ...[...over].sort((a, b) => extra(b) - extra(a)).slice(0, 3),
      ...commits
        .filter((c) => c.status === "on_track")
        .sort((a, b) => b.value - a.value)
        .slice(0, 3),
    ].map(({ statusBefore: _s, expectedBefore: _e, usedBefore: _u, ...c }) => c),
  };
}
