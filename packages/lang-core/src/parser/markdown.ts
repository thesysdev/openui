// ─────────────────────────────────────────────────────────────────────────────
// ElementNode → Markdown
// Flattens a parsed OpenUI response into readable Markdown: text, headings,
// lists, tables and code survive; layout and interactive-only UI is dropped.
// ─────────────────────────────────────────────────────────────────────────────

import { isASTNode } from "./ast";
import { isElementNode, type ElementNode, type ParseResult } from "./types";

// ─── Public types ────────────────────────────────────────────────────────────

/** Helpers handed to a component renderer. */
export interface MarkdownRenderContext {
  /** Render any prop value (element, array, string, ...) as Markdown blocks. */
  render(value: unknown): string;
  /** Render a value as a single line of text (for headings, list items, table cells). */
  inline(value: unknown): string;
  /** Resolve a prop value to plain data: `$state` refs and literal AST nodes are unwrapped. */
  resolve(value: unknown): unknown;
}

/**
 * Renders one component. Return a string to use it, `null` (or `""`) to drop the
 * component, or `undefined` to fall back to the built-in handling.
 */
export type MarkdownComponentRenderer = (
  node: ElementNode,
  ctx: MarkdownRenderContext,
) => string | null | undefined;

export interface ToMarkdownOptions {
  /**
   * Per-component renderers keyed by component name. They take precedence over the
   * built-in rules. `false` drops the component (and its children).
   */
  components?: Record<string, MarkdownComponentRenderer | false>;
  /**
   * `$variable` values used to resolve state references in props.
   * Taken from `ParseResult.stateDeclarations` when a ParseResult is passed.
   */
  stateDeclarations?: Record<string, unknown>;
}

// ─── Built-in rules ──────────────────────────────────────────────────────────

/** Props that only affect presentation; the generic renderer never prints them. */
const PRESENTATIONAL_PROPS = new Set([
  "align",
  "appearance",
  "color",
  "decorative",
  "direction",
  "disabled",
  "gap",
  "height",
  "icon",
  "iconSize",
  "iconVariant",
  "id",
  "isFoldable",
  "justify",
  "language",
  "layout",
  "mode",
  "name",
  "open",
  "orientation",
  "placeholder",
  "rules",
  "size",
  "src",
  "subtextVariant",
  "type",
  "variant",
  "visible",
  "width",
  "wrap",
]);

/** Interactive components with no Markdown equivalent. Dropped unless overridden. */
const INTERACTIVE = [
  "Button",
  "Buttons",
  "IconButton",
  "FollowUpBlock",
  "FollowUpItem",
  "Input",
  "TextArea",
  "Select",
  "SelectItem",
  "DatePicker",
  "Slider",
  "CheckBoxGroup",
  "CheckBoxItem",
  "RadioGroup",
  "RadioItem",
  "SwitchGroup",
  "SwitchItem",
  "Chips",
  "ChipItem",
  "Icon",
];

function heading(level: number, text: string): string {
  return text ? `${"#".repeat(level)} ${text}` : "";
}

function blocks(...parts: (string | null | undefined)[]): string {
  return parts.filter((p) => p && p.trim()).join("\n\n");
}

function elements(value: unknown): ElementNode[] {
  return Array.isArray(value) ? value.filter(isElementNode) : isElementNode(value) ? [value] : [];
}

function cell(text: string): string {
  return text.replace(/\|/g, "\\|") || " ";
}

function table(header: string[], rows: string[][]): string {
  if (!header.length) return "";
  const line = (cells: string[]) => `| ${cells.map(cell).join(" | ")} |`;
  return [line(header), line(header.map(() => "---")), ...rows.map(line)].join("\n");
}

function list(items: string[], ordered: boolean): string {
  return items
    .filter(Boolean)
    .map((item, i) => {
      const marker = ordered ? `${i + 1}. ` : "- ";
      // Indent continuation lines so multi-line items stay inside the list item
      const indent = " ".repeat(marker.length);
      return marker + item.replace(/\n(?=[^\n])/g, `\n${indent}`);
    })
    .join("\n");
}

/** "Title — subtitle", bolding the title when there is more than one part. */
function titled(title: string, rest: string): string {
  if (!title) return rest;
  return rest ? `**${title}** — ${rest}` : title;
}

/**
 * Render one prop as Markdown, or undefined when the component doesn't have it, so a
 * same-named component from another library falls back to the generic renderer.
 */
function renderProp(node: ElementNode, ctx: MarkdownRenderContext, key: string) {
  return key in node.props ? ctx.render(node.props[key]) : undefined;
}

/** Chart-shaped props → a data table. Returns undefined when the shape doesn't match. */
function chartTable(node: ElementNode, ctx: MarkdownRenderContext): string | undefined {
  const labels = ctx.resolve(node.props.labels);
  if (!Array.isArray(labels)) return undefined;
  const labelText = labels.map((l) => ctx.inline(l));

  const series = elements(ctx.resolve(node.props.series));
  if (series.length) {
    const header = [
      ctx.inline(node.props.xLabel),
      ...series.map((s) => ctx.inline(s.props.category)),
    ];
    const values = series.map((s) => ctx.resolve(s.props.values));
    const rows = labelText.map((label, i) => [
      label,
      ...values.map((v) => (Array.isArray(v) ? ctx.inline(v[i]) : "")),
    ]);
    return table(header, rows);
  }

  const values = ctx.resolve(node.props.values);
  if (Array.isArray(values)) {
    return table(
      ["Label", "Value"],
      labelText.map((label, i) => [label, ctx.inline(values[i])]),
    );
  }
  return undefined;
}

/** Human-readable value of a form input, or "" when it has none. */
function inputValue(input: ElementNode, ctx: MarkdownRenderContext): string {
  const value = ctx.resolve(input.props.value) ?? ctx.resolve(input.props.defaultValue);
  const items = elements(ctx.resolve(input.props.items));
  const labelOf = (v: unknown) => {
    const item = items.find((it) => ctx.resolve(it.props.value) === v);
    return item ? ctx.inline(item.props.label) : ctx.inline(v);
  };

  if (value === null || value === undefined) {
    // Checkbox-style groups carry their state on the items
    const checked = items.filter((it) => ctx.resolve(it.props.defaultChecked) === true);
    return checked.map((it) => ctx.inline(it.props.label)).join(", ");
  }
  if (Array.isArray(value)) return value.map(labelOf).join(", ");
  if (typeof value === "object") {
    // { [itemName]: boolean } → labels of the checked items
    const record = value as Record<string, unknown>;
    return items
      .filter((it) => record[ctx.inline(it.props.name)] === true)
      .map((it) => ctx.inline(it.props.label))
      .join(", ");
  }
  return labelOf(value);
}

const BUILTIN_RENDERERS: Record<string, MarkdownComponentRenderer> = {
  Heading: (node, ctx) => {
    const level = Number(ctx.resolve(node.props.level));
    const clamped = Number.isInteger(level) && level >= 1 && level <= 6 ? level : 2;
    return heading(clamped, ctx.inline(node.props.text ?? node.props.title));
  },
  CardHeader: (node, ctx) =>
    blocks(heading(2, ctx.inline(node.props.title)), ctx.inline(node.props.subtitle)),
  InlineHeader: (node, ctx) =>
    blocks(heading(3, ctx.inline(node.props.heading)), ctx.inline(node.props.description)),
  TextContent: (node, ctx) => renderProp(node, ctx, "text"),
  Text: (node, ctx) => renderProp(node, ctx, "text"),
  MarkDownRenderer: (node, ctx) => renderProp(node, ctx, "textMarkdown"),
  Markdown: (node, ctx) => renderProp(node, ctx, "textMarkdown") ?? renderProp(node, ctx, "text"),
  CodeBlock: (node, ctx) => {
    const code = ctx.resolve(node.props.codeString);
    if (typeof code !== "string") return null;
    const fence = code.includes("```") ? "````" : "```";
    return `${fence}${ctx.inline(node.props.language)}\n${code}\n${fence}`;
  },
  Separator: () => "---",
  Image: (node, ctx) => {
    const alt = ctx.inline(node.props.alt);
    const src = ctx.resolve(node.props.src);
    return typeof src === "string" && src ? `![${alt}](${src})` : alt;
  },
  Callout: (node, ctx) => {
    const body = blocks(
      node.props.title ? `**${ctx.inline(node.props.title)}**` : "",
      ctx.render(node.props.description),
    );
    return body ? body.replace(/^/gm, "> ").replace(/^> $/gm, ">") : null;
  },
  Table: (node, ctx) => {
    if (!("columns" in node.props)) return undefined;
    const cols = elements(ctx.resolve(node.props.columns));
    const header = cols.map((c) => ctx.inline(c.props.label));
    const data = cols.map((c) => {
      const d = ctx.resolve(c.props.data);
      return Array.isArray(d) ? d : [];
    });
    const rowCount = Math.max(0, ...data.map((d) => d.length));
    const rows = Array.from({ length: rowCount }, (_, r) => data.map((d) => ctx.inline(d[r])));
    return table(header, rows);
  },
  ListBlock: (node, ctx) =>
    list(
      elements(ctx.resolve(node.props.items)).map((item) => ctx.inline(item)),
      ctx.resolve(node.props.variant) === "number",
    ),
  ListItem: (node, ctx) => titled(ctx.inline(node.props.title), ctx.inline(node.props.subtitle)),
  Steps: (node, ctx) =>
    list(
      elements(ctx.resolve(node.props.items)).map((item) =>
        blocks(`**${ctx.inline(item.props.title)}**`, ctx.render(item.props.details)),
      ),
      true,
    ),
  TagBlock: (node, ctx) => {
    const tags = ctx.resolve(node.props.tags);
    return Array.isArray(tags) ? tags.map((t) => ctx.inline(t)).join(", ") : null;
  },
  Tag: (node, ctx) => ctx.inline(node.props.text),
  Form: (node, ctx) =>
    list(
      elements(ctx.resolve(node.props.fields)).map((field) => ctx.inline(field)),
      false,
    ),
  FormControl: (node, ctx) => {
    const label = ctx.inline(node.props.label);
    const input = elements(ctx.resolve(node.props.input))[0];
    const value = input ? inputValue(input, ctx) : "";
    return value ? `**${label}:** ${value}` : `**${label}**`;
  },
};

// Sections with a trigger label: Tabs, Accordion, SectionBlock
for (const name of ["TabItem", "AccordionItem", "SectionItem"]) {
  BUILTIN_RENDERERS[name] = (node, ctx) =>
    blocks(heading(3, ctx.inline(node.props.trigger)), ctx.render(node.props.content));
}
for (const name of INTERACTIVE) {
  BUILTIN_RENDERERS[name] = () => null;
}

// ─── Renderer ────────────────────────────────────────────────────────────────

class MarkdownRenderer implements MarkdownRenderContext {
  private readonly stack = new Set<ElementNode>();

  private readonly components: NonNullable<ToMarkdownOptions["components"]>;
  private readonly state: Record<string, unknown>;

  constructor(options: ToMarkdownOptions) {
    this.components = options.components ?? {};
    this.state = options.stateDeclarations ?? {};
    this.render = this.render.bind(this);
    this.inline = this.inline.bind(this);
    this.resolve = this.resolve.bind(this);
  }

  resolve(value: unknown): unknown {
    if (!isASTNode(value)) return value;
    switch (value.k) {
      case "Str":
      case "Num":
      case "Bool":
        return value.v;
      case "Null":
        return null;
      case "StateRef":
        return this.resolve(this.state[value.n]);
      case "Arr":
        return value.els.map(this.resolve);
      default:
        // Runtime expressions (queries, ternaries, ...) need evaluation; nothing to print
        return undefined;
    }
  }

  render(value: unknown): string {
    const v = this.resolve(value);
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v.trim();
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (isElementNode(v)) return this.renderElement(v);
    if (Array.isArray(v)) {
      if (v.every((x) => !isElementNode(x) && typeof this.resolve(x) !== "object")) {
        return list(
          v.map((x) => this.inline(x)),
          false,
        );
      }
      return blocks(...v.map(this.render));
    }
    // Plain objects (action plans, image descriptors, ...) carry no readable text
    return "";
  }

  inline(value: unknown): string {
    const v = this.resolve(value);
    if (Array.isArray(v)) return v.map(this.inline).filter(Boolean).join(", ");
    return this.render(v)
      .replace(/\s*\n\s*/g, " ")
      .trim();
  }

  private renderElement(node: ElementNode): string {
    if (this.stack.has(node)) return "";
    this.stack.add(node);
    try {
      const custom = this.components[node.typeName];
      if (custom === false) return "";
      if (custom) {
        const out = custom(node, this);
        if (out !== undefined) return out ?? "";
      }
      const builtin = BUILTIN_RENDERERS[node.typeName];
      if (builtin) {
        const out = builtin(node, this);
        if (out !== undefined) return out ?? "";
      }
      return chartTable(node, this) ?? this.renderGeneric(node);
    } finally {
      this.stack.delete(node);
    }
  }

  /** Unknown component: print its content props in order, recurse into children. */
  private renderGeneric(node: ElementNode): string {
    const parts: string[] = [];
    for (const [key, raw] of Object.entries(node.props)) {
      if (PRESENTATIONAL_PROPS.has(key)) continue;
      const value = this.resolve(raw);
      if (typeof value === "string") {
        const text = value.trim();
        if (text) parts.push(key === "title" ? `**${this.inline(text)}**` : text);
      } else if (isElementNode(value) || Array.isArray(value)) {
        parts.push(this.render(value));
      }
      // Numbers, booleans and plain objects are usually configuration — skip them
    }
    return blocks(...parts);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

function isParseResult(value: unknown): value is ParseResult {
  return (
    !!value &&
    typeof value === "object" &&
    "root" in value &&
    "meta" in value &&
    !isElementNode(value)
  );
}

/**
 * Convert a parsed OpenUI response to Markdown.
 *
 * Text, headings, lists, tables, code blocks and form labels/values are kept; layout
 * containers are flattened and interactive-only components (buttons, inputs, follow-ups)
 * are dropped. Unknown components fall back to printing their text props in order, so
 * custom libraries get a sensible result without configuration. Use `options.components`
 * to override or extend how individual components are rendered.
 *
 * Props that only exist at runtime (Query results, ternaries) are skipped. To include
 * live data, evaluate the tree first (e.g. with `evaluateElementProps`) and pass the result.
 *
 * @param input - A `ParseResult` (from `parser.parse()`) or a root `ElementNode`
 * @param options - Component overrides and `$variable` values
 * @returns Markdown text (empty string when there is nothing to render)
 */
export function toMarkdown(
  input: ParseResult | ElementNode | null | undefined,
  options: ToMarkdownOptions = {},
): string {
  const root = isParseResult(input) ? input.root : input;
  if (!root) return "";
  const renderer = new MarkdownRenderer({
    components: options.components,
    stateDeclarations: {
      ...(isParseResult(input) ? input.stateDeclarations : undefined),
      ...options.stateDeclarations,
    },
  });
  return renderer
    .render(root)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
