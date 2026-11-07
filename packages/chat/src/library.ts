import type { ComponentGroup, PromptOptions } from "@openuidev/lang-core";
import { action, createLibrary, defineComponent, isElementNode } from "@openuidev/lang-core";
import type {
  ActionsElement,
  ButtonStyle,
  ChartDefinition,
  SelectElement,
  SelectOptionElement,
  TextStyle,
} from "chat";
import {
  Button,
  Card,
  CardLink,
  CardText,
  Chart,
  Actions as ChatActions,
  Divider as ChatDivider,
  Field as ChatField,
  Fields as ChatFields,
  Image as ChatImage,
  Section as ChatSection,
  Select as ChatSelect,
  Table as ChatTable,
  LinkButton,
} from "chat";
import { z } from "zod/v4";
import { buttonActionId, buttonIntent, encodeButtonValue, selectActionId } from "./actions";
import type { ChatComponentRenderer, ChatNode } from "./render";
import { toCardChildren } from "./render";

function chatComponent<T extends z.ZodObject>(config: {
  name: string;
  props: T;
  description: string;
  component: ChatComponentRenderer;
}) {
  return defineComponent<T, ChatComponentRenderer>(config);
}

const str = (value: unknown): string => (value == null ? "" : String(value));
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const childProps = (value: unknown): Record<string, unknown> =>
  isElementNode(value) ? value.props : {};
const oneOf = <T extends string>(value: unknown, options: readonly T[]): T | undefined =>
  options.includes(value as T) ? (value as T) : undefined;

const BUTTON_STYLES = ["primary", "danger", "default"] as const satisfies readonly ButtonStyle[];
const TEXT_STYLES = ["plain", "bold", "muted"] as const satisfies readonly TextStyle[];

// ── Content ──

export const TextContent = chatComponent({
  name: "TextContent",
  props: z.object({
    text: z.string(),
    style: z.enum(TEXT_STYLES).optional(),
  }),
  description:
    'Text block. Supports markdown (**bold**, _italic_, `code`, links, lists). style: "plain" (default) | "bold" | "muted".',
  component: (props) => {
    const text = str(props["text"]);
    if (!text.trim()) return null;
    const style = oneOf(props["style"], TEXT_STYLES);
    return CardText(text, style ? { style } : undefined);
  },
});

export const Field = chatComponent({
  name: "Field",
  props: z.object({
    label: z.string(),
    value: z.union([z.string(), z.number()]),
  }),
  description: "One label/value pair, shown in a compact grid with its siblings.",
  component: (props, ctx) => {
    if (ctx.partial || props["label"] == null || props["value"] == null) return null;
    return ChatField({ label: str(props["label"]), value: str(props["value"]) });
  },
});

export const Fields = chatComponent({
  name: "Fields",
  props: z.object({
    fields: z.array(Field.ref),
  }),
  description: "Key facts as a two-column grid of Field. Best for 2-10 short values.",
  component: (props, ctx) => {
    const fields = ctx.render(props["fields"]).filter((node) => node.type === "field");
    return fields.length ? ChatFields(fields) : null;
  },
});

export const Table = chatComponent({
  name: "Table",
  props: z.object({
    headers: z.array(z.string()),
    rows: z.array(z.array(z.union([z.string(), z.number()]))),
  }),
  description: "Row data. Each row has one cell per header. Keep it under ~20 rows.",
  component: (props, ctx) => {
    if (ctx.partial) return null;
    const headers = list(props["headers"]).map(str);
    if (!headers.length) return null;
    const rows = list(props["rows"]).map((row) => list(row).map(str));
    return ChatTable({ headers, rows });
  },
});

export const Image = chatComponent({
  name: "Image",
  props: z.object({
    url: z.string(),
    alt: z.string().optional(),
  }),
  description: "Image from a public https URL.",
  component: (props, ctx) => {
    const url = str(props["url"]);
    if (ctx.partial || !/^https?:\/\//.test(url)) return null;
    return ChatImage({ url, alt: str(props["alt"]) || undefined });
  },
});

export const Divider = chatComponent({
  name: "Divider",
  props: z.object({}),
  description: "Horizontal rule between groups of content.",
  component: () => ChatDivider(),
});

export const Link = chatComponent({
  name: "Link",
  props: z.object({
    label: z.string(),
    url: z.string(),
  }),
  description: "Inline hyperlink.",
  component: (props, ctx) => {
    const url = str(props["url"]);
    if (ctx.partial || !url) return null;
    return CardLink({ url, label: str(props["label"]) || url });
  },
});

// ── Charts ──

export const Series = chatComponent({
  name: "Series",
  props: z.object({
    category: z.string(),
    values: z.array(z.number()),
  }),
  description: "One named data series: one value per chart label, in label order.",
  component: () => null,
});

function seriesChart(type: "bar" | "line" | "area", description: string) {
  return chatComponent({
    name: `${type[0]!.toUpperCase()}${type.slice(1)}Chart`,
    props: z.object({
      title: z.string(),
      labels: z.array(z.string()),
      series: z.array(Series.ref),
      xLabel: z.string().optional(),
      yLabel: z.string().optional(),
    }),
    description,
    component: (props, ctx) => {
      if (ctx.partial) return null;
      const labels = list(props["labels"]).map(str);
      const series = list(props["series"])
        .map(childProps)
        .filter((s) => s["category"] != null)
        .map((s) => {
          const values = list(s["values"]);
          return {
            name: str(s["category"]),
            data: labels.map((label, i) => ({ label, value: Number(values[i] ?? 0) || 0 })),
          };
        });
      if (!labels.length || !series.length) return null;
      const chart: ChartDefinition = { type, categories: labels, series };
      if (props["xLabel"]) chart.xLabel = str(props["xLabel"]);
      if (props["yLabel"]) chart.yLabel = str(props["yLabel"]);
      return Chart({ title: str(props["title"]), chart });
    },
  });
}

export const BarChart = seriesChart("bar", "Bars comparing values across categories.");
export const LineChart = seriesChart("line", "Lines for a trend over time.");
export const AreaChart = seriesChart("area", "Filled lines for a cumulative trend over time.");

export const PieChart = chatComponent({
  name: "PieChart",
  props: z.object({
    title: z.string(),
    labels: z.array(z.string()),
    values: z.array(z.number()),
  }),
  description: "Shares of a whole. 2-12 slices, every value above 0.",
  component: (props, ctx) => {
    if (ctx.partial) return null;
    const values = list(props["values"]);
    const segments = list(props["labels"])
      .map((label, i) => ({ label: str(label), value: Number(values[i] ?? 0) || 0 }))
      .filter((segment) => segment.value > 0);
    if (!segments.length) return null;
    return Chart({ title: str(props["title"]), chart: { type: "pie", segments } });
  },
});

// ── Actions ──

export const ButtonComponent = chatComponent({
  name: "Button",
  props: z.object({
    label: z.string(),
    action: action().optional(),
    style: z.enum(BUTTON_STYLES).optional(),
  }),
  description:
    'Button. Without an action, clicking sends its label to the assistant. Use @ToAssistant("message") for a different follow-up, @OpenUrl("https://...") for a link. style: "primary" | "danger" | "default".',
  component: (props, ctx) => {
    const label = str(props["label"]);
    if (ctx.partial || !label) return null;
    const style = oneOf(props["style"], BUTTON_STYLES);
    const intent = buttonIntent(props["action"], label);
    if (intent.kind === "url") return LinkButton({ label, url: intent.url, style });
    return Button({
      id: buttonActionId(ctx.nextActionIndex()),
      label,
      style,
      value: encodeButtonValue(intent),
    });
  },
});

export const SelectItem = chatComponent({
  name: "SelectItem",
  props: z.object({
    value: z.string(),
    label: z.string().optional(),
  }),
  description: "Option for Select. value is sent to the assistant when picked; keep it readable.",
  component: () => null,
});

export const Select = chatComponent({
  name: "Select",
  props: z.object({
    label: z.string(),
    items: z.array(SelectItem.ref),
    placeholder: z.string().optional(),
  }),
  description:
    'Dropdown. Picking an option sends "<label>: <value>" to the assistant, like a follow-up question.',
  component: (props, ctx) => {
    const label = str(props["label"]);
    if (ctx.partial || !label) return null;
    const options: SelectOptionElement[] = list(props["items"])
      .map(childProps)
      .filter((item) => item["value"] != null)
      .map((item) => ({ value: str(item["value"]), label: str(item["label"] ?? item["value"]) }));
    if (!options.length) return null;
    return ChatSelect({
      id: selectActionId(ctx.nextActionIndex(), label),
      label,
      placeholder: str(props["placeholder"]) || label,
      options,
    }) as SelectElement;
  },
});

export const Actions = chatComponent({
  name: "Actions",
  props: z.object({
    items: z.array(z.union([ButtonComponent.ref, Select.ref])),
  }),
  description: "Row of Button and Select for next steps. Up to 5 per row.",
  component: (props, ctx) => {
    const items = ctx
      .render(props["items"])
      .filter(
        (node) => node.type === "button" || node.type === "link-button" || node.type === "select",
      );
    return items.length
      ? (ChatActions(items as ActionsElement["children"]) as ActionsElement)
      : null;
  },
});

// ── Layout ──

const ContentUnion = z.union([
  TextContent.ref,
  Fields.ref,
  Table.ref,
  BarChart.ref,
  LineChart.ref,
  AreaChart.ref,
  PieChart.ref,
  Image.ref,
  Divider.ref,
  Link.ref,
  Actions.ref,
]);

export const Section = chatComponent({
  name: "Section",
  props: z.object({
    children: z.array(ContentUnion),
  }),
  description: "Groups related content inside a Card.",
  component: (props, ctx) => {
    const children = toCardChildren(ctx.render(props["children"]));
    return children.length ? ChatSection(children) : null;
  },
});

export const CardComponent = chatComponent({
  name: "Card",
  props: z.object({
    title: z.string(),
    children: z.array(z.union([...ContentUnion.options, Section.ref])),
    subtitle: z.string().optional(),
    imageUrl: z.string().optional(),
  }),
  description:
    "Root message card: a short title, then content top to bottom. Every response is exactly one Card.",
  component: (props, ctx) => {
    const imageUrl = str(props["imageUrl"]);
    return Card({
      title: str(props["title"]) || undefined,
      subtitle: str(props["subtitle"]) || undefined,
      imageUrl: /^https?:\/\//.test(imageUrl) ? imageUrl : undefined,
      children: toCardChildren(ctx.render(props["children"]) as ChatNode[]),
    });
  },
});

// ── Library ──

export const chatComponentGroups: ComponentGroup[] = [
  {
    name: "Message",
    components: ["Card", "Section", "TextContent", "Divider", "Image", "Link"],
    notes: [
      "- The response is one Card. Lead with the answer in a TextContent, then supporting data.",
      "- The card is a chat message: keep it short. Prefer one or two data components over many.",
    ],
  },
  {
    name: "Data",
    components: [
      "Fields",
      "Field",
      "Table",
      "BarChart",
      "LineChart",
      "AreaChart",
      "PieChart",
      "Series",
    ],
    notes: [
      "- Fields for a few key numbers, Table for rows, a chart for a trend or a share of a whole.",
      "- At most 2 charts and 1 Table per Card.",
    ],
  },
  {
    name: "Next steps",
    components: ["Actions", "Button", "Select", "SelectItem"],
    notes: [
      "- End with Actions offering 2-4 useful follow-ups when it helps the user continue.",
      "- A click arrives as the user's next message, and you answer it with a new Card.",
    ],
  },
];

export const chatExamples: string[] = [
  `root = Card("Q3 revenue", [summary, stats, trend, next])
summary = TextContent("Revenue grew **18%** to $4.2M, led by self-serve.")
stats = Fields([Field("Revenue", "$4.2M"), Field("Growth", "+18%"), Field("New customers", 312), Field("Churn", "2.1%")])
trend = BarChart("Revenue by month ($K)", ["Jul", "Aug", "Sep"], [Series("Self-serve", [820, 905, 990]), Series("Sales-led", [430, 470, 585])])
next = Actions([Button("Break down by region", @ToAssistant("Break down Q3 revenue by region"), "primary"), Button("Compare to Q2"), Button("Open dashboard", @OpenUrl("https://example.com/dashboard"))])`,
];

export const chatAdditionalRules: string[] = [
  "This UI is posted as a chat message (Slack, Teams, Discord). There are no inputs, $variables, Query or Mutation: write static values.",
  "Every Card needs a title of at most 50 characters.",
  "Chart titles and labels: at most 50 and 20 characters.",
];

export const chatPromptOptions: PromptOptions = {
  examples: chatExamples,
  additionalRules: chatAdditionalRules,
  toolCalls: false,
  bindings: false,
  builtinFunctions: false,
};

/** Components that render as native Chat SDK cards. Root: `Card`. */
export const chatLibrary = createLibrary<ChatComponentRenderer>({
  root: "Card",
  componentGroups: chatComponentGroups,
  components: [
    CardComponent,
    Section,
    TextContent,
    Fields,
    Field,
    Table,
    BarChart,
    LineChart,
    AreaChart,
    PieChart,
    Series,
    Image,
    Divider,
    Link,
    Actions,
    ButtonComponent,
    Select,
    SelectItem,
  ],
});
