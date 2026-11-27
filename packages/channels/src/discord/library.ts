/**
 * The Discord component library, targeting message Components V2: a render is
 * ONE message whose body is a Container (optional accent color) of text
 * displays, separators, media galleries, sections, and action rows. Messages
 * are EDITED IN PLACE on interaction (UPDATE_MESSAGE), like Slack and Teams.
 *
 * Interactivity: buttons and string selects live in action rows inside the
 * container; a Form renders as one button that opens a modal of labelled
 * inputs. Discord has no in-message text or number inputs.
 */
import type { ElementNode, ToolSpec } from "@openuidev/lang-core";
import { createLibrary, markReactive } from "@openuidev/lang-core";
import * as z from "zod/v4";
import type { ChannelLibrary, RenderArgs, RenderFn } from "../core/types";
import { defineBlockComponent } from "../core/walker";
import type { FieldSpec, FormSpec } from "../ui/types";
import { customIdFits, DUP_SEP, FORM_PREFIX, formModal } from "./payload";
import { IS_COMPONENTS_V2, type DiscordMessage } from "./types";

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

/** Normalize light markdown to Discord's dialect (*bold* -> **bold**), leaving code untouched. */
const md = (v: unknown) =>
  asText(v)
    .split(/(```[\s\S]*?```|`[^`\n]*`)/)
    .map((part, i) => (i % 2 ? part : part.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1**$2**")))
    .join("");

// Component type numbers (Discord API).
const T = {
  row: 1,
  button: 2,
  select: 3,
  section: 9,
  text: 10,
  thumbnail: 11,
  gallery: 12,
  separator: 14,
} as const;

const MAX_URL = 512;
const NO_MENTIONS = { parse: [] as string[] };

const text = (content: string) => (content ? [{ type: T.text, content }] : []);

// --- content ---

const Header = def(
  "Header",
  z.object({ text: z.string(), size: z.number().optional() }),
  "A heading. Optional size 1-3 (1 largest; default 2).",
  ({ props: p }) => {
    const size = Math.min(3, Math.max(1, Number(p.size) || 2));
    return text(`${"#".repeat(size)} ${asText(p.text)}`);
  },
);

const Text = def(
  "Text",
  z.object({ text: z.string() }),
  "A body paragraph. Inline formatting: **bold**, _italic_, `code`, [label](url).",
  ({ props: p }) => text(md(p.text)),
);

const Markdown = def(
  "Markdown",
  z.object({ text: z.string() }),
  "Multi-line Discord markdown: **bold**, _italic_, `code`, [label](url), lists, > quotes.",
  ({ props: p }) => text(md(p.text)),
);

const Context = def(
  "Context",
  z.object({ text: z.string() }),
  "Small, muted secondary text (timestamps, sources, who did what).",
  ({ props: p }) =>
    text(
      md(p.text)
        .split("\n")
        .map((l) => `-# ${l}`)
        .join("\n"),
    ),
);

const Field = dataDef(
  "Field",
  z.object({ label: z.string(), value: z.string() }),
  "A key/value pair shown inside Fields.",
);

const Fields = def(
  "Fields",
  z.object({ items: z.array(Field.ref) }),
  "Key/value pairs, one per line with a bold label. Use for stats and metadata.",
  ({ props: p }) =>
    text(
      (p.items ?? [])
        .filter(isElement)
        .map((f: any) => `**${asText(f.props?.label)}**  ${md(f.props?.value)}`)
        .join("\n"),
    ),
);

const Divider = def("Divider", z.object({}), "A horizontal rule between sections.", () => [
  { type: T.separator, divider: true, spacing: 1 },
]);

const Quote = def("Quote", z.object({ text: z.string() }), "A block quotation.", ({ props: p }) =>
  text(
    md(p.text)
      .split("\n")
      .map((l) => `> ${l}`)
      .join("\n"),
  ),
);

const Code = def(
  "Code",
  z.object({ text: z.string(), language: z.string().optional() }),
  "A code block with optional language for syntax highlighting.",
  ({ props: p }) => text(`\`\`\`${asText(p.language)}\n${asText(p.text)}\n\`\`\``),
);

const List = def(
  "List",
  z.object({ items: z.array(z.string()), ordered: z.boolean().optional() }),
  "A bulleted list; ordered=true for a numbered list.",
  ({ props: p }) =>
    text(
      (p.items ?? [])
        .map((t: any, i: number) => `${p.ordered ? `${i + 1}.` : "-"} ${md(t)}`)
        .join("\n"),
    ),
);

const Table = def(
  "Table",
  z.object({ headers: z.array(z.string()), rows: z.array(z.array(z.string())) }),
  'A small table, rendered as an aligned monospace block (Discord has no native table). Keep it to a few short columns. e.g. Table(["Package", "Weekly"], [["lang-core", "1.5M"]]).',
  ({ props: p }) => {
    const rows: string[][] = [
      (p.headers ?? []).map(asText),
      ...(p.rows ?? []).map((r: any) => (Array.isArray(r) ? r.map(asText) : [])),
    ].filter((r) => r.length);
    if (!rows.length) return [];
    const widths = rows[0].map((_, i) => Math.max(...rows.map((r) => (r[i] ?? "").length)));
    const line = (r: string[]) =>
      r
        .map((c, i) => (i === r.length - 1 ? c : c.padEnd(widths[i] ?? 0)))
        .join("  ")
        .trimEnd();
    const out = rows.map(line);
    return text(`\`\`\`\n${out.join("\n")}\n\`\`\``);
  },
);

const Image = def(
  "Image",
  z.object({ url: z.string(), alt: z.string().optional() }),
  "An image from a public https URL, shown full width.",
  ({ props: p }) => [
    {
      type: T.gallery,
      items: [
        {
          media: { url: asText(p.url) },
          ...(p.alt ? { description: asText(p.alt).slice(0, 1024) } : {}),
        },
      ],
    },
  ],
);

const Section = def(
  "Section",
  z.object({ text: z.string(), image: z.string() }),
  "Text with a small thumbnail image on the right (an avatar, logo, or product shot from a public https URL).",
  ({ props: p }) => [
    {
      type: T.section,
      components: [{ type: T.text, content: md(p.text) }],
      accessory: { type: T.thumbnail, media: { url: asText(p.image) } },
    },
  ],
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
  'A chart rendered as an image in the message. type is "bar", "line", "pie", or "area"; labels and values are parallel arrays. e.g. Chart("bar", ["Todo","Doing","Done"], [5,3,8], "Issues by state").',
  // The gallery references attachment://<chartId>.png; the transport rasterizes
  // the recorded ChartSpec and uploads it as a file with that name.
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
    return [
      {
        type: T.gallery,
        items: [
          { media: { url: `attachment://${id}.png` }, ...(title ? { description: title } : {}) },
        ],
      },
    ];
  },
);

// --- interactive ---

const STYLES: Record<string, number> = {
  primary: 1,
  secondary: 2,
  success: 3,
  positive: 3,
  danger: 4,
  destructive: 4,
};

const Button = dataDef(
  "Button",
  z.object({ label: z.string(), action: z.any().optional(), style: z.string().optional() }),
  'A button that runs an action: Button("Approve", Action([@Set($state, "approved")]), "primary"). style is "primary" (default), "secondary", "success", or "danger". Lives inside Actions.',
);

const LinkButton = dataDef(
  "LinkButton",
  z.object({ label: z.string(), url: z.string() }),
  'A button that opens a URL: LinkButton("View on GitHub", "https://github.com"). Lives inside Actions.',
);

function button(n: ElementNode, ctx: RenderArgs["ctx"]): Record<string, any> | null {
  const p: any = n.props ?? {};
  const label = asText(p.label).slice(0, 80);
  if (n.typeName === "LinkButton") {
    const url = asText(p.url);
    if (!url || url.length > MAX_URL) {
      console.warn(`[openui] link button URL exceeds Discord's ${MAX_URL}-char limit; skipping`);
      return null;
    }
    return { type: T.button, style: 5, label, url };
  }
  if (n.typeName !== "Button") return null;
  const id = ctx.idFor(n);
  if (p.action && Array.isArray(p.action.steps))
    ctx.registerAction(id, { kind: "action", plan: p.action });
  if (!customIdFits(id)) {
    console.warn(`[openui] button id "${id}" exceeds Discord's 100-char custom_id limit; skipping`);
    return null;
  }
  return { type: T.button, style: STYLES[asText(p.style)] ?? 1, label, custom_id: id };
}

const Actions = def(
  "Actions",
  z.object({ items: z.array(z.union([Button.ref, LinkButton.ref] as any)) }),
  "One row of up to 5 buttons. Use several Actions for more rows.",
  ({ props: p, ctx }) => {
    const components = (p.items ?? [])
      .filter(isElement)
      .map((n: any) => button(n, ctx))
      .filter(Boolean)
      .slice(0, 5);
    return components.length ? [{ type: T.row, components }] : [];
  },
);

const Option = dataDef(
  "Option",
  z.object({ value: z.string(), label: z.string(), description: z.string().optional() }),
  "An option inside a Select, with an optional one-line description.",
);

const optionsOf = (p: any, current?: unknown) =>
  (p.options ?? [])
    .filter(isElement)
    .filter((o: any) => {
      const fits = customIdFits(asText(o.props?.value));
      if (!fits) console.warn("[openui] Discord option values must be 1-100 chars; skipping one");
      return fits;
    })
    .slice(0, 25)
    .map((o: any) => {
      const value = asText(o.props?.value);
      return {
        label: asText(o.props?.label).slice(0, 100),
        value,
        ...(o.props?.description ? { description: asText(o.props.description).slice(0, 100) } : {}),
        ...(current !== undefined && value === asText(current) ? { default: true } : {}),
      };
    });

const Select = def(
  "Select",
  z.object({
    name: z.string(),
    value: reactive(z.string()),
    prompt: z.string(),
    options: z.array(Option.ref),
  }),
  'A dropdown bound to a $variable; picking an option sets it and the message updates in place. e.g. Select("range", $range, "Range", [Option("30", "Last 30 days"), Option("90", "Last 90 days")]). Also usable as a Form field.',
  ({ props: p, node, ctx }) => {
    const id = ctx.idFor(node);
    const target = ctx.bindTarget(p.value);
    if (target) ctx.registerAction(id, { kind: "input", target });
    const options = optionsOf(p, target ? ctx.state[target] : undefined);
    if (!options.length) {
      console.warn(`[openui] Select "${asText(p.name) || id}" has no options; skipping it`);
      return [];
    }
    return [
      {
        type: T.row,
        components: [
          { type: T.select, custom_id: id, placeholder: asText(p.prompt).slice(0, 150), options },
        ],
      },
    ];
  },
);

// --- form fields (shown in a modal, not in the message) ---

const TextInput = dataDef(
  "TextInput",
  z.object({ label: z.string(), value: reactive(z.string()) }),
  "A single-line text field inside a Form, bound to a $variable.",
);
const TextArea = dataDef(
  "TextArea",
  z.object({ label: z.string(), value: reactive(z.string()) }),
  "A multi-line text field inside a Form, bound to a $variable.",
);
const NumberInput = dataDef(
  "NumberInput",
  z.object({ label: z.string(), value: reactive(z.number()) }),
  "A number field inside a Form, bound to a $variable.",
);

const KINDS: Record<string, FieldSpec["kind"]> = {
  TextInput: "text",
  TextArea: "textarea",
  NumberInput: "number",
  Select: "select",
};

function fieldSpec(n: unknown, ctx: RenderArgs["ctx"]): FieldSpec | null {
  if (!isElement(n)) return null;
  const kind = KINDS[n.typeName];
  const p: any = n.props ?? {};
  const target = ctx.bindTarget(p.value);
  if (!kind || !target) return null;
  return {
    target,
    kind,
    label: asText(kind === "select" ? p.prompt || p.name : p.label),
    initial: ctx.state[target],
    ...(kind === "select"
      ? { options: optionsOf(p).map(({ value, label }: any) => ({ value, label })) }
      : {}),
  } as FieldSpec;
}

const Form = def(
  "Form",
  z.object({
    title: z.string(),
    submit: z.string(),
    fields: z.array(z.union([TextInput.ref, TextArea.ref, NumberInput.ref, Select.ref])),
    action: z.any().optional(),
  }),
  'A form. Renders as one button labeled `title`; clicking opens a pop-up of up to 5 fields. Submitting sets each field\'s $variable, then runs the optional action. e.g. Form("Set goal", "Save", [NumberInput("Weekly downloads", $goal)], Action([@Set($stage, "goal")])).',
  ({ props: p, node, ctx }) => {
    const id = ctx.idFor(node, "form");
    const spec: FormSpec = {
      title: asText(p.title),
      submit: asText(p.submit) || "Submit",
      fields: (p.fields ?? []).map((n: any) => fieldSpec(n, ctx)).filter(Boolean) as FieldSpec[],
      action: p.action && Array.isArray(p.action.steps) ? p.action : undefined,
    };
    ctx.registerForm(id, spec);
    if (!formModal(id, spec).components.length) {
      console.warn(`[openui] form "${id}" has no fields Discord can show; skipping its button`);
      return [];
    }
    return [
      {
        type: T.row,
        components: [
          {
            type: T.button,
            style: 1,
            label: asText(p.title).slice(0, 80) || "Open form",
            custom_id: `${FORM_PREFIX}${id}`,
          },
        ],
      },
    ];
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
        Context.ref,
        Fields.ref,
        Divider.ref,
        Quote.ref,
        Code.ref,
        List.ref,
        Table.ref,
        Image.ref,
        Section.ref,
        Chart.ref,
        Actions.ref,
        Select.ref,
        Form.ref,
      ]),
    ),
    accent: z.string().optional(),
  }),
  'The top-level container. Every program must define root = Root([...]). Optional accent is a hex color for the left edge, e.g. Root([...], "#5865F2").',
  ({ props: p, ctx }) => [{ accent: asText(p.accent) }, ...ctx.walk(p.children ?? [])],
);

/** The component library - drives Discord rendering, parsing, and prompt generation. */
export const library = createLibrary({
  root: "Root",
  components: [
    Header,
    Text,
    Markdown,
    Context,
    Field,
    Fields,
    Divider,
    Quote,
    Code,
    List,
    Table,
    Image,
    Section,
    Chart,
    Button,
    LinkButton,
    Actions,
    Option,
    Select,
    TextInput,
    TextArea,
    NumberInput,
    Form,
    Root,
  ],
});

const MAX_COMPONENTS = 40;
const MAX_TEXT = 4000;

const countOf = (c: any): number =>
  1 + (c.components ?? []).reduce((n: number, x: any) => n + countOf(x), 0) + (c.accessory ? 1 : 0);

const textOf = (c: any): string => [c.content ?? "", ...(c.components ?? []).map(textOf)].join("");

/** The Discord channel: the library plus the one-container envelope. */
export const discordChannel: ChannelLibrary<DiscordMessage> = {
  library: library as any,
  finalize(items) {
    let accent: number | undefined;
    const body: Record<string, any>[] = [];
    let count = 1;
    let chars = 0;
    for (const item of items as any[]) {
      if (!item) continue;
      if ("accent" in item && !("type" in item)) {
        const hex = /^#?([0-9a-f]{6})$/i.exec(item.accent ?? "");
        if (hex) accent = parseInt(hex[1], 16);
        continue;
      }
      const n = countOf(item);
      const len = textOf(item).length;
      if (count + n > MAX_COMPONENTS || chars + len > MAX_TEXT) {
        console.warn(
          "[openui] Discord message limit reached (40 components / 4000 chars); truncating",
        );
        break;
      }
      count += n;
      chars += len;
      body.push(item);
    }
    // Adjacent button rows (e.g. a Form button next to Actions) share one row when they fit.
    for (let i = body.length - 1; i > 0; i--) {
      const a = body[i - 1],
        b = body[i];
      const buttons = (r: any) =>
        r?.type === T.row && r.components.every((c: any) => c.type === T.button);
      if (buttons(a) && buttons(b) && a.components.length + b.components.length <= 5) {
        body.splice(i - 1, 2, { ...a, components: [...a.components, ...b.components] });
        count--;
      }
    }
    if (!body.length) body.push({ type: T.text, content: "…" });
    // Discord rejects a message whose custom_ids repeat (a statement reused in two places).
    const seen = new Map<string, number>();
    const dedupe = (c: any) => {
      if (typeof c?.custom_id === "string") {
        const n = seen.get(c.custom_id) ?? 0;
        seen.set(c.custom_id, n + 1);
        if (n) c.custom_id = `${c.custom_id}${DUP_SEP}${n}`;
      }
      if (c?.accessory) dedupe(c.accessory);
      for (const k of c?.components ?? []) dedupe(k);
      if (c?.type === T.row) c.components = c.components.filter((k: any) => !tooLong(k));
    };
    const tooLong = (k: any) => typeof k.custom_id === "string" && !customIdFits(k.custom_id);
    body.forEach(dedupe);
    for (let i = body.length - 1; i >= 0; i--)
      if (body[i].type === T.row && !body[i].components.length) body.splice(i, 1);
    const container = {
      type: 17,
      ...(accent !== undefined ? { accent_color: accent } : {}),
      components: body,
    };
    const firstText = body.map(textOf).find(Boolean) ?? "";
    return {
      output: { flags: IS_COMPONENTS_V2, allowed_mentions: NO_MENTIONS, components: [container] },
      text: firstText.replace(/^[#>\-\s]+/, "").slice(0, 200) || "OpenUI message",
    };
  },
  errorMessage() {
    return {
      output: {
        flags: IS_COMPONENTS_V2,
        allowed_mentions: NO_MENTIONS,
        components: [{ type: T.text, content: "Could not render a reply from the model output." }],
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
    "Everything renders into ONE Discord message that updates in place when the user clicks. Compose a coherent card, not a transcript.",
    "A message holds at most 40 components and 4000 characters of text. Prefer one Fields block over many Text lines.",
    "Discord has no text or number inputs in messages: use Select for choices and Form (a pop-up) to collect typed values.",
    "Only use Image or Section with a URL you know is a direct image file. When in doubt, use Chart or omit the image.",
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
