"use client";

import { useSpreadsheetSync } from "@/app/useSpreadsheetSync";
import {
  additionalRules,
  componentGroups,
  examples,
  library,
  promptOptions as intelligentPromptOptions,
} from "@openuidev/intelligent-ui-library";
import { z } from "zod";
import { createLibrary, defineComponent, type PromptOptions } from "@openuidev/react-lang";

export const SpreadsheetTable = defineComponent({
  name: "SpreadsheetTable",
  description:
    "Syncs data to the live spreadsheet panel. ONLY use this AFTER modification tools " +
    "(update_cells, add_rows, delete_rows, set_formula, add_column) to push updated data " +
    "to the user's spreadsheet. NEVER use for read-only display. Always include colHeaders.",
  props: z.object({
    data: z
      .array(z.array(z.union([z.string(), z.number(), z.null()])))
      .describe(
        "2D array of cell values. Each inner array is a row. Values can be numbers, strings, or Excel-like formulas starting with =",
      ),
    colHeaders: z.array(z.string()).optional().describe("Array of column header names"),
  }),
  component: function SpreadsheetSync({ props }) {
    useSpreadsheetSync(props.data, props.colHeaders);
    return null;
  },
});

export const spreadsheetLibrary = createLibrary({
  root: "Col",
  componentGroups,
  functions: Object.values(library.functions),
  components: [...Object.values(library.components), SpreadsheetTable],
});

export const promptOptions: PromptOptions = {
  ...intelligentPromptOptions,
  preamble:
    "You are a spreadsheet assistant. The user sees a live spreadsheet on the left panel. For read-only requests use Text, Markdown, Table, and Chart. For write requests, after using tools emit SpreadsheetTable to sync changes to the live spreadsheet.",
  additionalRules: [
    ...additionalRules,
    "ALWAYS output valid OpenUI Lang with root = Col([...]). Never output plain text or markdown outside of OpenUI Lang.",
    "For READ-ONLY requests: use Text, Markdown, Table, and Chart. Do NOT use SpreadsheetTable.",
    "For WRITE requests: after calling modification tools and get_table_data, emit SpreadsheetTable with the full updated data and colHeaders to sync changes to the live spreadsheet. Also include Text explaining what changed.",
    "Only call modification tools when the user explicitly requests changes.",
  ],
  examples: [
    ...examples,
    `root = Col([Title("Sales Summary"), Text("Your spreadsheet has 5 products with quarterly sales data. Total revenue across all products is $45,350."), followups])
followups = Row([Button("Visualize sales trends", @ToAssistant("Visualize sales trends"), "outline"), Button("Add a new product", @ToAssistant("Add a new product"), "outline")])`,
    `root = Col([Title("Q1-Q4 Revenue Comparison"), chart, followups])
chart = Chart("bar", [{quarter: "Q1", WidgetA: 1500, WidgetB: 1200}, {quarter: "Q2", WidgetA: 1800, WidgetB: 1400}, {quarter: "Q3", WidgetA: 2100, WidgetB: 1600}, {quarter: "Q4", WidgetA: 2400, WidgetB: 1900}], "quarter", ["WidgetA", "WidgetB"])
followups = Row([Button("Show as a table", @ToAssistant("Show as a table"), "outline"), Button("Compare Q1 vs Q4", @ToAssistant("Compare Q1 vs Q4"), "outline")])`,
    `root = Col([Title("Revenue by Category"), chart, followups])
chart = Chart("donut", [{category: "Laptops", revenue: 236800}, {category: "Phones", revenue: 521700}, {category: "Audio", revenue: 149200}, {category: "Tablets", revenue: 104100}], "category", ["revenue"])
followups = Row([Button("Show as a bar chart", @ToAssistant("Show as a bar chart"), "outline"), Button("Break down by quarter", @ToAssistant("Break down by quarter"), "outline")])`,
    `root = Col([Text("Done! I added Widget C with quarterly sales and a SUM formula for Total."), followups, sheet])
followups = Row([Button("Add another product", @ToAssistant("Add another product"), "outline"), Button("Show updated totals", @ToAssistant("Show updated totals"), "outline")])
sheet = SpreadsheetTable([["Widget A", 1500, 1800, 2100, 2400, "=SUM(B1:E1)"], ["Widget B", 1200, 1400, 1600, 1900, "=SUM(B2:E2)"], ["Widget C", 500, 600, 700, 800, "=SUM(B3:E3)"]], ["Product", "Q1 Sales", "Q2 Sales", "Q3 Sales", "Q4 Sales", "Total"])`,
  ],
};
