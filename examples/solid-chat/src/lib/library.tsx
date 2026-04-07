import { createLibrary, defineComponent, type PromptOptions } from "@openuidev/solid-lang";
import { z } from "zod";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Chart } from "../components/Chart";
import { KpiTile } from "../components/KpiTile";
import { MetricList } from "../components/MetricList";
import { Stack } from "../components/Stack";
import { TextContent } from "../components/TextContent";
import { Timeline } from "../components/Timeline";

const TextContentDef = defineComponent({
  name: "TextContent",
  props: z.object({ text: z.string(), tone: z.enum(["normal", "muted", "strong"]).optional() }),
  description: "Displays a block of text.",
  component: TextContent,
});

const ButtonDef = defineComponent({
  name: "Button",
  props: z.object({
    label: z.string(),
    action: z.string().optional(),
    variant: z.enum(["primary", "secondary", "ghost"]).optional(),
  }),
  description: "A clickable button.",
  component: Button,
});

const BadgeDef = defineComponent({
  name: "Badge",
  props: z.object({
    label: z.string(),
    tone: z.enum(["neutral", "success", "warning", "danger", "info"]).optional(),
  }),
  description: "Small status pill.",
  component: Badge,
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
  component: KpiTile,
});

const MetricListDef = defineComponent({
  name: "MetricList",
  props: z.object({
    title: z.string(),
    items: z.array(z.object({ label: z.string(), value: z.string() })),
  }),
  description: "Two-column labeled metric list.",
  component: MetricList,
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
  component: Timeline,
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
  description: "Simple chart-style visualization.",
  component: Chart,
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
  component: Card,
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
  description: "Vertical root layout.",
  component: Stack,
});

export const library = createLibrary({
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

export const promptOptions: PromptOptions = {
  additionalRules: [
    "Always use Stack as the root component.",
    "Use Stack only as root. Never place Stack inside Card children.",
    "Output openui-lang code only. No markdown fences, no explanations, no think blocks.",
    "All visible text must be English.",
    "Prefer dashboard composition: KpiTile + Chart + MetricList + Timeline for richer UIs.",
    "Use Card subtitle/variant/highlight for hierarchy when relevant.",
    "Use Badge for state labels (healthy, warning, risk).",
    "For dashboard requests, compose multiple Cards in one Stack and include at least two Chart components.",
  ],
  examples: [
    `title = TextContent("Q2 Growth Pulse", "strong")
chip = Badge("Healthy", "success")
m1 = KpiTile("MRR", "$128.4k", "+8.2% MoM", "up")
m2 = KpiTile("New Users", "1,248", "+12.6% WoW", "up")
m3 = KpiTile("Churn", "2.4%", "-0.3pp", "up")
m4 = KpiTile("NPS", "47", "+2", "up")
trend = Chart("Revenue Trend", "line", ["Jan", "Feb", "Mar", "Apr", "May"], [92, 98, 107, 119, 128], "$k")
mix = Chart("Traffic Sources", "pie", ["Organic", "Paid", "Referral", "Social"], [44, 28, 18, 10], "%")
ops = MetricList("Ops Snapshot", [{"label":"Avg response","value":"4.9h"},{"label":"Backlog","value":"31"}])
flow = Timeline("Delivery Steps", [{"title":"Design","detail":"Completed","status":"done"},{"title":"Dev","detail":"In progress","status":"active"},{"title":"Launch","detail":"Planned","status":"next"}])
card = Card("Executive Dashboard", [chip, trend, mix, ops, flow], "Weekly status and channel mix", "glass", "Live")
a1 = Button("Show risk drivers", "continue-conversation", "primary")
root = Stack([title, m1, m2, m3, m4, card, a1])`,
  ],
};
