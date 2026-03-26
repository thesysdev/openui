/**
 * Generates the system prompt from the library definition.
 * Uses jiti (shipped with Nuxt) to handle lang-core's bundler-style imports.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const __dirname = dirname(fileURLToPath(import.meta.url));
const jiti = createJiti(import.meta.url);

const { createLibrary, defineComponent } = await jiti.import("@openuidev/lang-core");
const { z } = await jiti.import("zod");

const TextContentDef = defineComponent({
  name: "TextContent",
  props: z.object({ text: z.string() }),
  description: "Displays a block of text. Supports markdown formatting within the string.",
  component: null,
});

const ButtonDef = defineComponent({
  name: "Button",
  props: z.object({
    label: z.string(),
    action: z.string().optional(),
  }),
  description:
    "A clickable button. The label is shown to the user and used as the follow-up message.",
  component: null,
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
  component: null,
});

const CardDef = defineComponent({
  name: "Card",
  props: z.object({
    title: z.string(),
    children: z.array(z.union([TextContentDef.ref, ButtonDef.ref, ChartDef.ref])),
  }),
  description: "A card container with a title and child components",
  component: null,
});

const StackDef = defineComponent({
  name: "Stack",
  props: z.object({
    children: z.array(z.union([CardDef.ref, TextContentDef.ref, ButtonDef.ref, ChartDef.ref])),
  }),
  description: "Vertical layout container. Use as the root.",
  component: null,
});

const library = createLibrary({
  components: [TextContentDef, ButtonDef, ChartDef, CardDef, StackDef],
  root: "Stack",
});

const promptOptions = {
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
    `User: What is Vue?

t1 = TextContent("Vue is a progressive JavaScript framework for building user interfaces. It builds on standard HTML, CSS, and JavaScript with a declarative, component-based programming model.")
t2 = TextContent("**Reactivity system** — Vue tracks dependencies at runtime and efficiently updates the DOM when state changes, with no virtual DOM diffing overhead in Vue 3's Vapor mode.")
t3 = TextContent("**Single-File Components** — Vue's .vue files combine template, logic, and styling in one file with full TypeScript support.")
t4 = TextContent("**Composition API** — Flexible, composable logic reuse with \\\`setup()\\\` and \\\`<script setup>\\\` syntax.")
intro = Card("What is Vue?", [t1])
features = Card("Key Features", [t2, t3, t4])
cta = Button("Tell me about Vue 3.5")
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

const prompt = library.prompt(promptOptions);
const outPath = resolve(__dirname, "../generated/system-prompt.txt");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, prompt, "utf-8");
console.log(`Generated system prompt (${prompt.length} chars) → ${outPath}`);
