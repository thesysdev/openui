import { z } from "zod/v4";
import { groupComponents } from "./registeredGroups";

const LAYOUT = ["Dashboard", "Section", "Row", "Card"];
const byName = new Map(groupComponents.map((component) => [component.name, component]));

export const isRegistered = (name: string) => LAYOUT.includes(name) || byName.has(name);

/** What a Card's content holds, in his order (components/layout.tsx). */
export const CARD_CONTENT = [
  "Stat",
  "TimeSeries",
  "SmallMultiples",
  "Bars",
  "Dumbbell",
  "Distribution",
  "Donut",
  "Treemap",
  "Waterfall",
  "Intervals",
  "StatusTimeline",
  "Flow",
  "Scatter",
  "GeoMap",
  "PointMap",
  "Funnel",
  "Cohorts",
  "Heatmap",
  "Table",
  "Leaderboard",
  "Goal",
  "SegmentedBar",
  "KeyValues",
];
/** A Card's own controls. */
export const CARD_CONTROLS = ["ChipFilter", "SelectFilter"];
/** What a Section holds besides Rows. */
export const SECTION_ROWS = ["Kpis"];
/** What the Dashboard holds besides Sections. */
export const DASHBOARD_CHILDREN = ["FilterBar"];

/** The order components are listed in the prompt: his library.ts. */
export const COMPONENT_ORDER = [
  "Dashboard",
  "FilterBar",
  "PeriodPicker",
  "DateRangeFilter",
  "MultiSelectFilter",
  "SearchFilter",
  "ChipFilter",
  "SelectFilter",
  "CompareToggle",
  "Section",
  "Row",
  "Kpis",
  "Kpi",
  "Trend",
  "Progress",
  "Split",
  "States",
  "Card",
  "Stat",
  "TimeSeries",
  "Series",
  "Reference",
  "Marker",
  "SmallMultiples",
  "Bars",
  "Dumbbell",
  "Distribution",
  "Donut",
  "SegmentedBar",
  "Treemap",
  "Waterfall",
  "Intervals",
  "StatusTimeline",
  "Flow",
  "Scatter",
  "GeoMap",
  "PointMap",
  "Funnel",
  "Cohorts",
  "Heatmap",
  "Table",
  "Column",
  "Leaderboard",
  "Goal",
  "KeyValues",
  "KeyValue",
];

/** The registered components' refs among these names, in this order. */
export function refs(names: readonly string[]): z.ZodType[] {
  return names.flatMap((name) => {
    const component = byName.get(name);
    return component ? [component.ref as z.ZodType] : [];
  });
}

/** A union of these schemas; a slot nothing has registered for yet accepts no nodes. */
export function oneOf(schemas: z.ZodType[]): z.ZodType {
  if (schemas.length === 0) return z.never();
  if (schemas.length === 1) return schemas[0]!;
  return z.union(schemas as [z.ZodType, z.ZodType, ...z.ZodType[]]);
}

/** Sorts components into the prompt's order; anything not in his list goes last. */
export function inPromptOrder<T extends { name: string }>(components: T[]): T[] {
  const rank = (name: string) => {
    const index = COMPONENT_ORDER.indexOf(name);
    return index === -1 ? COMPONENT_ORDER.length : index;
  };
  return [...components].sort((a, b) => rank(a.name) - rank(b.name));
}
