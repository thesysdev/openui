import { DAY, daysAgoOf, TODAY } from "../../core/sample-data";

// Relay's calendar: the holiday, the launches, and the tracking and data
// problems. The population reads its weekly rhythm and the holiday from here,
// the charts annotate from it, and the explain engine checks it for data
// causes before product ones.

export type EventKind = "launch" | "incident" | "measurement" | "holiday";

export interface ProductEvent {
  id: string;
  kind: EventKind;
  label: string;
  /** First and last day, in days ago. */
  from: number;
  to: number;
  detail: string;
  /** Which platforms it touched; all when left out. */
  platforms?: ("web" | "ios" | "android")[];
  /** Only moved counts of users active on any event, not core actions or signups. */
  anyEventOnly?: boolean;
}

/** Days ago of a date this year. */
const daysAgo = (month: number, day: number) => daysAgoOf(2026, month, day);

export const PRODUCT_EVENTS: ProductEvent[] = [
  {
    id: "labor-day",
    kind: "holiday",
    label: "Labor Day week",
    from: daysAgo(9, 6),
    to: daysAgo(9, 10),
    detail: "US holiday on Sep 7: daily actives fell about 30% for the week",
  },
  {
    id: "checklist-v2",
    kind: "launch",
    label: "Onboarding checklist v2",
    from: daysAgo(9, 22),
    to: daysAgo(9, 22),
    detail: "Shipped to everyone after winning its experiment; activation rose about 10%",
  },
  {
    id: "widget-rollback",
    kind: "launch",
    label: "Quick-capture widget rolled back",
    from: daysAgo(9, 30),
    to: daysAgo(9, 30),
    detail:
      "Removed after losing its experiment: widget users added tasks but opened the app 4.2% less",
    platforms: ["ios", "android"],
  },
  {
    id: "ios-duplicate-events",
    kind: "measurement",
    label: "iOS duplicate events",
    from: daysAgo(10, 1),
    to: daysAgo(10, 3),
    detail:
      "iOS SDK 4.2 sent app_opened twice from background refresh: users counted active on any event rose; core actions were unaffected",
    platforms: ["ios"],
    anyEventOnly: true,
  },
  {
    id: "oct-8-restatement",
    kind: "measurement",
    label: "Oct 8 restated",
    from: daysAgo(10, 8),
    to: daysAgo(10, 8),
    detail: "Late events from the Android SDK arrived on Oct 9; Oct 8 was restated up 2.1%",
    platforms: ["android"],
  },
];

/** Return chance by weekday, Sunday first: a work tool goes quiet at weekends. */
export const WEEKDAY_FACTOR = [0.4, 1, 1, 1, 1, 1, 0.4];

const event = (id: string) => PRODUCT_EVENTS.find((e) => e.id === id)!;

/** The multiplier on everyone's chance of being active on a day. */
export function dayFactor(ago: number): number {
  const weekday = new Date(TODAY - ago * DAY).getUTCDay();
  const holiday = event("labor-day");
  return WEEKDAY_FACTOR[weekday]! * (ago <= holiday.from && ago >= holiday.to ? 0.7 : 1);
}

/** Days ago the onboarding checklist v2 shipped; signups after it activate more. */
export const CHECKLIST_SHIPPED = event("checklist-v2").from;

/** Whether the iOS duplicate-events bug was live on a day. */
export const iosDuplicates = (ago: number) => {
  const bug = event("ios-duplicate-events");
  return ago <= bug.from && ago >= bug.to;
};
