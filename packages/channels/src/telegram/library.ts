/**
 * The Telegram component library, targeting Bot API 10.x Rich Messages
 * (verified against the reference, Bot API 10.2 / July 2026): a render is ONE
 * rich message - typed blocks (headings, paragraphs, tables, quotes, lists
 * with checkboxes, expandable details, photos) plus an inline keyboard - sent
 * with sendRichMessage and EDITED IN PLACE on interaction, like Slack.
 *
 * Interactivity is inline-keyboard callback buttons: plain buttons run
 * ActionPlans; a Select renders as rows of option buttons whose callback data
 * encodes `actionId|value` within Telegram's 64-byte limit.
 */
import type { ElementNode, ToolSpec } from "@openuidev/lang-core";
import { createLibrary, markReactive } from "@openuidev/lang-core";
import * as z from "zod/v4";
import type { ChannelLibrary, RenderArgs, RenderFn } from "../core/types";
import { defineBlockComponent } from "../core/walker";
import { callbackFits, encodeCallback } from "./payload";
import type { TgCard } from "./types";

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

/**
 * Convert light inline markdown (*bold* / **bold**, _italic_, `code`,
 * [label](url)) into Telegram RichText (a string, a typed node, or an array).
 */
export function richText(input: unknown): any {
  const s = asText(input);
  const parts: any[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_|`(.+?)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    if (m[1] !== undefined || m[2] !== undefined) parts.push({ type: "bold", text: m[1] ?? m[2] });
    else if (m[3] !== undefined) parts.push({ type: "italic", text: m[3] });
    else if (m[4] !== undefined) parts.push({ type: "code", text: m[4] });
    else parts.push({ type: "url", text: m[5], url: m[6] });
    last = m.index + m[0].length;
  }
  if (last < s.length) parts.push(s.slice(last));
  if (!parts.length) return "";
  return parts.length === 1 ? parts[0] : parts;
}

const block = (b: Record<string, any>) => [{ b }];
const row = (buttons: Record<string, any>[]) => [{ row: buttons }];

// --- content blocks ---

const Header = def(
  "Header",
  z.object({ text: z.string(), size: z.number().optional() }),
  "A section heading. Optional size 1-6 (1 largest; default 3).",
  ({ props: p }) => {
    const size = Math.min(6, Math.max(1, Number(p.size) || 3));
    return block({ type: "heading", text: richText(p.text), size });
  },
);

const Text = def(
  "Text",
  z.object({ text: z.string() }),
  "A body paragraph. Inline formatting: *bold*, _italic_, `code`, [label](url).",
  ({ props: p }) => block({ type: "paragraph", text: richText(p.text) }),
);

const Field = dataDef(
  "Field",
  z.object({ label: z.string(), value: z.string() }),
  "A key/value pair shown inside Fields.",
);

const Fields = def(
  "Fields",
  z.object({ items: z.array(Field.ref) }),
  "A compact key/value grid rendered as a two-column table. Use for metadata, stats, or summaries.",
  ({ props: p }) => {
    const cells = (p.items ?? []).filter(isElement).map((f: any) => [
      { text: { type: "bold", text: asText(f.props?.label) }, align: "left", valign: "middle" },
      { text: richText(f.props?.value), align: "left", valign: "middle" },
    ]);
    return cells.length ? block({ type: "table", cells }) : [];
  },
);

const Divider = def("Divider", z.object({}), "A horizontal rule between sections.", () =>
  block({ type: "divider" }),
);

const Quote = def("Quote", z.object({ text: z.string() }), "A block quotation.", ({ props: p }) =>
  block({ type: "blockquote", blocks: [{ type: "paragraph", text: richText(p.text) }] }),
);

const Code = def(
  "Code",
  z.object({ text: z.string(), language: z.string().optional() }),
  "A preformatted code block, with an optional programming language for syntax highlighting.",
  ({ props: p }) =>
    block({
      type: "pre",
      text: asText(p.text),
      ...(p.language ? { language: asText(p.language) } : {}),
    }),
);

const List = def(
  "List",
  z.object({ items: z.array(z.string()), ordered: z.boolean().optional() }),
  "A bulleted list; ordered=true for a numbered list.",
  ({ props: p }) =>
    block({
      type: "list",
      items: (p.items ?? []).map((t: any, i: number) => ({
        blocks: [{ type: "paragraph", text: richText(t) }],
        ...(p.ordered ? { value: i + 1, type: "1" } : {}),
      })),
    }),
);

const Checklist = def(
  "Checklist",
  z.object({ items: z.array(z.string()), checked: z.array(z.boolean()).optional() }),
  'A read-only checklist; checked is a parallel array of booleans, e.g. Checklist(["Deploy", "Test"], [true, false]).',
  ({ props: p }) =>
    block({
      type: "list",
      items: (p.items ?? []).map((t: any, i: number) => ({
        blocks: [{ type: "paragraph", text: richText(t) }],
        has_checkbox: true,
        ...((p.checked ?? [])[i] ? { is_checked: true } : {}),
      })),
    }),
);

const Table = def(
  "Table",
  z.object({ headers: z.array(z.string()), rows: z.array(z.array(z.string())) }),
  'A native table. headers are column titles; rows is an array of rows of cell strings. e.g. Table(["Task", "State"], [["Login fix", "Done"]]).',
  ({ props: p }) => {
    const headers = (p.headers ?? []).map(asText);
    const rows = (p.rows ?? []).map((r: any) => (Array.isArray(r) ? r.map(asText) : []));
    const cells = [
      ...(headers.length
        ? [
            headers.map((h: string) => ({
              text: { type: "bold", text: h },
              is_header: true,
              align: "left",
              valign: "middle",
            })),
          ]
        : []),
      ...rows.map((r: string[]) =>
        r.map((c) => ({ text: richText(c), align: "left", valign: "middle" })),
      ),
    ];
    return cells.length ? block({ type: "table", cells, is_bordered: true }) : [];
  },
);

const Details = def(
  "Details",
  z.object({ summary: z.string(), text: z.string(), open: z.boolean().optional() }),
  "An expandable section: an always-visible summary that reveals the text when tapped. Use for long or secondary content.",
  ({ props: p }) =>
    block({
      type: "details",
      summary: richText(p.summary),
      blocks: [{ type: "paragraph", text: richText(p.text) }],
      ...(p.open ? { is_open: true } : {}),
    }),
);

const Image = def(
  "Image",
  z.object({ url: z.string(), caption: z.string().optional() }),
  "A photo from a public https URL, embedded in the card. Optional caption.",
  ({ props: p }) =>
    block({
      type: "photo",
      photo: { type: "photo", media: asText(p.url) },
      ...(p.caption != null ? { caption: { text: richText(p.caption) } } : {}),
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
  'A chart rendered as an image inside the card. type is "bar", "line", "pie", or "area"; labels and values are parallel arrays. Optional: title, series, xLabel, yLabel. e.g. Chart("bar", ["Todo","Doing","Done"], [5,3,8], "Issues by state").',
  // The photo block references attach://<chartId>; the transport rasterizes the
  // recorded ChartSpec and attaches the PNG when sending/editing.
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
    return block({
      type: "photo",
      photo: { type: "photo", media: `attach://${id}` },
      ...(title ? { caption: { text: richText(title) } } : {}),
    });
  },
);

const Markdown = def(
  "Markdown",
  z.object({ text: z.string() }),
  "Multi-line text with inline formatting (*bold*, _italic_, `code`, [label](url)); blank lines split paragraphs.",
  ({ props: p }) =>
    asText(p.text)
      .split(/\n{2,}/)
      .flatMap((para) =>
        para.trim() ? block({ type: "paragraph", text: richText(para.trim()) }) : [],
      ),
);

// --- interactive (inline keyboard) ---

const Button = dataDef(
  "Button",
  z.object({ label: z.string(), action: z.any().optional() }),
  'A button that runs an action: Button("Add one", Action([@Set($count, $count + 1)])). Use @Reset($var) to restore a variable. Lives inside Actions.',
);

const LinkButton = dataDef(
  "LinkButton",
  z.object({ label: z.string(), url: z.string() }),
  'A button that opens a URL: LinkButton("View docs", "https://example.com"). Lives inside Actions.',
);

const CopyButton = dataDef(
  "CopyButton",
  z.object({ label: z.string(), copyText: z.string() }),
  'A button that copies text to the user\'s clipboard: CopyButton("Copy command", "npm install"). Lives inside Actions.',
);

/** Build the keyboard button for one Actions child, registering its action. */
function keyboardButton(n: ElementNode, ctx: RenderArgs["ctx"]): Record<string, any> | null {
  const p: any = n.props ?? {};
  const label = asText(p.label).slice(0, 64);
  if (n.typeName === "LinkButton") return { text: label, url: asText(p.url) };
  if (n.typeName === "CopyButton")
    return { text: label, copy_text: { text: asText(p.copyText).slice(0, 256) } };
  if (n.typeName !== "Button") return null;
  const id = ctx.idFor(n);
  const plan = p.action;
  if (plan && Array.isArray(plan.steps)) ctx.registerAction(id, { kind: "action", plan });
  if (!callbackFits(id)) {
    console.warn(`[openui] button id "${id}" exceeds Telegram's 64-byte callback limit; skipping`);
    return null;
  }
  return { text: label, callback_data: encodeCallback(id) };
}

const Actions = def(
  "Actions",
  z.object({ items: z.array(z.union([Button.ref, LinkButton.ref, CopyButton.ref] as any)) }),
  "One row of buttons (up to 8; keep labels short). Use several Actions for several rows.",
  ({ props: p, ctx }) => {
    const buttons = (p.items ?? [])
      .filter(isElement)
      .map((n: any) => keyboardButton(n, ctx))
      .filter(Boolean)
      .slice(0, 8) as Record<string, any>[];
    return buttons.length ? row(buttons) : [];
  },
);

const Option = dataDef(
  "Option",
  z.object({ value: z.string(), label: z.string() }),
  "An option inside a Select. Keep value a SHORT id - it must fit Telegram's 64-byte callback limit alongside the select's name.",
);

const Select = def(
  "Select",
  z.object({
    name: z.string(),
    value: reactive(z.string()),
    prompt: z.string(),
    options: z.array(Option.ref),
  }),
  'A choice presented as a grid of option buttons, bound to a $variable. e.g. Select("priority", $priority, "Filter by priority", [Option("high", "High"), Option("low", "Low")]). The currently selected option is marked; tapping one sets the $variable and the card updates in place.',
  ({ props: p, node, ctx }) => {
    const id = ctx.idFor(node);
    const target = ctx.bindTarget(p.value);
    if (target) ctx.registerAction(id, { kind: "input", target });
    const current = target ? asText(ctx.state[target]) : "";
    const options = (p.options ?? []).filter(isElement);
    if (!options.length) {
      console.warn(
        `[openui] Select "${asText(p.name) || id}" has no options - likely a Query shape mismatch; skipping it`,
      );
      return [];
    }
    const buttons = options.flatMap((o: any) => {
      const value = asText(o.props?.value);
      const data = encodeCallback(id, value);
      if (!callbackFits(data)) {
        console.warn(
          `[openui] Select option value "${value}" exceeds Telegram's 64-byte callback limit; skipping it`,
        );
        return [];
      }
      const label = asText(o.props?.label).slice(0, 60);
      return [{ text: value === current ? `● ${label}` : label, callback_data: data }];
    });
    if (!buttons.length) return [];
    const fragments: any[] = p.prompt ? block({ type: "paragraph", text: richText(p.prompt) }) : [];
    // Chunk into rows of 3 so labels stay readable on phones.
    for (let i = 0; i < buttons.length; i += 3) fragments.push(...row(buttons.slice(i, i + 3)));
    return fragments;
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
        Quote.ref,
        Code.ref,
        List.ref,
        Checklist.ref,
        Table.ref,
        Details.ref,
        Image.ref,
        Chart.ref,
        Markdown.ref,
        Actions.ref,
        Select.ref,
      ]),
    ),
  }),
  "The top-level container. Every program must define root = Root([...]). Everything renders into ONE Telegram message: content blocks in order, with all button rows attached beneath.",
  ({ props: p, ctx }) => ctx.walk(p.children ?? []),
);

/** The component library - drives Telegram rendering, parsing, and prompt generation. */
export const library = createLibrary({
  root: "Root",
  components: [
    Header,
    Text,
    Field,
    Fields,
    Divider,
    Quote,
    Code,
    List,
    Checklist,
    Table,
    Details,
    Image,
    Chart,
    Markdown,
    Button,
    LinkButton,
    CopyButton,
    Actions,
    Option,
    Select,
    Root,
  ],
});

/** Plain-text preview of a RichText value (for notification fallback). */
function plain(rt: any): string {
  if (typeof rt === "string") return rt;
  if (Array.isArray(rt)) return rt.map(plain).join("");
  if (rt && typeof rt === "object") return plain(rt.text ?? "");
  return "";
}

/** The Telegram channel: the library plus the one-card envelope. */
export const telegramChannel: ChannelLibrary<TgCard> = {
  library: library as any,
  finalize(items) {
    const blocks: Record<string, any>[] = [];
    const keyboard: Record<string, any>[][] = [];
    for (const item of items as any[]) {
      if (item?.b) blocks.push(item.b);
      else if (item?.row) keyboard.push(item.row);
    }
    const firstText = blocks.map((b) => plain(b.text)).find(Boolean) ?? "";
    // A rich message needs at least one block even if the card is buttons-only.
    if (!blocks.length && keyboard.length) blocks.push({ type: "paragraph", text: "…" });
    return { output: { blocks, keyboard }, text: firstText || "OpenUI message" };
  },
  errorMessage() {
    return {
      output: {
        blocks: [{ type: "paragraph", text: "⚠️ Could not render a reply from the model output." }],
        keyboard: [],
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
    "Arrays (Root's children, Actions items, Select options) contain only references or inline components - never assignments.",
    "Query() and Mutation() must each be their own top-level statement; they cannot appear inside an array or as a nested value.",
    "Everything renders into ONE Telegram message that updates in place when the user taps buttons. Compose a coherent card, not a transcript.",
    "Keep button labels short (a word or two); an Actions row holds up to 8 buttons - prefer 2-4.",
    "Option values must be SHORT ids (they ride in a 64-byte callback). Use Select for choices, Details for long secondary content, Checklist to show task completion.",
    "Only use Image with a URL you know is a direct image file; Telegram fetches it and rejects the card otherwise. When in doubt, use Chart or omit the image.",
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
