import type { PromptOptions } from "@openuidev/react-lang";
import { examples } from "./examples";

// Rules, examples and promptOptions sit apart from the prompt groups, which read the registered
// components: a server route that imports only promptOptions then loads no component code, so
// nothing calls React's client APIs (createContext) where they don't exist.

/**
 * How to decide what a dashboard shows, before how to write it: what its reader came to find
 * out, the order that serves them, and what earns a place. They come first so they frame the
 * rules of the format below. Each carries its reason, because a model applies a rule better
 * when it knows what the rule is for.
 */
const designRules: string[] = [
  'A dashboard brings the important information together so its reader sees what is happening at a glance. Before writing, settle from the request who reads it, what they came to find out and what they already know: someone asking why sales fell has seen the fall and needs what is behind it. That decides what goes in and in what order. The audience and the purpose show in what you choose to show, never in labels such as "Board view".',
  "A request may arrive as a numbered list of sections and charts, written by someone who doesn't know this library. Take from it what the reader wants and which data to use, and cover what it asks to show. Its order and its chart types are suggestions: put the items in the order described next, choose each component yourself, and turn items that would tell the reader the same thing into one view.",
  "Order the page by what the reader needs. First the answer: a few headline numbers and the views that respond to the request most directly. Then what explains or qualifies it: the drivers, the comparison, the exception that stands out. Then detail to explore: the rows and items behind the answer, in a component built for many of them, such as a Table. Someone who stops after the first screen should already have the answer.",
  "The top of the page builds the big picture, so each headline number and each view in the opening Sections must tell the reader something the others there don't: a different measure, cause, comparison or exception that helps them see what they came to find out. Before adding one there, ask what the reader learns from it that the ones beside it haven't said. The same numbers in another chart, a count next to its share, a total over 6 months next to the same total over 12, two measures that rise and fall together: keep the one that says more. Detail Sections further down are for drilling in, so they may break down or list again what the top already shows, such as the table behind a chart.",
  "When two measures explain each other, show them in one view so the relationship is visible: a count with its rate (late orders and late rate per seller), volume with quality, a cause with its effect. A Scatter plots one against the other, a Table puts them in neighbouring columns, and two charts over the same labels sit side by side in one Row.",
  'Give the reader the controls the question implies, opened on what they asked about. Activity over time gets a period filter that opens on the period the request is about, or on the latest complete period when it names none; dates written out in a request ("Nov 1-19") are that opening value, not fixed text in every query. Months, regions or categories the reader would step through are one view with a filter, never one Section each. When the same view is worth reading in more than one way, make it one Card with a ChipFilter in its controls that switches between the readings, never two charts. When the reader should not have to click, show the right view and add no filters.',
  "A period still in progress looks like a fall beside complete ones. Say once that it is in progress, compare it with the same days of the earlier period or project it to its end (forecastFrom draws the projection dashed), and don't repeat the warning on every card.",
  'Write for someone scanning. A title names what is shown in a few plain words ("Late deliveries by seller"). Titles share one form: noun phrases, never a question, never the request restated, never a heading that could sit on any dashboard ("Overview", "Key insights", "Headline numbers"). A subtitle or description is one short sentence, and a caveat is stated once, where it applies. Labels read the way people write them: "Oct 2026", "Health & beauty", "Police Department", not "2026-10", "health_beauty" or "POLICE DEPARTMENT"; have the query return them that way.',
  "Choose each component for the point it makes, from the whole library. Beyond lines, bars and plain tables: a Kpi with Progress for a number with a target, or with Trend for its direction; a Card with a Stat and KeyValues for one item's numbers; Table columns drawn as bars, deltas, sparklines or badges for rows compared on several measures; a Leaderboard for a ranking; a SegmentedBar or Donut for a split; a Scatter for two measures per item; SmallMultiples for one measure across many groups; a Heatmap for a pattern across two dimensions.",
];

/**
 * Rules for generating a dashboard, beyond the notes on each component group. The base
 * openui-lang prompt is written for any library and names components this one doesn't have
 * (Button, Select, forms); these rules say what a dashboard is made of instead, and cover the
 * mistakes that make a card come out empty.
 */
export const additionalRules: string[] = [
  ...designRules,
  "Dashboard holds an optional FilterBar first, then Sections. A Section holds Kpis strips and Rows. A Row holds Cards. Every chart, map, Table, Stat, Goal and KeyValues goes inside a Card's content, never straight into a Row or a Section.",
  "root lists every Section, in page order. A Section that is defined but missing from root is never drawn, so decide all the Sections before you write root.",
  "Use only the components listed under Component Signatures. This library has no Button, Select, SelectItem, Input, Form, FormControl, Tabs or text and markdown blocks, whatever other sections of these instructions mention. A choice the reader makes is a filter. Words that explain a number go in a Card's subtitle or a Section's description; a Section titled \"\" shows no description.",
  "A dashboard only shows data. Never write a Mutation, a form or a refresh button.",
  "Arrays that go together have the same length and order: labels with values, a Series' values with its previous, every Column of one Table. Never write null for a value a component requires, such as a KeyValue's value: leave that row or item out.",
  "Previous values are the same measure for the period before, in the same unit. With live data and no tool that returns them, load them with a second Query for the previous range. When you don't have them, leave them out: never repeat the current values or invent a change.",
  "Without a data tool, write realistic, professional data into the program, and use only PeriodPicker, ChipFilter, SelectFilter and CompareToggle as filters. Give the data an entry for every option value, the default included. DateRangeFilter and MultiSelectFilter need a data tool, because written values can't follow a free date range or several choices at once.",
  "With a data tool, load every number with Query. Pass each filter's $variable in the arguments of every Query it should change. Give each Query a default with the same shape as its result, with empty lists and no made-up numbers ({rows: []} for a tool that returns {rows: [...]}), and read its columns with a pluck: sales.rows.revenue. Sum or count rows with the built-in functions for headline numbers: @Sum(sales.rows.revenue).",
  'A Goal needs a target above 0. For a limit of zero, such as critical bugs or failed checks, show the count as a Kpi with goodWhen "down".',
  'A filter is connected only through its first argument, value, which takes a $variable: PeriodPicker($period, [...]), ChipFilter($by, [...], "Group by"). A literal there ("30d") leaves the filter disconnected, so clicking it changes nothing. Put the starting value in the declaration: $period = "30d".',
  "Add a filter only when something can follow it. A date or period filter needs a data tool that takes a date, period or range argument; when no tool does (current counts such as stars, open issues or a latest version), add no date filter, and show the previous period with previous values or a comparison card instead. A filter whose $variable nothing reads does nothing: leave it out, and with no filters leave the FilterBar out.",
  "Only one FilterBar is drawn, the one listed first in Dashboard([...]): put every dashboard-wide filter in it.",
  "A Marker's label is cut off at the plot's edge when it sits on a chart's first or last label. For a period in progress, say so in the subtitle or use forecastFrom instead.",
  'When a filter sets the period, never write a period ("Last 30 days") in a title, subtitle or hint.',
  'A pluck on a list of rows gives one value per row. @Filter(pkgs.rows, "name", "==", "react").downloads is a list holding that row\'s list, not its numbers, so @Sum of it is 0 and a chart of it is empty. To read one row, take it first, then its fields: react = @First(@Filter(pkgs.rows, "name", "==", "react")), then react.downloads. The same for a result of one row: totals = @First(sales.rows), then Kpi("Revenue", totals.revenue, "currency-compact"). @Filter returns the list of rows itself, so pluck from it directly: y25 = @Filter(pay.rows, "year", "==", 2025), then y25.median, never y25.rows.median.',
  "Write the statements in this order: root, $variables, Queries and the strings they are built from, the FilterBar and Sections, then written-in data last.",
];

/**
 * Prompt options for the dashboard library: pass to `library.prompt(promptOptions)`, or spread
 * `examples` and `additionalRules` into your own options beside your own preamble.
 */
export const promptOptions: PromptOptions = {
  preamble:
    "You are generating an openui-lang dashboard: you decide what it shows from what its reader came to find out, then write it.",
  examples,
  additionalRules,
  bindings: true,
};
