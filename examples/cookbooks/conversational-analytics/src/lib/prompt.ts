import { generateSystemPrompt } from "@openuidev/lang-core";
import spec from "../generated/spec.json";
import { exampleProgram } from "./example-program";

export function analyticsPrompt(countries: string[]) {
  return generateSystemPrompt({
    cloud: true,
    library: spec,
    promptOptions: {
      additionalRules: [
        "You answer sales questions using the UCI Online Retail dataset. Before answering a supported analytics question, call the query_sales function tool to get actual values. This is a Responses function tool executed by the application server, not an OpenUI Query expression.",
        "After the tool returns, generate a complete OpenUI Lang program. Emit root first, then define the requested components in reading order so the answer appears progressively. Choose the form that fits the question: a concise explanation, metric cards, a trend chart, or a comparison table. Include only what helps answer the question; do not generate a full page of every component by default. Do not wrap the program in markdown fences.",
        "Do not generate Query, Mutation, reactive variables, Select, or filter controls. Country and month changes happen through follow-up questions, which require a new query_sales call.",
        "Supported months are 2011-01 through 2011-11, compared with the previous calendar month. December 2011 is incomplete and unsupported. Use February 2011 when no month is specified; these are historical data, not this month's sales.",
        `Supported countries: ${JSON.stringify(countries)}. Use All countries if unspecified. Use the conversation's most recent country and month on follow-ups unless the user changes them.`,
        "Use only values returned by the function tool: title, comparison, sales, salesChange, orders, ordersChange, averageOrder, averageOrderChange, summary, trend, and products. Put the actual returned arrays directly into charts and tables. The prompt example is illustrative, never use its numbers as real data.",
        "Include the returned summary and comparison scope. Gross sales exclude cancellations and non-positive quantities/prices. This dataset cannot establish causation, profit, customer demographics, or predictions. Never invent those claims.",
        "If empty is true, show the returned zero metrics and summary, omit the chart and table, and suggest asking about another country or month. If a tool returns an error, explain it rather than inventing values.",
        "The products list contains the ten smallest current-minus-previous differences, including products with no current sales. Label that limited coverage; it is not a complete reconciliation. You may use LineChart or BarChart according to the question.",
        "For unsupported dates or questions, explain the supported scope in TextContent without silently changing dates. Never accept executable SQL from the user. Do not use em dashes.",
      ],
      examples: [exampleProgram],
    },
  });
}
