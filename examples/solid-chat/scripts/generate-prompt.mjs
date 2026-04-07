import { createJiti } from "jiti";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const jiti = createJiti(import.meta.url);

const { createLibrary, defineComponent } = await jiti.import("@openuidev/lang-core");
const { z } = await jiti.import("zod");

const TextContentDef = defineComponent({
  name: "TextContent",
  props: z.object({ text: z.string(), tone: z.enum(["normal", "muted", "strong"]).optional() }),
  description: "Displays a block of text.",
  component: null,
});

const ButtonDef = defineComponent({
  name: "Button",
  props: z.object({
    label: z.string(),
    action: z.string().optional(),
    variant: z.enum(["primary", "secondary", "ghost"]).optional(),
  }),
  description: "A clickable button.",
  component: null,
});

const BadgeDef = defineComponent({
  name: "Badge",
  props: z.object({
    label: z.string(),
    tone: z.enum(["neutral", "success", "warning", "danger", "info"]).optional(),
  }),
  description: "Small status pill.",
  component: null,
});

const KpiTileDef = defineComponent({
  name: "KpiTile",
  props: z.object({
    label: z.string(),
    value: z.string(),
    delta: z.string().optional(),
    trend: z.enum(["up", "down", "neutral"]).optional(),
  }),
  description: "Compact KPI tile with value and trend.",
  component: null,
});

const MetricListDef = defineComponent({
  name: "MetricList",
  props: z.object({
    title: z.string(),
    items: z.array(z.object({ label: z.string(), value: z.string() })),
  }),
  description: "Two-column labeled metric list.",
  component: null,
});

const TimelineDef = defineComponent({
  name: "Timeline",
  props: z.object({
    title: z.string(),
    items: z.array(
      z.object({
        title: z.string(),
        detail: z.string(),
        status: z.enum(["done", "active", "next"]).optional(),
      }),
    ),
  }),
  description: "Progress timeline with status dots.",
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
  description: "Renders a chart.",
  component: null,
});

const CardDef = defineComponent({
  name: "Card",
  props: z.object({
    title: z.string(),
    children: z.array(
      z.union([
        TextContentDef.ref,
        ButtonDef.ref,
        ChartDef.ref,
        BadgeDef.ref,
        KpiTileDef.ref,
        MetricListDef.ref,
        TimelineDef.ref,
      ]),
    ),
    subtitle: z.string().optional(),
    variant: z.enum(["default", "glass", "accent"]).optional(),
    highlight: z.string().optional(),
  }),
  description: "Card container with title and children.",
  component: null,
});

const StackDef = defineComponent({
  name: "Stack",
  props: z.object({
    children: z.array(
      z.union([
        CardDef.ref,
        TextContentDef.ref,
        ButtonDef.ref,
        ChartDef.ref,
        BadgeDef.ref,
        KpiTileDef.ref,
        MetricListDef.ref,
        TimelineDef.ref,
      ]),
    ),
  }),
  description: "Dashboard layout container. Use as root.",
  component: null,
});

const library = createLibrary({
  components: [
    TextContentDef,
    ButtonDef,
    ChartDef,
    BadgeDef,
    KpiTileDef,
    MetricListDef,
    TimelineDef,
    CardDef,
    StackDef,
  ],
  root: "Stack",
});

const promptOptions = {
  additionalRules: [
    "Always use Stack as the root component.",
    "Use Stack only as root. Never place Stack inside Card children.",
    "Output openui-lang code only. No markdown fences, no explanations, no think blocks.",
    "All visible text must be English.",
    "Use references for readability and better streaming behavior.",
    "For dashboards, include at least four KpiTile components and at least two charts.",
    "Prefer Card with subtitle and highlight for richer hierarchy.",
    "Use Badge, MetricList, and Timeline when relevant instead of plain text-only layouts.",
    "Use positional arguments only.",
    "Never output reasoning or markdown.",
  ],
  examples: [
    `User: Build a SaaS KPI dashboard

root = Stack([title, healthy, m1, m2, m3, m4, mainCard, action1, action2])
title = TextContent("Q2 Growth Pulse", "strong")
healthy = Badge("Healthy", "success")
m1 = KpiTile("MRR", "$128.4k", "+8.2% MoM", "up")
m2 = KpiTile("New Users", "1,248", "+12.6% WoW", "up")
m3 = KpiTile("Churn", "2.4%", "-0.3pp", "up")
m4 = KpiTile("NPS", "47", "+2", "up")
trend = Chart("Revenue Trend", "line", ["Jan", "Feb", "Mar", "Apr", "May"], [92, 98, 107, 119, 128], "$k")
mix = Chart("Traffic Sources", "pie", ["Organic", "Paid", "Referral", "Social"], [44, 28, 18, 10], "%")
ops = MetricList("Ops Snapshot", [{"label":"Avg response", "value":"4.9h"}, {"label":"Backlog", "value":"31"}])
flow = Timeline("Delivery Steps", [{"title":"Design", "detail":"Completed", "status":"done"}, {"title":"Dev", "detail":"In progress", "status":"active"}, {"title":"Launch", "detail":"Planned", "status":"next"}])
mainCard = Card("Executive Dashboard", [trend, mix, ops, flow], "Weekly status and channel mix", "glass", "Live")
action1 = Button("Show risk drivers", "continue-conversation", "primary")
action2 = Button("Compare with previous quarter", "continue-conversation", "ghost")`,
  ],
};

const prompt = library.prompt(promptOptions);
const outPath = resolve(__dirname, "../generated/system-prompt.txt");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, prompt, "utf-8");
console.log(`Generated system prompt (${prompt.length} chars) -> ${outPath}`);
