"use client";

import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { z } from "zod";
import type { PromptOptions } from "@openuidev/react-lang";

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
        "2D array of cell values. Each inner array is a row. Values can be numbers, strings, or Excel-like formulas starting with ="
      ),
    colHeaders: z
      .array(z.string())
      .optional()
      .describe("Array of column header names"),
  }),
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useSpreadsheetSync } = require("@/app/useSpreadsheetSync");
    useSpreadsheetSync(props.data, props.colHeaders);
    return null;
  },
});

export const spreadsheetLibrary = createLibrary({
  root: openuiLibrary.root ?? "Stack",
  componentGroups: openuiLibrary.componentGroups,
  components: [...Object.values(openuiLibrary.components), SpreadsheetTable],
});

export const promptOptions: PromptOptions = {
  preamble:
    "You are a spreadsheet assistant. The user sees a live spreadsheet on the left panel. Always respond in OpenUI Lang (root = Stack([...])). For read-only requests use TextContent, Table, charts. For write requests, after using tools emit SpreadsheetTable to sync changes to the live spreadsheet.",
  additionalRules: [
    "ALWAYS output valid OpenUI Lang with root = Stack([...]). Never output plain text or markdown outside of OpenUI Lang.",
    "For READ-ONLY requests: use TextContent, MarkDownRenderer, Table, BarChart, LineChart, PieChart. Do NOT use SpreadsheetTable.",
    "For WRITE requests: after calling modification tools and get_table_data, emit SpreadsheetTable with the full updated data and colHeaders to sync changes to the live spreadsheet. Also include a TextContent explaining what changed.",
    "Only call modification tools when the user explicitly requests changes.",
  ],
  examples: [
    `root = Stack([title, info, followups])\ntitle = TextContent("Sales Summary", "large-heavy")\ninfo = TextContent("Your spreadsheet has 5 products with quarterly sales data. Total revenue across all products is $45,350.")\nfollowups = Buttons([Button("Visualize sales trends", null, "secondary"), Button("Add a new product", null, "secondary"), Button("Show top performers", null, "secondary")])`,
    `root = Stack([title, chart, followups])\ntitle = TextContent("Q1-Q4 Sales Comparison", "large-heavy")\nchart = BarChart("Quarterly Sales", [q1, q2, q3, q4], "Quarter", "Sales ($)")\nq1 = BarChartData("Q1", [w1a, w1b])\nw1a = BarChartBar("Widget A", 1500)\nw1b = BarChartBar("Widget B", 1200)\nq2 = BarChartData("Q2", [w2a, w2b])\nw2a = BarChartBar("Widget A", 1800)\nw2b = BarChartBar("Widget B", 1400)\nq3 = BarChartData("Q3", [w3a, w3b])\nw3a = BarChartBar("Widget A", 2100)\nw3b = BarChartBar("Widget B", 1600)\nq4 = BarChartData("Q4", [w4a, w4b])\nw4a = BarChartBar("Widget A", 2400)\nw4b = BarChartBar("Widget B", 1900)\nfollowups = Buttons([Button("Show as a table", null, "secondary"), Button("Compare Q1 vs Q4", null, "secondary")])`,
    `root = Stack([msg, sheet, followups])\nmsg = TextContent("Done! I added Widget C with Q1=500, Q2=600, Q3=700, Q4=800 and a SUM formula for Total.")\nsheet = SpreadsheetTable([["Widget A", 1500, 1800, 2100, 2400, "=SUM(B1:E1)"], ["Widget B", 1200, 1400, 1600, 1900, "=SUM(B2:E2)"], ["Widget C", 500, 600, 700, 800, "=SUM(B3:E3)"]], ["Product", "Q1 Sales", "Q2 Sales", "Q3 Sales", "Q4 Sales", "Total"])\nfollowups = Buttons([Button("Add another product", null, "secondary"), Button("Show updated totals", null, "secondary"), Button("Visualize the data", null, "secondary")])`,
  ],
};
