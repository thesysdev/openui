import { createJiti } from "jiti";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const jiti = createJiti(import.meta.url);

const { createLibrary, defineComponent } = await jiti.import("@openuidev/lang-core");
const { BuiltinActionType } = await jiti.import("@openuidev/lang-core");
const { z } = await jiti.import("zod");

const continueConversationAction = z.object({
  type: z.literal(BuiltinActionType.ContinueConversation),
  context: z.string().optional(),
});

const openUrlAction = z.object({
  type: z.literal(BuiltinActionType.OpenUrl),
  url: z.string(),
});

const actionSchema = z.union([openUrlAction, continueConversationAction]);

const TextContentDef = defineComponent({
  name: "TextContent",
  props: z.object({
    text: z.string(),
    tone: z.enum(["normal", "muted", "strong", "success", "warning", "danger", "info"]).optional(),
  }),
  description: "Displays a block of text.",
  component: null,
});

const ButtonDef = defineComponent({
  name: "Button",
  props: z.object({
    label: z.string(),
    action: z.union([z.string(), actionSchema]).optional(),
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

const InputFieldDef = defineComponent({
  name: "InputField",
  props: z.object({
    label: z.string(),
    placeholder: z.string().optional(),
    value: z.string().or(z.any()).optional(),
    type: z.enum(["text", "email", "password", "number", "url"]).optional(),
  }),
  description: "Single-line text input with label.",
  component: null,
});

const TextAreaFieldDef = defineComponent({
  name: "TextAreaField",
  props: z.object({
    label: z.string(),
    placeholder: z.string().optional(),
    value: z.string().or(z.any()).optional(),
    rows: z.number().optional(),
  }),
  description: "Multi-line text input with label.",
  component: null,
});

const SelectFieldDef = defineComponent({
  name: "SelectField",
  props: z.object({
    label: z.string(),
    options: z.array(z.string()),
    selected: z.string().or(z.any()).optional(),
  }),
  description: "Dropdown-style field with selectable options.",
  component: null,
});

const ToggleFieldDef = defineComponent({
  name: "ToggleField",
  props: z.object({
    label: z.string(),
    checked: z.boolean().or(z.any()).optional(),
  }),
  description: "On/off setting toggle with label.",
  component: null,
});

const DividerDef = defineComponent({
  name: "Divider",
  props: z.object({
    label: z.string().optional(),
  }),
  description: "Visual divider line with optional label.",
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
        InputFieldDef.ref,
        TextAreaFieldDef.ref,
        SelectFieldDef.ref,
        ToggleFieldDef.ref,
        DividerDef.ref,
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
        InputFieldDef.ref,
        TextAreaFieldDef.ref,
        SelectFieldDef.ref,
        ToggleFieldDef.ref,
        DividerDef.ref,
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
    InputFieldDef,
    TextAreaFieldDef,
    SelectFieldDef,
    ToggleFieldDef,
    DividerDef,
    CardDef,
    StackDef,
  ],
  root: "Stack",
});

const promptOptions = {
  additionalRules: [
    "Always use Stack as the root component.",
    "The FIRST line must be exactly a root assignment: root = Stack(...).",
    "Do not output any statement before root = Stack(...).",
    "Use Stack only as root. Never place Stack inside Card children.",
    "Output openui-lang code only. No markdown fences, no explanations, no think blocks.",
    "All visible text must be English.",
    "Start directly with openui-lang code. Do not add preface text.",
    "Keep syntax valid while streaming: no TODO bullets, no pseudo-code, no planning sections.",
    "Match the requested UI type; do not force dashboard layouts for every request.",
    "Use references for readability and better streaming behavior.",
    "Prefer Card subtitle/highlight only when it improves hierarchy.",
    "Use Badge, MetricList, Timeline, Chart, and KpiTile when relevant.",
    "Use InputField, TextAreaField, SelectField, ToggleField, and Divider for form or settings UIs.",
    'Use state bindings in forms when needed (e.g. InputField("Email", "name@example.com", $email, "email")).',
    "Button action supports both simple action type strings and structured action objects.",
    "Use positional arguments only.",
    "Prefer inline composition in Stack/Card to reduce forward-reference errors.",
    "Never output reasoning or markdown.",
  ],
  examples: [
    `User: Build a weekly product status view

root = Stack([title, summary, panel, action])
title = TextContent("Product Delivery Overview", "strong")
summary = TextContent("Current sprint highlights, blockers, and next actions.", "muted")
state = Badge("On Track", "success")
velocity = Chart("Story Points", "bar", ["W1", "W2", "W3", "W4"], [28, 31, 35, 33], "pts")
burn = Chart("Defect Trend", "line", ["W1", "W2", "W3", "W4"], [14, 11, 9, 7], "count")
metrics = MetricList("Team Metrics", [{"label":"Cycle time", "value":"3.2d"}, {"label":"PR review", "value":"6.8h"}, {"label":"Escaped bugs", "value":"2"}])
steps = Timeline("Release Steps", [{"title":"Scope lock", "detail":"Done", "status":"done"}, {"title":"UAT", "detail":"In progress", "status":"active"}, {"title":"Launch", "detail":"Scheduled Friday", "status":"next"}])
panel = Card("Delivery Health", [state, velocity, burn, metrics, steps], "Sprint 18 status", "glass", "Updated")
action = Button("Generate rollback checklist", "continue-conversation", "primary")
`,
  ],
};

const prompt = library.prompt(promptOptions);
const outPath = resolve(__dirname, "../generated/system-prompt.txt");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, prompt, "utf-8");
console.log(`Generated system prompt (${prompt.length} chars) -> ${outPath}`);
