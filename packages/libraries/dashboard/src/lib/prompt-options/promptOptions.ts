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
  "Use only the components listed under Component Signatures. This library has no Button, Select, SelectItem, Input, Form, FormControl, Tabs or text and markdown blocks, whatever other sections of these instructions mention. A choice the reader makes is a filter: PeriodPicker, DateRangeFilter, ChipFilter, SelectFilter, MultiSelectFilter, SearchFilter or CompareToggle. Words that explain a number go in a Card's subtitle or a Section's description.",
  "A dashboard only shows data. Never write a Mutation, a form or a refresh button.",
  "Arrays that go together have the same length and order: labels with values, a Series' values with its previous, every Column of one Table. Never write null for a value a component requires, such as a KeyValues row's value: leave that row or item out.",
  "Previous values are the same measure for the period before, in the same unit. When you don't have them, leave them out: never repeat the current values or invent a change.",
  "Without a data tool, write realistic, professional data into the program, and use only PeriodPicker, ChipFilter, SelectFilter and CompareToggle as filters. Give the data an entry for every option value, the default included, and read each number the filter changes from it: data[$period].revenue. DateRangeFilter and MultiSelectFilter need a data tool, because written values can't follow a free date range or several choices at once. SearchFilter only searches a Table: pass its $variable as that Table's search.",
  "With a data tool, load every number with Query. Pass each filter's $variable in the arguments of every Query it should change. Give each Query a default with the same shape as its result, with empty lists and no made-up numbers ({rows: []} for a tool that returns {rows: [...]}), and read its columns with a pluck: sales.rows.revenue. Sum or count rows with the built-in functions for headline numbers: @Sum(sales.rows.revenue).",
  'A Goal needs a target above 0. For a limit of zero, such as critical bugs or failed checks, show the count as a Kpi with goodWhen "down".',
  'A filter is connected only through its first argument, value, which takes a $variable: PeriodPicker($period, [...]), ChipFilter($by, [...], "Group by"), SearchFilter($q, "Search…"). A literal there ("30d") leaves the filter disconnected, so clicking it changes nothing. Put the starting value in the declaration: $period = "30d".',
  "Add a filter only when something can follow it. A date or period filter needs a data tool that takes a date, period or range argument; when no tool does (current counts such as stars, open issues or a latest version), add no date filter, and show the previous period with previous values or a comparison card instead. A filter whose $variable nothing reads does nothing: leave it out, and with no filters leave the FilterBar out.",
  'A CompareToggle shows previous values and nothing else, so give them wherever it applies: a Kpi\'s previous (Kpi("Revenue", 412600, "currency-compact", 398200)) and a Series\' previous. With live data and no tool that returns the period before, load it with a second Query of the same tool for the previous range, and pass its values as previous. Without previous values anywhere, add no CompareToggle.',
  "Put every dashboard-wide filter, SearchFilter included, in the one FilterBar listed first in Dashboard([...]). A second FilterBar, or one left out of Dashboard([...]), is never drawn.",
  'A pluck on a list of rows gives one value per row. @Filter(pkgs.rows, "name", "==", "react").downloads is a list holding that row\'s list, not its numbers, so @Sum of it is 0 and a chart of it is empty. To read one row, take it first: react = @First(@Filter(pkgs.rows, "name", "==", "react")), then react.downloads or react.total.',
  "Write the statements in this order: root, $variables, Queries, the FilterBar and Sections, then written-in data last.",
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
