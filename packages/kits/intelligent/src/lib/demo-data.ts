import type { ToolSpec } from "@openuidev/lang-core";

/**
 * Demo data tools for Query-backed dashboards: a store's orders, support
 * tickets and website traffic, generated for the days up to today. A day's
 * rows depend only on its date, so the same day always shows the same data.
 * Used by /gallery, the /preview page and the benchmark's dashboard prompts.
 */

const days = { type: "number", description: "How many days back from today, 1 to 365 (default 90)" };

export const demoToolSpecs: ToolSpec[] = [
  {
    name: "get_orders",
    description: "An online store's orders, one row per order, newest last",
    inputSchema: { type: "object", properties: { days } },
    outputSchema: {
      type: "object",
      properties: {
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              date: { type: "string", description: "YYYY-MM-DD" },
              region: { type: "string", enum: ["North", "South", "East", "West"] },
              channel: { type: "string", enum: ["Web", "Mobile", "Retail"] },
              category: { type: "string" },
              product: { type: "string" },
              units: { type: "number" },
              amount: { type: "number", description: "Order total in USD" },
            },
          },
        },
      },
    },
  },
  {
    name: "get_tickets",
    description: "Support tickets opened, one row per ticket; hours and csat are set once a ticket is solved",
    inputSchema: { type: "object", properties: { days } },
    outputSchema: {
      type: "object",
      properties: {
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              opened: { type: "string", description: "YYYY-MM-DD" },
              team: { type: "string", enum: ["Billing", "Technical", "Accounts", "Shipping"] },
              priority: { type: "string", enum: ["low", "normal", "high", "urgent"] },
              status: { type: "string", enum: ["open", "pending", "solved"] },
              hours: { type: "number", description: "Hours to resolve" },
              csat: { type: "number", description: "Satisfaction 1 to 5" },
            },
          },
        },
      },
    },
  },
  {
    name: "get_traffic",
    description: "Daily website visits and signups, one row per day and source",
    inputSchema: { type: "object", properties: { days } },
    outputSchema: {
      type: "object",
      properties: {
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string", description: "YYYY-MM-DD" },
              source: { type: "string", enum: ["Search", "Social", "Email", "Direct", "Referral"] },
              visits: { type: "number" },
              signups: { type: "number" },
            },
          },
        },
      },
    },
  },
];

const DAY = 86_400_000;

/** A small seeded generator (mulberry32), seeded from a string. */
function rng(seed: string): () => number {
  let h = 1779033703;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(r: () => number, list: readonly T[], weights?: readonly number[]): T => {
  if (!weights) return list[Math.floor(r() * list.length)]!;
  let x = r() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) if ((x -= weights[i]!) < 0) return list[i]!;
  return list[list.length - 1]!;
};

/** The last `n` calendar days ending today (UTC), oldest first, as YYYY-MM-DD. */
function lastDays(input: unknown): string[] {
  const raw = Number((input as { days?: unknown } | null)?.days ?? 90);
  const n = Math.min(365, Math.max(1, Number.isFinite(raw) ? Math.round(raw) : 90));
  const today = Math.floor(Date.now() / DAY);
  return Array.from({ length: n }, (_, i) => new Date((today - n + 1 + i) * DAY).toISOString().slice(0, 10));
}

const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();
// Slow growth over the year, so trends and period-over-period changes show
const growth = (date: string) => 1 + (Date.parse(date) / DAY - 20000) / 1500;

const PRODUCTS = [
  { product: "Trail runner", category: "Outdoors", price: 128 },
  { product: "Rain shell", category: "Outdoors", price: 164 },
  { product: "Camp stove", category: "Outdoors", price: 89 },
  { product: "Linen shirt", category: "Apparel", price: 58 },
  { product: "Wool sweater", category: "Apparel", price: 96 },
  { product: "Everyday tee", category: "Apparel", price: 24 },
  { product: "Ceramic mug set", category: "Home", price: 36 },
  { product: "Oak side table", category: "Home", price: 210 },
  { product: "Throw blanket", category: "Home", price: 72 },
  { product: "Wireless earbuds", category: "Electronics", price: 149 },
  { product: "Smart lamp", category: "Electronics", price: 64 },
  { product: "Portable speaker", category: "Electronics", price: 119 },
] as const;

function orders(input: unknown) {
  return lastDays(input).flatMap((date) => {
    const r = rng(`orders:${date}`);
    const weekend = weekday(date) === 0 || weekday(date) === 6;
    const count = Math.round((18 + r() * 14) * (weekend ? 1.35 : 1) * growth(date));
    return Array.from({ length: count }, (_, i) => {
      const p = pick(r, PRODUCTS, [9, 5, 4, 8, 5, 10, 6, 2, 4, 6, 5, 4]);
      const units = pick(r, [1, 1, 1, 2, 2, 3, 4]);
      const channel = pick(r, ["Web", "Mobile", "Retail"] as const, [5, 3 * growth(date), 2]);
      return {
        id: `${date.replaceAll("-", "")}-${i + 1}`,
        date,
        region: pick(r, ["North", "South", "East", "West"] as const, [3, 2, 3, 4]),
        channel,
        category: p.category,
        product: p.product,
        units,
        amount: Math.round(p.price * units * (0.85 + r() * 0.2) * 100) / 100,
      };
    });
  });
}

function tickets(input: unknown) {
  const all = lastDays(input);
  return all.flatMap((date, d) => {
    const r = rng(`tickets:${date}`);
    const age = all.length - 1 - d;
    const count = Math.round(6 + r() * 10);
    return Array.from({ length: count }, (_, i) => {
      const team = pick(r, ["Billing", "Technical", "Accounts", "Shipping"] as const, [3, 5, 2, 3]);
      const priority = pick(r, ["low", "normal", "high", "urgent"] as const, [3, 6, 3, 1]);
      const base = { Billing: 9, Technical: 22, Accounts: 6, Shipping: 14 }[team] * { low: 1.6, normal: 1, high: 0.6, urgent: 0.3 }[priority];
      const hours = Math.round(base * (0.4 + r() * 1.6) * 10) / 10;
      const solved = age * 24 > hours * 1.5 || r() < 0.2;
      const status = solved ? "solved" : r() < 0.6 ? "open" : "pending";
      const csat = Math.min(5, Math.max(1, Math.round(5.4 - hours / 14 - r() * 1.8)));
      return {
        id: `T-${date.replaceAll("-", "").slice(2)}${String(i + 1).padStart(2, "0")}`,
        opened: date,
        team,
        priority,
        status,
        ...(solved ? { hours, ...(r() < 0.7 ? { csat } : {}) } : {}),
      };
    });
  });
}

function traffic(input: unknown) {
  const sources = { Search: [1800, 0.021], Social: [950, 0.012], Email: [420, 0.045], Direct: [700, 0.03], Referral: [300, 0.035] } as const;
  return lastDays(input).flatMap((date) => {
    const r = rng(`traffic:${date}`);
    const weekend = weekday(date) === 0 || weekday(date) === 6;
    return Object.entries(sources).map(([source, [visits, rate]]) => {
      const v = Math.round(visits * (weekend ? 0.75 : 1) * growth(date) * (0.8 + r() * 0.4));
      return { date, source, visits: v, signups: Math.round(v * rate * (0.7 + r() * 0.6)) };
    });
  });
}

/** The function-map tool provider for `Renderer`. */
export const demoTools: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {
  get_orders: async (args) => ({ rows: orders(args) }),
  get_tickets: async (args) => ({ rows: tickets(args) }),
  get_traffic: async (args) => ({ rows: traffic(args) }),
};
