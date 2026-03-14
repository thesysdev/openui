/**
 * Node-compatible library definition — mirrors mobile/library.tsx exactly
 * (same component names, same Zod schemas, same prop order) but uses null
 * renderers so the file can run in Node.js without react-native.
 *
 * Used only by the @openuidev/cli to generate system-prompt.txt.
 * The backend API route never imports this file at runtime.
 */
import { defineComponent, createLibrary } from "@openuidev/react-lang";
import type { PromptOptions } from "@openuidev/react-lang";
import { z } from "zod";

const DataPointSchema = z.object({
  label: z.string().describe("X-axis or slice label"),
  value: z.number().describe("Numeric value"),
});

const TextComponent = defineComponent({
  name: "Text",
  description: "Renders a line of text. Use variant to control emphasis.",
  props: z.object({
    content: z.string().describe("The text to display"),
    variant: z
      .enum(["body", "heading", "caption"])
      .optional()
      .describe("Visual style of the text — heading | body | caption"),
  }),
  component: () => null,
});

const BarChartComponent = defineComponent({
  name: "BarChart",
  description:
    "Renders a vertical bar chart for comparing discrete values across categories.",
  props: z.object({
    data: z
      .array(DataPointSchema)
      .describe("Array of { label, value } data points"),
    title: z.string().optional().describe("Chart title displayed above the bars"),
    color: z
      .string()
      .optional()
      .describe("Hex color for bars, e.g. \"#6366f1\". Defaults to indigo."),
  }),
  component: () => null,
});

const LineChartComponent = defineComponent({
  name: "LineChart",
  description:
    "Renders a line chart to visualise trends across an ordered sequence of values.",
  props: z.object({
    data: z
      .array(DataPointSchema)
      .describe("Ordered array of { label, value } data points"),
    title: z.string().optional().describe("Chart title"),
    color: z
      .string()
      .optional()
      .describe("Hex color for the line, e.g. \"#10b981\". Defaults to emerald."),
  }),
  component: () => null,
});

const PieChartComponent = defineComponent({
  name: "PieChart",
  description: "Renders a pie chart to show how parts contribute to a whole.",
  props: z.object({
    data: z
      .array(
        z.object({
          label: z.string().describe("Slice label shown in the legend"),
          value: z.number().describe("Numeric value for this slice"),
          color: z
            .string()
            .optional()
            .describe("Hex color override for this slice"),
        }),
      )
      .describe("Array of { label, value, color? } slices"),
    title: z.string().optional().describe("Chart title"),
  }),
  component: () => null,
});

const CardComponent = defineComponent({
  name: "Card",
  description:
    "A container card that holds a list of child components.",
  props: z.object({
    children: z
      .array(
        z.union([
          TextComponent.ref,
          BarChartComponent.ref,
          LineChartComponent.ref,
          PieChartComponent.ref,
        ]),
      )
      .optional()
      .describe("Child Text or chart components rendered inside the card"),
  }),
  component: () => null,
});

export const library = createLibrary({
  components: [
    TextComponent,
    BarChartComponent,
    LineChartComponent,
    PieChartComponent,
    CardComponent,
  ],
  root: "Card",
});

export const promptOptions: PromptOptions = {
  preamble:
    "You are a helpful assistant. Always respond using OpenUI Lang — never plain markdown or JSON.",
  additionalRules: [
    "Always wrap your entire response inside a single root Card.",
    "Use Text components for all textual content.",
    "Use variant=\"heading\" for the main topic, variant=\"caption\" for secondary info, and the default body variant for regular text.",
    "Use BarChart to compare discrete categories, LineChart for trends over time, and PieChart for part-to-whole proportions.",
    "Always provide meaningful labels for every data point.",
    "Only include a chart when the user's query involves data that genuinely benefits from visualisation.",
  ],
  examples: [
    `root = Card([intro, detail])\nintro = Text("It's sunny and 24°C in San Francisco.", "heading")\ndetail = Text("Humidity is at 60%. No rain expected this week.", "body")`,
    `root = Card([heading, chart])\nheading = Text("Revenue grew 42% over Q1.", "heading")\nchart = LineChart([{label:"Jan",value:80},{label:"Feb",value:95},{label:"Mar",value:114}], "Q1 Revenue ($k)", "#6366f1")`,
    `root = Card([chart])\nchart = PieChart([{label:"Product A",value:45},{label:"Product B",value:30},{label:"Product C",value:25}], "2025 Market Share")`,
  ],
};
