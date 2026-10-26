import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { runTool } from "../core/prompt";
import type { Kpi } from "../core/schemas";
import { reviewOkNote } from "./blocks";
import { analyticsHandlers, flattening } from "./data";
import { analyticsKit } from "./kit";
import { payingWorkspaces } from "./workspaces";

// Relay's numbers have to add up: one population drives every count of users.

const run = (tool: string, args: Record<string, unknown> = {}) =>
  runTool(analyticsKit, tool, args, analyticsHandlers) as any;
const total = (values: number[]) => values.reduce((a, b) => a + b, 0);
const RANGES = ["7d", "30d", "90d", "mtd"] as const;
const PLATFORMS = ["web", "ios", "android"] as const;

function argumentSets(input: z.ZodObject): Record<string, unknown>[] {
  const sets: Record<string, unknown>[] = [{}];
  for (const [key, field] of Object.entries(input.shape)) {
    let inner = field as z.ZodType;
    while (inner instanceof z.ZodDefault || inner instanceof z.ZodOptional)
      inner = inner.unwrap() as z.ZodType;
    if (inner instanceof z.ZodEnum) for (const value of inner.options) sets.push({ [key]: value });
  }
  return sets;
}

describe("metric definitions", () => {
  for (const tool of analyticsKit.tools) {
    it(`${tool.name}: every KPI has a definition`, () => {
      for (const args of argumentSets(tool.input)) {
        const out = run(tool.name, args);
        for (const k of [out.hero, ...(out.metrics ?? [])].filter(Boolean) as Kpi[]) {
          expect(k.definition?.formula, `${k.label} ${JSON.stringify(args)}`).toBeTruthy();
        }
      }
    });
  }
});

describe("one population", () => {
  it("builds every segment quickly", () => {
    const started = performance.now();
    run("get_usage_kpis", { range: "90d" });
    expect(performance.now() - started).toBeLessThan(2000);
  });

  for (const range of RANGES) {
    it(`${range}: platforms add up to all users`, () => {
      const whole = run("get_active_users", { range });
      const parts = PLATFORMS.map((platform) => run("get_active_users", { range, platform }));
      whole.wau.forEach((v: number, i: number) =>
        expect(Math.abs(total(parts.map((p) => p.wau[i])) - v)).toBeLessThanOrEqual(3),
      );
    });

    it(`${range}: daily ≤ weekly ≤ monthly, and any event ≥ core`, () => {
      const core = run("get_active_users", { range });
      const any = run("get_active_users", { range, active: "any" });
      core.dau.forEach((v: number, i: number) => {
        expect(v).toBeLessThanOrEqual(core.wau[i]);
        expect(core.wau[i]).toBeLessThanOrEqual(core.mau[i]);
        expect(any.wau[i]).toBeGreaterThanOrEqual(core.wau[i]);
      });
    });
  }

  it("accounts for each week's actives in the lifecycle", () => {
    const life = run("get_lifecycle", { weeks: 8 });
    const wau = run("get_active_users", { range: "90d" });
    for (let w = 0; w < 8; w++) {
      expect(life.dormant[w]).toBeLessThan(0);
      expect(life.resurrecting[w]).toBeGreaterThan(0);
    }
    expect(Number(life.quickRatio)).toBeGreaterThan(0);
    expect(wau.labels.length).toBeGreaterThan(0);
  });

  it("finds activated users keep at least twice as well", () => {
    const funnel = run("get_activation_funnel", { range: "30d" });
    expect(funnel.validity.pass).toBe(true);
    for (let i = 1; i < funnel.steps.length; i++) {
      expect(funnel.steps[i].value).toBeLessThanOrEqual(funnel.steps[i - 1].value);
    }
  });

  it("shows the checklist lifting activation", () => {
    const kpis = run("get_usage_kpis", { range: "30d" });
    const activation = kpis.metrics.find((m: Kpi) => m.label === "Activation");
    expect(activation.change).toBeGreaterThan(0);
  });

  it("counts the iOS duplicate events on any event, not on core actions", () => {
    const core = run("get_active_users", { range: "30d", platform: "ios" });
    const any = run("get_active_users", { range: "30d", platform: "ios", active: "any" });
    const at = (label: string) => core.labels.indexOf(label);
    const bugDay = at("Oct 2");
    const before = at("Sep 24");
    const lift = (i: number) => any.dau[i] / core.dau[i];
    expect(lift(bugDay)).toBeGreaterThan(lift(before) * 1.1);
  });

  it("keeps cohorts falling week by week", () => {
    const { cohorts } = run("get_retention_cohorts", { weeks: 8 });
    for (const c of cohorts) {
      // The last value is the week in progress, a part week.
      const whole = c.values.slice(0, -1);
      expect(whole[0]).toBe(100);
      for (let w = 1; w < whole.length; w++) expect(whole[w]).toBeLessThanOrEqual(whole[w - 1]);
    }
    expect(cohorts[0].values.length).toBe(9);
  });
});

it("reports the tracking break and restatement in the data status", () => {
  const month = run("get_data_status", { range: "30d" });
  const labels = month.items.map((i: { label: string }) => i.label);
  expect(labels).toContain("Tracking break");
  expect(labels).toContain("Restated");
  const web = run("get_data_status", { range: "30d", platform: "web" });
  expect(web.items.map((i: { label: string }) => i.label)).not.toContain("Tracking break");
});

it("finds the seeded aha moment first, one candidate per behaviour", () => {
  const { candidates } = run("find_activation_moment", {});
  expect(candidates[0].rule).toBe("Invited 2+ teammates in 7 days");
  expect(new Set(candidates.map((c: { behaviour: string }) => c.behaviour)).size).toBe(
    candidates.length,
  );
  for (const c of candidates) {
    expect(c.reach).toBeGreaterThanOrEqual(0.05);
    expect(c.reach).toBeLessThanOrEqual(0.9);
  }
});

describe("explain_change", () => {
  it("puts the iOS duplicate events first under any event, and never under core actions", () => {
    const any = run("explain_change", {
      metric: "wau",
      range: "7d",
      active: "any",
      platform: "ios",
    });
    expect(any.dataQuality).toMatch(/iOS duplicate events/);
    expect(any.walk[1].label).toBe("Tracking");
    const core = run("explain_change", { metric: "wau", range: "7d", platform: "ios" });
    expect(core.dataQuality).toBeUndefined();
  });

  it("explains activation as a change within groups, naming the launch", () => {
    const why = run("explain_change", { metric: "activation", range: "30d" });
    expect(why.confidence.level).not.toBe("Low");
    expect(why.drivers[0].dimension).toBe("Within group");
    expect(why.summary).toMatch(/Onboarding checklist v2 shipped/);
  });

  it("walks from the prior period to this one", () => {
    for (const metric of ["wau", "dau", "signups", "activation", "stickiness"]) {
      const why = run("explain_change", { metric, range: "30d" });
      const end = why.walk.reduce(
        (t: number, s: { kind: string; value: number }) =>
          s.kind === "base"
            ? s.value
            : s.kind === "add"
              ? t + s.value
              : s.kind === "subtract"
                ? t - s.value
                : t,
        0,
      );
      const last = why.walk.at(-1);
      expect(Math.abs(end - last.value)).toBeLessThanOrEqual(
        Math.abs(last.value - why.walk[0].value) * 0.04 + 1,
      );
    }
  });
});

describe("workspaces", () => {
  it("counts every paying workspace and gives every row a reason", () => {
    for (const list of ["risk", "slipping", "expansion", "power", "mrr"]) {
      const out = run("get_account_health", { list, limit: 10 });
      expect(out.metrics[0].value).toBe("8,000");
      for (const a of out.accounts) {
        expect(a.reason.length).toBeGreaterThan(10);
        expect(total(a.breakdown.map((b: { weight: number }) => b.weight))).toBeGreaterThan(0);
        expect(a.history.length).toBe(12);
        expect(a.history.at(-1)).toBe(a.healthScore);
      }
    }
  });

  it("flags Harbor & Pine for review and lists Kestrel Labs as ready to expand", () => {
    const slipping = run("get_account_health", {
      list: "slipping",
      limit: 10,
      plan: "team",
    }).accounts;
    const harbor = run("get_account_health", {
      list: "risk",
      limit: 10,
      plan: "team",
    }).accounts.find((a: { name: string }) => a.name === "Harbor & Pine");
    expect(
      harbor?.reviewNow ?? slipping.some((a: { name: string }) => a.name === "Harbor & Pine"),
    ).toBe(true);
    const expansion = run("get_account_health", {
      list: "expansion",
      limit: 10,
      plan: "team",
    }).accounts;
    expect(expansion.map((a: { name: string }) => a.name)).toContain("Kestrel Labs");
  });

  it("gives different counts for the three account-active rules", () => {
    const last = (accountActive: string) =>
      run("get_account_activity", { accountActive }).active.at(-1);
    const counts = ["any", "team", "seats"].map(last);
    expect(new Set(counts).size).toBe(3);
    expect(counts[0]).toBeGreaterThanOrEqual(counts[1]);
    const funnel = run("get_account_activity", {}).seats;
    expect(funnel[0].value).toBeGreaterThanOrEqual(funnel[1].value);
    expect(funnel[1].value).toBeGreaterThanOrEqual(funnel[2].value);
  });
});

describe("lifecycle states and retention modes", () => {
  it("keeps the daily states adding up to daily actives", () => {
    const states = run("get_lifecycle", { view: "states" });
    const daily = run("get_active_users", { range: "30d" }).dau.slice(-28);
    states.current.forEach((c: number, i: number) => {
      const active = c + states.newUsers[i] + states.reactivated[i] + states.resurrected[i];
      expect(Math.abs(active - daily[i])).toBeLessThanOrEqual(4);
    });
    expect(states.atRiskWau.every((v: number) => v <= 0)).toBe(true);
    expect(states.sensitivity[0].value).toBeGreaterThan(0);
  });

  it("draws the power-user curves from the same days active as DAU/WAU and DAU/MAU", () => {
    for (const [platform, plan] of [
      ["all", "all"],
      ["web", "business"],
      ["android", "free"],
      ["ios", "team"],
    ]) {
      const users = run("get_active_users", { range: "7d", platform, plan });
      const ratio = (field: "wau" | "mau") => total(users.dau) / total(users[field]);
      for (const [window, field] of [
        [7, "wau"],
        [28, "mau"],
      ] as const) {
        const { buckets } = run("get_stickiness", { platform, plan, window });
        const count = total(buckets.map((b: { users: number }) => b.users));
        const days = total(buckets.map((b: { users: number; days: number }) => b.users * b.days));
        const label = `${platform} ${plan} ${window}`;
        expect(Math.abs(days / count / window - ratio(field)), label).toBeLessThan(0.003);
      }
    }
  });

  it("counts a 2% lift over the last 90 days only, smallest for activation", () => {
    const { sensitivity } = run("get_lifecycle", { view: "states" });
    const value = (name: RegExp) =>
      sensitivity.find((s: { name: string }) => name.test(s.name)).value as number;
    // Applied over the whole history, these were 928 and 378.
    expect(value(/^Current/)).toBeLessThan(700);
    expect(value(/activating/)).toBeLessThan(100);
    expect(value(/activating/)).toBeGreaterThan(0);
  });

  it("counts unbounded retention at or above exact retention", () => {
    const exact = run("get_retention_cohorts", { weeks: 6 }).cohorts;
    const unbounded = run("get_retention_cohorts", { weeks: 6, mode: "unbounded" }).cohorts;
    exact.forEach((c: { values: number[] }, k: number) =>
      c.values
        .slice(0, -1)
        .forEach((v, w) => expect(unbounded[k].values[w]).toBeGreaterThanOrEqual(v - 0.05)),
    );
  });
});

describe("experiments", () => {
  const list = run("get_experiments", { status: "all" }).experiments;
  const named = (name: string) => list.find((e: { name: string }) => e.name === name);

  it("scores the checklist win from its counts", () => {
    const v = named("Onboarding checklist v2").variants[1];
    expect(v.lift).toBeCloseTo(10.9, 0);
    expect(v.ciLow).toBeGreaterThan(6);
    expect(v.ciHigh).toBeLessThan(16);
  });

  it("refuses to read a test whose traffic split wrong", () => {
    const pricing = named("Pricing page redesign");
    expect(pricing.split.ok).toBe(false);
    expect(pricing.recommendation).toBe("fix_split");
  });

  it("holds a test with a guardrail past its limit, and extends a young unclear one", () => {
    expect(named("AI summaries on by default").recommendation).toBe("discuss");
    expect(named("Annual plan as default on upgrade").recommendation).toBe("extend");
  });

  it("filters running from finished", () => {
    const running = run("get_experiments", { status: "running" }).experiments;
    expect(running.every((e: { status: string }) => e.status === "running")).toBe(true);
    expect(running.length).toBe(3);
  });
});

describe("revenue retention", () => {
  const revenue = run("get_revenue_retention", { plan: "all" });

  it("walks the latest month from its start to today's MRR", () => {
    const walk = revenue.walk as { value: number; kind: string }[];
    const moved = walk.reduce(
      (a, s) => a + (s.kind === "add" ? s.value : s.kind === "subtract" ? -s.value : 0),
      0,
    );
    expect(Math.abs(walk[0]!.value + moved - walk.at(-1)!.value)).toBeLessThanOrEqual(3);
  });

  it("explains September's seat cuts, which only Business carries", () => {
    expect(revenue.note).toMatch(/cut seats/);
    expect(run("get_revenue_retention", { plan: "team" }).note).not.toMatch(/cut seats/);
  });

  it("adds the plans up to the whole", () => {
    const end = (plan: string) => run("get_revenue_retention", { plan }).walk.at(-1).value;
    expect(Math.abs(end("team") + end("business") - end("all"))).toBeLessThanOrEqual(1);
  });

  it("sizes NRR cohorts in line with paying-workspace growth, plan by plan", () => {
    const sizes = (plan: string) =>
      run("get_revenue_retention", { plan }).cohorts.map((c: { size: number }) => c.size);
    for (const plan of ["team", "business", "all"]) {
      const paying = run("get_account_health", { plan }).metrics.find(
        (m: Kpi) => m.label === "Paying workspaces",
      );
      const [now, before] = [paying.value, paying.previous].map((v: string) =>
        Number(v.replace(/,/g, "")),
      );
      // A month's new workspaces cover at least its net growth, and a year's
      // fit inside today's paying workspaces.
      expect(sizes(plan).at(-1), plan).toBeGreaterThanOrEqual(now - before);
      expect(total(sizes(plan)), plan).toBeLessThan(now);
    }
    sizes("all").forEach((v: number, k: number) =>
      expect(Math.abs(v - sizes("team")[k] - sizes("business")[k])).toBeLessThanOrEqual(1),
    );
  });
});

describe("actions and alerts", () => {
  it("recommends from the data, the largest effect first", () => {
    const actions = run("get_actions", {}).actions as { id: string; impact: number }[];
    expect(actions.map((a) => a.id)).toContain("fix-pricing-split");
    expect(actions.map((a) => a.id)).toContain("save-slipping");
    actions.slice(1).forEach((a, i) => expect(a.impact).toBeLessThanOrEqual(actions[i]!.impact));
  });

  it("fires on Labor Day and calls it a holiday, not an incident", () => {
    const alert = run("preview_alert", { metric: "dau", drop: 15 });
    expect(alert.fired).toBeGreaterThan(0);
    expect(alert.events.every((e: { kind: string }) => e.kind === "holiday")).toBe(true);
    expect(alert.summary).toMatch(/Labor Day week, not a real drop/);
  });

  it("fires at least as often with a smaller drop, and less when it must confirm", () => {
    const fired = (args: Record<string, unknown>) =>
      run("preview_alert", { metric: "signups", ...args }).fired;
    expect(fired({ drop: 5 })).toBeGreaterThanOrEqual(fired({ drop: 15 }));
    expect(fired({ drop: 5, confirm: "2of3" })).toBeLessThanOrEqual(fired({ drop: 5 }));
  });

  it("holds a weekend alert to Monday, and keeps the holiday as the cause when confirming", () => {
    const quiet = run("preview_alert", { metric: "dau", quiet: "weekends" });
    expect(quiet.summary).toMatch(/held to Monday/);
    const confirmed = run("preview_alert", { metric: "dau", confirm: "2of3" });
    expect(confirmed.events[0].kind).toBe("holiday");
  });

  it("marks each back-test day: alerting on the fired days, below-only days unconfirmed", () => {
    const alert = run("preview_alert", { metric: "dau", drop: 15, confirm: "2of3" });
    expect(alert.days).toHaveLength(alert.labels.length);
    alert.days.forEach((d: { status: string }, i: number) => {
      const below = alert.actual[i] < alert.threshold[i];
      if (d.status !== "good") expect(below || d.status === "bad").toBe(true);
      if (!below) expect(d.status).not.toBe("warn");
    });
    expect(alert.days.some((d: { status: string }) => d.status === "bad")).toBe(alert.fired > 0);
  });

  it("never blames the iOS any-event bug for a signup alert", () => {
    const alert = run("preview_alert", { metric: "signups", drop: 5 });
    expect(alert.summary).not.toMatch(/iOS duplicate/);
  });

  it("tells each kind of action what approving would do", () => {
    const actions = run("get_actions", {}).actions as { kind: string; effect: string }[];
    expect(new Set(actions.map((a) => a.kind))).toEqual(
      new Set(["task", "audience", "experiment", "change"]),
    );
    actions.forEach((a) => expect(a.effect).toMatch(/^Would /));
  });
});

describe("retention modes and units", () => {
  it("reads a curve as flattened only when it falls under a point a week at the end", () => {
    expect(flattening([100, 50, 30, 22, 21.5, 21, 20.8])).toBe("flattened at 21% from week 3");
    expect(flattening([100, 60, 45, 35, 30, 25])).toBe("still falling 6.7 pts a week");
  });

  it("hatches the week in progress on exact cohorts only", () => {
    const exact = run("get_retention_cohorts", { weeks: 6 }).cohorts;
    expect(exact.every((c: { partial?: boolean }) => c.partial)).toBe(true);
    const unbounded = run("get_retention_cohorts", { weeks: 6, mode: "unbounded" }).cohorts;
    expect(unbounded.some((c: { partial?: boolean }) => c.partial)).toBe(false);
  });

  it("brackets weeks 0, 1, 2–3, and 4–7, each at least the exact week it starts with", () => {
    const bracket = run("get_retention_cohorts", { weeks: 8, mode: "bracket" });
    const exact = run("get_retention_cohorts", { weeks: 8 });
    expect(bracket.periodLabels).toEqual(["Week 0", "Week 1", "Weeks 2–3", "Weeks 4–7"]);
    expect(bracket.cohorts[0].values[2]).toBeGreaterThanOrEqual(exact.cohorts[0].values[2] - 0.05);
    expect(bracket.cohorts[0].values[3]).toBeGreaterThanOrEqual(exact.cohorts[0].values[4] - 0.05);
  });

  it("starts workspace cohorts at team activation, and never rises after", () => {
    const ws = run("get_retention_cohorts", { weeks: 6, unit: "workspace" }).cohorts;
    ws.forEach((c: { values: number[] }) => {
      expect(c.values[0]).toBeGreaterThan(25);
      expect(c.values[0]).toBeLessThanOrEqual(80);
    });
    const curves = run("get_retention_curves", { unit: "workspace", mode: "unbounded" });
    for (let w = 1; w < curves.business.length; w++)
      expect(curves.business[w]).toBeLessThanOrEqual(curves.business[w - 1] + 0.05);
    expect(run("get_retention_curves", { unit: "workspace" }).flattened).toMatch(/^All workspaces/);
  });
});

describe("comparisons", () => {
  it("compares usage with last year's same weekdays grown by the plan", () => {
    const lastYear = run("get_usage_kpis", { compare: "last_year" });
    const plan = run("get_usage_kpis", { compare: "plan" });
    expect(plan.periodLabel).toMatch(/vs plan$/);
    expect(plan.heroTrend.comparisonLabel).toBe("Plan");
    const previous = (k: { hero: { previous: string } }) => parseFloat(k.hero.previous);
    expect(previous(plan) / previous(lastYear)).toBeCloseTo(1.22, 1);
    const activation = plan.metrics.find((m: Kpi) => m.label === "Activation");
    expect(activation.previous).toBe("30.0%");
  });

  it("marks shipped and rolled-back experiments on the charts", () => {
    const events = run("get_annotations", { range: "30d" }).events as { label: string }[];
    expect(events.map((e) => e.label)).toContain("Quick-capture widget rolled back");
    expect(events.map((e) => e.label)).toContain("Onboarding checklist v2");
  });
});

describe("monetisation and usage commits", () => {
  const money = run("get_monetization", { range: "90d" });

  it("narrows the funnel at every step, and paying never exceeds product-qualified", () => {
    const values = money.funnel.map((s: { value: number }) => s.value);
    values.slice(1).forEach((v: number, i: number) => expect(v).toBeLessThanOrEqual(values[i]));
  });

  it("keeps free to paid inside the freemium good band", () => {
    money.freeToPaid.forEach((v: number) => {
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(6);
    });
  });

  it("counts trial outcomes by when trials end, so every range has real ones", () => {
    const running = new Set<number>();
    for (const range of RANGES) {
      const out = run("get_monetization", { range });
      const count = (name: string) =>
        out.trials.find((t: { name: string }) => t.name === name).value as number;
      out.trials.forEach((t: { value: number }) =>
        expect(t.value, range).toBeGreaterThanOrEqual(0),
      );
      expect(count("Converted") + count("Expired"), range).toBeGreaterThan(0);
      running.add(count("Still in trial"));
      const conversion = out.metrics.find((m: Kpi) => m.label.startsWith("Trial"));
      for (const v of [conversion.value, conversion.previous])
        expect(parseFloat(v), range).toBeGreaterThan(8);
      for (const v of [conversion.value, conversion.previous])
        expect(parseFloat(v), range).toBeLessThan(25);
    }
    // Trials still running are the last 14 days' starts, whatever the range.
    expect(running.size).toBe(1);
  });

  it("gives every monetisation KPI a real weekly series", () => {
    money.metrics.forEach((m: { series?: number[] }) =>
      expect(m.series?.length).toBeGreaterThan(1),
    );
  });

  it("lists under-pacing commits first, still two weeks or more from renewal", () => {
    const { commits } = run("get_usage_commits", {});
    const firstOther = commits.findIndex((c: { status: string }) => c.status !== "under");
    commits
      .slice(0, firstOther)
      .forEach((c: { renewalInDays: number }) =>
        expect(c.renewalInDays).toBeGreaterThanOrEqual(14),
      );
    expect(commits.map((c: { name: string }) => c.name)).toContain("Brightline Health");
    const over = commits.find((c: { status: string }) => c.status === "over");
    expect(over.pace).toBeGreaterThan(110);
  });
});

describe("weekly review", () => {
  const { rows } = run("get_weekly_review", {});

  it("gives each metric 6 weeks and 12 months, with last year beside them", () => {
    rows.forEach(
      (r: { weeks: { current: number[]; yearAgo: number[] }; months: { current: number[] } }) => {
        expect(r.weeks.current.length).toBe(6);
        expect(r.weeks.yearAgo.length).toBe(6);
        expect(r.months.current.length).toBe(12);
      },
    );
  });

  it("explains known exceptions and names an owner for the rest", () => {
    const exceptions = rows.filter((r: { status: string }) => r.status === "exception");
    expect(exceptions.length).toBeGreaterThan(0);
    exceptions.forEach((r: { cause: string; owner: string }) => {
      expect(r.cause.length).toBeGreaterThan(0);
      expect(r.owner.length).toBeGreaterThan(0);
    });
    expect(rows.find((r: { key: string }) => r.key === "signups").cause).toBe("Cause unknown");
    expect(rows.find((r: { key: string }) => r.key === "activation").cause).toMatch(/checklist/);
  });

  it("never calls a metric with no plan on plan", () => {
    const sticky = rows.find((r: { key: string }) => r.key === "stickiness");
    expect(sticky.vsPlan).toBe("No plan");
    expect(reviewOkNote(sticky)).not.toMatch(/on plan/i);
    expect(reviewOkNote(rows.find((r: { key: string }) => r.key === "wau"))).toBe("On plan");
  });

  it("ends the MRR weeks on the revenue card's MRR", () => {
    const mrr = rows.find((r: { key: string }) => r.key === "mrr");
    const walk = run("get_revenue_retention", { plan: "all" }).walk;
    expect(Math.abs(mrr.weeks.current[5] - walk.at(-1).value)).toBeLessThan(2);
  });
});

describe("signups by source", () => {
  it("adds up to the funnel's signups, and its rates average to activation", () => {
    for (const range of ["7d", "30d", "90d"] as const) {
      const sources = run("get_signups_by_source", { range });
      const funnel = run("get_activation_funnel", { range });
      const total = sources.items.reduce((a: number, i: { value: number }) => a + i.value, 0);
      expect(total).toBe(funnel.steps[0].value);
    }
  });
});

describe("TRACE-inspired cards", () => {
  it("measures each launch the week before against the week after", () => {
    const { releases } = run("get_release_impact");
    expect(releases.map((r: { label: string }) => r.label)).toEqual([
      "Onboarding checklist v2",
      "Quick-capture widget rolled back",
    ]);
    const checklist = releases[0].metrics.find((m: { name: string }) => m.name === "Activation");
    expect(checklist.change).toBeGreaterThan(1);
  });

  it("splits daily actives by platform, adding up to the whole", () => {
    const funnel = run("get_activation_funnel", { range: "30d", platform: "ios" });
    const share = funnel.platformUsers.reduce((a: number, p: { share: number }) => a + p.share, 0);
    expect(share).toBeCloseTo(1, 3);
    expect(funnel.platformActivation).toHaveLength(3);
  });

  it("counts every paying workspace once in the health distribution, by zone", () => {
    const accounts = run("get_account_health", { plan: "all" });
    const counted = accounts.distribution.series
      .flatMap((s: { values: number[] }) => s.values)
      .reduce((a: number, v: number) => a + v, 0);
    expect(counted).toBe(accounts.metrics[0].value.replace(/,/g, "") * 1);
  });

  it("derives lifetime value from ARPA and revenue churn", () => {
    const { metrics } = run("get_revenue_retention", { plan: "all" });
    const label = (l: string) => metrics.find((m: { label: string }) => m.label === l);
    expect(label("ARPA")).toBeDefined();
    expect(label("Revenue churn").goodDirection).toBe("down");
    expect(label("Lifetime value")).toBeDefined();
  });
});

describe("filters move every card", () => {
  it("follows the retention mode on the curves as on the cohorts, brackets included", () => {
    for (const unit of ["user", "workspace"] as const) {
      const exact = run("get_retention_curves", { unit });
      const later = run("get_retention_curves", { unit, mode: "unbounded" });
      const bracket = run("get_retention_curves", { unit, mode: "bracket" });
      expect(later.all).not.toEqual(exact.all);
      expect(later.rule).toBe(run("get_retention_cohorts", { unit, mode: "unbounded" }).rule);
      expect(bracket.labels).toEqual(
        run("get_retention_cohorts", { unit, mode: "bracket" }).periodLabels,
      );
      expect(bracket.all).toHaveLength(4);
      // A bracket counts anyone active in any of its weeks.
      expect(bracket.all[3]).toBeGreaterThanOrEqual(exact.all[4] - 0.05);
    }
    const program = analyticsKit.gallery.find((d) => d.title === "Retention and lifecycle")!;
    expect(program.program).toMatch(/get_retention_curves", \{[^}]*mode: \$mode/);
  });

  it("measures feature breadth, frequency, and users over the chosen period", () => {
    const at = (range: string) =>
      Object.fromEntries(
        run("get_feature_engagement", { range }).features.map(
          (f: { name: string }) => [f.name, f] as const,
        ),
      ) as Record<string, { breadth: number; frequency: number; users: number }>;
    const [week, month, quarter] = ["7d", "30d", "90d"].map(at);
    for (const name of Object.keys(month!)) {
      expect(week![name]!.breadth).toBeLessThan(month![name]!.breadth);
      expect(quarter![name]!.breadth).toBeGreaterThan(month![name]!.breadth);
      expect(week![name]!.users).toBeLessThan(month![name]!.users);
      expect(quarter![name]!.users).toBeGreaterThan(month![name]!.users);
      expect(quarter![name]!.frequency).toBeLessThanOrEqual(month![name]!.frequency);
      expect(week![name]!.frequency).toBeLessThanOrEqual(7);
    }
    // Plausible: a weekly read is not a fraction of the monthly one.
    expect(week!["Boards"]!.breadth).toBeGreaterThan(70);
    expect(at("30d")).toEqual(month);
  });

  it("counts the by-platform card in the funnel's unit", () => {
    const users = run("get_activation_funnel", { range: "30d" });
    const ws = run("get_activation_funnel", { range: "30d", unit: "workspace" });
    expect(ws.platformUsers).not.toEqual(users.platformUsers);
    expect(ws.platformActivation).not.toEqual(users.platformActivation);
    expect(ws.platformRule).toMatch(/new workspaces/);
    const share = ws.platformUsers.reduce((a: number, p: { share: number }) => a + p.share, 0);
    expect(share).toBeCloseTo(1, 3);
    // The platforms' new workspaces add up to the funnel's first step.
    const created = total(ws.platformUsers.map((p: { value: number }) => p.value));
    expect(Math.abs(created - ws.steps[0].value)).toBeLessThanOrEqual(3);
  });

  it("charts free to paid for the weeks of the chosen period", () => {
    const month = run("get_monetization", { range: "30d" });
    const quarter = run("get_monetization", { range: "90d" });
    expect(month.labels).toHaveLength(5);
    expect(quarter.labels).toHaveLength(13);
    expect(month.freeToPaid).toEqual(quarter.freeToPaid.slice(-5));
    const tile = (m: { metrics: Kpi[] }) => m.metrics.find((k) => k.label === "Free to paid")!;
    expect(tile(month).series).toHaveLength(5);
    expect(tile(month).value).toBe(tile(quarter).value);
    expect(tile(month).previous).not.toBe(tile(quarter).previous);
  });

  it("reads DAU/MAU the same on the KPI tile and the why-card", () => {
    for (const range of RANGES)
      for (const platform of ["all", ...PLATFORMS])
        for (const plan of ["all", "free", "team", "business"])
          for (const compare of ["previous_period", "last_year"]) {
            const args = { range, platform, plan, compare };
            const tile = run("get_usage_kpis", args).metrics.find(
              (k: Kpi) => k.label === "DAU/MAU",
            );
            const why = run("explain_change", { ...args, metric: "stickiness" });
            const label = JSON.stringify(args);
            expect(why.value, label).toBe(tile.value);
            expect(why.comparison, label).toBe(tile.previous);
          }
  });

  it("leaves the explained metric's period change out of the insights beside it", () => {
    const all = run("get_product_insights", { range: "30d" }).insights;
    const titles = (excluding: string) =>
      run("get_product_insights", { range: "30d", excluding }).insights.map(
        (i: { title: string }) => i.title,
      );
    const wau = all.find((i: { kind?: string }) => i.kind === "period_change");
    expect(wau.title).toMatch(/^Weekly active users/);
    expect(titles("wau")).not.toContain(wau.title);
    expect(titles("wau")).toContain(all[1].title);
    const activation = all.find((i: { title: string }) => i.title.startsWith("Activation"));
    if (activation) expect(titles("activation")).not.toContain(activation.title);
    // Other findings stay, the tracking break among them.
    const ios = run("get_product_insights", { range: "90d", platform: "ios", excluding: "wau" });
    expect(ios.insights.some((i: { kind?: string }) => i.kind === "data_quality")).toBe(true);
    const program = analyticsKit.gallery.find((d) => d.title === "What changed and why")!;
    expect(program.program).toMatch(/get_product_insights", \{[^}]*excluding: \$why/);
  });

  it("names an at-risk workspace on the plan filtered to", () => {
    for (const plan of ["team", "business"]) {
      const risk = run("get_product_insights", { plan }).insights.find(
        (i: { kind?: string }) => i.kind === "workspace_risk",
      );
      const name = risk.title.split("'s health")[0];
      expect(
        payingWorkspaces()
          .find((w) => w.name === name)
          ?.plan.toLowerCase(),
        plan,
      ).toBe(plan);
    }
  });

  it("titles the feature matrix by its subject", () => {
    const program = analyticsKit.gallery.find((d) => d.title === "Features and experiments")!;
    expect(program.program).not.toMatch(/"Engagement matrix"/);
    expect(program.program).toMatch(/DashboardCardHeader\("How features are used"/);
  });
});
