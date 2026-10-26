import { describe, expect, it } from "vitest";
import { runTool } from "../../core/prompt";
import type { Kpi } from "../../core/schemas";
import { analyticsHandlers } from "./data";
import { analyticsKit } from "./kit";

// One basis per dashboard: the hero, the why-card, and the insights all say
// the same thing against the prior period, last year, or plan.

const run = (tool: string, args: Record<string, unknown> = {}) =>
  runTool(analyticsKit, tool, args, analyticsHandlers) as any;
const COMPARES = [
  {
    compare: "previous_period",
    label: "Prior period",
    period: /vs prior 30 days$/,
    says: /on the prior 30 days/,
  },
  {
    compare: "last_year",
    label: "Last year",
    period: /vs same days last year$/,
    says: /on the same days last year/,
  },
  { compare: "plan", label: "Plan", period: /vs plan$/, says: /(above|below) plan/ },
] as const;
const METRICS = ["wau", "dau", "signups", "activation", "stickiness"] as const;
/** The KPI in get_usage_kpis each explained metric matches. */
const KPI_LABEL = { dau: "Daily active users", signups: "New signups", activation: "Activation" };

describe("explain_change on each comparison", () => {
  for (const { compare, label, period, says } of COMPARES) {
    it(`labels, summarises, and walks against ${label.toLowerCase()}`, () => {
      for (const metric of METRICS) {
        const why = run("explain_change", { metric, compare });
        expect(why.comparisonLabel).toBe(label);
        expect(why.periodLabel).toMatch(period);
        expect(why.summary.split(". ")[0]).toMatch(says);
        expect(why.walk[0]).toMatchObject({ label, kind: "base" });
      }
    });
  }

  it("uses get_usage_kpis' comparison values, plan included", () => {
    for (const { compare } of COMPARES) {
      const kpis = run("get_usage_kpis", { compare });
      expect(run("explain_change", { metric: "wau", compare }).comparison).toBe(kpis.hero.previous);
      for (const [metric, kpi] of Object.entries(KPI_LABEL)) {
        const previous = kpis.metrics.find((m: Kpi) => m.label === kpi).previous;
        expect(run("explain_change", { metric, compare }).comparison, `${metric} ${compare}`).toBe(
          previous,
        );
      }
    }
    expect(run("explain_change", { metric: "activation", compare: "plan" }).comparison).toBe(
      "30.0%",
    );
  });

  it("shares a plan miss out across segments so the walk still adds up", () => {
    for (const metric of METRICS) {
      const why = run("explain_change", { metric, compare: "plan" });
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

  it("names a holiday in this period against last year, and in the prior period otherwise", () => {
    const lastYear = run("explain_change", { range: "90d", compare: "last_year" });
    expect(lastYear.summary).toMatch(/This period includes the Labor Day week/);
    const prior = run("explain_change", { range: "30d" });
    expect(prior.summary).toMatch(/The prior period includes the Labor Day week/);
  });

  it("leads the KPI hero with the same sentence", () => {
    for (const { compare } of COMPARES) {
      const kpis = run("get_usage_kpis", { compare });
      expect(kpis.heroTrend.summary).toBe(run("explain_change", { compare }).summary);
    }
  });
});

describe("get_product_insights on each comparison", () => {
  for (const { compare, label } of COMPARES) {
    it(`says the change against ${label.toLowerCase()}`, () => {
      const why = run("explain_change", { compare });
      const insights = run("get_product_insights", { compare }).insights;
      const wau = insights.find((i: { kind?: string }) => i.kind === "period_change");
      const basis = {
        previous_period: "on the prior 30 days",
        last_year: "on the same days last year",
        plan: "against plan",
      }[compare];
      expect(wau.title).toBe(
        `Weekly active users ${why.change >= 0 ? "up" : "down"} ${Math.abs(why.change).toFixed(1)}% ${basis}`,
      );
      expect(wau.metric).toBe(why.value);
      const activation = insights.find((i: { title: string }) => i.title.startsWith("Activation"));
      if (activation) expect(activation.title.endsWith(basis)).toBe(true);
    });
  }

  it("agrees with the hero on direction against plan", () => {
    const hero = run("get_usage_kpis", { compare: "plan" }).hero;
    const wau = run("get_product_insights", { compare: "plan" }).insights[0];
    expect(wau.title).toMatch(hero.change < 0 ? / down / : / up /);
  });
});

describe("gallery", () => {
  it("passes $compare to every tool that takes compare on a dashboard with a compare filter", () => {
    const takesCompare = analyticsKit.tools
      .filter((t) => "compare" in t.input.shape)
      .map((t) => t.name);
    expect(takesCompare).toEqual(["get_usage_kpis", "explain_change", "get_product_insights"]);
    for (const { title, program } of analyticsKit.gallery) {
      if (!program.includes("$compare")) continue;
      for (const [, tool, args] of program.matchAll(/Query\("(\w+)", \{([^}]*)\}/g)) {
        if (takesCompare.includes(tool!))
          expect(args, `${title}: ${tool}`).toMatch(/compare: \$compare/);
      }
    }
  });
});
