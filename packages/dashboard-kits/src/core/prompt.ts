import { generateSystemPrompt, type LibrarySpec } from "@openuidev/lang-core";
import { z } from "zod/v4";
import { BASE_RULES, COMPOSITION_RULES, DATA_RULES } from "./base-prompt";
import { toToolSpec, type GalleryDashboard, type KitDefinition } from "./kit";

/** A tool implementation: validated arguments in, a result matching the output schema out. */
export type ToolHandler = (args: any) => unknown;

/**
 * Prompt size ceiling in characters. Every token of the prompt is paid on each
 * generation and dilutes the rules; examples picked for a question fill the
 * prompt up to it.
 */
export const PROMPT_BUDGET = 64_000;

/** The most worked examples a question-picked prompt carries. */
const MAX_EXAMPLES = 3;
/** A dashboard joins the top pick only when it scores at least this share of it. */
const MIN_RELATIVE_SCORE = 0.4;

export interface PromptOptions {
  /**
   * The user's request. When set, the gallery dashboards most relevant to it
   * (examples or not) become the worked examples, as many as fit the budget.
   */
  question?: string;
  /** Character ceiling for a question-picked prompt (default PROMPT_BUDGET). */
  budget?: number;
}

/**
 * The full self-hosted system prompt for one kit: its library spec (written by
 * `openui generate --spec` from the kit's library), its tools, the base and
 * data rules, its own rules, and gallery dashboards as worked examples.
 *
 * Without a question the examples are the gallery entries not marked
 * `example: false`. With one they are the 1 to 3 dashboards ranked most
 * relevant by {@link rankGallery}, added best first while the prompt stays
 * within the budget; a dashboard far less relevant than the best is left out.
 * A question no dashboard matches gets the defaults.
 */
export function buildSystemPrompt(
  kit: KitDefinition,
  spec: LibrarySpec,
  options: PromptOptions = {},
): string {
  const { schema: _schema, ...rest } = spec;
  const build = (examples: GalleryDashboard[]) =>
    generateSystemPrompt({
      ...rest,
      tools: kit.tools.map(toToolSpec),
      preamble: kit.preamble,
      additionalRules: [...BASE_RULES, ...DATA_RULES, ...COMPOSITION_RULES, ...kit.rules],
      toolExamples: examples.map((dashboard) => dashboard.program),
    });
  const defaults = () => build(kit.gallery.filter((dashboard) => dashboard.example !== false));
  const ranked = options.question?.trim() ? rankGallery(kit, options.question) : [];
  if (ranked.length === 0) return defaults();

  const budget = options.budget ?? PROMPT_BUDGET;
  const picked: GalleryDashboard[] = [];
  let prompt = "";
  for (const { dashboard, score } of ranked) {
    if (picked.length === MAX_EXAMPLES || score < ranked[0]!.score * MIN_RELATIVE_SCORE) break;
    const next = build([...picked, dashboard]);
    if (next.length > budget) continue;
    picked.push(dashboard);
    prompt = next;
  }
  // Nothing relevant fits: the default examples, which the kit keeps in budget.
  return picked.length ? prompt : defaults();
}

/**
 * Gallery dashboards that share words with a question, most relevant first.
 * A dashboard's words are its title (weighted most), its description and the
 * names of the tools it queries ("get_inventory_health" → inventory, health),
 * and those tools' descriptions (weighted least). Each shared word scores by
 * how few dashboards use it, so "restocking" outweighs "sales". Ties keep
 * gallery order.
 */
export function rankGallery(
  kit: KitDefinition,
  question: string,
): { dashboard: GalleryDashboard; score: number }[] {
  const docs = kit.gallery.map((dashboard) => {
    const weights = new Map<string, number>();
    const add = (text: string, weight: number) => {
      for (const word of words(text)) weights.set(word, Math.max(weights.get(word) ?? 0, weight));
    };
    for (const [, name] of dashboard.program.matchAll(/Query\(\s*"([\w-]+)"/g)) {
      add(kit.tools.find((t) => t.name === name)?.description ?? "", 0.5);
      add(name!.replace(/^get_/, "").replace(/_/g, " "), 1.5);
    }
    add(dashboard.description, 1.5);
    add(dashboard.title, 3);
    return { dashboard, weights };
  });
  const asked = new Set(words(question));
  const score = (weights: Map<string, number>) => {
    let total = 0;
    for (const word of asked) {
      const weight = weights.get(word);
      if (!weight) continue;
      const seenIn = docs.filter((d) => d.weights.has(word)).length;
      total += weight * Math.log(1 + docs.length / seenIn);
    }
    return total;
  };
  return docs
    .map(({ dashboard, weights }) => ({ dashboard, score: score(weights) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

const STOPWORDS = new Set(
  (
    "a about after again all also an and any are as at be been before being but by can come " +
    "coming could did do does doing for from get give had has have how i if in into is it its " +
    "just last like look me month more most much my need no not now of on one or our out over " +
    "period see should show so some tell than that the their them then there these they this " +
    "those time to too up us very want was we were what when where which while who will with " +
    "would year you your"
  ).split(" "),
);

/** Lowercase word stems without stopwords: "Restocking products" → restock, product. */
function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .map(stem);
}

/**
 * A light suffix strip so forms of a word meet: "restocking" and "restock",
 * "changes" and "changed", "shipping" and "ships".
 */
function stem(word: string): string {
  let w = word;
  if (w.length > 4 && w.endsWith("ies")) w = `${w.slice(0, -3)}y`;
  else if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith("ed")) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  if (/([b-df-hj-np-tv-z])\1$/.test(w) && !/(ss|ll|ff)$/.test(w)) w = w.slice(0, -1);
  return w.length > 3 && w.endsWith("e") ? w.slice(0, -1) : w;
}

/** Validates the arguments, runs the handler, and validates its result against the contract. */
export function runTool(
  kit: KitDefinition,
  toolName: string,
  args: unknown,
  handlers: Record<string, ToolHandler>,
): unknown {
  const tool = kit.tools.find((t) => t.name === toolName);
  const handler = handlers[toolName];
  if (!tool || !handler) throw new Error(`Unknown tool: ${kit.id}/${toolName}`);
  return tool.output.parse(handler(tool.input.parse(coerceArgs(tool.input, args ?? {}))));
}

/**
 * Brings arguments a model got slightly wrong to the nearest valid value
 * before validation. The prompt shows a tool's numbers as plain `number` and
 * some choices as `string`, so a model may ask for 12 weeks where 10 is the
 * most, or "ytd" where the periods are 7d, 30d, 90d, and mtd: the nearest
 * valid value answers it, where a rejection would leave a card empty.
 *
 * - numbers: read from text ("12", "6 weeks"), rounded where the schema wants
 *   integers, clamped to its bounds;
 * - booleans: read from "true"/"false", "yes"/"no", "on"/"off", 1/0;
 * - choices (enums and literal unions): matched ignoring case, spaces,
 *   underscores, and hyphens ("Previous period" → "previous_period"), or by
 *   a common alias ("this month" → "mtd", "yoy" → "last_year"); a period
 *   like "12m", "ytd", "last 7 days", or a bare 7 goes to the closest
 *   day-count option, a leading number ("28d") to the closest numeric
 *   option; from a list, the first item that fits; anything else falls back
 *   to the field's default, or is dropped when the field is optional;
 * - lists: a single value is wrapped (a comma-separated one split, for lists
 *   of choices), and each item repaired as above.
 *
 * Whatever can't be repaired is left for the schema to reject.
 */
export function coerceArgs(input: z.ZodType, args: unknown): unknown {
  if (!(input instanceof z.ZodObject) || args == null || typeof args !== "object") return args;
  const out: Record<string, unknown> = { ...(args as Record<string, unknown>) };
  for (const [key, field] of Object.entries(input.shape)) {
    const value = out[key];
    if (value == null) continue;
    const { inner, fallback } = unwrap(field as z.ZodType);
    const fixed = coerceValue(inner, value);
    if (fixed !== undefined) out[key] = fixed;
    else if (fallback && choicesOf(inner)) delete out[key];
  }
  return out;
}

/** The schema under any `.optional()`/`.default()`, and whether it had one. */
function unwrap(schema: z.ZodType): { inner: z.ZodType; fallback: boolean } {
  let inner = schema;
  let fallback = false;
  while (inner instanceof z.ZodDefault || inner instanceof z.ZodOptional) {
    fallback = true;
    inner = inner.unwrap() as z.ZodType;
  }
  return { inner, fallback };
}

/** An enum's options, or a union of literals' values; undefined for anything else. */
function choicesOf(schema: z.ZodType): unknown[] | undefined {
  if (schema instanceof z.ZodEnum) return schema.options;
  if (schema instanceof z.ZodUnion && schema.options.every((o) => o instanceof z.ZodLiteral))
    return schema.options.flatMap((o) => [...(o as z.ZodLiteral).values]);
  return undefined;
}

const TRUE = new Set(["true", "yes", "y", "on", "1"]);
const FALSE = new Set(["false", "no", "n", "off", "0"]);

/** The value repaired to fit the schema, or undefined when it can't be. */
function coerceValue(schema: z.ZodType, value: unknown): unknown {
  if (schema instanceof z.ZodNumber) {
    const n = typeof value === "string" ? Number.parseFloat(value.trim()) : value;
    if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
    let v = schema.isInt ? Math.round(n) : n;
    if (schema.minValue != null && Number.isFinite(schema.minValue))
      v = Math.max(schema.minValue, v);
    if (schema.maxValue != null && Number.isFinite(schema.maxValue))
      v = Math.min(schema.maxValue, v);
    return v;
  }
  if (schema instanceof z.ZodBoolean) {
    if (typeof value === "boolean") return value;
    const t = String(value).trim().toLowerCase();
    return TRUE.has(t) ? true : FALSE.has(t) ? false : undefined;
  }
  if (schema instanceof z.ZodArray) {
    const element = unwrap(schema.element as z.ZodType).inner;
    const choices = choicesOf(element);
    let items: unknown[];
    if (Array.isArray(value)) items = value;
    else if (typeof value === "object" && value !== null) return undefined;
    // A comma always separates items: "7,28" must not read as the leading 7.
    else if (
      choices &&
      typeof value === "string" &&
      (value.includes(",") || matchChoice(value, choices) === undefined)
    )
      items = value.split(",").map((part) => part.trim());
    else items = [value];
    return items.map((item) => coerceValue(element, item) ?? item);
  }
  const choices = choicesOf(schema);
  if (choices) {
    for (const item of Array.isArray(value) ? value : [value]) {
      const match = matchChoice(item, choices);
      if (match !== undefined) return match;
    }
    return undefined;
  }
  return value;
}

/** Other names a model uses for an option, spelled loosely; used only when the option exists. */
const ALIASES: Record<string, string[]> = {
  mtd: ["thismonth", "monthtodate", "thismonthtodate", "currentmonth"],
  last_year: [
    "yoy",
    "yearoveryear",
    "vslastyear",
    "sameperiodlastyear",
    "prioryear",
    "previousyear",
  ],
};

/** The option a model meant: exact, then loosely spelled or aliased, then the nearest period or number. */
function matchChoice(value: unknown, options: unknown[]): unknown {
  if (options.includes(value)) return value;
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const loose = (v: unknown) =>
    String(v)
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");
  const spelled = options.find((o) => loose(o) === loose(value));
  if (spelled !== undefined) return spelled;
  const aliased = options.find((o) => ALIASES[String(o)]?.includes(loose(value)));
  if (aliased !== undefined) return aliased;
  const numbers = options.filter((o): o is number => typeof o === "number");
  // A leading number, so "28d" or "last 28 days" reads as 28.
  const n = typeof value === "number" ? value : Number.parseFloat(periodText(value));
  if (numbers.length && Number.isFinite(n))
    return numbers.reduce((best, o) => (Math.abs(o - n) < Math.abs(best - n) ? o : best));
  return nearestPeriod(String(value), options.map(String));
}

/** A period's text lowercased, spaced, and without a "last"/"past" prefix: "Last_7_days" → "7 days". */
function periodText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ")
    .replace(/^(the )?(last|past|previous|prior|trailing) /, "");
}

/** Days in a period a model might ask for: "12m", "6 weeks", "last 7 days", "ytd", "quarter", "7". */
function periodDays(text: string): number | undefined {
  const t = periodText(text);
  if (/^(ytd|year|this ?year|last ?year|1y|12m|annual|365d?)$/.test(t)) return 365;
  if (/^(qtd|quarter|this ?quarter|3m|1q)$/.test(t)) return 90;
  if (/^(week|this ?week|wtd)$/.test(t)) return 7;
  if (/^(month|this ?month|mtd|month to date)$/.test(t)) return 30;
  // A bare number is days.
  const m = t.match(/^(\d+) ?(d|days?|w|weeks?|m|months?|y|years?)?$/);
  if (!m) return undefined;
  const n = Number(m[1]);
  const unit = m[2]?.[0] ?? "d";
  return unit === "d" ? n : unit === "w" ? n * 7 : unit === "m" ? n * 30 : n * 365;
}

/** The day-count option ("7d", "30d", "90d") nearest a period, or undefined. */
function nearestPeriod(value: string, options: string[]): string | undefined {
  const days = periodDays(value);
  const dayOptions = options.filter((o) => /^\d+d$/.test(o));
  if (days == null || dayOptions.length === 0) return undefined;
  return dayOptions.reduce((best, o) =>
    Math.abs(parseInt(o, 10) - days) < Math.abs(parseInt(best, 10) - days) ? o : best,
  );
}
