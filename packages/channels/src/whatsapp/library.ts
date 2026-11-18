/**
 * The WhatsApp component library. WhatsApp's native surface is small and this
 * vocabulary is honest to it: text with light markdown (*bold* is a single
 * asterisk), image messages, interactive cards with AT MOST 3 reply buttons,
 * and one list menu (the select equivalent, <=10 options). There are no forms,
 * no modals, and messages cannot be edited - every interaction produces new
 * messages, so the prompt steers the model toward short, self-contained cards.
 *
 * Output shape: a WhatsApp render produces an ARRAY of Cloud API message
 * payloads (text runs are coalesced; images, charts, and interactive messages
 * stand alone), in walk order.
 */
import type { ElementNode, ToolSpec } from "@openuidev/lang-core";
import { createLibrary, markReactive } from "@openuidev/lang-core";
import * as z from "zod/v4";
import type { ChannelLibrary, RenderFn } from "../core/types";
import { defineBlockComponent } from "../core/walker";
import type { WaMessage } from "./types";

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
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

/**
 * Encode an action id (+ optional value) into an interactive reply id using
 * the `chat:{"a":...,"v":...}` format the Chat SDK's WhatsApp adapter decodes
 * natively; other transports can decode it with three lines of JSON.
 */
export const encodeReplyId = (actionId: string, value?: string): string =>
  `chat:${JSON.stringify(value === undefined ? { a: actionId } : { a: actionId, v: value })}`;

// Walk fragments: text runs coalesce; messages stand alone.
type Fragment = { t: "text"; text: string } | { t: "msg"; payload: WaMessage };
const textFrag = (text: string): Fragment[] => (text ? [{ t: "text", text }] : []);
const msgFrag = (payload: WaMessage): Fragment[] => [{ t: "msg", payload }];

// --- content ---

const Header = def(
  "Header",
  z.object({ text: z.string() }),
  "A short bold headline line.",
  ({ props: p }) => textFrag(`*${asText(p.text)}*`),
);

const Text = def(
  "Text",
  z.object({ text: z.string() }),
  "A body paragraph. WhatsApp formatting: *bold*, _italic_, ~strikethrough~, ```monospace``` (note: bold is a SINGLE asterisk).",
  ({ props: p }) => textFrag(asText(p.text)),
);

const Field = dataDef(
  "Field",
  z.object({ label: z.string(), value: z.string() }),
  "A key/value pair shown inside Fields.",
);

const Fields = def(
  "Fields",
  z.object({ items: z.array(Field.ref) }),
  "A list of key/value lines. Use for metadata, stats, or summaries.",
  ({ props: p }) =>
    textFrag(
      (p.items ?? [])
        .map((f: any) => `*${asText(f.props?.label)}:* ${asText(f.props?.value)}`)
        .join("\n"),
    ),
);

const Divider = def("Divider", z.object({}), "A separator line between sections.", () =>
  textFrag("――――――――――"),
);

const Image = def(
  "Image",
  z.object({ url: z.string(), caption: z.string().optional() }),
  "An image from a public https URL, sent as an image message. Optional caption.",
  ({ props: p }) =>
    msgFrag({
      type: "image",
      image: { link: asText(p.url), ...(p.caption != null ? { caption: asText(p.caption) } : {}) },
    }),
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
  'A chart rendered as an image message. type is "bar", "line", "pie", or "area". labels and values are parallel arrays. Optional: title, series, xLabel, yLabel. e.g. Chart("bar", ["Todo","Doing","Done"], [5,3,8], "Issues by state").',
  // Emits a marker image message; the transport rasterizes the recorded
  // ChartSpec, uploads the PNG, and swaps in the media id before sending.
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
    return msgFrag({
      type: "image",
      image: { link: "" },
      chartId: id,
      ...(title ? { caption: title } : {}),
    } as any);
  },
);

const Table = def(
  "Table",
  z.object({ headers: z.array(z.string()), rows: z.array(z.array(z.string())) }),
  'A small table rendered as aligned monospace text. e.g. Table(["Title", "Priority"], [["Fix login", "High"]]). Keep it narrow - phone screens.',
  ({ props: p }) => {
    const headers = (p.headers ?? []).map(asText);
    const rows = (p.rows ?? []).map((r: any) => (Array.isArray(r) ? r.map(asText) : []));
    const all = headers.length ? [headers, ...rows] : rows;
    if (!all.length) return [];
    const widths = all[0].map((_: any, c: number) =>
      Math.max(...all.map((r: string[]) => (r[c] ?? "").length)),
    );
    const line = (r: string[]) =>
      r
        .map((cell, c) => (cell ?? "").padEnd(widths[c]))
        .join("  ")
        .trimEnd();
    const out = headers.length
      ? [line(headers), widths.map((w: number) => "-".repeat(w)).join("  "), ...rows.map(line)]
      : rows.map(line);
    return textFrag("```\n" + out.join("\n") + "\n```");
  },
);

const Markdown = def(
  "Markdown",
  z.object({ text: z.string() }),
  "A block of text with WhatsApp formatting (*bold* single asterisk, _italic_, bullet lines starting with •).",
  ({ props: p }) => textFrag(asText(p.text).replace(/\*\*(.+?)\*\*/g, "*$1*")),
);

// --- interactive ---

const Button = dataDef(
  "Button",
  z.object({ label: z.string(), action: z.any().optional() }),
  'A reply button inside a Card. Pass an action for interactivity: Button("Add one", Action([@Set($count, $count + 1)])). Labels are clipped to 20 characters.',
);

const Card = def(
  "Card",
  z.object({ text: z.string(), buttons: z.array(Button.ref).optional() }),
  'A message with up to 3 reply buttons: Card("Count is *3*", [Button("+1", Action([@Set($count, $count + 1)])), Button("Reset", Action([@Reset($count)]))]). Without buttons it is plain text. Tapping a button runs its action and the bot sends an updated card as a NEW message.',
  ({ props: p, ctx }) => {
    const body = clip(asText(p.text), 1024);
    const nodes = (p.buttons ?? []).filter(isElement);
    if (!nodes.length) return textFrag(asText(p.text));
    if (nodes.length > 3)
      console.warn(
        `[openui] Card has ${nodes.length} buttons; WhatsApp allows 3 - extra buttons dropped`,
      );
    const buttons = nodes.slice(0, 3).map((n: any) => {
      const id = ctx.idFor(n);
      const plan = n.props?.action;
      if (plan && Array.isArray(plan.steps)) ctx.registerAction(id, { kind: "action", plan });
      return {
        type: "reply",
        reply: { id: encodeReplyId(id), title: clip(asText(n.props?.label), 20) },
      };
    });
    return msgFrag({
      type: "interactive",
      interactive: { type: "button", body: { text: body }, action: { buttons } },
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
    prompt: z.string(),
    options: z.array(Option.ref),
  }),
  'A list menu (WhatsApp\'s dropdown) bound to a $variable - the one way to offer more than 3 choices, up to 10. e.g. Select("priority", $priority, "Choose a priority", [Option("high", "High"), Option("low", "Low")]). Picking an option sets the $variable and the bot replies with an updated card.',
  ({ props: p, node, ctx }) => {
    const id = ctx.idFor(node);
    const target = ctx.bindTarget(p.value);
    if (target) ctx.registerAction(id, { kind: "input", target });
    const options = (p.options ?? []).filter(isElement);
    if (!options.length) {
      console.warn(
        `[openui] Select "${asText(p.name) || id}" has no options - likely a Query shape mismatch; skipping it`,
      );
      return [];
    }
    const rows = options.slice(0, 10).map((o: any) => ({
      id: encodeReplyId(id, asText(o.props?.value)),
      title: clip(asText(o.props?.label), 24),
    }));
    if (options.length > 10)
      console.warn(
        `[openui] Select "${asText(p.name)}" has ${options.length} options; WhatsApp allows 10 - extras dropped`,
      );
    return msgFrag({
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: clip(asText(p.prompt) || asText(p.name) || "Choose", 1024) },
        action: { button: clip(asText(p.name) || "Choose", 20), sections: [{ rows }] },
      },
    });
  },
);

const Root = def(
  "Root",
  z.object({
    children: z.array(
      z.union([
        Header.ref,
        Text.ref,
        Fields.ref,
        Divider.ref,
        Image.ref,
        Chart.ref,
        Table.ref,
        Markdown.ref,
        Card.ref,
        Select.ref,
      ]),
    ),
  }),
  "The top-level container. Every program must define root = Root([...]). Consecutive text-like children are combined into one message; images, charts, cards, and selects are sent as separate messages.",
  ({ props: p, ctx }) => ctx.walk(p.children ?? []),
);

/** The component library - drives WhatsApp rendering, parsing, and prompt generation. */
export const library = createLibrary({
  root: "Root",
  components: [
    Header,
    Text,
    Field,
    Fields,
    Divider,
    Image,
    Chart,
    Table,
    Markdown,
    Button,
    Card,
    Option,
    Select,
    Root,
  ],
});

/** Coalesce walk fragments: adjacent text runs merge; other messages stand alone. */
function coalesce(items: unknown[]): { messages: WaMessage[]; firstText: string } {
  const messages: WaMessage[] = [];
  let buf: string[] = [];
  let firstText = "";
  const flush = () => {
    if (!buf.length) return;
    const body = clip(buf.join("\n\n"), 4096);
    if (!firstText) firstText = buf[0];
    messages.push({ type: "text", text: { body } });
    buf = [];
  };
  for (const item of items as Fragment[]) {
    if (item?.t === "text") buf.push(item.text);
    else if (item?.t === "msg") {
      flush();
      messages.push(item.payload);
    }
  }
  flush();
  return { messages, firstText };
}

/** The WhatsApp channel: the library plus the multi-message envelope. */
export const whatsappChannel: ChannelLibrary<WaMessage[]> = {
  library: library as any,
  finalize(items) {
    const { messages, firstText } = coalesce(items);
    return { output: messages, text: firstText.replace(/[*_~`]/g, "") || "OpenUI message" };
  },
  errorMessage() {
    return {
      output: [
        { type: "text", text: { body: "⚠️ Could not render a reply from the model output." } },
      ],
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
    "Arrays (Root's children, Card buttons, Select options) contain only references or inline components - never assignments.",
    "Query() and Mutation() must each be their own top-level statement; they cannot appear inside an array or as a nested value.",
    "WhatsApp formatting: *bold* uses a SINGLE asterisk, _italic_, ~strikethrough~. Never use ** or # headings.",
    "A Card holds AT MOST 3 buttons. For more choices, use a Select (up to 10 options).",
    "Messages cannot be edited: every button tap or list pick makes the bot send an UPDATED CARD AS A NEW MESSAGE. Keep cards short and self-contained so the chat stays readable.",
    "This is a phone chat: prefer one focused card over long dashboards; split unrelated content across Text/Card children rather than cramming one message.",
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
