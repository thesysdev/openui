import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { formatCurrency } from "../../core/format";
import { runTool } from "../../core/prompt";
import { AS_OF } from "../../core/sample-data";
import type { Kpi } from "../../core/schemas";
import { LAST_YEAR, STORE_EVENTS } from "./calendar";
import { activeCustomers, ecommerceHandlers, hourShares } from "./data";
import { ecommerceKit } from "./kit";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// The sample store has to add up: every tool reads the same daily history, so
// totals agree across tools and every KPI says how it is calculated.

const run = (tool: string, args: Record<string, unknown> = {}) =>
  runTool(ecommerceKit, tool, args, ecommerceHandlers) as any;

/** The defaults, then every value of every enum argument with the rest at defaults. */
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

function kpisIn(output: Record<string, unknown>): Kpi[] {
  const found: Kpi[] = [];
  if (output.hero) found.push(output.hero as Kpi);
  if (Array.isArray(output.metrics)) found.push(...(output.metrics as Kpi[]));
  return found;
}

describe("metric definitions", () => {
  for (const tool of ecommerceKit.tools) {
    it(`${tool.name}: every KPI has a definition`, () => {
      for (const args of argumentSets(tool.input)) {
        for (const kpi of kpisIn(run(tool.name, args))) {
          expect(kpi.definition?.formula, `${kpi.label} ${JSON.stringify(args)}`).toBeTruthy();
          expect(kpi.definition?.window).toBeTruthy();
        }
      }
    });
  }
});

const RANGES = ["7d", "30d", "90d", "mtd"] as const;
const CHANNELS = ["all", "online", "app", "amazon"] as const;
const total = (values: number[]) => values.reduce((a, b) => a + b, 0);
const line = (lines: { label: string; value: number }[], label: string) =>
  lines.find((l) => l.label === label)!.value;

describe("the sample store adds up", () => {
  for (const range of RANGES) {
    for (const channel of CHANNELS) {
      const args = { range, channel };
      it(`${range} ${channel}: sales agree across tools`, () => {
        const breakdown = run("get_sales_breakdown", args).lines;
        const totalSales = line(breakdown, "Total sales");
        // Each day is rounded on its own. Weekly views (90d) leave out the
        // days before the first full week, so only daily views add up.
        if (range !== "90d") {
          const days = run("get_sales_over_time", args).totalSales;
          expect(Math.abs(total(days) - totalSales)).toBeLessThanOrEqual(days.length);
        }
        expect(line(breakdown, "Net sales")).toBeCloseTo(
          line(breakdown, "Gross sales") -
            line(breakdown, "Discounts") -
            line(breakdown, "Returns"),
          -1,
        );
        for (const dimension of ["category", "country"]) {
          const items = run("get_sales_by", { ...args, dimension }).items;
          expect(
            Math.abs(total(items.map((i: { value: number }) => i.value)) - totalSales),
            dimension,
          ).toBeLessThanOrEqual(items.length);
        }
      });

      it(`${range} ${channel}: product revenue adds up to net sales`, () => {
        const net = line(run("get_sales_breakdown", args).lines, "Net sales");
        const products = run("get_product_performance", { ...args, limit: 16 }).products;
        expect(
          Math.abs(total(products.map((p: { revenue: number }) => p.revenue)) - net),
        ).toBeLessThanOrEqual(products.length);
      });
    }

    it(`${range}: channels add up to the store`, () => {
      const all = line(run("get_sales_breakdown", { range }).lines, "Total sales");
      const items = run("get_sales_by", { range, dimension: "channel" }).items;
      expect(
        Math.abs(total(items.map((i: { value: number }) => i.value)) - all),
      ).toBeLessThanOrEqual(3);
      const parts = ["online", "app", "amazon"].map((channel) =>
        line(run("get_sales_breakdown", { range, channel }).lines, "Total sales"),
      );
      expect(Math.abs(total(parts) - all)).toBeLessThanOrEqual(3);
    });

    it(`${range}: marketing reconciles to the store`, () => {
      const mkt = run("get_marketing_performance", { range });
      const storefront = ["online", "app"].map((channel) =>
        line(run("get_sales_breakdown", { range, channel }).lines, "Total sales"),
      );
      const attributed = total(mkt.channels.map((c: { revenue: number }) => c.revenue));
      expect(Math.abs(attributed - total(storefront))).toBeLessThanOrEqual(mkt.channels.length + 2);
      const paid = mkt.channels
        .filter((c: { type: string }) => c.type === "paid")
        .map((c: { spend: number }) => c.spend);
      const adSpend = mkt.metrics.find((m: Kpi) => m.label === "Ad spend")!;
      expect(adSpend.value).toBe(formatCurrency(total(paid)));
    });

    it(`${range}: the profit breakdown adds up`, () => {
      const { lines } = run("get_profit_bridge", { range });
      const signed = lines
        .filter((l: { kind: string }) => l.kind === "base" || l.kind === "subtract")
        .map((l: { kind: string; value: number }) => (l.kind === "base" ? l.value : -l.value));
      expect(Math.abs(total(signed) - line(lines, "Contribution profit"))).toBeLessThanOrEqual(
        lines.length,
      );
      expect(line(lines, "Net sales")).toBe(
        line(run("get_sales_breakdown", { range }).lines, "Net sales"),
      );
    });

    it(`${range}: new and returning add up to all sales`, () => {
      const mix = run("get_new_vs_returning", { range });
      const days = run("get_sales_over_time", { range }).totalSales;
      mix.newCustomerSales.forEach((v: number, i: number) =>
        expect(Math.abs(v + mix.returningCustomerSales[i] - days[i])).toBeLessThanOrEqual(2),
      );
    });
  }
});

/** A whole-dollar ledger line formatted, allowing for its own rounding. */
const nearly = (value: number) => [value - 1, value, value + 1].map(formatCurrency);

describe("sales by device", () => {
  it("has no device split for Amazon alone, and shares that sum to 1 otherwise", () => {
    for (const range of RANGES) {
      const amazon = run("get_sales_by", { range, channel: "amazon", dimension: "device" });
      expect(amazon.items).toEqual([]);
      expect(amazon.overTime).toEqual({ labels: [], series: [] });
      for (const channel of ["all", "online", "app"]) {
        const { items } = run("get_sales_by", { range, channel, dimension: "device" });
        const shares = total(items.map((i: { share: number }) => i.share));
        expect(shares, `${range} ${channel}`).toBeCloseTo(1, 2);
      }
    }
  });
});

describe("the profit bridge", () => {
  const COMPARES = ["previous_period", "last_year", "plan"] as const;

  for (const range of RANGES) {
    it(`${range}: ad spend matches the marketing tool`, () => {
      const bridge = run("get_profit_bridge", { range, compare: "previous_period" }).lines;
      const adSpend = run("get_marketing_performance", { range }).metrics.find(
        (m: Kpi) => m.label === "Ad spend",
      )!;
      expect(formatCurrency(line(bridge, "Ad spend"))).toBe(adSpend.value);
    });

    it(`${range}: the channels add up to the whole store`, () => {
      const profit = (channel: string) =>
        line(run("get_profit_bridge", { range, channel }).lines, "Contribution profit");
      const parts = ["online", "app", "amazon"].map(profit);
      expect(Math.abs(total(parts) - profit("all"))).toBeLessThanOrEqual(3);
    });

    for (const compare of COMPARES) {
      it(`${range} vs ${compare}: the KPI hero is the bridge's contribution profit`, () => {
        const bridge = run("get_profit_bridge", { range, compare });
        const kpis = run("get_store_kpis", { range, compare });
        const result = line(bridge.lines, "Contribution profit");
        expect(nearly(result)).toContain(kpis.hero.value);
        const before = bridge.lines.find(
          (l: { label: string }) => l.label === "Contribution profit",
        );
        expect(nearly(before.previous)).toContain(kpis.hero.previous);
        expect(kpis.heroTrend.comparisonLabel).toBe(bridge.comparisonLabel);
      });
    }
  }

  it("compares last year on the same weekdays", () => {
    expect(LAST_YEAR % 7).toBe(0);
    const sale = STORE_EVENTS.find((e) => e.id === "fall-sale")!;
    const lastYear = STORE_EVENTS.find((e) => e.id === "fall-sale-2025")!;
    expect(lastYear.from - sale.from).toBe(LAST_YEAR);
  });

  it("puts break-even ROAS between TikTok's ROAS and the blended ROAS", () => {
    const mkt = run("get_marketing_performance", { range: "30d" });
    const breakEven = run("get_profit_bridge", { range: "30d" }).breakEvenRoas;
    expect(mkt.targetRoas).toBe(breakEven);
    const tiktok = mkt.channels.find((c: { channel: string }) => c.channel === "TikTok Ads");
    expect(tiktok.roas).toBeLessThan(breakEven);
    for (const name of ["Meta Ads", "Google Ads"]) {
      const channel = mkt.channels.find((c: { channel: string }) => c.channel === name);
      expect(channel.roas, name).toBeGreaterThan(breakEven);
    }
    expect(parseFloat(mkt.hero.value)).toBeGreaterThan(breakEven);
  });
});

describe("explain_change", () => {
  const METRICS = ["contribution_profit", "total_sales", "orders", "aov", "conversion_rate"];
  const parse = (why: { walk: { value: number; kind: string }[] }) =>
    why.walk.reduce(
      (t, s) =>
        s.kind === "base"
          ? s.value
          : s.kind === "add"
            ? t + s.value
            : s.kind === "subtract"
              ? t - s.value
              : t,
      0,
    );

  for (const metric of METRICS) {
    for (const compare of ["previous_period", "last_year", "plan"]) {
      it(`${metric} vs ${compare}: the walk ends where the metric is`, () => {
        const why = run("explain_change", { metric, range: "30d", compare });
        const end = why.walk.at(-1)!;
        const start = why.walk[0]!;
        // Steps under 0.5% of the change are left out of the walk.
        expect(Math.abs(parse(why) - end.value)).toBeLessThanOrEqual(
          Math.abs(end.value - start.value) * 0.04 + 0.01,
        );
        if (why.confidence.level === "Low") expect(why.drivers).toEqual([]);
      });
    }
  }

  it("blames ad spend for profit below plan", () => {
    const why = run("explain_change", {
      metric: "contribution_profit",
      range: "30d",
      compare: "plan",
    });
    expect(why.tone).toBe("bad");
    expect(why.drivers[0].name).toBe("Ad spend");
    expect(why.drivers.map((d: { name: string }) => d.name)).toContain("TikTok Ads");
  });

  it("puts most of the conversion rise down to the tracking change", () => {
    const why = run("explain_change", { metric: "conversion_rate", range: "30d" });
    expect(why.dataQuality).toMatch(/cookie banner update/);
    expect(why.walk.map((s: { label: string }) => s.label)).toContain("Tracking change");
    expect(why.summary).toMatch(/pts/);
  });

  it("says the same value and comparison as the KPI tiles, for every filter", () => {
    const TILE: Record<string, string> = {
      total_sales: "Total sales",
      orders: "Orders",
      aov: "Average order value",
      conversion_rate: "Conversion rate",
    };
    for (const range of RANGES)
      for (const channel of CHANNELS)
        for (const compare of ["previous_period", "last_year", "plan"]) {
          const at = `${range} ${channel} ${compare}`;
          const kpis = run("get_store_kpis", { range, channel, compare });
          const profit = run("explain_change", {
            metric: "contribution_profit",
            range,
            channel,
            compare,
          });
          expect(profit.value, at).toBe(kpis.hero.value);
          expect(profit.comparison, at).toBe(kpis.hero.previous);
          for (const [metric, label] of Object.entries(TILE)) {
            const tile = kpis.metrics.find((k: Kpi) => k.label === label);
            const why = run("explain_change", { metric, range, channel, compare });
            expect(why.value, `${metric} ${at}`).toBe(tile.value);
            expect(why.comparison, `${metric} ${at}`).toBe(tile.previous ?? "—");
          }
        }
  });

  it("does not explain conversion rate for Amazon, which has no store sessions", () => {
    for (const compare of ["previous_period", "last_year", "plan"]) {
      const why = run("explain_change", {
        metric: "conversion_rate",
        range: "30d",
        channel: "amazon",
        compare,
      });
      expect(why.value).toBe("—");
      expect(why.summary).toMatch(/not tracked for Amazon/);
      expect(why.summary).not.toMatch(/0\.00/);
      expect(why.walk).toEqual([]);
      expect(why.drivers).toEqual([]);
    }
  });

  it("finds the post-sale week unusual and does not explain a flat quarter", () => {
    const week = run("explain_change", { metric: "total_sales", range: "7d" });
    expect(week.tone).toBe("bad");
    expect(week.confidence.level).toBe("High");
    const quarter = run("explain_change", { metric: "orders", range: "90d", compare: "plan" });
    expect(quarter.confidence.level).toBe("Low");
    expect(quarter.summary).toMatch(/no single cause stands out/);
  });
});

describe("new and returning customers", () => {
  const TYPES = ["new", "returning"] as const;
  for (const range of RANGES) {
    for (const channel of CHANNELS) {
      it(`${range} ${channel}: new plus returning is everyone`, () => {
        const sum = (type: string, tool: string, pick: (r: any) => number[]) =>
          pick(run(tool, { range, channel, customerType: type }));
        const totalOf = (tool: string, pick: (r: any) => number[]) => {
          const everyone = sum("all", tool, pick);
          const all = total(everyone);
          const parts = total(TYPES.flatMap((t) => sum(t, tool, pick)));
          // Every value is rounded on its own, in each of the three calls.
          expect(Math.abs(parts - all), tool).toBeLessThanOrEqual(everyone.length * 1.5);
        };
        totalOf("get_sales_over_time", (r) => r.totalSales.concat(r.orders));
        totalOf("get_sales_breakdown", (r) => r.lines.map((l: { value: number }) => l.value));
        totalOf("get_sales_by", (r) => r.items.map((i: { value: number }) => i.value));
      });
    }
  }

  it("new customers start with the cheaper products", () => {
    const share = (type: string, sku: string) => {
      const products = run("get_product_performance", {
        range: "30d",
        customerType: type,
        limit: 16,
      }).products;
      const all = total(products.map((p: { revenue: number }) => p.revenue));
      return products.find((p: { sku: string }) => p.sku === sku).revenue / all;
    };
    expect(share("new", "APP-TEE-01")).toBeGreaterThan(share("returning", "APP-TEE-01"));
    expect(share("new", "FTW-DBT-03")).toBeLessThan(share("returning", "FTW-DBT-03"));
  });

  it("the customer flow nets out", () => {
    for (const range of RANGES) {
      const flow = run("get_customer_flow", { range });
      flow.net.forEach((net: number, i: number) =>
        expect(
          Math.abs(flow.newCustomers[i] + flow.reactivated[i] + flow.lapsed[i] - net),
        ).toBeLessThanOrEqual(2),
      );
      expect(flow.lapsed.every((v: number) => v <= 0)).toBe(true);
    }
  });
});

describe("store insights beside DriverCards", () => {
  // The insight that already says each metric's change; orders and AOV have none.
  const ABOUT: Record<string, string[]> = {
    contribution_profit: ["top_driver", "top_detractor"],
    total_sales: ["period_change"],
    conversion_rate: ["data_quality"],
    orders: [],
    aov: [],
  };

  // 48 filter combinations, each run once whole and once per metric left out.
  it("leaves out only the change explain_change explains, for every filter", () => {
    for (const range of RANGES)
      for (const channel of CHANNELS)
        for (const compare of ["previous_period", "last_year", "plan"]) {
          const args = { range, channel, compare };
          const all = run("get_store_insights", args).insights;
          for (const [metric, kinds] of Object.entries(ABOUT)) {
            const rest = run("get_store_insights", { ...args, excluding: metric }).insights;
            const label = `${metric} ${range} ${channel} ${compare}`;
            const kept = all.filter((i: { kind?: string }) => !kinds.includes(i.kind ?? ""));
            expect(
              rest.some((i: { kind?: string }) => kinds.includes(i.kind ?? "")),
              label,
            ).toBe(false);
            // Everything else stays, in order; the cap of 8 can let one more in.
            expect(rest.slice(0, kept.length), label).toEqual(kept);
          }
        }
  }, 20_000);

  it("leads with profit unless the cards already explain it", () => {
    const first = (excluding?: string) =>
      run("get_store_insights", { range: "30d", compare: "plan", excluding }).insights[0];
    expect(["top_driver", "top_detractor"]).toContain(first().kind);
    expect(["top_driver", "top_detractor"]).not.toContain(first("contribution_profit").kind);
  });

  it("the What changed program leaves the explained metric out of its list", () => {
    const { program } = ecommerceKit.gallery.find((g) => g.title === "What changed and why")!;
    expect(program).toMatch(/Query\("get_store_insights", \{[^}]*excluding: \$why[^}]*\}/);
  });
});

describe("trust", () => {
  it("platforms claim more than the store's orders credit them with", () => {
    for (const range of RANGES) {
      const recon = run("get_reconciliation", { range });
      for (const p of recon.platforms) expect(p.claimedRevenue).toBeGreaterThan(p.storeRevenue);
      const mkt = run("get_marketing_performance", { range });
      const paid = mkt.channels.filter((c: { type: string }) => c.type === "paid");
      expect(recon.storeTotal).toBe(total(paid.map((c: { revenue: number }) => c.revenue)));
    }
  });

  it("says how the KPIs are counted", () => {
    const kpis = run("get_store_kpis", { range: "30d", compare: "plan" });
    expect(kpis.rules[0]).toBe("Compared with plan");
    expect(run("get_marketing_performance", { range: "7d" }).rules.length).toBeGreaterThan(2);
  });
});

describe("comparisons and the calendar", () => {
  it("cuts the last day of every window to the same hours", () => {
    const week = run("get_sales_over_time", { range: "30d", compare: "last_year" });
    const today = week.totalSales.at(-1);
    const usual = total(week.totalSales.slice(-8, -1)) / 7;
    expect(today / usual).toBeLessThan(0.75);
    expect(week.comparison.at(-1) / (total(week.comparison.slice(-8, -1)) / 7)).toBeLessThan(0.75);
    expect(week.comparisonLabel).toBe("Same days last year");
  });

  it("puts every event's start and end on the chart's own labels", () => {
    for (const range of RANGES) {
      const { events } = run("get_annotations", { range });
      const { labels } = run("get_sales_over_time", { range });
      for (const e of events) {
        expect(labels, `${range} ${e.label}`).toContain(e.start);
        expect(labels).toContain(e.end);
      }
    }
    for (const event of ["fall-sale", "fall-sale-2025", "bfcm-2025"]) {
      const promo = run("get_promo_impact", { event });
      expect(promo.labels).toContain(promo.events[0].start);
      expect(promo.labels).toContain(promo.events[0].end);
    }
  });

  it("marks the tracking change as a measurement, not a real change", () => {
    const { events } = run("get_annotations", { range: "30d" });
    expect(events.find((e: { kind: string }) => e.kind === "measurement").label).toBe(
      "Cookie banner update",
    );
  });

  it("finds this year's Fall sale beat the lift its discount needed", () => {
    const promo = run("get_promo_impact", { event: "fall-sale" });
    const value = (label: string) =>
      parseFloat(promo.metrics.find((m: Kpi) => m.label === label).value.replace(/[^\d.-]/g, ""));
    expect(value("Order lift")).toBeGreaterThan(value("Lift needed"));
    expect(promo.summary).toMatch(/pulled demand forward/);
  });
});

it("finds every sale's pull-forward dip against a season-adjusted baseline", () => {
  // BFCM's baseline is November's weeks, its after-period December's busier days.
  for (const event of ["fall-sale", "fall-sale-2025", "bfcm-2025"]) {
    const promo = run("get_promo_impact", { event });
    const after = promo.metrics.find((m: Kpi) => m.label === "Sales after").value;
    expect(after, event).toMatch(/^−/);
    expect(promo.summary, event).toMatch(/pulled demand forward/);
  }
});

it("measures promotions on whole days", () => {
  const promo = run("get_promo_impact", { event: "fall-sale" });
  const last = promo.actual.at(-1);
  const before = total(promo.actual.slice(-8, -1)) / 7;
  expect(last / before).toBeGreaterThan(0.75);
});

describe("replenishment", () => {
  const items = () => run("get_inventory_health", {}).items as any[];

  it("adjusts a sold-out product's velocity for its days out of stock", () => {
    const beanie = items().find((i) => i.sku === "ACC-BEA-03");
    expect(beanie.stock).toBe(0);
    expect(beanie.lostRevenue).toBeGreaterThan(0);
    expect(beanie.replenishBy).toBe("Now");
    // It sold nothing on its 4 days out, so 30 days' units are 26 days at its velocity.
    const sold = run("get_product_performance", { range: "30d", limit: 16 }).products.find(
      (p: { sku: string }) => p.sku === "ACC-BEA-03",
    );
    expect(Math.abs(beanie.dailySales * 26 - sold.units)).toBeLessThanOrEqual(2);
  });

  it("sells nothing of a sold-out product on its days out", () => {
    const week = run("get_product_performance", { range: "7d", limit: 16 }).products;
    const beanie = week.find((p: { sku: string }) => p.sku === "ACC-BEA-03");
    // Out since Oct 7: the last 4 of the week's 7 days.
    expect(beanie.trend.slice(-4)).toEqual([0, 0, 0, 0]);
    expect(beanie.trend.slice(0, 3).every((v: number) => v > 0)).toBe(true);
    expect(beanie.change).toBeLessThan(0);
  });

  it("finds the Trail Runner's gap before its order lands, and what it costs", () => {
    const runner = items().find((i) => i.sku === "FTW-TRL-01");
    expect(runner.stockoutGapDays).toBeGreaterThan(2);
    expect(runner.stockoutGapDays).toBeLessThan(4);
    expect(runner.revenueAtRisk).toBeGreaterThan(0);
  });
});

describe("returns", () => {
  it("refunds match the sales breakdown, and exchanges are kept", () => {
    for (const range of RANGES) {
      const r = run("get_returns", { range });
      const refunds = line(run("get_sales_breakdown", { range }).lines, "Returns");
      const sent = line(r.lines, "Sent back");
      const kept = line(r.lines, "Kept as exchanges");
      expect(Math.abs(sent - kept - refunds)).toBeLessThanOrEqual(2);
    }
  });

  it("each category returns at its own rate, on its share of sales", () => {
    const rate = (r: { metrics: Kpi[] }) =>
      parseFloat(r.metrics.find((m) => m.label === "Return rate")!.value as string);
    for (const range of RANGES) {
      const store = run("get_returns", { range });
      const by = run("get_sales_by", { range, dimension: "category" }).items as {
        name: string;
        value: number;
      }[];
      const sales = total(by.map((i) => i.value));
      const rates: Record<string, number> = {};
      for (const [category, name] of [
        ["apparel", "Apparel"],
        ["footwear", "Footwear"],
        ["accessories", "Accessories"],
        ["home", "Home"],
      ] as const) {
        const r = run("get_returns", { range, category });
        rates[category] = rate(r);
        // Gross sales take the category's share of the store's, as get_sales_by does.
        const share = by.find((i) => i.name === name)!.value / sales;
        expect(line(r.lines, "Gross sales") / line(store.lines, "Gross sales"), name).toBeCloseTo(
          share,
          2,
        );
      }
      expect(rates.footwear, range).toBeGreaterThan(rate(store));
      expect(rates.accessories, range).toBeLessThan(rate(store));
      expect(rates.home, range).toBeLessThan(rates.apparel!);
    }
  });

  it("shows footwear running small", () => {
    const { exchanges } = run("get_returns", { range: "30d", category: "footwear" });
    const up = exchanges.counts.reduce(
      (t: number, row: number[], r: number) => t + total(row.slice(r + 1)),
      0,
    );
    expect(up / total(exchanges.counts.flat())).toBeGreaterThan(0.55);
  });
});

describe("attribution", () => {
  const revenue = (model: string, window = "7d") =>
    run("get_marketing_performance", { range: "30d", model, window }).channels as {
      channel: string;
      revenue: number;
    }[];
  const share = (model: string, name: string) => {
    const channels = revenue(model);
    return (
      channels.find((c) => c.channel === name)!.revenue / total(channels.map((c) => c.revenue))
    );
  };

  it("reconciles to the store under every model but the platforms' own", () => {
    const store = total(revenue("last_click").map((c) => c.revenue));
    for (const model of ["first_click", "linear"]) {
      expect(Math.abs(total(revenue(model).map((c) => c.revenue)) - store)).toBeLessThanOrEqual(8);
    }
    expect(total(revenue("platform").map((c) => c.revenue))).toBeGreaterThan(store * 1.1);
  });

  it("gives first click more credit to the channels that find new shoppers", () => {
    expect(share("first_click", "Meta Ads")).toBeGreaterThan(share("last_click", "Meta Ads"));
    expect(share("first_click", "Email & SMS")).toBeLessThan(share("last_click", "Email & SMS"));
  });
});

describe("targets and usual ranges", () => {
  it("forecasts inside their range and agrees with the monthly goal", () => {
    for (const channel of CHANNELS) {
      const { targets } = run("get_targets", { channel });
      for (const t of targets) {
        expect(t.forecastLow, t.label).toBeLessThanOrEqual(t.forecast);
        expect(t.forecast).toBeLessThanOrEqual(t.forecastHigh);
        expect(t.toDate).toBeLessThan(t.target);
      }
      const sales = targets.find((t: { label: string }) => t.label === "Total sales");
      // The goal is the month's sales target, rounded to three significant figures.
      const goal = run("get_sales_goal", { channel }).goal;
      expect(Math.abs(goal / sales.target - 1)).toBeLessThan(0.01);
    }
  });

  it("flags the ad budget as over and conversion as unusually high", () => {
    const { targets } = run("get_targets", {});
    expect(targets.find((t: { label: string }) => t.label === "Ad spend budget").status).toBe(
      "over",
    );
    const conversion = run("get_store_kpis", { range: "30d" }).metrics.find(
      (m: Kpi) => m.label === "Conversion rate",
    );
    expect(conversion.usual.status).toBe("above");
  });

  it("splits the ad budget by platform: budgets, spend, and forecasts add up to the target", () => {
    for (const channel of ["all", "online", "app"]) {
      const { targets, budgets } = run("get_targets", { channel });
      const ads = targets.find((t: { label: string }) => t.label === "Ad spend budget");
      const total = (key: string) => budgets.reduce((a: number, b: any) => a + b[key], 0);
      expect(Math.abs(total("budget") - ads.target), channel).toBeLessThanOrEqual(budgets.length);
      expect(Math.abs(total("spent") - ads.actual), channel).toBeLessThanOrEqual(budgets.length);
      for (const b of budgets) expect(b.burn.at(-1)).toBe(b.spent);
    }
    expect(run("get_targets", { channel: "amazon" }).budgets).toEqual([]);
  });

  it("has no ad budgets for Amazon: ads drive the store and app, and Amazon's costs are fees", () => {
    expect(run("get_targets", { channel: "amazon" }).budgets).toEqual([]);
    const { lines } = run("get_profit_bridge", { range: "30d", channel: "amazon" });
    const line = (label: string) => lines.find((l: { label: string }) => l.label === label);
    expect(Math.abs(line("Ad spend").value)).toBe(0);
    expect(Math.abs(line("Other marketing").value)).toBe(0);
    expect(Math.abs(line("Fees").value)).toBeGreaterThan(0);
  });
});

describe("orders by hour", () => {
  it("counts whole days: no weekday row is cut like today", () => {
    const { rows } = run("get_orders_by_hour", { range: "7d" });
    const totals = rows.map((r: { values: number[] }) => r.values.reduce((a, v) => a + v, 0));
    expect(Math.min(...totals) / Math.max(...totals)).toBeGreaterThan(0.6);
  });

  it("spreads all of each day's orders over its hours", () => {
    for (const ch of ["online", "app", "amazon"] as const)
      for (const weekend of [false, true])
        expect(hourShares(ch, weekend).reduce((a, v) => a + v, 0)).toBeCloseTo(1, 9);
    const { rows, columns } = run("get_orders_by_hour", { range: "7d" });
    expect(rows.map((r: { label: string }) => r.label)).toEqual(WEEKDAY_LABELS);
    expect(columns).toHaveLength(24);
  });

  it("puts the store's busiest hour in the evening", () => {
    const { rule } = run("get_orders_by_hour", { range: "30d", channel: "online" });
    expect(rule).toMatch(/busiest \w{3} (19|20|21):00/);
  });
});

it("cohorts forecast at most three months and pay back inside the grid", () => {
  const { cohorts } = run("get_customer_cohorts", { metric: "ltv" });
  for (const c of cohorts) {
    expect(c.predicted ?? 0).toBeLessThanOrEqual(3);
    expect(c.payback).toBeGreaterThanOrEqual(0);
    expect(c.payback).toBeLessThan(c.values.length);
  }
  expect(run("get_customer_cohorts", { metric: "repeat_rate" }).cohorts[0].payback).toBeUndefined();
});

describe("segments and products", () => {
  it("sizes each segment by the customers who moved into it", () => {
    const { segments, movement, totalCustomers } = run("get_customer_segments", {});
    for (const s of segments) {
      const into = total(
        movement
          .filter((m: { to: string }) => m.to === s.name)
          .map((m: { customers: number }) => m.customers),
      );
      expect(s.customers).toBe(into);
    }
    expect(total(segments.map((s: { customers: number }) => s.customers))).toBe(totalCustomers);
    expect(movement.some((m: { to: string }) => m.to === "Lapsed")).toBe(true);
  });

  it("puts every product's sell-through between 0 and 1", () => {
    const { products } = run("get_product_performance", { range: "30d", limit: 16 });
    for (const p of products) {
      expect(p.sellThrough).toBeGreaterThan(0);
      expect(p.sellThrough).toBeLessThanOrEqual(1);
    }
    const beanie = products.find((p: { sku: string }) => p.sku === "ACC-BEA-03");
    expect(beanie.sellThrough).toBe(1);
  });

  it("splits category and device sales by customer type", () => {
    for (const dimension of ["category", "device"]) {
      const sales = (customerType: string) =>
        total(run("get_sales_by", { range: "30d", dimension, customerType }).totalSales);
      expect(sales("new"), dimension).toBeLessThan(sales("all"));
      expect(sales("returning"), dimension).toBeLessThan(sales("all"));
      expect(sales("new"), dimension).not.toBe(sales("returning"));
    }
  });

  it("passes the Customers filter to every query that takes it", () => {
    const takes = new Set(
      ecommerceKit.tools.filter((t) => "customerType" in t.input.shape).map((t) => t.name),
    );
    for (const { title, program } of ecommerceKit.gallery) {
      if (!program.includes("$customer")) continue;
      for (const [, tool, args] of program.matchAll(/Query\("(\w+)", (\{[^}]*\})/g))
        if (takes.has(tool!))
          expect(args, `${title}: ${tool}`).toContain("customerType: $customer");
    }
  });
});

it("the monthly goal forecasts the same finish as the targets", () => {
  for (const channel of CHANNELS) {
    const goal = run("get_sales_goal", { channel });
    const sales = run("get_targets", { channel }).targets.find(
      (t: { label: string }) => t.label === "Total sales",
    );
    expect(goal.projected).toBe(sales.forecast);
    expect(goal.planToDate).toBe(sales.toDate);
  }
});

it("the pace-to-goal insight says what the goal card says", () => {
  for (const channel of CHANNELS) {
    const goal = run("get_sales_goal", { channel });
    const pace = run("get_store_insights", {
      range: "30d",
      channel,
      compare: "plan",
    }).insights.find((i: { kind?: string }) => i.kind === "pace_to_goal");
    expect(pace.title, channel).toContain(formatCurrency(goal.projected));
    expect(pace.metric).toBe(`${Math.round((goal.projected / goal.goal) * 100)}%`);
    // The card's on-pace band: within 2% of the goal.
    expect(pace.tone).toBe(goal.projected >= goal.goal * 0.98 ? "positive" : "warning");
  }
});

describe("operations", () => {
  it("lists recent orders back from AS_OF, the newest at it", () => {
    const minutes = (at: string) => {
      const [, h, m, pm] = at.match(/(\d+):(\d+) (AM|PM)$/)!;
      return ((Number(h) % 12) + (pm === "PM" ? 12 : 0)) * 60 + Number(m);
    };
    for (const channel of CHANNELS) {
      const { orders } = run("get_recent_orders", { channel, limit: 8 });
      expect(orders[0].placedAt, channel).toBe(AS_OF);
      for (const o of orders) expect(minutes(o.placedAt)).toBeLessThanOrEqual(minutes(AS_OF));
    }
  });

  it("creatives add up to each platform's spend and store revenue", () => {
    const { creatives } = run("get_creatives", { range: "30d" });
    const channels = run("get_marketing_performance", { range: "30d" }).channels;
    for (const name of ["Meta Ads", "Google Ads", "TikTok Ads"]) {
      const ads = creatives.filter((c: { platform: string }) => c.platform === name);
      const channel = channels.find((c: { channel: string }) => c.channel === name);
      expect(
        Math.abs(total(ads.map((a: { spend: number }) => a.spend)) - channel.spend),
      ).toBeLessThanOrEqual(ads.length);
      expect(
        Math.abs(total(ads.map((a: { revenue: number }) => a.revenue)) - channel.revenue),
      ).toBeLessThanOrEqual(ads.length);
    }
  });

  it("orders actions by expected effect", () => {
    const { actions } = run("get_actions", { range: "30d" });
    const impacts = actions.map((a: { impact: number }) => a.impact);
    expect(impacts).toEqual([...impacts].sort((a: number, b: number) => b - a));
    expect(actions.every((a: { impact: number }) => a.impact > 0)).toBe(true);
  });

  it("narrows the live funnel step by step", () => {
    const { funnel } = run("get_live_view", {});
    for (let i = 1; i < funnel.length; i++)
      expect(funnel[i].value).toBeLessThanOrEqual(funnel[i - 1].value);
  });

  it("plans Black Friday on last year's weekdays and flags short stock", () => {
    const sale = run("get_sale_plan", {});
    expect(sale.daysToGo).toBe(48);
    expect(sale.labels).toContain(sale.events[0].start);
    sale.plan.forEach((v: number, i: number) =>
      expect(Math.abs(v - sale.lastYear[i] * 1.12)).toBeLessThanOrEqual(2),
    );
    expect(sale.extraUnits.length).toBeGreaterThan(0);
    expect(sale.orderBy).toBe("Nov 6");
  });
});

describe("customer base", () => {
  it("counts every new customer of the last year among the active customers", () => {
    const newThisYear = run("get_customer_flow", { range: "90d" }).metrics.find(
      (m: { label: string }) => m.label === "New customers",
    );
    // About four quarters of new customers, all of them active this year.
    const quarter = Number(String(newThisYear.value).replace(/[^\d.]/g, "")) * 1000;
    expect(activeCustomers()).toBeGreaterThan(quarter * 4 * 0.95);
    const segments = run("get_customer_segments", {}).totalCustomers;
    expect(segments).toBeGreaterThan(activeCustomers());
    const year = run("get_customer_kpis", { range: "90d" });
    expect(
      year.metrics.find((m: { label: string }) => m.label === "Repeat purchase rate").value,
    ).toMatch(/^[23]\d\.\d%$/);
  });
});

describe("order journey", () => {
  it("continues from first to second order at the repeat purchase rate", () => {
    const [first, second] = run("get_order_journey", {}).steps;
    const repeat = run("get_customer_kpis", { range: "30d" }).metrics.find(
      (m: { label: string }) => m.label === "Repeat purchase rate",
    );
    expect(((second.value / first.value) * 100).toFixed(1)).toBe(repeat.value.replace("%", ""));
  });
});

describe("LEDGER-inspired cards", () => {
  it("splits contribution profit across sales channels that add up to the store", () => {
    const all = run("get_profit_bridge", { range: "30d", channel: "all" });
    const total = all.lines.find((l: { label: string }) => l.label === "Contribution profit").value;
    const sum = all.byChannel.reduce(
      (a: number, c: { contribution: number }) => a + c.contribution,
      0,
    );
    expect(Math.abs(sum - total)).toBeLessThanOrEqual(all.byChannel.length);
    for (const c of all.byChannel) expect(c.margin).toBeCloseTo(c.contribution / c.net, 3);
  });

  it("charts today's whole hours, and projects a close inside its range", () => {
    const live = run("get_live_view");
    const [sales, , projected] = live.todayMetrics;
    const hours = live.hourlyToday.reduce((a: number, v: number) => a + v, 0);
    // 3:48 PM: 15 whole hours; the hour in progress holds the rest of today's sales.
    expect(live.hourlyToday).toHaveLength(15);
    expect(live.hourlyYesterday).toHaveLength(24);
    const salesNow = Number(sales.value.replace(/[$K]/g, "")) * 1000;
    expect(hours).toBeLessThan(salesNow);
    expect(hours).toBeGreaterThan(salesNow * 0.85);
    const [low, high] = projected.hint.match(/\$[\d.]+K/g);
    expect(projected.value >= low && projected.value <= high).toBe(true);
  });

  it("lists every product's stock, most urgent first, with ABC classes in revenue order", () => {
    const { catalog, items } = run("get_inventory_health", { category: "all" });
    const order = ["Out of stock", "Reorder now", "Slow mover", "Healthy"];
    const ranks = catalog.map((c: { status: string }) => order.indexOf(c.status));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    const below = catalog.filter(
      (c: { status: string }) => c.status !== "Slow mover" && c.status !== "Healthy",
    );
    expect(below).toHaveLength(items.length);
    expect(catalog.some((c: { abc: string }) => c.abc === "A")).toBe(true);
  });

  it("gives the sales goal a forecast range around its projection", () => {
    const goal = run("get_sales_goal", { channel: "all" });
    expect(goal.range[0]).toBeLessThanOrEqual(goal.projected);
    expect(goal.range[1]).toBeGreaterThanOrEqual(goal.projected);
  });
});
