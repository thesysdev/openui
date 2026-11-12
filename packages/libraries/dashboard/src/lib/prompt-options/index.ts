import type { ComponentGroup } from "@openuidev/react-lang";
import { FORMAT_PRESETS } from "../../shared/format";
import { WIDTHS } from "../../shared/schema";
import { isRegistered } from "../defineComponents";

/**
 * His prompt groups and notes (library.ts), written out in full once. A group shows only the
 * components registered so far and is left out while it has none, and a note that names
 * components not registered yet waits for them. Once every group ticket has landed the prompt
 * is his, word for word, and no group ticket needs to edit this file.
 */
type Note = string | { text: string; needs: string[] } | (() => string | null);

type PromptGroup = { name: string; components: string[]; notes: Note[] };

const all = (names: string[]) => names.every(isRegistered);

/** "Give previous-period values wherever they exist (…)": lists only components that exist. */
function previousValuesNote() {
  const takers = ["Kpi", "Stat", "Series", "Funnel", "Leaderboard", "GeoMap"].filter(isRegistered);
  const toggle = isRegistered("CompareToggle") ? " and add a CompareToggle" : "";
  return `Give previous-period values wherever they exist (${takers.join(", ")})${toggle}.`;
}

/** Story order: his text once trends and tables exist; until then, without them. */
function storyOrderNote() {
  const tail = all(["TimeSeries", "Table"])
    ? "then trends, then breakdowns, then detail tables"
    : "then Rows of Cards";
  return `Story order: a lead Section with one Kpis strip of 3–6 headline numbers, ${tail}. Don't size Kpis: the strip lays them out. A number that needs a chart beside it is a Card with a Stat.`;
}

const PROMPT_GROUPS: PromptGroup[] = [
  {
    name: "Structure",
    components: ["Dashboard", "Section", "Row", "Card"],
    notes: [
      `Shared argument types: Format = ${FORMAT_PRESETS.map((preset) => `"${preset}"`).join(" | ")}, or {type, currency?, decimals?, prefix?, suffix?} to override, e.g. {type: "number", suffix: " seats"}. Width = ${WIDTHS.map((width) => `"${width}"`).join(" | ")}. GoodWhen = "up" | "down" | "neutral": which direction of change is good news.`,
      'Numbers are raw with a Format; never formatted strings like "$1.2K" or "12%". percent values are already percentages (18.4 = 18.4%); ratio is for fractions; duration is seconds, ms milliseconds, days days. A Kpi\'s text value is for words (a plan, a status, a version), never a number.',
      {
        text: "A pluck reads one column across a list of rows: where a Query result r holds its rows as objects in r.rows, r.rows.day is every row's day, so TimeSeries(r.rows.day, [Series(\"Events\", r.rows.events)]). Read each tool's result in the shape that tool describes, and ask a query for exactly the rows and columns a card shows.",
        needs: ["TimeSeries", "Series"],
      },
      'To skip an optional argument before one you need, pass null: Kpi("Signups", 2227, "number", null, null, "Last 30 days").',
      storyOrderNote,
      "Rows hold Cards only; their widths add up to a full row.",
      {
        text: "Charts are grouped below by the question they answer: Trends (over time), Comparison (across categories), Composition (part of a whole), Flow (between stages), Relationships (two measures or axes), Maps (by place). Pick the group by the question, then the chart. One unit per chart (no dual axes); split different units into separate charts.",
        needs: ["TimeSeries", "Bars", "Donut", "Funnel", "Scatter", "GeoMap"],
      },
    ],
  },
  {
    name: "Filters",
    components: [
      "FilterBar",
      "PeriodPicker",
      "DateRangeFilter",
      "ChipFilter",
      "SelectFilter",
      "MultiSelectFilter",
      "SearchFilter",
      "CompareToggle",
    ],
    notes: [
      "One FilterBar first, for dashboard-wide filters only: date filter first, then segments several cards read (plan, region), then CompareToggle, and SearchFilter last.",
      "A switch that changes only one card, such as what it's broken down by (channel or referring domain; device, browser or OS) or which metric it plots, belongs in that Card's controls, not the FilterBar. Its $variable feeds only that card's Query or data.",
      'A filter must change what is shown, but only cards whose numbers depend on it read it; point-in-time or cross-segment cards can ignore it. Declare $period = "30d" and pass $period to the filter. With live data, pass the $variable into the data tool\'s arguments so the Query reloads when it changes. With data written into the program, key values by option: data[$period].mrr (nest keys for two filters: data[$period][$channel].signups).',
    ],
  },
  {
    name: "Metrics",
    components: [
      "Kpis",
      "Kpi",
      "Trend",
      "Progress",
      "Split",
      "States",
      "Stat",
      "KeyValues",
      "KeyValue",
      "Goal",
    ],
    notes: [
      previousValuesNote,
      'Set goodWhen "down" for metrics where lower is better: costs, CAC, churn, latency, errors.',
    ],
  },
  {
    name: "Tables",
    components: ["Table", "Column"],
    notes: ["Table for several measures per row; Columns pick how each cell draws."],
  },
  // Charts are grouped by the question they answer, the same groups as the library's pages.
  {
    name: "Trends",
    components: ["TimeSeries", "Series", "Reference", "Marker", "SmallMultiples", "StatusTimeline"],
    notes: [
      'How a measure moves over time → TimeSeries (events → markers; share over time → stacked "percent"; projections → forecastFrom). Many series of one measure → SmallMultiples. Up, degraded or down per service over time → StatusTimeline.',
    ],
  },
  {
    name: "Comparison",
    components: ["Bars", "Leaderboard", "Dumbbell", "Distribution", "Intervals"],
    notes: [
      "Values across categories → Bars (variance around zero → diverging). A ranked top-N list to read → Leaderboard. Before → after per category → Dumbbell. Spread of values → Distribution. Estimates with uncertainty → Intervals.",
    ],
  },
  {
    name: "Composition",
    components: ["Donut", "SegmentedBar", "Treemap", "Waterfall"],
    notes: [
      "Part of a whole → Donut when the total is the headline, SegmentedBar for a compact strip; both take up to 8 parts. Treemap for many or nested parts. How a total moved → Waterfall.",
    ],
  },
  {
    name: "Flow",
    components: ["Funnel", "Flow"],
    notes: [
      "Ordered conversion steps → Funnel; start it at the first meaningful step (signup started), not raw traffic, and show traffic as a Kpi. Paths between stages → Flow.",
    ],
  },
  {
    name: "Relationships",
    components: ["Scatter", "Heatmap", "Cohorts"],
    notes: [
      "Two measures per item → Scatter. Magnitude across two categorical axes → Heatmap. Retention by cohort → Cohorts.",
    ],
  },
  {
    name: "Maps",
    components: ["GeoMap", "PointMap"],
    notes: ["By country or US state → GeoMap. At places such as stores or cities → PointMap."],
  },
];

function noteText(note: Note): string | null {
  if (typeof note === "string") return note;
  if (typeof note === "function") return note();
  return all(note.needs) ? note.text : null;
}

export { examples } from "./examples";
export { additionalRules, promptOptions } from "./promptOptions";

/** The prompt groups for the components registered so far. */
export function promptGroups(): ComponentGroup[] {
  return PROMPT_GROUPS.flatMap((group) => {
    const components = group.components.filter(isRegistered);
    if (!components.length) return [];
    const notes = group.notes.map(noteText).filter((note): note is string => note !== null);
    return [{ name: group.name, components, notes }];
  });
}
