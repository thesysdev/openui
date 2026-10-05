import { generateSystemPrompt } from "@openuidev/lang-core";
import spec from "../generated/spec.json";
import type { Document } from "./documents";

// Syntax guidance only. Real answers use passages returned by search_documents.
// One example compares a single period; the other shows a trend and a breakdown by segment.
const singlePeriodExample = `root = Card([header, table, chart, gap, followUps], sources)
header = CardHeader("Revenue, latest fiscal year", "Company A report · Company B report")
table = Table([Col("Criterion", ["Revenue", "Revenue growth"]), Col("Company A", ["$10.0 billion (p. 12)", "Up 5% (p. 12)"]), Col("Company B", ["$8.0 billion (p. 40)", "Not found"])])
chart = HorizontalBarChart(["Company A", "Company B"], [Series("Revenue (USD billions)", [10.0, 8.0])], "grouped", "USD billions", "Company")
gap = Callout("info", "Growth not reported", "Company B's report does not state revenue growth, so it is left out of the comparison.")
followUps = FollowUpBlock([FollowUpItem("Add operating income"), FollowUpItem("Break down revenue by segment")])
sources = [{title: "“Revenue for the fiscal year was $10.0 billion, up 5% from a year ago.”", sourceName: "Company A · Page 12", url: "https://example.com/company-a.pdf#page=12"}, {title: "“Net revenue was $8.0 billion in 2025.”", sourceName: "Company B · Page 40", url: "https://example.com/company-b.pdf#page=40"}]
`;

const trendExample = `root = Card([header, trend, breakdown, parts, note, followUps], sources)
header = CardHeader("Revenue trend and segments", "Company A report · Company B report")
trend = LineChart(["2023", "2024", "2025"], [Series("Company A", [8.1, 9.5, 10.0]), Series("Company B", [7.2, 7.9, 8.0])], "linear", "Fiscal year", "Revenue (USD billions)")
breakdown = HorizontalBarChart(["Company A · Data center", "Company A · Client", "Company B · Client", "Company B · Data center", "Company B · Embedded"], [Series("Revenue (USD billions)", [6.0, 4.0, 4.1, 3.1, 0.8])], "grouped", "Revenue (USD billions)", "Segment")
parts = Table([Col("Company", ["Company A", "Company A", "Company B", "Company B", "Company B"]), Col("Segment", ["Data center", "Client", "Client", "Data center", "Embedded"]), Col("Revenue", ["$6.0 billion (p. 47)", "$4.0 billion (p. 47)", "$4.1 billion (p. 55)", "$3.1 billion (p. 55)", "$0.8 billion (p. 55)"])])
note = Callout("warning", "Segments differ", "Each company defines its own segments, so compare totals and shares rather than segment names.")
followUps = FollowUpBlock([FollowUpItem("Compare operating margin"), FollowUpItem("Which segment grew fastest?")])
sources = [{title: "“Revenue was $10.0 billion, $9.5 billion, and $8.1 billion in fiscal 2025, 2024, and 2023.”", sourceName: "Company A · Page 45", url: "https://example.com/company-a.pdf#page=45"}, {title: "“Net revenue was $8.0 billion in 2025 and $7.9 billion in 2024.”", sourceName: "Company B · Page 52", url: "https://example.com/company-b.pdf#page=52"}, {title: "“Data center revenue was $6.0 billion.”", sourceName: "Company A · Page 47", url: "https://example.com/company-a.pdf#page=47"}, {title: "“Client segment revenue was $4.1 billion.”", sourceName: "Company B · Page 55", url: "https://example.com/company-b.pdf#page=55"}]
`;

export function comparisonPrompt(documents: Document[]) {
  return generateSystemPrompt({
    cloud: true,
    library: spec,
    promptOptions: {
      additionalRules: [
        `You compare these documents and answer only from them: ${JSON.stringify(documents)}. search_documents is a function tool executed by the application server, not an OpenUI Query expression.`,
        "Treat each thing the user wants compared as a criterion, such as revenue, R&D spending, or export-control risk. Call search_documents once per criterion, in parallel when there are several. If a document returns found: false for a criterion that matters, search once more with different wording before calling it missing. Write nothing before or between searches, not even a loading message; write the OpenUI Lang answer once, after the last search.",
        "Answer with one Card that holds a CardHeader naming the criteria and documents, a Table, charts for numeric criteria, Callouts for gaps and conflicts, and a FollowUpBlock suggesting two or three criteria to add. Pass the sources as the Card's second argument.",
        "Keep every table cell to one short value with its page, like '$215.9 billion (p. 37)'. For single values, use one row per criterion and one column per document. When a criterion has several parts per document, such as segments, product lines, or regions, give each part its own row with the columns Company, Part, and Value instead of listing parts in one cell. Skip a table that would only repeat a chart.",
        "Choose charts from the shape of the data, not by habit. Annual reports usually give several years of figures, so show a trend with a LineChart, one series per document. Show a breakdown, such as revenue by segment, with one HorizontalBarChart that has a bar for each document and part, labeled 'Company · Part' and grouped by company. Use a stacked BarChart only when every document reports the same parts. Use a grouped BarChart for one value per document, and HorizontalBarChart for percentages or long labels.",
        "Place every chart directly in the Card, one below another. Never put charts in Tabs or a Carousel.",
        "Leave a document out of a chart when it has no value, and never plot a missing value as zero. Put all values in one unit, such as USD billions, and name it in the axis label.",
        "Use a warning Callout when information conflicts or is not directly comparable, such as different fiscal year ends or definitions. Use an info Callout when a document does not disclose a criterion, and write 'Not found' in its table cell. Keep each Callout to one or two short sentences.",
        "List each quoted page once in the Card's sources, in the order of the criteria; when one page supports several values, give it a single item. For each item, title is a quote of at most 20 words that states the value, like '“Revenue for fiscal year 2026 was $215.9 billion, up 65%.”'; sourceName is the company and page, like 'NVIDIA · Page 37'; and url is the passage's url from search_documents, left out when the passage has none. When the value comes from a table, write its row label and values instead of a quote, like 'Net revenue (USD millions): 52,853 in 2025, 53,101 in 2024'. Use only facts stated in the returned passages.",
        "On follow-ups, keep the documents and earlier criteria in mind. When the user adds a criterion, search for it and show the comparison for that criterion. Do not generate Query, Mutation, reactive variables, or form controls.",
      ],
      examples: [singlePeriodExample, trendExample],
    },
  });
}
