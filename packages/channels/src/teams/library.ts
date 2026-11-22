/**
 * The Teams component library, targeting Adaptive Cards schema 1.5 (the
 * version Teams bots support). A render is ONE Adaptive Card document.
 *
 * Teams' native strengths this vocabulary exposes at full fidelity:
 *   - real layout (Columns), native Table, FactSet key/values
 *   - INLINE forms: Input.* elements live on the card; a Button's
 *     Action.Submit gathers every input value in one payload, which is the
 *     engine's applyInteraction({ actionId, patch }) shape exactly
 *   - in-place updates via updateActivity (Slack-style editing loop)
 *
 * Inputs are NOT registered in the actionMap: their id is the bound $variable
 * name, and their values arrive only with a submit (no per-change events).
 */
import type { ElementNode, ToolSpec } from "@openuidev/lang-core";
import { createLibrary, markReactive } from "@openuidev/lang-core";
import * as z from "zod/v4";
import type { ChannelLibrary, RenderArgs, RenderFn } from "../core/types";
import { defineBlockComponent } from "../core/walker";
import type { TeamsCard } from "./types";
import { CHART_MARKER_PREFIX } from "./types";

const def = (name: string, props: any, description: string, render: RenderFn) =>
  defineBlockComponent({ name, props, description, render });

const dataDef = (name: string, props: any, description: string) =>
  defineBlockComponent({ name, props, description, render: () => [] });

const reactive = (schema: any) => {
  markReactive(schema);
  return schema;
};

const isElement = (n: unknown): n is ElementNode =>
  !!n && typeof n === "object" && (n as any).type === "element";

const asText = (v: unknown) => (v == null ? "" : String(v));

const el = (element: Record<string, any>) => [element];

// --- content ---

const Header = def(
  "Header",
  z.object({ text: z.string(), size: z.string().optional() }),
  'A heading. Optional size: "large" (default) or "extraLarge".',
  ({ props: p }) =>
    el({
      type: "TextBlock",
      text: asText(p.text),
      weight: "Bolder",
      size: p.size === "extraLarge" ? "ExtraLarge" : "Large",
      wrap: true,
    }),
);

const Text = def(
  "Text",
  z.object({ text: z.string() }),
  "A body paragraph. Supports the TextBlock markdown subset: **bold**, _italic_, bulleted lists with '- ', numbered lists, and [links](url).",
  ({ props: p }) => el({ type: "TextBlock", text: asText(p.text), wrap: true }),
);

const Markdown = def(
  "Markdown",
  z.object({ text: z.string() }),
  "Multi-line text with the TextBlock markdown subset (bold, italic, lists, links).",
  ({ props: p }) => el({ type: "TextBlock", text: asText(p.text), wrap: true }),
);

const Field = dataDef(
  "Field",
  z.object({ label: z.string(), value: z.string() }),
  "A key/value pair shown inside Fields.",
);

const Fields = def(
  "Fields",
  z.object({ items: z.array(Field.ref) }),
  "A native key/value grid (FactSet). Use for metadata, stats, or summaries.",
  ({ props: p }) =>
    el({
      type: "FactSet",
      facts: (p.items ?? []).filter(isElement).map((f: any) => ({
        title: asText(f.props?.label),
        value: asText(f.props?.value),
      })),
    }),
);

const Divider = def("Divider", z.object({}), "A horizontal separator line.", () =>
  el({ type: "Container", separator: true, spacing: "Medium", items: [] }),
);

const Quote = def(
  "Quote",
  z.object({ text: z.string() }),
  "An emphasized block quotation.",
  ({ props: p }) =>
    el({
      type: "Container",
      style: "emphasis",
      items: [{ type: "TextBlock", text: asText(p.text), wrap: true, isSubtle: true }],
    }),
);

const Code = def(
  "Code",
  z.object({ text: z.string() }),
  "A monospace code block.",
  ({ props: p }) =>
    el({ type: "TextBlock", text: asText(p.text), fontType: "Monospace", wrap: true }),
);

const List = def(
  "List",
  z.object({ items: z.array(z.string()), ordered: z.boolean().optional() }),
  "A bulleted list; ordered=true for a numbered list.",
  ({ props: p }) =>
    el({
      type: "TextBlock",
      text: (p.items ?? [])
        .map((t: any, i: number) => (p.ordered ? `${i + 1}. ${asText(t)}` : `- ${asText(t)}`))
        .join("\n"),
      wrap: true,
    }),
);

const Table = def(
  "Table",
  z.object({ headers: z.array(z.string()), rows: z.array(z.array(z.string())) }),
  'A native table. headers are column titles; rows is an array of rows of cell strings. e.g. Table(["Task", "State"], [["Login fix", "Done"]]).',
  ({ props: p }) => {
    const headers = (p.headers ?? []).map(asText);
    const rows = (p.rows ?? []).map((r: any) => (Array.isArray(r) ? r.map(asText) : []));
    const width = Math.max(headers.length, ...rows.map((r: string[]) => r.length), 1);
    const cell = (text: string, bold = false) => ({
      type: "TableCell",
      items: [{ type: "TextBlock", text, wrap: true, ...(bold ? { weight: "Bolder" } : {}) }],
    });
    const toRow = (cells: string[], bold = false) => ({
      type: "TableRow",
      cells: Array.from({ length: width }, (_, c) => cell(cells[c] ?? "", bold)),
    });
    return el({
      type: "Table",
      firstRowAsHeader: headers.length > 0,
      columns: Array.from({ length: width }, () => ({ width: 1 })),
      rows: [
        ...(headers.length ? [toRow(headers, true)] : []),
        ...rows.map((r: string[]) => toRow(r)),
      ],
    });
  },
);

const Image = def(
  "Image",
  z.object({ url: z.string(), alt: z.string().optional() }),
  "An image from a public https URL.",
  ({ props: p }) =>
    el({ type: "Image", url: asText(p.url), ...(p.alt != null ? { altText: asText(p.alt) } : {}) }),
);

const Chart = def(
  "Chart",
  z.object({
    type: z.string(),
    labels: z.array(z.string()),
    values: z.array(z.number()),
    title: z.string().optional(),
    series: z.string().optional(),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  'A chart rendered as an image on the card. type is "bar", "line", "pie", or "area"; labels and values are parallel arrays. Optional: title, series, xLabel, yLabel.',
  ({ props: p, ctx }) => {
    const title = p.title != null ? asText(p.title) : undefined;
    const id = ctx.addChart({
      type: asText(p.type) || "bar",
      labels: (p.labels ?? []).map(asText),
      values: (p.values ?? []).map((v: any) => Number(v)),
      title,
      series: p.series != null ? asText(p.series) : undefined,
      xLabel: p.xLabel != null ? asText(p.xLabel) : undefined,
      yLabel: p.yLabel != null ? asText(p.yLabel) : undefined,
    });
    return el({ type: "Image", url: `${CHART_MARKER_PREFIX}${id}`, altText: title ?? "chart" });
  },
);

const Column = dataDef(
  "Column",
  z.object({ children: z.array(z.any()) }),
  "One column inside Columns; children are any content components.",
);

const Columns = def(
  "Columns",
  z.object({ items: z.array(Column.ref) }),
  "A side-by-side column layout: Columns([Column([...]), Column([...])]). Use for dashboards and comparisons.",
  ({ props: p, ctx }) =>
    el({
      type: "ColumnSet",
      columns: (p.items ?? []).filter(isElement).map((c: any) => ({
        type: "Column",
        width: "stretch",
        items: ctx.walk(c.props?.children ?? []),
      })),
    }),
);

// --- inputs (inline; ids are the bound $variable names, values arrive on submit) ---

const inputId = (ctx: RenderArgs["ctx"], value: unknown): string | undefined =>
  ctx.bindTarget(value);

const TextInput = def(
  "TextInput",
  z.object({ label: z.string(), value: reactive(z.string()), multiline: z.boolean().optional() }),
  "A text field on the card, bound to a $variable. Its value is submitted when any Button is pressed.",
  ({ props: p, ctx }) => {
    const id = inputId(ctx, p.value);
    if (!id) return [];
    const current = asText(ctx.state[id]);
    return el({
      type: "Input.Text",
      id,
      label: asText(p.label),
      ...(p.multiline ? { isMultiline: true } : {}),
      ...(current ? { value: current } : {}),
    });
  },
);

const NumberInput = def(
  "NumberInput",
  z.object({ label: z.string(), value: reactive(z.number()) }),
  "A numeric field on the card, bound to a $variable.",
  ({ props: p, ctx }) => {
    const id = inputId(ctx, p.value);
    if (!id) return [];
    const current = ctx.state[id];
    return el({
      type: "Input.Number",
      id,
      label: asText(p.label),
      ...(current != null && current !== "" ? { value: Number(current) } : {}),
    });
  },
);

const DateInput = def(
  "DateInput",
  z.object({ label: z.string(), value: reactive(z.string()) }),
  'A date picker on the card, bound to a $variable holding "YYYY-MM-DD".',
  ({ props: p, ctx }) => {
    const id = inputId(ctx, p.value);
    if (!id) return [];
    const current = asText(ctx.state[id]);
    return el({
      type: "Input.Date",
      id,
      label: asText(p.label),
      ...(current ? { value: current } : {}),
    });
  },
);

const TimeInput = def(
  "TimeInput",
  z.object({ label: z.string(), value: reactive(z.string()) }),
  'A time picker on the card, bound to a $variable holding "HH:mm".',
  ({ props: p, ctx }) => {
    const id = inputId(ctx, p.value);
    if (!id) return [];
    const current = asText(ctx.state[id]);
    return el({
      type: "Input.Time",
      id,
      label: asText(p.label),
      ...(current ? { value: current } : {}),
    });
  },
);

const Toggle = def(
  "Toggle",
  z.object({ label: z.string(), value: reactive(z.string()) }),
  'A toggle on the card, bound to a $variable holding "true" or "false".',
  ({ props: p, ctx }) => {
    const id = inputId(ctx, p.value);
    if (!id) return [];
    return el({
      type: "Input.Toggle",
      id,
      title: asText(p.label),
      value: asText(ctx.state[id]) === "true" ? "true" : "false",
    });
  },
);

const Option = dataDef(
  "Option",
  z.object({ value: z.string(), label: z.string() }),
  "An option inside a Select.",
);

const Select = def(
  "Select",
  z.object({
    name: z.string(),
    value: reactive(z.string()),
    label: z.string(),
    options: z.array(Option.ref),
  }),
  'A native dropdown (Input.ChoiceSet) bound to a $variable, e.g. Select("priority", $priority, "Priority", [Option("high", "High"), Option("low", "Low")]). Its value is submitted when any Button is pressed.',
  ({ props: p, ctx }) => {
    const id = inputId(ctx, p.value);
    if (!id) return [];
    const options = (p.options ?? []).filter(isElement);
    if (!options.length) {
      console.warn(
        `[openui] Select "${asText(p.name)}" has no options - likely a Query shape mismatch; skipping it`,
      );
      return [];
    }
    const current = asText(ctx.state[id]);
    return el({
      type: "Input.ChoiceSet",
      id,
      label: asText(p.label) || asText(p.name),
      style: "compact",
      choices: options.map((o: any) => ({
        title: asText(o.props?.label),
        value: asText(o.props?.value),
      })),
      ...(current ? { value: current } : {}),
    });
  },
);

// --- actions ---

const Button = dataDef(
  "Button",
  z.object({ label: z.string(), action: z.any().optional(), style: z.string().optional() }),
  'A submit button: runs its action AND submits every input on the card, e.g. Button("Save", Action([@Set($saved, "yes")])). Optional style: "positive" or "destructive". Lives inside Actions.',
);

const LinkButton = dataDef(
  "LinkButton",
  z.object({ label: z.string(), url: z.string() }),
  'A button that opens a URL: LinkButton("View docs", "https://example.com"). Lives inside Actions.',
);

const Actions = def(
  "Actions",
  z.object({ items: z.array(z.union([Button.ref, LinkButton.ref] as any)) }),
  "A row of buttons (keep to 6 or fewer). Buttons submit the card's inputs; use one per distinct action.",
  ({ props: p, ctx }) => {
    const actions = (p.items ?? []).filter(isElement).flatMap((n: any) => {
      const label = asText(n.props?.label);
      if (n.typeName === "LinkButton")
        return [{ type: "Action.OpenUrl", title: label, url: asText(n.props?.url) }];
      if (n.typeName !== "Button") return [];
      const id = ctx.idFor(n);
      const plan = n.props?.action;
      if (plan && Array.isArray(plan.steps)) ctx.registerAction(id, { kind: "action", plan });
      const style =
        n.props?.style === "positive" || n.props?.style === "destructive"
          ? { style: n.props.style }
          : {};
      return [{ type: "Action.Submit", title: label, data: { actionId: id }, ...style }];
    });
    return actions.length ? el({ type: "ActionSet", actions }) : [];
  },
);

const Root = def(
  "Root",
  z.object({
    children: z.array(
      z.union([
        Header.ref,
        Text.ref,
        Markdown.ref,
        Fields.ref,
        Divider.ref,
        Quote.ref,
        Code.ref,
        List.ref,
        Table.ref,
        Image.ref,
        Chart.ref,
        Columns.ref,
        TextInput.ref,
        NumberInput.ref,
        DateInput.ref,
        TimeInput.ref,
        Toggle.ref,
        Select.ref,
        Actions.ref,
      ]),
    ),
  }),
  "The top-level container. Every program must define root = Root([...]). Everything renders into ONE Adaptive Card that updates in place on interaction.",
  ({ props: p, ctx }) => ctx.walk(p.children ?? []),
);

/** The component library - drives Adaptive Card rendering, parsing, and prompt generation. */
export const library = createLibrary({
  root: "Root",
  components: [
    Header,
    Text,
    Markdown,
    Field,
    Fields,
    Divider,
    Quote,
    Code,
    List,
    Table,
    Image,
    Chart,
    Column,
    Columns,
    TextInput,
    NumberInput,
    DateInput,
    TimeInput,
    Toggle,
    Option,
    Select,
    Button,
    LinkButton,
    Actions,
    Root,
  ],
});

function firstText(body: Record<string, any>[]): string {
  for (const b of body) {
    if (b.type === "TextBlock" && b.text) return String(b.text);
    if (b.type === "Container" || b.type === "ColumnSet") {
      const nested = firstText(b.items ?? (b.columns ?? []).flatMap((c: any) => c.items ?? []));
      if (nested) return nested;
    }
  }
  return "";
}

/** The Teams channel: the library plus the Adaptive Card envelope. */
export const teamsChannel: ChannelLibrary<TeamsCard> = {
  library: library as any,
  finalize(items) {
    const body = items as Record<string, any>[];
    return {
      output: {
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        type: "AdaptiveCard",
        version: "1.5",
        body: body.length ? body : [{ type: "TextBlock", text: "…", wrap: true }],
      },
      text: firstText(body) || "OpenUI message",
    };
  },
  errorMessage() {
    return {
      output: {
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        type: "AdaptiveCard",
        version: "1.5",
        body: [
          {
            type: "TextBlock",
            text: "⚠️ Could not render a reply from the model output.",
            wrap: true,
          },
        ],
      },
      text: "Could not render UI",
    };
  },
};

/**
 * Build the system prompt. Passing the connected MCP tools enables
 * Query()/Mutation(); extraRules lets the host app append deployment-specific
 * guidance.
 */
export function buildSystemPrompt(tools?: ToolSpec[], extraRules: string[] = []): string {
  const hasTools = !!(tools && tools.length);
  const rules = [
    "Write every statement on its own top-level line as `name = Expression`. NEVER put a `name = ...` assignment inside an array or inside Root([...]).",
    "Arrays (Root's children, Actions items, Select options, Column children) contain only references or inline components - never assignments.",
    "Query() and Mutation() must each be their own top-level statement; they cannot appear inside an array or as a nested value.",
    "Everything renders into ONE Adaptive Card that updates in place when the user interacts. Compose a coherent card.",
    "Forms are INLINE: put TextInput/NumberInput/DateInput/TimeInput/Toggle/Select directly on the card and add ONE Button to submit - pressing any Button submits every input's value and then runs the button's action.",
    "Keep to 6 or fewer buttons; use Select for choices instead of many buttons.",
    "Only use Image with a URL you know is a direct image file; use Chart for data visuals.",
  ];
  if (hasTools) {
    rules.push(
      "Reference Query results using the exact field names from each tool's output signature above; do not invent wrapper fields like .items, .nodes, or .rows.",
      "When a Select feeds a Mutation argument that needs an id, make each Option's value that id, not the display name.",
    );
  }
  rules.push(...extraRules);
  return library.prompt({ bindings: true, toolCalls: hasTools, tools, additionalRules: rules });
}

export const systemPrompt = buildSystemPrompt();
