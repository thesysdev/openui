/** Built-in functions and action steps (defined like library ones), and reserved calls. */

import { z } from "zod/v4";
import {
  defineAction,
  defineFunction,
  type DefinedAction,
  type DefinedFunction,
} from "../functions";
import { tagSchemaId } from "../signature";
import type { ActionStep, CallDef, ParamMap } from "./types";

/** Resolve a field path on an object. Supports dot-paths: "state.name" → obj.state.name */
function resolveField(obj: any, path: string): unknown {
  if (!path || obj == null) return undefined;
  if (!path.includes(".")) return obj[path];
  let cur = obj;
  for (const p of path.split(".")) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function toNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  }
  if (typeof val === "boolean") return val ? 1 : 0;
  return 0;
}

const sumOf = (arr: unknown[]) => arr.reduce((a: number, b: unknown) => a + toNumber(b), 0);
const array = () => z.array(z.any());
const numbers = () => z.object({ numbers: z.array(z.number()) });
const number = () => z.object({ number: z.number() });

/** A built-in function. A lazy one (@Each) has no `fn`: the evaluator runs it on raw args. */
export type BuiltinFunction = Omit<DefinedFunction<any, any>, "fn"> & {
  fn?: (args: any) => unknown;
  lazy?: true;
};

const builtins: BuiltinFunction[] = [
  defineFunction({
    name: "Count",
    description: "Returns array length",
    params: z.object({ array: array() }),
    returns: z.number(),
    fn: ({ array }) => (Array.isArray(array) ? array.length : 0),
  }),
  defineFunction({
    name: "First",
    description: "Returns first element of array",
    params: z.object({ array: array() }),
    returns: z.any(),
    fn: ({ array }) => (Array.isArray(array) ? (array[0] ?? null) : null),
  }),
  defineFunction({
    name: "Last",
    description: "Returns last element of array",
    params: z.object({ array: array() }),
    returns: z.any(),
    fn: ({ array }) => (Array.isArray(array) ? (array[array.length - 1] ?? null) : null),
  }),
  defineFunction({
    name: "Sum",
    description: "Sum of numeric array",
    params: numbers(),
    returns: z.number(),
    fn: ({ numbers }) => (Array.isArray(numbers) ? sumOf(numbers) : 0),
  }),
  defineFunction({
    name: "Avg",
    description: "Average of numeric array",
    params: numbers(),
    returns: z.number(),
    fn: ({ numbers }) =>
      Array.isArray(numbers) && numbers.length ? sumOf(numbers) / numbers.length : 0,
  }),
  defineFunction({
    name: "Min",
    description: "Minimum value in array",
    params: numbers(),
    returns: z.number(),
    fn: ({ numbers }) =>
      Array.isArray(numbers) && numbers.length
        ? numbers.reduce((acc, b) => Math.min(acc, toNumber(b)), toNumber(numbers[0]))
        : 0,
  }),
  defineFunction({
    name: "Max",
    description: "Maximum value in array",
    params: numbers(),
    returns: z.number(),
    fn: ({ numbers }) =>
      Array.isArray(numbers) && numbers.length
        ? numbers.reduce((acc, b) => Math.max(acc, toNumber(b)), toNumber(numbers[0]))
        : 0,
  }),
  defineFunction({
    name: "Sort",
    description: 'Sort array by field. Direction: "asc" (default) or "desc"',
    params: z.object({
      array: array(),
      field: z.string(),
      direction: z.enum(["asc", "desc"]).optional(),
    }),
    returns: array(),
    fn: ({ array, field, direction }) => {
      if (!Array.isArray(array)) return array;
      const f = String(field ?? "");
      const desc = String(direction ?? "asc") === "desc";
      return [...array].sort((a: any, b: any) => {
        const av = f ? resolveField(a, f) : a;
        const bv = f ? resolveField(b, f) : b;
        const aIsNumeric =
          typeof av === "number" || (typeof av === "string" && !isNaN(Number(av)) && av !== "");
        const bIsNumeric =
          typeof bv === "number" || (typeof bv === "string" && !isNaN(Number(bv)) && bv !== "");
        if (aIsNumeric && bIsNumeric) {
          const diff = toNumber(av) - toNumber(bv);
          return desc ? -diff : diff;
        }
        const cmp = String(av ?? "").localeCompare(String(bv ?? ""));
        return desc ? -cmp : cmp;
      });
    },
  }),
  defineFunction({
    name: "Filter",
    description: "Filter array by field value",
    params: z.object({
      array: array(),
      field: z.string(),
      operator: z.enum(["==", "!=", ">", "<", ">=", "<=", "contains"]),
      value: z.any(),
    }),
    returns: array(),
    fn: ({ array, field, operator, value }) => {
      if (!Array.isArray(array)) return [];
      const f = String(field ?? "");
      const o = String(operator ?? "==");
      return array.filter((item: any) => {
        const v = f ? resolveField(item, f) : item;
        switch (o) {
          case "==":
            return v == value;
          case "!=":
            return v != value;
          case ">":
            return toNumber(v) > toNumber(value);
          case "<":
            return toNumber(v) < toNumber(value);
          case ">=":
            return toNumber(v) >= toNumber(value);
          case "<=":
            return toNumber(v) <= toNumber(value);
          case "contains":
            return String(v ?? "").includes(String(value ?? ""));
          default:
            return false;
        }
      });
    },
  }),
  defineFunction({
    name: "Round",
    description: "Round to N decimal places (default 0)",
    params: z.object({ number: z.number(), decimals: z.number().optional() }),
    returns: z.number(),
    fn: ({ number, decimals }) => {
      const num = toNumber(number);
      const d = decimals != null ? toNumber(decimals) : 0;
      const factor = Math.pow(10, d);
      return Math.round(num * factor) / factor;
    },
  }),
  defineFunction({
    name: "Abs",
    description: "Absolute value",
    params: number(),
    returns: z.number(),
    fn: ({ number }) => Math.abs(toNumber(number)),
  }),
  defineFunction({
    name: "Floor",
    description: "Round down to nearest integer",
    params: number(),
    returns: z.number(),
    fn: ({ number }) => Math.floor(toNumber(number)),
  }),
  defineFunction({
    name: "Ceil",
    description: "Round up to nearest integer",
    params: number(),
    returns: z.number(),
    fn: ({ number }) => Math.ceil(toNumber(number)),
  }),
  {
    name: "Each",
    description:
      "Evaluate template for each element. varName is the loop variable — use it ONLY inside the template expression (inline). Do NOT create a separate statement for the template.",
    params: z.object({ array: array(), varName: z.string(), template: z.any() }),
    lazy: true,
  },
];

/** All built-in functions by name, in prompt order. */
export const BUILTINS: Record<string, BuiltinFunction> = Object.fromEntries(
  builtins.map((b) => [b.name, b]),
);

/** Maps parser-level action step names → runtime step type values. Single source of truth. */
export const ACTION_STEPS = {
  Run: "run",
  ToAssistant: "continue_conversation",
  OpenUrl: "open_url",
  Set: "set",
  Reset: "reset",
} as const;

/** A schema that only names its type in prompt signatures, e.g. `$variable`. */
function named(id: string) {
  const schema = z.any();
  tagSchemaId(schema, id);
  return schema;
}

const actionSchema = z.union([
  z.object({ type: z.literal("open_url"), url: z.string() }),
  z.object({ type: z.literal("continue_conversation"), context: z.string().optional() }),
  z.object({ type: z.string(), params: z.record(z.string(), z.any()).optional() }),
]);
tagSchemaId(actionSchema, "ActionExpression");

/**
 * Schema for a component's action prop: `action: action().optional()`. Tagged
 * `ActionExpression`, so the prompt teaches the @step syntax (one @step, or
 * Action([...]) for several). Its JSON schema describes the legacy `{ type, ... }`
 * action objects, which also still work. Returns the same schema on every call.
 */
export function action() {
  return actionSchema;
}

/** A built-in step: `step` builds it from coerced args; a lazy one reads raw args in the evaluator. */
export type BuiltinStep = DefinedAction<any> & {
  step?: (args: any) => ActionStep;
  lazy?: true;
};

const steps: BuiltinStep[] = [
  {
    ...defineAction({
      name: "Run",
      description: "Execute a Mutation or re-fetch a Query (ref must be a declared Query/Mutation)",
      params: z.object({ ref: named("Query | Mutation") }),
    }),
    lazy: true,
  },
  {
    ...defineAction({
      name: "ToAssistant",
      description:
        'Send a message to the assistant (for conversational buttons like "Tell me more", "Explain this"). The optional context is any value (object, array, string, number) passed to the assistant as hidden data, e.g. @ToAssistant("Show details", {orderId: 42})',
      params: z.object({ message: z.string(), context: z.any().optional() }),
    }),
    // The context may be any value and is passed through unchanged; null means none
    step: ({ message, context }) => ({
      type: ACTION_STEPS.ToAssistant,
      message: String(message ?? ""),
      context: context ?? undefined,
    }),
  },
  {
    ...defineAction({
      name: "OpenUrl",
      description: "Navigate to a URL",
      params: z.object({ url: z.string() }),
    }),
    step: ({ url }) => ({ type: ACTION_STEPS.OpenUrl, url: String(url ?? "") }),
  },
  {
    ...defineAction({
      name: "Set",
      description: "Set a $variable to a specific value",
      params: z.object({ variable: named("$variable"), value: z.any() }),
    }),
    lazy: true,
  },
  {
    ...defineAction({
      name: "Reset",
      description:
        'Reset $variables to their declared defaults; pass several to reset each (e.g. @Reset($title, $priority) restores $title="" and $priority="medium")',
      params: z.object({ variable: named("$variable") }),
    }),
    lazy: true,
  },
];

/** All built-in steps by name, in prompt order. */
export const BUILTIN_STEPS: Record<string, BuiltinStep> = Object.fromEntries(
  steps.map((s) => [s.name, s]),
);

const callDef = (kind: CallDef["kind"], def: BuiltinFunction | BuiltinStep): CallDef => ({
  kind,
  params: Object.keys(def.params.shape).map((name) => ({ name, required: false })),
  builtin: true,
  ...(def.lazy ? { lazy: true } : {}),
});

/** The built-in functions, steps and Action: the base of every library's call registry. */
export const BUILTIN_CALLS: ReadonlyMap<string, CallDef> = new Map([
  ...builtins.map((b) => [b.name, callDef("function", b)] as const),
  ...steps.map((s) => [s.name, callDef("action", s)] as const),
  [
    "Action",
    { kind: "action", params: [{ name: "steps", required: true }], builtin: true, lazy: true },
  ],
]);

// getCallDefs(cat).get("Percent") -> the library's @Percent; no cat -> built-ins only
export function getCallDefs(cat: ParamMap | undefined): ReadonlyMap<string, CallDef> {
  return cat?.callDefs ?? BUILTIN_CALLS;
}

/** True for a built-in function, step, or Action (not a component). */
export function isBuiltin(name: string): boolean {
  return BUILTIN_CALLS.has(name);
}

/** True for a step call: a built-in step, Action, or one of `actions`. */
export function isStep(name: string, actions?: object): boolean {
  return (
    BUILTIN_CALLS.get(name)?.kind === "action" ||
    (!!actions && Object.prototype.hasOwnProperty.call(actions, name))
  );
}

/** Reserved statement-level call names — not builtins, not components */
export const RESERVED_CALLS = { Query: "Query", Mutation: "Mutation" } as const;

/** Check if a name is a reserved statement call (Query, Mutation) */
export function isReservedCall(name: string): boolean {
  return name in RESERVED_CALLS;
}

export { toNumber };
