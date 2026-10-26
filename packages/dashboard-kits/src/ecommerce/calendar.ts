import { DAY, daysAgoOf as daysAgo, TODAY } from "../core/sample-data";

// The store's calendar: promotions, launches, stockouts, incidents, and
// tracking changes. The daily history reads demand from it and the charts
// annotate from it, so a shaded sale and the jump in orders always line up.

export type EventKind = "promo" | "launch" | "stockout" | "incident" | "measurement";

export interface StoreEvent {
  id: string;
  kind: EventKind;
  label: string;
  /** First day of the event, in days ago. */
  from: number;
  /** Last day of the event, in days ago; equal to `from` for a one-day marker. */
  to: number;
  detail: string;
  /** Promotions: orders against a normal day, and the share of gross sales discounted. */
  lift?: number;
  discountRate?: number;
  /** Promotions: how far orders dip below normal the day after, recovering over about 3 weeks. */
  dip?: number;
}

/** 52 weeks, so a day last year falls on the same weekday. */
export const LAST_YEAR = 364;

export const STORE_EVENTS: StoreEvent[] = [
  {
    id: "fall-sale",
    kind: "promo",
    label: "Fall sale",
    from: 14,
    to: 12,
    detail: "20% off sitewide, Sep 26–28",
    lift: 1.65,
    discountRate: 0.21,
    dip: 0.09,
  },
  {
    id: "tracking-change",
    kind: "measurement",
    label: "Cookie banner update",
    from: 21,
    to: 21,
    detail:
      "Visitors who decline cookies are no longer counted as sessions: about 7% fewer tracked sessions from Sep 19, so conversion rate reads higher",
  },
  {
    id: "trail-runner-launch",
    kind: "launch",
    label: "Trail Runner 2 launch",
    from: 44,
    to: 44,
    detail: "New colorways and a lighter sole, Aug 27",
  },
  {
    id: "carrier-miss",
    kind: "incident",
    label: "Carrier pickup missed",
    from: 5,
    to: 5,
    detail: "Oct 5 orders shipped a day late",
  },
  {
    id: "beanie-stockout",
    kind: "stockout",
    label: "Wool Beanie sold out",
    from: 3,
    to: 0,
    detail: "Out of stock since Oct 7; 800 units arrive in 4 days",
  },
  {
    id: "fall-sale-2025",
    kind: "promo",
    label: "Fall sale 2025",
    from: 14 + LAST_YEAR,
    to: 12 + LAST_YEAR,
    detail: "20% off sitewide, Sep 27–29, 2025",
    lift: 1.6,
    discountRate: 0.2,
    dip: 0.08,
  },
  {
    id: "bfcm-2025",
    kind: "promo",
    label: "Black Friday Cyber Monday",
    from: daysAgo(2025, 11, 28),
    to: daysAgo(2025, 12, 1),
    detail: "25% off sitewide, Nov 28 – Dec 1, 2025",
    lift: 2.4,
    discountRate: 0.25,
    dip: 0.14,
  },
];

/** Demand by calendar month against an average month, January first. */
const SEASON = [0.86, 0.9, 0.97, 1, 1, 0.97, 0.95, 0.98, 1, 1.03, 1.12, 1.22];

/** How busy a day's season is, before any promotion. */
export function seasonOn(ago: number): number {
  const date = new Date(TODAY - ago * DAY);
  // Gift shipping cuts off on Dec 22; the last days of December are quiet.
  const lateDecember = date.getUTCMonth() === 11 && date.getUTCDate() > 22;
  return lateDecember ? 0.92 : SEASON[date.getUTCMonth()];
}

/** How busy a day is: its season, any promotion running, and the dip after one. */
export function demandOn(ago: number): { lift: number; discountRate?: number } {
  let lift = seasonOn(ago);
  for (const event of STORE_EVENTS) {
    if (event.kind !== "promo") continue;
    if (ago <= event.from && ago >= event.to) {
      return { lift: lift * (event.lift ?? 1), discountRate: event.discountRate };
    }
    const after = event.to - ago;
    if (after > 0 && after <= 28) lift *= 1 - (event.dip ?? 0) * Math.exp(-after / 7);
  }
  return { lift };
}

/** Share of real sessions the store's analytics counts on a day. */
export const trackedSessions = (ago: number) =>
  ago <= (STORE_EVENTS.find((e) => e.id === "tracking-change")?.from ?? -1) ? 0.93 : 1;
