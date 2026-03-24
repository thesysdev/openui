import { createLibrary, defineComponent, type PromptOptions } from "@openuidev/svelte-lang";
import { z } from "zod";
import Button from "./components/Button.svelte";
import Card from "./components/Card.svelte";
import Chart from "./components/Chart.svelte";
import Stack from "./components/Stack.svelte";
import TextContent from "./components/TextContent.svelte";

const TextContentDef = defineComponent({
  name: "TextContent",
  props: z.object({ text: z.string() }),
  description: "Displays a block of text. Supports markdown formatting within the string.",
  component: TextContent,
});

const ButtonDef = defineComponent({
  name: "Button",
  props: z.object({
    label: z.string(),
    action: z.string().optional(),
  }),
  description:
    "A clickable button. The label is shown to the user and used as the follow-up message.",
  component: Button,
});

const ChartDef = defineComponent({
  name: "Chart",
  props: z.object({
    title: z.string(),
    type: z.enum(["bar", "line", "pie", "doughnut"]),
    labels: z.array(z.string()),
    values: z.array(z.number()),
    datasetLabel: z.string().optional(),
  }),
  description:
    "Renders a chart. Use bar for comparisons, line for trends, pie/doughnut for proportions.",
  component: Chart,
});

const CardDef = defineComponent({
  name: "Card",
  props: z.object({
    title: z.string(),
    children: z.array(z.union([TextContentDef.ref, ButtonDef.ref, ChartDef.ref])),
  }),
  description: "A card container with a title and child components",
  component: Card,
});

const StackDef = defineComponent({
  name: "Stack",
  props: z.object({
    children: z.array(z.union([CardDef.ref, TextContentDef.ref, ButtonDef.ref, ChartDef.ref])),
  }),
  description: "Vertical layout container. Use as the root.",
  component: Stack,
});

export const library = createLibrary({
  components: [TextContentDef, ButtonDef, ChartDef, CardDef, StackDef],
  root: "Stack",
});

export const promptOptions: PromptOptions = {
  additionalRules: [
    "Always use Stack as the root component.",
    "Group related content in Card components with descriptive titles.",
    "Use TextContent for all text output. You can use markdown within the text string.",
    "Use Button for suggested follow-up actions the user might want to take.",
    "For multi-section responses, use multiple Card components inside the root Stack.",
    "Prefer using references for readability and better streaming performance.",
    "Keep TextContent strings focused — use multiple TextContent components for different paragraphs or points.",
    "Never nest Stack inside Stack directly.",
    "Use Chart for data visualization. Choose bar for comparisons, line for trends, pie/doughnut for proportions.",
    "Chart labels and values arrays must have the same length.",
  ],
  examples: [
    `User: What is Svelte?

t1 = TextContent("Svelte is a modern JavaScript framework that shifts work from the browser to a compile step. Unlike React or Vue, Svelte compiles your components into efficient imperative code that directly manipulates the DOM.")
t2 = TextContent("**No virtual DOM** — Svelte updates the DOM surgically when state changes, resulting in excellent runtime performance.")
t3 = TextContent("**Less boilerplate** — Svelte's syntax is concise and intuitive, letting you write less code to achieve the same results.")
t4 = TextContent("**Built-in reactivity** — Simple variable assignments trigger UI updates. No hooks or special APIs needed.")
intro = Card("What is Svelte?", [t1])
features = Card("Key Features", [t2, t3, t4])
cta = Button("Tell me about Svelte 5")
root = Stack([intro, features, cta])`,
    `User: What's the weather like?

t1 = TextContent("I can look up the current weather for any city. Just tell me which location you're interested in!")
card = Card("Weather Lookup", [t1])
b1 = Button("Weather in New York")
b2 = Button("Weather in Tokyo")
root = Stack([card, b1, b2])`,
    `User: Show me the top 5 programming languages by popularity

root = Stack([card, cta])
chart = Chart("Programming Language Popularity", "bar", ["Python", "JavaScript", "Java", "C++", "TypeScript"], [30, 25, 18, 12, 10], "% Market Share")
t1 = TextContent("Python leads with 30% market share, driven by AI/ML adoption. JavaScript remains dominant for web development at 25%.")
card = Card("Language Trends", [chart, t1])
cta = Button("Compare Python vs JavaScript")`,
  ],
};
