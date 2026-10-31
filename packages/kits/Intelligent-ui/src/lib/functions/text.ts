import { defineFunction } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { list, MAX_ITEMS, read } from "./shared";

const LOCALE = "en-US";

function currencyCode(code: string | undefined): string {
  const upper = (code ?? "USD").toUpperCase();
  return /^[A-Z]{3}$/.test(upper) ? upper : "USD";
}

/** Formats with Intl; an unknown currency code falls back to USD instead of throwing. */
function format(value: number, options: Intl.NumberFormatOptions): string {
  try {
    return value.toLocaleString(LOCALE, options);
  } catch {
    return value.toLocaleString(LOCALE, { ...options, currency: "USD" });
  }
}

export const Format = defineFunction({
  name: "Format",
  description:
    'Number as text: "number" 12,345.6, "currency" $12,345.68 (currency is a code like "EUR"), "percent" 45 -> 45%, "compact" 1.2M ($1.2M with a currency)',
  params: z.object({
    value: z.number(),
    kind: z.enum(["number", "currency", "percent", "compact"]).optional(),
    decimals: z.number().optional(),
    currency: z.string().optional(),
  }),
  returns: z.string(),
  fn: ({ value, kind = "number", decimals, currency }) => {
    if (!Number.isFinite(value)) throw new Error("value is not a finite number");
    const d = decimals === undefined ? undefined : Math.min(Math.max(Math.trunc(decimals), 0), 10);
    // decimals caps the digits; only currency pads to it, so 600 never reads "600.0".
    const digits = (fallbackMax: number, fallbackMin = 0) =>
      d === undefined
        ? { minimumFractionDigits: fallbackMin, maximumFractionDigits: fallbackMax }
        : { minimumFractionDigits: fallbackMin && d, maximumFractionDigits: d };
    switch (kind) {
      case "currency":
        return format(value, { style: "currency", currency: currencyCode(currency), ...digits(2, 2) });
      case "percent":
        return `${format(value, digits(1))}%`;
      case "compact":
        return format(value, {
          notation: "compact",
          ...digits(1),
          ...(currency ? { style: "currency", currency: currencyCode(currency) } : {}),
        });
      default:
        return format(value, digits(2));
    }
  },
});

export const Join = defineFunction({
  name: "Join",
  description: 'Joins the items (or their field) into text with sep (default ", "), skipping nulls',
  params: z.object({ list: list(), sep: z.string().optional(), field: z.string().optional() }),
  returns: z.string(),
  fn: ({ list, sep = ", ", field = "" }) =>
    list
      .map((item) => read(item, field))
      .filter((v) => v != null)
      .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
      .join(sep),
});

export const Plural = defineFunction({
  name: "Plural",
  description: 'Count and word: @Plural(1, "guest") is "1 guest", 3 gives "3 guests"; plural defaults to word + "s"',
  params: z.object({ n: z.number(), word: z.string(), plural: z.string().optional() }),
  returns: z.string(),
  fn: ({ n, word, plural }) => `${format(n, { maximumFractionDigits: 2 })} ${Math.abs(n) === 1 ? word : (plural ?? `${word}s`)}`,
});

export const Pad = defineFunction({
  name: "Pad",
  description: 'Pads the start of value to length with char (default "0"), e.g. 7 -> "07"',
  params: z.object({ value: z.union([z.string(), z.number()]), length: z.number(), char: z.string().optional() }),
  returns: z.string(),
  fn: ({ value, length, char = "0" }) => String(value).padStart(Math.min(Math.trunc(length), 1000), char || "0"),
});

export const Upper = defineFunction({
  name: "Upper",
  description: "Text in upper case",
  params: z.object({ text: z.string() }),
  returns: z.string(),
  fn: ({ text }) => text.toUpperCase(),
});

export const Lower = defineFunction({
  name: "Lower",
  description: "Text in lower case",
  params: z.object({ text: z.string() }),
  returns: z.string(),
  fn: ({ text }) => text.toLowerCase(),
});

export const Trim = defineFunction({
  name: "Trim",
  description: "Text without spaces at the start and end",
  params: z.object({ text: z.string() }),
  returns: z.string(),
  fn: ({ text }) => text.trim(),
});

export const Capitalize = defineFunction({
  name: "Capitalize",
  description: 'Each word with a capital first letter, e.g. "new york" is "New York"',
  params: z.object({ text: z.string() }),
  returns: z.string(),
  fn: ({ text }) => text.replace(/(^|[\s\-(/"])(\p{L})/gu, (_, before: string, letter: string) => before + letter.toUpperCase()),
});

export const Split = defineFunction({
  name: "Split",
  description: 'List of the parts of text between sep (default ","), each trimmed, empty parts dropped, e.g. @Split("a, b,,c") is ["a", "b", "c"]',
  params: z.object({ text: z.string(), sep: z.string().optional() }),
  returns: z.array(z.string()),
  fn: ({ text, sep = "," }) => {
    const parts = text.split(sep === "" ? "" : sep).map((p) => p.trim()).filter((p) => p !== "");
    if (parts.length > MAX_ITEMS) throw new Error(`more than ${MAX_ITEMS} items`);
    return parts;
  },
});

export const Replace = defineFunction({
  name: "Replace",
  description: "Text with every find replaced by replacement",
  params: z.object({ text: z.string(), find: z.string(), replacement: z.string() }),
  returns: z.string(),
  fn: ({ text, find, replacement }) => (find === "" ? text : text.split(find).join(replacement)),
});

export const Duration = defineFunction({
  name: "Duration",
  description: 'Seconds as text: "short" 1h 20m, 4m 05s, 45s (default); "clock" 1:20:00, 4:05',
  params: z.object({ seconds: z.number(), style: z.enum(["short", "clock"]).optional() }),
  returns: z.string(),
  fn: ({ seconds, style = "short" }) => {
    if (!Number.isFinite(seconds)) throw new Error("seconds is not a finite number");
    const sign = seconds < 0 ? "-" : "";
    const total = Math.round(Math.abs(seconds));
    const [h, m, s] = [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60];
    const two = (n: number) => String(n).padStart(2, "0");
    if (style === "clock") return sign + (h ? `${h}:${two(m)}:${two(s)}` : `${m}:${two(s)}`);
    if (h) return `${sign}${h}h${m ? ` ${m}m` : ""}`;
    if (m) return `${sign}${m}m${s ? ` ${two(s)}s` : ""}`;
    return `${sign}${s}s`;
  },
});

export const Default = defineFunction({
  name: "Default",
  description: 'value, or fallback when value is null, "" or not a number, e.g. an empty number input: @Default($weight, 0)',
  params: z.object({ value: z.any().optional(), fallback: z.any() }),
  returns: z.any(),
  // Annotated explicitly: z.any() params give defineFunction nothing to infer
  // from, and older @openuidev/react-lang then reports an implicit any here.
  fn: ({ value, fallback }: { value?: unknown; fallback: unknown }) =>
    value == null || value === "" || (typeof value === "number" && Number.isNaN(value)) ? fallback : value,
});

export const textFunctions = [Format, Join, Plural, Pad, Upper, Lower, Trim, Capitalize, Split, Replace, Duration, Default];
