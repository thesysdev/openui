import { z } from "zod/v4";

// Shared by the Angular library and the server's prompt generator.
// Property order is the OpenUI Lang positional argument order.
export const definitions = {
  Heading: { description: "A short section heading.", props: z.object({ text: z.string() }) },
  Paragraph: {
    description: "A paragraph of plain text. Do not use markdown formatting.",
    props: z.object({ text: z.string() }),
  },
  Metrics: {
    description: "A row of 1–4 summary metrics.",
    props: z.object({
      items: z.array(z.object({ label: z.string(), value: z.string(), detail: z.string() })),
    }),
  },
  BarChart: {
    description:
      "A horizontal chart comparing nonnegative values. Always supply the unit and a source or illustrative-data caption.",
    props: z.object({
      title: z.string(),
      items: z.array(z.object({ label: z.string(), value: z.number().nonnegative() })),
      unit: z.string(),
      caption: z.string(),
    }),
  },
  DataTable: {
    description:
      "A comparison or data table. Every row must have the same number of cells as headers.",
    props: z.object({
      title: z.string(),
      headers: z.array(z.string()),
      rows: z.array(z.array(z.string())),
    }),
  },
  Callout: {
    description: "A useful takeaway, assumption, or caveat.",
    props: z.object({ title: z.string(), text: z.string() }),
  },
  Checklist: {
    description: "An interactive checklist that the user can check off locally.",
    props: z.object({ title: z.string(), items: z.array(z.string()) }),
  },
  FollowUps: {
    description: "Two or three concise suggested next user messages, shown as clickable buttons.",
    props: z.object({ suggestions: z.array(z.string()) }),
  },
  ChoiceForm: {
    description:
      "Ask the user for preferences. The form submits their answers as the next chat message.",
    props: z.object({
      title: z.string(),
      fields: z.array(z.object({ name: z.string(), label: z.string(), placeholder: z.string() })),
      submitLabel: z.string(),
    }),
  },
};

export const promptOptions = {
  preamble:
    "You are a helpful assistant in an Angular chat application. Answer the user's actual request with a useful, compact, thoughtfully composed interface.",
  additionalRules: [
    "Return ONLY OpenUI Lang, with no markdown fences or surrounding prose. Always start with root = Response([...]) and put child definitions on subsequent lines. Use only the components in this library.",
    "For ordinary conversation use Paragraph. For comparisons use DataTable, for numeric comparisons use BarChart, and for plans use Checklist. Include a Heading when helpful and end substantial answers with FollowUps.",
    "Use plain text inside component strings; no markdown syntax. Use at most 8 top-level blocks and 8 rows per chart or table unless asked for more.",
    "You do not have web search, live data, or tools that take external actions. Never claim to search, book, send, buy, or execute anything. Clearly label invented demonstration data as illustrative. Use user-provided data accurately.",
    "When user preferences are needed, render ChoiceForm with 2–4 useful fields. Submitted form data arrives as a normal user message. You can use previous assistant OpenUI Lang responses as conversation context.",
    "All BarChart values must be nonnegative. Use DataTable for signed values. Each DataTable row must match the headers. Metric detail can be an empty string.",
  ],
  examples: [
    'root = Response([title, intro, chart, next])\ntitle = Heading("A clearer picture")\nintro = Paragraph("Here is the data you provided.")\nchart = BarChart("Weekly signups", [{label: "Week 1", value: 120}, {label: "Week 2", value: 165}], "signups", "Source: your figures")\nnext = FollowUps(["Calculate the growth rate", "Make a plan to improve signups"])',
  ],
  toolCalls: false,
  bindings: false,
};
