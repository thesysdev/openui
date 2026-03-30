/**
 * Shared parser/runtime registry hub for:
 *   - Runtime data builtins (evaluator.ts imports `.fn`)
 *   - Prompt builtin docs (prompt.ts imports `.signature` + `.description`)
 *   - Parser/runtime call classification (`isBuiltin`, action names, reserved calls)
 */

export interface BuiltinDef {
  /** PascalCase name matching the openui-lang syntax: Count, Sum, etc. */
  name: string;
  /** Signature for prompt docs: "Count(array) → number" */
  signature: string;
  /** One-line description for prompt docs */
  description: string;
  /** Runtime implementation */
  fn: (...args: unknown[]) => unknown;
}

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

export const BUILTINS: Record<string, BuiltinDef> = {
  Count: {
    name: "Count",
    signature: "Count(array) → number",
    description: "Returns array length",
    fn: (arr) => (Array.isArray(arr) ? arr.length : 0),
  },
  First: {
    name: "First",
    signature: "First(array) → element",
    description: "Returns first element of array",
    fn: (arr) => (Array.isArray(arr) ? (arr[0] ?? null) : null),
  },
  Last: {
    name: "Last",
    signature: "Last(array) → element",
    description: "Returns last element of array",
    fn: (arr) => (Array.isArray(arr) ? (arr[arr.length - 1] ?? null) : null),
  },
  Sum: {
    name: "Sum",
    signature: "Sum(numbers[]) → number",
    description: "Sum of numeric array",
    fn: (arr) =>
      Array.isArray(arr) ? arr.reduce((a: number, b: unknown) => a + toNumber(b), 0) : 0,
  },
  Avg: {
    name: "Avg",
    signature: "Avg(numbers[]) → number",
    description: "Average of numeric array",
    fn: (arr) =>
      Array.isArray(arr) && arr.length
        ? (arr.reduce((a: number, b: unknown) => a + toNumber(b), 0) as number) / arr.length
        : 0,
  },
  Min: {
    name: "Min",
    signature: "Min(numbers[]) → number",
    description: "Minimum value in array",
    fn: (arr) =>
      Array.isArray(arr) && arr.length
        ? arr.reduce((acc: number, b: unknown) => Math.min(acc, toNumber(b)), toNumber(arr[0]))
        : 0,
  },
  Max: {
    name: "Max",
    signature: "Max(numbers[]) → number",
    description: "Maximum value in array",
    fn: (arr) =>
      Array.isArray(arr) && arr.length
        ? arr.reduce((acc: number, b: unknown) => Math.max(acc, toNumber(b)), toNumber(arr[0]))
        : 0,
  },
  Sort: {
    name: "Sort",
    signature: "Sort(array, field, direction?) → sorted array",
    description: 'Sort array by field. Direction: "asc" (default) or "desc"',
    fn: (arr, field, dir) => {
      if (!Array.isArray(arr)) return arr;
      const f = String(field ?? "");
      const desc = String(dir ?? "asc") === "desc";
      return [...arr].sort((a: any, b: any) => {
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
  },
  Filter: {
    name: "Filter",
    signature:
      'Filter(array, field, operator: "==" | "!=" | ">" | "<" | ">=" | "<=" | "contains", value) → filtered array',
    description: "Filter array by field value",
    fn: (arr, field, op, value) => {
      if (!Array.isArray(arr)) return [];
      const f = String(field ?? "");
      const o = String(op ?? "==");
      return arr.filter((item: any) => {
        const v = f ? resolveField(item, f) : item;
        switch (o) {
          case "==":
            // eslint-disable-next-line eqeqeq
            return v == value;
          case "!=":
            // eslint-disable-next-line eqeqeq
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
  },
  Round: {
    name: "Round",
    signature: "Round(number, decimals?) → number",
    description: "Round to N decimal places (default 0)",
    fn: (n, decimals) => {
      const num = toNumber(n);
      const d = decimals != null ? toNumber(decimals) : 0;
      const factor = Math.pow(10, d);
      return Math.round(num * factor) / factor;
    },
  },
  Abs: {
    name: "Abs",
    signature: "Abs(number) → number",
    description: "Absolute value",
    fn: (n) => Math.abs(toNumber(n)),
  },
  Floor: {
    name: "Floor",
    signature: "Floor(number) → number",
    description: "Round down to nearest integer",
    fn: (n) => Math.floor(toNumber(n)),
  },
  Ceil: {
    name: "Ceil",
    signature: "Ceil(number) → number",
    description: "Round up to nearest integer",
    fn: (n) => Math.ceil(toNumber(n)),
  },
};

/**
 * Lazy builtins — these receive AST nodes (not evaluated values) and
 * control their own evaluation. Handled specially in evaluator.ts.
 */
export const LAZY_BUILTINS: Set<string> = new Set(["Each"]);

export const LAZY_BUILTIN_DEFS: Record<string, { signature: string; description: string }> = {
  Each: {
    signature: "Each(array, varName, template)",
    description:
      "Evaluate template for each element. Produces components (for rendering) or values (for data transformation). varName is the loop variable.",
  },
};

/** Maps parser-level action step names → runtime step type values. Single source of truth. */
export const ACTION_STEPS = {
  Run: "run",
  ToAssistant: "continue_conversation",
  OpenUrl: "open_url",
  Set: "set",
} as const;

/** All action expression names (steps + the Action container) */
export const ACTION_NAMES: Set<string> = new Set(["Action", ...Object.keys(ACTION_STEPS)]);

/** Set of builtin names for fast lookup (includes action expressions) */
export const BUILTIN_NAMES: Set<string> = new Set([
  ...Object.keys(BUILTINS),
  ...LAZY_BUILTINS,
  ...ACTION_NAMES,
]);

/** Check if a name is a builtin function (not a component) */
export function isBuiltin(name: string): boolean {
  return BUILTIN_NAMES.has(name);
}

/** Reserved statement-level call names — not builtins, not components */
export const RESERVED_CALLS = { Query: "Query", Mutation: "Mutation" } as const;

/** Check if a name is a reserved statement call (Query, Mutation) */
export function isReservedCall(name: string): boolean {
  return name in RESERVED_CALLS;
}

/** Re-export toNumber for evaluator compatibility */
export { toNumber };
