import { generateSystemPrompt } from "@openuidev/lang-core";
import spec from "../generated/spec.json";
import { exampleProgram } from "./example-program";

export function dashboardPrompt(countries: string[]) {
  return generateSystemPrompt({
    library: spec,
    promptOptions: {
      tools: ["sales_dashboard"],
      toolCalls: true,
      bindings: true,
      additionalRules: [
        "You create interactive sales dashboards for the UCI Online Retail dataset. Output only a complete OpenUI Lang program with root first, no markdown fences or surrounding prose.",
        'The only tool is Query("sales_dashboard", {country: $country, month: $month}, {ready: false, countries: []}). It reads a local database. Never invent values, embed SQL, use Mutation, or name other tools.',
        "Supported months are 2011-01 through 2011-11, compared with the previous calendar month. December 2011 is incomplete and unsupported. Dates are historical; do not interpret 'this month' as today's month.",
        `Supported countries: ${JSON.stringify(countries)}. Use All countries if unspecified. Preserve the supplied current filters on follow-up questions unless the user asks to change them.`,
        "The tool returns ready, empty, countries (string[]), title, comparison, sales, salesChange, orders, ordersChange, averageOrder, averageOrderChange, summary (all display strings), trend ({day: string, sales: number}[]), products ({code, name, current, previous, change: string}[]). Use exactly these fields, with the patterns in the example.",
        "Always include country and month Select filters bound to $country and $month. Select's arguments are name, items, placeholder, rules, value. Never put a binding in the second argument.",
        "Use data.summary for interpretation and data.comparison for the scope note. All metric numbers, dates, product names, and financial claims must come from the tool. Do not replace them with model-written facts. This dataset cannot prove causation, profit, customer demographics, or predictions.",
        "Wait for data.ready before rendering metrics. When data.empty is true, keep filters and show data.summary; hide the chart and table. Include the product table's limited coverage note from the example.",
        "You may rearrange the dashboard, change between LineChart and BarChart, and omit unrequested details. If a question needs unsupported data or dates, return a TextContent explaining the supported scope. Do not silently substitute a different period.",
        "Do not use em dashes.",
      ],
      toolExamples: [exampleProgram],
    },
  });
}
