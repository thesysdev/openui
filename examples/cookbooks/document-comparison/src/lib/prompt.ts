import { generateSystemPrompt } from "@openuidev/lang-core";
import spec from "../generated/spec.json";
import type { Document } from "./documents";

// Syntax guidance only. Real answers use passages returned by search_documents.
// One example compares a single period; the other shows a trend and a breakdown.
const singlePeriodExample = `root = Stack([header, table, chart, gap, sources, followUps], "column", "l")
header = CardHeader("Revenue, latest fiscal year", "Company A report · Company B report")
table = Table([Col("Criterion", ["Revenue", "Revenue growth"]), Col("Company A", ["$10.0 billion (p. 12)", "Up 5% (p. 12)"]), Col("Company B", ["$8.0 billion (p. 40)", "Not found"])])
chart = HorizontalBarChart(["Company A", "Company B"], [Series("Revenue (USD billions)", [10.0, 8.0])], "grouped", "USD billions", "Company")
gap = Callout("info", "Growth not reported", "Company B's report does not state revenue growth, so it is left out of the comparison.")
sources = Accordion([AccordionItem("sources", "Sources", [TextContent("Revenue", "small-heavy"), TextContent("Company A, p. 12: “Revenue for the fiscal year was $10.0 billion, up 5% from a year ago.”"), TextContent("Company B, p. 40: “Net revenue was $8.0 billion in 2025.”")])])
followUps = FollowUpBlock([FollowUpItem("Add operating income"), FollowUpItem("Break down revenue by segment")])
`;

const trendExample = `root = Stack([header, trend, mix, note, sources, followUps], "column", "l")
header = CardHeader("Revenue trend and segment mix", "Company A report · Company B report")
trend = LineChart(["2023", "2024", "2025"], [Series("Company A", [8.1, 9.5, 10.0]), Series("Company B", [7.2, 7.9, 8.0])], "linear", "Fiscal year", "Revenue (USD billions)")
mix = BarChart(["Company A", "Company B"], [Series("Data center", [6.0, 3.1]), Series("Client", [3.0, 4.1]), Series("Other", [1.0, 0.8])], "stacked", "Company", "Revenue (USD billions)")
note = Callout("warning", "Fiscal years differ", "Company A's fiscal year ends in January; Company B's ends in December.")
sources = Accordion([AccordionItem("sources", "Sources", [TextContent("Revenue trend", "small-heavy"), TextContent("Company A, p. 45: “Revenue was $10.0 billion, $9.5 billion, and $8.1 billion in fiscal 2025, 2024, and 2023.”"), TextContent("Company B, p. 52: “Net revenue was $8.0 billion in 2025 and $7.9 billion in 2024.”"), TextContent("Segment mix", "small-heavy"), TextContent("Company A, p. 47: “Data center revenue was $6.0 billion.”"), TextContent("Company B, p. 55: “Client segment revenue was $4.1 billion.”")])])
followUps = FollowUpBlock([FollowUpItem("Compare operating margin"), FollowUpItem("Which segment grew fastest?")])
`;

export function comparisonPrompt(documents: Document[]) {
  return generateSystemPrompt({
    cloud: true,
    library: spec,
    promptOptions: {
      additionalRules: [
        `You compare these documents and answer only from them: ${JSON.stringify(documents)}. search_documents is a Responses function tool executed by the application server, not an OpenUI Query expression.`,
        "Treat each thing the user wants compared as a criterion, such as revenue, R&D spending, or export-control risk. Call search_documents once per criterion, in parallel when there are several. If a document returns found: false for a criterion that matters, search once more with different wording before calling it missing.",
        "Answer with: a CardHeader naming the criteria and documents; a Table with one row per criterion and one column per document, each cell a short value or phrase with its page, like '$215.9 billion (p. 37)'; charts for numeric criteria; Callouts for gaps and conflicts; a single collapsible Sources section; and a FollowUpBlock suggesting two or three criteria to add. Skip the table when a chart already shows every value clearly.",
        "Choose charts from the shape of the data, not by habit. Annual reports usually give several years of figures, so show a trend with a LineChart, one series per document. Show how a total splits into parts, such as revenue by segment, with a stacked BarChart across documents or a PieChart for a single document. Use HorizontalBarChart for percentages, ratios, or long labels, and a grouped BarChart for one value per document. Do not use the same chart type for every criterion when another type fits the data better.",
        "Leave a document out of a chart when it has no value, and never plot a missing value as zero. Put all values in one unit, such as USD billions, and name it in the axis label.",
        "Use a warning Callout when information conflicts or is not directly comparable, such as different fiscal year ends or definitions. Use an info Callout when a document does not disclose a criterion, and write 'Not found' in its table cell.",
        "End with a single collapsible Sources section: one Accordion with exactly one AccordionItem whose trigger is 'Sources'. Inside it, for each criterion, add the criterion name as TextContent with size 'small-heavy', then one TextContent per document with the company, page, and a one-sentence quote, like 'NVIDIA, p. 37: “Revenue for fiscal year 2026 was $215.9 billion, up 65%.”' Use only facts stated in the returned passages, and use only TextContent inside AccordionItem.",
        "On follow-ups, keep the documents and earlier criteria in mind. When the user adds a criterion, search for it and show the comparison for that criterion. Do not generate Query, Mutation, reactive variables, or form controls.",
      ],
      examples: [singlePeriodExample, trendExample],
    },
  });
}
