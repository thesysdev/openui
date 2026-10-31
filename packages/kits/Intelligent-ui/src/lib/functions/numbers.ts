import { defineFunction } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { finite, numbers } from "./shared";

export const Pow = defineFunction({
  name: "Pow",
  description: "base raised to exponent",
  params: z.object({ base: z.number(), exponent: z.number() }),
  returns: z.number(),
  fn: ({ base, exponent }) => finite(Math.pow(base, exponent)),
});

export const Sqrt = defineFunction({
  name: "Sqrt",
  description: "Square root; null for a negative number",
  params: z.object({ number: z.number() }),
  returns: z.number(),
  fn: ({ number }) => finite(Math.sqrt(number)),
});

export const Random = defineFunction({
  name: "Random",
  description: "Random number from min to max (integer true: a whole number, max included); draws anew each time, so call it inside @Set",
  params: z.object({ min: z.number(), max: z.number(), integer: z.boolean().optional() }),
  returns: z.number(),
  fn: ({ min, max, integer }) => {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    if (!integer) return lo + Math.random() * (hi - lo);
    const a = Math.ceil(lo);
    const b = Math.floor(hi);
    if (a > b) throw new Error("no whole number between min and max");
    return a + Math.floor(Math.random() * (b - a + 1));
  },
});

export const Clamp = defineFunction({
  name: "Clamp",
  description: "number kept between min and max",
  params: z.object({ number: z.number(), min: z.number(), max: z.number() }),
  returns: z.number(),
  fn: ({ number, min, max }) => Math.min(Math.max(number, Math.min(min, max)), Math.max(min, max)),
});

export const Percent = defineFunction({
  name: "Percent",
  description: "part / total * 100, e.g. @Percent(3, 4) is 75; 0 when total is 0",
  params: z.object({ part: z.number(), total: z.number() }),
  returns: z.number(),
  fn: ({ part, total }) => (total === 0 ? 0 : finite((part / total) * 100)),
});

export const Lerp = defineFunction({
  name: "Lerp",
  description: "The value a fraction t of the way from a to b",
  params: z.object({ a: z.number(), b: z.number(), t: z.number() }),
  returns: z.number(),
  fn: ({ a, b, t }) => finite(a + (b - a) * t),
});

export const Allocate = defineFunction({
  name: "Allocate",
  description: "Splits total in proportion to weights, rounded to decimals (default 2), so the parts add up to exactly total, e.g. @Allocate(100, [1, 1, 1]) is [33.34, 33.33, 33.33]",
  params: z.object({ total: z.number(), weights: numbers(), decimals: z.number().optional() }),
  returns: z.array(z.number()),
  fn: ({ total, weights, decimals }) => {
    const sum = weights.reduce((a, b) => a + b, 0);
    if (!weights.length || weights.some((w) => !Number.isFinite(w) || w < 0)) throw new Error("weights must be zero or more");
    // All-zero weights (a day with nothing to split across) give all zeros
    if (sum === 0) return weights.map(() => 0);
    // Whole units (cents for 2 decimals); the leftover units go to the largest remainders
    const scale = 10 ** Math.min(6, Math.max(0, Math.round(decimals ?? 2)));
    const units = Math.round(Math.abs(total) * scale);
    const exact = weights.map((w) => (units * w) / sum);
    const parts = exact.map(Math.floor);
    let left = units - parts.reduce((a, b) => a + b, 0);
    const order = exact.map((x, i) => ({ i, rest: x - Math.floor(x) })).sort((a, b) => b.rest - a.rest || a.i - b.i);
    for (const { i } of order) {
      if (left <= 0) break;
      parts[i] += 1;
      left -= 1;
    }
    return parts.map((p) => (total < 0 ? -p : p) / scale);
  },
});

export const Payment = defineFunction({
  name: "Payment",
  description: "Payment per period that repays principal over periods at rate percent per period, e.g. a 30-year loan at 6% a year: @Payment(300000, 6 / 12, 360)",
  params: z.object({ principal: z.number(), rate: z.number(), periods: z.number() }),
  returns: z.number(),
  fn: ({ principal, rate, periods }) => {
    if (!(periods > 0)) throw new Error("periods must be positive");
    const r = rate / 100;
    return finite(r === 0 ? principal / periods : (principal * r) / (1 - Math.pow(1 + r, -periods)));
  },
});

// Units per kind, as the factor to the kind's base unit (m, kg, l, m/s)
const UNITS: Record<string, [string, number]> = {
  mm: ["length", 0.001], cm: ["length", 0.01], m: ["length", 1], km: ["length", 1000],
  in: ["length", 0.0254], ft: ["length", 0.3048], yd: ["length", 0.9144], mi: ["length", 1609.344],
  mg: ["mass", 1e-6], g: ["mass", 0.001], kg: ["mass", 1], oz: ["mass", 0.028349523125], lb: ["mass", 0.45359237], st: ["mass", 6.35029318],
  ml: ["volume", 0.001], l: ["volume", 1], tsp: ["volume", 0.00492892159375], tbsp: ["volume", 0.0147867647812], floz: ["volume", 0.0295735295625],
  cup: ["volume", 0.2365882365], pt: ["volume", 0.473176473], qt: ["volume", 0.946352946], gal: ["volume", 3.785411784],
  "m/s": ["speed", 1], "km/h": ["speed", 1 / 3.6], mph: ["speed", 0.44704], kn: ["speed", 0.514444],
  m2: ["area", 1], km2: ["area", 1e6], ft2: ["area", 0.09290304], ha: ["area", 10000], acre: ["area", 4046.8564224],
};
const TEMPS = ["c", "f", "k"];
const toCelsius = (v: number, u: string) => (u === "f" ? ((v - 32) * 5) / 9 : u === "k" ? v - 273.15 : v);
const fromCelsius = (v: number, u: string) => (u === "f" ? (v * 9) / 5 + 32 : u === "k" ? v + 273.15 : v);

export const Convert = defineFunction({
  name: "Convert",
  description:
    "value from one unit to another: mm cm m km in ft yd mi; mg g kg oz lb st; ml l tsp tbsp floz cup pt qt gal (US); m/s km/h mph kn; m2 km2 ft2 ha acre; c f k",
  params: z.object({ value: z.number(), from: z.string(), to: z.string() }),
  returns: z.number(),
  fn: ({ value, from, to }) => {
    const [a, b] = [from.trim().toLowerCase(), to.trim().toLowerCase()];
    if (TEMPS.includes(a) && TEMPS.includes(b)) return finite(fromCelsius(toCelsius(value, a), b));
    const [ua, ub] = [UNITS[a], UNITS[b]];
    if (!ua || !ub || ua[0] !== ub[0]) throw new Error(`cannot convert ${from} to ${to}`);
    return finite((value * ua[1]) / ub[1]);
  },
});

export const numberFunctions = [Pow, Sqrt, Random, Clamp, Percent, Lerp, Allocate, Payment, Convert];
