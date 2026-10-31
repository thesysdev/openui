import { defineFunction } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { list, MAX_ITEMS, read, same } from "./shared";

const index = (i: number, length: number) => (i < 0 ? length + i : i);

export const Append = defineFunction({
  name: "Append",
  description: "Copy of the list with item added at the end",
  params: z.object({ list: list(), item: z.any() }),
  returns: list(),
  fn: ({ list, item }) => [...list, item],
});

export const Prepend = defineFunction({
  name: "Prepend",
  description: "Copy of the list with item added at the start",
  params: z.object({ list: list(), item: z.any() }),
  returns: list(),
  fn: ({ list, item }) => [item, ...list],
});

export const Concat = defineFunction({
  name: "Concat",
  description: "Joins two lists",
  params: z.object({ list: list(), more: list() }),
  returns: list(),
  fn: ({ list, more }) => {
    if (list.length + more.length > MAX_ITEMS) throw new Error(`more than ${MAX_ITEMS} items`);
    return [...list, ...more];
  },
});

export const Remove = defineFunction({
  name: "Remove",
  description: 'Copy without the items whose field equals value; field "" compares the items themselves',
  params: z.object({ list: list(), field: z.string(), value: z.any() }),
  returns: list(),
  fn: ({ list, field, value }) => list.filter((item) => !same(read(item, field), value)),
});

export const RemoveAt = defineFunction({
  name: "RemoveAt",
  description: "Copy without the item at index (0-based; negative counts from the end)",
  params: z.object({ list: list(), index: z.number() }),
  returns: list(),
  fn: ({ list, index: at }) => {
    const i = index(Math.trunc(at), list.length);
    return list.filter((_, j) => j !== i);
  },
});

export const Update = defineFunction({
  name: "Update",
  description: "Copy where items whose field equals value get setField set to setValue",
  params: z.object({ list: list(), field: z.string(), value: z.any(), setField: z.string(), setValue: z.any() }),
  returns: list(),
  fn: ({ list, field, value, setField, setValue }) =>
    list.map((item) =>
      item && typeof item === "object" && !Array.isArray(item) && same(read(item, field), value)
        ? { ...item, [setField]: setValue }
        : item,
    ),
});

export const Toggle = defineFunction({
  name: "Toggle",
  description: "Adds item if missing, removes it if present (a set of strings or numbers)",
  params: z.object({ list: list(), item: z.any() }),
  returns: list(),
  fn: ({ list, item }) => (list.some((x) => same(x, item)) ? list.filter((x) => !same(x, item)) : [...list, item]),
});

export const Includes = defineFunction({
  name: "Includes",
  description: "True if the list has item, or the text contains it",
  params: z.object({ list: z.union([list(), z.string()]), item: z.any() }),
  returns: z.boolean(),
  fn: ({ list, item }) =>
    typeof list === "string" ? item != null && list.includes(String(item)) : list.some((x) => same(x, item)),
});

export const Find = defineFunction({
  name: "Find",
  description: "First item whose field equals value, or null",
  params: z.object({ list: list(), field: z.string(), value: z.any() }),
  returns: z.any(),
  fn: ({ list, field, value }) => list.find((item) => same(read(item, field), value)) ?? null,
});

export const IndexOf = defineFunction({
  name: "IndexOf",
  description: "Index of item in the list, or -1",
  params: z.object({ list: list(), item: z.any() }),
  returns: z.number(),
  fn: ({ list, item }) => list.findIndex((x) => same(x, item)),
});

export const Take = defineFunction({
  name: "Take",
  description: "The first n items; a negative n takes the last n",
  params: z.object({ list: list(), n: z.number() }),
  returns: list(),
  fn: ({ list, n }) => {
    const k = Math.trunc(n);
    return k >= 0 ? list.slice(0, k) : list.slice(k);
  },
});

export const Slice = defineFunction({
  name: "Slice",
  description: "Items, or characters of text, from start up to end (not included); negative counts from the end",
  params: z.object({ list: z.union([list(), z.string()]), start: z.number(), end: z.number().optional() }),
  returns: z.union([list(), z.string()]),
  fn: ({ list, start, end }) => {
    const to = end === undefined ? undefined : Math.trunc(end);
    return typeof list === "string" ? list.slice(Math.trunc(start), to) : list.slice(Math.trunc(start), to);
  },
});

export const Unique = defineFunction({
  name: "Unique",
  description: "Distinct items in first-seen order",
  params: z.object({ list: list() }),
  returns: list(),
  fn: ({ list }) => {
    const seen = new Set<string>();
    return list.filter((item) => {
      const key = item !== null && typeof item === "object" ? `o:${JSON.stringify(item)}` : `p:${String(item)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
});

export const Reverse = defineFunction({
  name: "Reverse",
  description: "Copy in reverse order",
  params: z.object({ list: list() }),
  returns: list(),
  fn: ({ list }) => [...list].reverse(),
});

export const Range = defineFunction({
  name: "Range",
  description: "Numbers from start up to end (not included) by step (default 1), e.g. @Range(0, 3) is [0, 1, 2]",
  params: z.object({ start: z.number(), end: z.number(), step: z.number().optional() }),
  returns: z.array(z.number()),
  fn: ({ start, end, step = 1 }) => {
    if (step === 0 || !Number.isFinite(step)) throw new Error("step must be a non-zero number");
    const count = Math.max(0, Math.ceil((end - start) / step));
    if (count > MAX_ITEMS) throw new Error(`more than ${MAX_ITEMS} items`);
    const whole = Number.isInteger(start) && Number.isInteger(step);
    // Rounding keeps fractional steps clean: 0.1 * 3 is 0.30000000000000004
    return Array.from({ length: count }, (_, i) => (whole ? start + i * step : Number((start + i * step).toPrecision(12))));
  },
});

export const Pick = defineFunction({
  name: "Pick",
  description: "A random item, or null for an empty list; draws anew each time, so call it inside @Set",
  params: z.object({ list: list() }),
  returns: z.any(),
  fn: ({ list }) => (list.length ? list[Math.floor(Math.random() * list.length)] : null),
});

export const Shuffle = defineFunction({
  name: "Shuffle",
  description: "Copy in random order; call it inside @Set",
  params: z.object({ list: list() }),
  returns: list(),
  fn: ({ list }) => {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  },
});

export const Flatten = defineFunction({
  name: "Flatten",
  description: "One list from a list of lists, e.g. [[1, 2], [3]] is [1, 2, 3]",
  params: z.object({ list: list() }),
  returns: list(),
  fn: ({ list }) => {
    const out = list.flatMap((item) => (Array.isArray(item) ? item : [item]));
    if (out.length > MAX_ITEMS) throw new Error(`more than ${MAX_ITEMS} items`);
    return out;
  },
});

export const Chunk = defineFunction({
  name: "Chunk",
  description: "The list cut into lists of size items, e.g. for weeks of 7 days or pages",
  params: z.object({ list: list(), size: z.number() }),
  returns: z.array(list()),
  fn: ({ list, size }) => {
    const n = Math.trunc(size);
    if (n < 1) throw new Error("size must be 1 or more");
    const out: unknown[][] = [];
    for (let i = 0; i < list.length; i += n) out.push(list.slice(i, i + n));
    return out;
  },
});

export const listFunctions = [
  Append, Prepend, Concat, Remove, RemoveAt, Update, Toggle, Includes, Find, IndexOf,
  Take, Slice, Unique, Reverse, Range, Pick, Shuffle, Flatten, Chunk,
];
