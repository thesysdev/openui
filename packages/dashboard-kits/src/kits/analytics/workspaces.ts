import { random } from "../../core/sample-data";

// Relay's 8,000 paying workspaces, most of them small teams: about 300 new
// ones a month (the monetisation funnel) at roughly 1.5% churn settles here. Each has seats paid for, claimed, and
// active, a plan and price, feature breadth, support history, a renewal
// date, and a latent engagement that drives all of it. Ten named workspaces
// keep their stories (Harbor & Pine slipping, Kestrel Labs ready to expand).
//
// Health is a weighted score a person can read (our rule):
//   health = Σ wᵢ·sᵢ ÷ Σ wᵢ over the categories that have data, each sᵢ 0–100
//   weights: engagement 35 · seats 25 · feature breadth 15 · support 15 · trend 10
//   70–100 healthy · 40–69 watch · under 40 at risk · a drop of 15+ in 7 days: review now

export const PAYING_WORKSPACES = 8000;
const PRICE_PER_SEAT = { Team: 20, Business: 40 } as const;

export interface Workspace {
  id: string;
  name: string;
  plan: "Team" | "Business";
  seats: number;
  claimed: number;
  /** Seats with a core action in the last 7 and 28 days, and 90 days ago over 28 days. */
  active7: number;
  active28: number;
  active28Before: number;
  /** Members who did a core action this week, and how many of 11 features they used. */
  members: number;
  breadth: number;
  /** Support tickets in the last 90 days, unknown for some (their category drops out). */
  tickets?: number;
  mrr: number;
  renewalInDays: number;
  lastActiveDays: number;
  /** Median days between days with a core action, last 60 days. */
  usualGap: number;
  /** Health a week, 30 days, and 90 days ago. */
  scoreWeekAgo: number;
  score30Ago: number;
  score90Ago: number;
  /** Whether the workspace cancelled in the last 90 days (for the back-test). */
  churned: boolean;
}

export const HEALTH_WEIGHTS = {
  engagement: 35,
  seats: 25,
  breadth: 15,
  support: 15,
  trend: 10,
} as const;
export type HealthCategory = keyof typeof HEALTH_WEIGHTS;

const clamp = (v: number) => Math.max(0, Math.min(100, v));

/** Each category's 0–100 sub-score; support is missing when a workspace has no ticket history. */
export function healthParts(w: Workspace): Partial<Record<HealthCategory, number>> {
  const trendRatio = w.active28 / Math.max(1, w.active28Before);
  return {
    engagement: clamp((w.members / Math.max(1, w.claimed)) * 140),
    seats: clamp((w.active28 / Math.max(1, w.seats)) * 110),
    breadth: clamp((w.breadth / 7) * 100),
    ...(w.tickets != null ? { support: clamp(100 - w.tickets * 12) } : {}),
    trend: clamp(50 + (trendRatio - 1) * 150),
  };
}

/** The weighted score over the categories that have data. */
export function healthScore(parts: Partial<Record<HealthCategory, number>>): number {
  let total = 0;
  let weight = 0;
  for (const [k, v] of Object.entries(parts) as [HealthCategory, number][]) {
    total += v * HEALTH_WEIGHTS[k];
    weight += HEALTH_WEIGHTS[k];
  }
  return weight ? Math.round(total / weight) : 0;
}

export const zoneOf = (score: number) =>
  score >= 70 ? "Healthy" : score >= 40 ? "Watch" : "At risk";

/** No core action for more than twice the workspace's usual gap. */
export const isSlipping = (w: Workspace) => w.lastActiveDays > 2 * w.usualGap;
/** Most seats in use and a renewal coming: room to add seats. */
export const isExpansionReady = (w: Workspace) =>
  w.active28 / w.seats > 0.8 && w.renewalInDays <= 90;
/** At risk by score, or active seats down 30% or more on their prior 90 days. */
export const isArrAtRisk = (w: Workspace, score: number) =>
  score < 40 || w.active28 <= w.active28Before * 0.7;

/** Account-active rules: anyone active, a team (3+ members), or half the seats. */
export type AccountActive = "any" | "team" | "seats";
export function isAccountActive(w: Workspace, rule: AccountActive, members = w.members): boolean {
  if (rule === "any") return members >= 1;
  if (rule === "team") return members >= 3;
  return w.active28 / w.seats >= 0.5;
}

const FIRST = [
  "Cedar",
  "Harbor",
  "Atlas",
  "Pioneer",
  "Copper",
  "Juniper",
  "Meridian",
  "Summit",
  "Willow",
  "Granite",
  "Lumen",
  "Orbit",
  "Beacon",
  "Northwind",
  "Riverbend",
  "Sable",
  "Tidewater",
  "Vantage",
  "Aspen",
  "Bluefin",
];
const SECOND = [
  "Analytics",
  "Health",
  "Logistics",
  "Media",
  "Studio",
  "Labs",
  "Retail",
  "Partners",
  "Systems",
  "Works",
  "Group",
  "Capital",
  "Design",
  "Foods",
  "Energy",
  "Education",
];

/**
 * The ten workspaces the kit's stories are about. Their history is stated as
 * how much the score moved in the last 7 and 30 days.
 */
const NAMED: (Partial<Workspace> & { weekChange: number; monthChange: number })[] = [
  {
    name: "Orbit Fintech",
    plan: "Business",
    seats: 320,
    active7: 291,
    active28: 305,
    active28Before: 298,
    members: 280,
    breadth: 8,
    tickets: 2,
    renewalInDays: 210,
    lastActiveDays: 0,
    usualGap: 1,
    weekChange: 0,
    monthChange: 1,
  },
  {
    name: "Northwind Logistics",
    plan: "Business",
    seats: 240,
    active7: 212,
    active28: 226,
    active28Before: 214,
    members: 205,
    breadth: 7,
    tickets: 1,
    renewalInDays: 140,
    lastActiveDays: 0,
    usualGap: 1,
    weekChange: 1,
    monthChange: 3,
  },
  {
    name: "Granite Works",
    plan: "Business",
    seats: 210,
    active7: 118,
    active28: 140,
    active28Before: 176,
    members: 101,
    breadth: 4,
    tickets: 6,
    renewalInDays: 75,
    lastActiveDays: 0,
    usualGap: 1,
    weekChange: -3,
    monthChange: -6,
  },
  {
    name: "Brightline Health",
    plan: "Business",
    seats: 180,
    active7: 96,
    active28: 118,
    active28Before: 166,
    members: 88,
    breadth: 5,
    tickets: 4,
    renewalInDays: 41,
    lastActiveDays: 1,
    usualGap: 1,
    weekChange: -4,
    monthChange: -9,
  },
  {
    name: "Summit Analytics",
    plan: "Business",
    seats: 150,
    active7: 131,
    active28: 138,
    active28Before: 140,
    members: 120,
    breadth: 6,
    renewalInDays: 300,
    lastActiveDays: 0,
    usualGap: 1,
    weekChange: 0,
    monthChange: -2,
  },
  {
    name: "Lumen Retail",
    plan: "Team",
    seats: 80,
    active7: 71,
    active28: 74,
    active28Before: 69,
    members: 66,
    breadth: 6,
    tickets: 1,
    renewalInDays: 120,
    lastActiveDays: 0,
    usualGap: 1,
    weekChange: 1,
    monthChange: 4,
  },
  {
    name: "Kestrel Labs",
    plan: "Team",
    seats: 64,
    active7: 61,
    active28: 62,
    active28Before: 58,
    members: 58,
    breadth: 7,
    tickets: 0,
    renewalInDays: 60,
    lastActiveDays: 0,
    usualGap: 1,
    weekChange: 1,
    monthChange: 2,
  },
  {
    name: "Harbor & Pine",
    plan: "Team",
    seats: 45,
    active7: 18,
    active28: 26,
    active28Before: 41,
    members: 14,
    breadth: 3,
    tickets: 5,
    renewalInDays: 33,
    lastActiveDays: 3,
    usualGap: 1,
    weekChange: -15,
    monthChange: -15,
  },
  {
    name: "Tidewater Media",
    plan: "Team",
    seats: 38,
    active7: 9,
    active28: 14,
    active28Before: 30,
    members: 7,
    breadth: 2,
    tickets: 3,
    renewalInDays: 88,
    lastActiveDays: 9,
    usualGap: 2,
    weekChange: -7,
    monthChange: -12,
  },
  {
    name: "Bluefin Studio",
    plan: "Team",
    seats: 22,
    active7: 20,
    active28: 21,
    active28Before: 19,
    members: 19,
    breadth: 6,
    renewalInDays: 180,
    lastActiveDays: 0,
    usualGap: 1,
    weekChange: 1,
    monthChange: 5,
  },
];

/** "Cedar Analytics", then "Cedar Analytics 2" once every pairing is used; never a named workspace's. */
function uniqueName(i: number, taken: Set<string>): string {
  const pairs = FIRST.length * SECOND.length;
  for (let k = i; ; k += pairs) {
    const base = `${FIRST[k % FIRST.length]} ${SECOND[Math.floor(k / FIRST.length) % SECOND.length]}`;
    const round = Math.floor(k / pairs);
    const name = round ? `${base} ${round + 1}` : base;
    if (!taken.has(name)) {
      taken.add(name);
      return name;
    }
  }
}

let cache: Workspace[] | undefined;

export function workspaces(): Workspace[] {
  if (cache) return cache;
  const next = random("workspaces");
  const out: Workspace[] = NAMED.map(({ weekChange, monthChange, ...n }, i) => {
    const w = {
      id: `named-${i}`,
      churned: false,
      // Active members hold claimed seats, so claimed is never below active.
      claimed: Math.max(Math.round(n.seats! * 0.96), n.active28!),
      mrr: n.seats! * PRICE_PER_SEAT[n.plan!],
      scoreWeekAgo: 0,
      score30Ago: 0,
      score90Ago: 0,
      ...n,
    } as Workspace;
    const now = healthScore(healthParts(w));
    w.scoreWeekAgo = now - weekChange;
    w.score30Ago = now - monthChange;
    w.score90Ago = Math.round(now - monthChange * 2 + (next() - 0.4) * 8);
    return w;
  });
  const taken = new Set(out.map((w) => w.name));
  const generated = (i: number): Workspace => {
    // Mostly small Team workspaces (a median near 6 seats), and a tenth on Business.
    const plan = next() < 0.9 ? "Team" : "Business";
    const seats = Math.round(plan === "Team" ? 3 + 45 * next() ** 3 : 40 + 320 * next() ** 1.8);
    // Latent engagement, skewed healthy: most workspaces use what they pay for.
    const e = Math.min(0.98, Math.max(0.05, 0.78 - 0.55 * next() ** 2.4 + (next() - 0.5) * 0.18));
    const claimed = Math.round(seats * (0.82 + 0.17 * next()));
    const active28 = Math.round(claimed * Math.min(1, e * (0.95 + 0.1 * next())));
    const drift = (next() - 0.55) * 0.5;
    const active28Before = Math.max(1, Math.round(active28 / Math.max(0.3, 1 + drift)));
    const active7 = Math.round(active28 * (0.7 + 0.25 * e));
    const usualGap = Math.max(1, Math.round(1 + (1 - e) * 6 * next()));
    const quiet = e < 0.3 && next() < 0.5;
    const w: Workspace = {
      id: `ws-${i}`,
      name: uniqueName(i, taken),
      plan,
      seats,
      claimed,
      active7,
      active28,
      active28Before,
      members: Math.round(active7 * (0.85 + 0.1 * next())),
      breadth: Math.max(1, Math.round(1 + e * 7 * (0.7 + 0.5 * next()))),
      ...(next() < 0.8 ? { tickets: Math.floor(next() * next() * 8) } : {}),
      mrr: seats * PRICE_PER_SEAT[plan],
      renewalInDays: 1 + Math.floor(next() * 365),
      lastActiveDays: quiet
        ? usualGap * 2 + Math.floor(next() * 10)
        : Math.floor(next() * usualGap),
      usualGap,
      scoreWeekAgo: 0,
      score30Ago: 0,
      score90Ago: 0,
      churned: false,
    };
    const now = healthScore(healthParts(w));
    w.scoreWeekAgo = Math.round(now - drift * 6 + (next() - 0.5) * 4);
    w.score30Ago = Math.round(now - drift * 20 + (next() - 0.5) * 6);
    w.score90Ago = Math.max(0, Math.min(100, Math.round(now - drift * 40 + (next() - 0.5) * 10)));
    return w;
  };
  for (let i = out.length; i < PAYING_WORKSPACES; i++) out.push(generated(i));
  // Churn over the last 90 days, more likely the lower the score was then.
  for (const w of out.slice(NAMED.length)) {
    w.churned = next() < 0.55 * (1 - w.score90Ago / 100) ** 2.2;
  }
  // Those that cancelled stay for the back-test only; as many workspaces
  // joined since, so PAYING_WORKSPACES are paying today.
  const cancelled = out.filter((w) => w.churned).length;
  for (let k = 0; k < cancelled; k++) out.push(generated(out.length));
  cache = out;
  return out;
}

/** The workspaces paying today: every one but those that cancelled in the last 90 days. */
export const payingWorkspaces = () => workspaces().filter((w) => !w.churned);

/** Churn by health band 90 days ago: does a low score back then predict leaving? */
export function backTest(list: Workspace[]) {
  const bands = [
    { label: "Under 40", test: (s: number) => s < 40 },
    { label: "40–69", test: (s: number) => s >= 40 && s < 70 },
    { label: "70 and up", test: (s: number) => s >= 70 },
  ];
  return bands.map((b) => {
    const inBand = list.filter((w) => b.test(w.score90Ago));
    const churned = inBand.filter((w) => w.churned).length;
    return {
      label: b.label,
      workspaces: inBand.length,
      churned,
      rate: inBand.length ? churned / inBand.length : 0,
    };
  });
}
