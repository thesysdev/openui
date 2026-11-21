import { additionalRules, examples } from "@openuidev/intelligent-ui-library";
import { generateSystemPrompt } from "@openuidev/lang-core";
import spec from "../generated/spec.json";
import { promptOptions } from "../library";
import type { Document } from "./documents";

// Syntax guidance only. Real answers use passages returned by search_documents.
// One example compares a single period; the other shows a trend and a breakdown by segment.
const singlePeriodExample = `root = Col([Card([header, table, chart, gap]), sources, followUps])
header = Title("Revenue, latest fiscal year · Company A and Company B")
table = Table(["Criterion", "Company A", "Company B"], [["Revenue", "$10.0 billion (p. 12)", "$8.0 billion (p. 40)"], ["Revenue growth", "Up 5% (p. 12)", "Not found"]])
chart = Chart("bar", [{Company: "Company A", "Revenue (USD billions)": 10.0}, {Company: "Company B", "Revenue (USD billions)": 8.0}], "Company", ["Revenue (USD billions)"])
gap = Text("Growth not reported: Company B's report does not state revenue growth, so it is left out of the comparison.")
followUps = Col([Button("Add operating income", @ToAssistant("Add operating income"), "outline"), Button("Break down revenue by segment", @ToAssistant("Break down revenue by segment"), "outline")])
sources = Col([Title("Sources", "sm"), Card([Quote("Revenue for the fiscal year was $10.0 billion, up 5% from a year ago.", "Company A · Page 12"), Link("Company A · Page 12", "https://example.com/company-a.pdf#page=12")]), Card([Quote("Net revenue was $8.0 billion in 2025.", "Company B · Page 40"), Link("Company B · Page 40", "https://example.com/company-b.pdf#page=40")])])
`;

const trendExample = `root = Col([Card([header, trend, breakdown, parts, note]), sources, followUps])
header = Title("Revenue trend and segments · Company A and Company B")
trend = Chart("line", [{"Fiscal year": "2024", "Company A": 9.5, "Company B": 7.9}, {"Fiscal year": "2025", "Company A": 10.0, "Company B": 8.0}], "Fiscal year", ["Company A", "Company B"])
breakdown = Chart("bar", [{Segment: "Company A · Data center", "Revenue (USD billions)": 6.0}, {Segment: "Company A · Client", "Revenue (USD billions)": 4.0}, {Segment: "Company B · Client", "Revenue (USD billions)": 4.1}, {Segment: "Company B · Data center", "Revenue (USD billions)": 3.1}, {Segment: "Company B · Embedded", "Revenue (USD billions)": 0.8}], "Segment", ["Revenue (USD billions)"])
parts = Table(["Company", "Segment", "Revenue"], [["Company A", "Data center", "$6.0 billion (p. 47)"], ["Company A", "Client", "$4.0 billion (p. 47)"], ["Company B", "Client", "$4.1 billion (p. 55)"], ["Company B", "Data center", "$3.1 billion (p. 55)"], ["Company B", "Embedded", "$0.8 billion (p. 55)"]])
note = Text("Revenue in USD billions. The trend uses shared years 2024–2025; only Company A reports 2023 ($8.1 billion, p. 45). Segments differ: each company defines its own segments, so compare totals and shares rather than segment names.")
followUps = Col([Button("Compare operating margin", @ToAssistant("Compare operating margin"), "outline"), Button("Which segment grew fastest?", @ToAssistant("Which segment grew fastest?"), "outline")])
sources = Col([Title("Sources", "sm"), Card([Quote("Revenue was $10.0 billion, $9.5 billion, and $8.1 billion in fiscal 2025, 2024, and 2023.", "Company A · Page 45"), Link("Company A · Page 45", "https://example.com/company-a.pdf#page=45")]), Card([Quote("Net revenue was $8.0 billion in 2025 and $7.9 billion in 2024.", "Company B · Page 52"), Link("Company B · Page 52", "https://example.com/company-b.pdf#page=52")]), Card([Quote("Revenue (USD billions): Data center 6.0; Client 4.0.", "Company A · Page 47"), Link("Company A · Page 47", "https://example.com/company-a.pdf#page=47")]), Card([Quote("Revenue (USD billions): Client 4.1; Data center 3.1; Embedded 0.8.", "Company B · Page 55"), Link("Company B · Page 55", "https://example.com/company-b.pdf#page=55")])])
`;

// The generated spec also carries promptOptions. Cloud rejects them inside chatLibrary,
// so the library goes without them and the options are passed beside it below.
const { promptOptions: _specPromptOptions, ...library } = spec;
export function comparisonPrompt(documents: Document[]) {
  return generateSystemPrompt({
    cloud: true,
    library,
    promptOptions: {
      ...promptOptions,
      additionalRules: [
        ...additionalRules,
        `You compare these documents and answer only from them: ${JSON.stringify(documents)}. search_documents is a function tool executed by the application server, not an OpenUI Query expression.`,
        "Treat each thing the user wants compared as a criterion, such as revenue, R&D spending, or export-control risk. Call search_documents once per criterion, in parallel when there are several. If a document returns found: false for a criterion that matters, search once more with different wording before calling it missing. Write nothing before or between searches, not even a loading message; write the OpenUI Lang answer once, after the last search.",
        "Answer with root Col containing a Card with a Title naming the criteria and documents, a Table, Chart components for numeric criteria, and Text notes for gaps and conflicts. After it, add source cards and two or three Button components using @ToAssistant actions to suggest criteria to add.",
        "Keep every table cell to one short value with its page, like '$215.9 billion (p. 37)'. For single values, use one row per criterion and one column per document. When a criterion has several parts per document, such as segments, product lines, or regions, give each part its own row with the columns Company, Part, and Value instead of listing parts in one cell. Skip a table that would only repeat a chart.",
        'Choose charts from the shape of the data. Use Chart("line", rows, "Fiscal year", seriesNames) for trends, one numeric series per document. Use Chart("bar", rows, "Company · Part", ["Revenue (USD billions)"]) for breakdowns, one row per document and part, grouped by company. Use stacked bars only when every document reports the same parts. Use bar charts for one value per document. Chart rows are objects with the category and numeric series keys; name units in series names and nearby Text. Use Table(columns, rows) with an array of column names and arrays of cell values.',
        "Place every chart directly in the Card, one below another, at full width.",
        "Leave a document out of a chart when it has no value, and never plot a missing value as zero. Every Chart row must contain a number for every selected series: restrict trends to shared years or use separate charts for different year ranges, and explain omissions in Text. Put all values in one unit, such as USD billions, and name it in series names and nearby Text.",
        "Use a short Text note headed 'Warning' when information conflicts or is not directly comparable, such as different fiscal year ends or definitions. Use a Text note when a document does not disclose a criterion, and write 'Not found' in its table cell. Keep each note to one or two short sentences.",
        "List each quoted page once under a Sources Title, in criterion order. Give each page a Card containing a Quote of at most 20 words that states the value, with the company and page as its cite, and a Link whose text is the company and page and whose url is the passage's url from search_documents. Omit the Link when no url is returned. When one page supports several values, give it one card. For table evidence, quote its row label and values instead. Use only facts stated in the returned passages.",
        "On follow-ups, keep the documents and earlier criteria in mind. When the user adds a criterion, search for it and show the comparison for that criterion. Do not generate Query, Mutation, reactive variables, or form controls.",
      ],
      examples: [...examples, singlePeriodExample, trendExample],
    },
  });
}
