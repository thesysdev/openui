import type { PromptOptions } from "@openuidev/react-lang";
import { examples } from "./examples";

// Rules, examples and promptOptions sit apart from the prompt groups, which read the registered
// components: a server route that imports only promptOptions then loads no component code, so
// nothing calls React's client APIs (createContext) where they don't exist.

/**
 * Rules for generating a dashboard, beyond the notes on each component group. The base
 * openui-lang prompt is written for any library and names components this one doesn't have
 * (Button, Select, forms); these rules say what a dashboard is made of instead, and cover the
 * mistakes that make a card come out empty.
 */
export const additionalRules: string[] = [
  "Dashboard holds an optional FilterBar first, then Sections. A Section holds Kpis strips and Rows. A Row holds Cards. Every chart, map, Table, Stat, Goal and KeyValues goes inside a Card's content, never straight into a Row or a Section.",
  "Use only the components listed under Component Signatures. This library has no Button, Select, SelectItem, Input, Form, FormControl, Tabs or text and markdown blocks, whatever other sections of these instructions mention. A choice the reader makes is a filter. Words that explain a number go in a Card's subtitle or a Section's description.",
  "A dashboard only shows data. Never write a Mutation, a form or a refresh button.",
  "Arrays that go together have the same length and order: labels with values, a Series' values with its previous, every Column of one Table. Never write null for a value a component requires, such as a KeyValue's value: leave that row or item out.",
  "Previous values are the same measure for the period before, in the same unit. With live data and no tool that returns them, load them with a second Query for the previous range. When you don't have them, leave them out: never repeat the current values or invent a change.",
  "Without a data tool, write realistic, professional data into the program, and use only PeriodPicker, ChipFilter, SelectFilter and CompareToggle as filters. Give the data an entry for every option value, the default included. DateRangeFilter and MultiSelectFilter need a data tool, because written values can't follow a free date range or several choices at once.",
  "With a data tool, load every number with Query. Pass each filter's $variable in the arguments of every Query it should change. Give each Query a default with the same shape as its result, with empty lists and no made-up numbers ({rows: []} for a tool that returns {rows: [...]}), and read its columns with a pluck: sales.rows.revenue. Sum or count rows with the built-in functions for headline numbers: @Sum(sales.rows.revenue).",
  'A Goal needs a target above 0. For a limit of zero, such as critical bugs or failed checks, show the count as a Kpi with goodWhen "down".',
  'A filter is connected only through its first argument, value, which takes a $variable: PeriodPicker($period, [...]), ChipFilter($by, [...], "Group by"). A literal there ("30d") leaves the filter disconnected, so clicking it changes nothing. Put the starting value in the declaration: $period = "30d".',
  "Add a filter only when something can follow it. A date or period filter needs a data tool that takes a date, period or range argument; when no tool does (current counts such as stars, open issues or a latest version), add no date filter, and show the previous period with previous values or a comparison card instead. A filter whose $variable nothing reads does nothing: leave it out, and with no filters leave the FilterBar out.",
  "Only one FilterBar is drawn, the one listed first in Dashboard([...]): put every dashboard-wide filter in it.",
  'When a filter sets the period, never write a period ("Last 30 days") in a title, subtitle or hint.',
  'A pluck on a list of rows gives one value per row. @Filter(pkgs.rows, "name", "==", "react").downloads is a list holding that row\'s list, not its numbers, so @Sum of it is 0 and a chart of it is empty. To read one row, take it first, then its fields: react = @First(@Filter(pkgs.rows, "name", "==", "react")), then react.downloads. The same for a result of one row: totals = @First(sales.rows), then Kpi("Revenue", totals.revenue, "currency-compact").',
  "Write the statements in this order: root, $variables, Queries and the strings they are built from, the FilterBar and Sections, then written-in data last.",
];

/**
 * Prompt options for the dashboard library: pass to `library.prompt(promptOptions)`, or spread
 * `examples` and `additionalRules` into your own options beside your own preamble.
 */
export const promptOptions: PromptOptions = {
  preamble: "You are generating an openui-lang dashboard.",
  examples,
  additionalRules,
  bindings: true,
};
