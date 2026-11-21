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

/**
 * Page order, by what the reader needs rather than by kind of chart: the answer, then what
 * explains it, then detail. With a Table registered, it names one as a home for the detail.
 */
function pageOrderNote() {
  const detail = isRegistered("Table")
    ? ", in a Table or another component built for many rows"
    : "";
  return `Page order: a lead Section titled "" holding one Kpis strip of three to five headline numbers and, under it, the views that answer the request. Then the Sections that explain or qualify the answer, then the detail behind it${detail}. Don't size Kpis: the strip lays them out. A number that needs a chart beside it is a Card with a Stat.`;
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
      'To skip an optional argument before one you need, pass null: Kpi("Signups", 2227, "number", null, null, "New accounts").',
      pageOrderNote,
      {
        text: "Layout: the views that answer the request get the most room. Views read against each other share a Row; views read one after another stack. A Donut or SegmentedBar takes half or a third of a Row beside a related Card, never a full Row alone. A Row of summary Cards (Stat, KeyValues, SegmentedBar, Goal) takes height 240, so no Card sits over empty space. Give a Row Cards of similar height: a three-row Table or a SegmentedBar beside a tall chart is stretched and left half empty.",
        needs: ["Donut", "SegmentedBar", "Stat", "KeyValues", "Goal"],
      },
      {
        text: "Charts are grouped below by the question they answer: Trends (over time), Comparison (across categories), Composition (part of a whole), Flow (between stages), Relationships (two measures or axes), Maps (by place). Pick the group by the question, then the chart. A chart has one value axis, so the series on it share a unit. To show how two measures in different units relate, plot one against the other in a Scatter, put them in neighbouring Table columns, or set two charts over the same labels side by side.",
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
      "One FilterBar first, for dashboard-wide filters only: date filter first, then segments several cards read (plan, region), then CompareToggle.",
      "A switch that changes only one card, such as what it's broken down by (channel or referring domain; device, browser or OS) or which metric it plots, belongs in that Card's controls, not the FilterBar. Its $variable feeds only that card's Query or data.",
      "A filter must change what is shown, but only cards whose numbers depend on it read it; point-in-time or cross-segment cards can ignore it. With data written into the program, key values by option: data[$period].mrr (nest keys for two filters: data[$period][$channel].signups).",
      "A filter opens on what the request is about: put that period or segment in its $variable's declaration, and give a date filter options that reach back over the data that exists.",
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
      {
        text: "A Kpi's chart adds what its number can't say: Progress when there is a target or a limit, Trend for where it has been heading, Split for what a total is made of, States for a status per period. Leave it out when it would only decorate.",
        needs: ["Kpi", "Trend", "Progress", "Split", "States"],
      },
      {
        text: "A few items compared on a few measures (three regions by orders, revenue and average order) read best as one Card per item, side by side: a Stat for its main number and KeyValues for the rest. A strip of item-by-measure Kpis is hard to read.",
        needs: ["Kpis", "Stat", "KeyValues"],
      },
    ],
  },
  {
    name: "Tables",
    components: ["Table", "Column"],
    notes: [
      'Table for several measures per row; Columns pick how each cell draws: "bar" for the measure the rows are ranked by, "delta" for a change, "sparkline" for each row\'s trend, "badge" or "states" for a status. Readers sort by any column, so one Table shows both extremes of a ranking, never split into separate lists.',
      'A "delta" Column left without a format prints a percent change ("+3.1%"). Format "percent" is for a change in a rate and prints points ("+0.4 pts"); "currency" and "number" print the change in that unit.',
      "A Table with more than four columns takes a full-width Row: in a narrower Card its last columns are cut off.",
    ],
  },
  // Charts are grouped by the question they answer, the same groups as the library's pages.
  {
    name: "Trends",
    components: ["TimeSeries", "Series", "Reference", "Marker", "SmallMultiples", "StatusTimeline"],
    notes: [
      'How a measure moves over time → TimeSeries (events → markers; share over time → stacked "percent"; projections → forecastFrom). Many series of one measure → SmallMultiples. Up, degraded or down per service over time → StatusTimeline.',
      'A Reference\'s chip prints its value after its label, so label it "Target", not "Target 1.2M".',
    ],
  },
  {
    name: "Comparison",
    components: ["Bars", "Leaderboard", "Dumbbell", "Distribution", "Intervals"],
    notes: [
      "Values across categories → Bars (variance around zero → diverging). A ranked top-N list to read → Leaderboard. Before → after per category → Dumbbell. Spread of values → Distribution. Estimates with uncertainty → Intervals.",
      "A Leaderboard longer than its Card is cut off: set limit to the rows that fit (8 in a 400 px Row), and leave a longer list to a Table, which pages.",
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
      "A Scatter reads well up to about 30 points. Plot the items that matter (the largest, or those past a threshold): hundreds of dots pile up and none is named.",
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
