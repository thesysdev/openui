export interface ParsedRule {
  type: string;
  arg?: number | string;
}

/**
 * Parse a rule string into a structured rule.
 *   "required"       → { type: "required" }
 *   "min:8"          → { type: "min", arg: 8 }
 *   "minLength:3"    → { type: "minLength", arg: 3 }
 *   "pattern:^[a-z]" → { type: "pattern", arg: "^[a-z]" }
 */
const NUMERIC_RULES = new Set(["min", "max", "minLength", "maxLength"]);

export function parseRule(rule: string): ParsedRule {
  const colonIdx = rule.indexOf(":");
  if (colonIdx === -1) return { type: rule };

  const type = rule.slice(0, colonIdx);
  const rawArg = rule.slice(colonIdx + 1);
  const arg = NUMERIC_RULES.has(type) && !Number.isNaN(Number(rawArg)) ? Number(rawArg) : rawArg;
  return { type, arg };
}

export function parseRules(rules: unknown): ParsedRule[] {
  if (!Array.isArray(rules)) return [];
  return rules.filter((r): r is string => typeof r === "string").map(parseRule);
}

export type ValidatorFn = (value: unknown, arg?: number | string) => string | undefined;

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  // Form state stores { value, componentType } — extract actual value for validation
  if (value && typeof value === "object" && !Array.isArray(value) && "value" in value) {
    return isEmpty((value as { value: unknown }).value);
  }
  // Empty plain object (e.g. CheckBoxGroup with no selection)
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  ) {
    return true;
  }
  return false;
}

export const builtInValidators: Record<string, ValidatorFn> = {
  required: (value) => {
    if (isEmpty(value)) return "This field is required";
    if (typeof value === "object" && !Array.isArray(value) && value !== null) {
      const vals = Object.values(value);
      if (vals.length > 0 && vals.every((v) => typeof v === "boolean") && !vals.some(Boolean)) {
        return "At least one option is required";
      }
    }
    return undefined;
  },

  email: (value) => {
    if (isEmpty(value)) return undefined;
    if (typeof value !== "string") return "Please enter a valid email";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : "Please enter a valid email";
  },

  url: (value) => {
    if (isEmpty(value)) return undefined;
    if (typeof value !== "string") return "Please enter a valid URL";
    try {
      new URL(value);
      return undefined;
    } catch {
      return "Please enter a valid URL";
    }
  },

  numeric: (value) => {
    if (isEmpty(value)) return undefined;
    if (typeof value === "number" && !isNaN(value)) return undefined;
    if (typeof value === "string" && !isNaN(parseFloat(value)) && value.trim() !== "")
      return undefined;
    return "Must be a number";
  },

  min: (value, arg) => {
    if (isEmpty(value)) return undefined;
    const n = typeof value === "number" ? value : parseFloat(String(value));
    if (isNaN(n)) return undefined;
    const min = Number(arg);
    return n >= min ? undefined : `Must be at least ${min}`;
  },

  max: (value, arg) => {
    if (isEmpty(value)) return undefined;
    const n = typeof value === "number" ? value : parseFloat(String(value));
    if (isNaN(n)) return undefined;
    const max = Number(arg);
    return n <= max ? undefined : `Must be no more than ${max}`;
  },

  minLength: (value, arg) => {
    if (isEmpty(value)) return undefined;
    if (typeof value !== "string") return undefined;
    const min = Number(arg);
    return value.length >= min ? undefined : `Must be at least ${min} characters`;
  },

  maxLength: (value, arg) => {
    if (isEmpty(value)) return undefined;
    if (typeof value !== "string") return undefined;
    const max = Number(arg);
    return value.length <= max ? undefined : `Must be no more than ${max} characters`;
  },

  pattern: (value, arg) => {
    if (isEmpty(value)) return undefined;
    if (typeof value !== "string" || typeof arg !== "string") return undefined;
    try {
      return new RegExp(arg).test(value) ? undefined : "Invalid format";
    } catch {
      return undefined;
    }
  },
};

/**
 * Run all rules against a value. Stop on first error.
 * Custom validators are checked first, then built-in ones.
 */
export function validate(
  value: unknown,
  rules: ParsedRule[],
  customValidators?: Record<string, ValidatorFn>,
): string | undefined {
  for (const rule of rules) {
    const validator = customValidators?.[rule.type] ?? builtInValidators[rule.type];
    if (!validator) {
      console.warn(`[openui] Unknown validation rule type: "${rule.type}"`);
      continue;
    }
    const error = validator(value, rule.arg);
    if (error) return error;
  }
  return undefined;
}

/**
 * Parse a structured rules object into ParsedRule[].
 * Accepts: { required: true, minLength: 5, email: true, max: 100 }
 * Skips keys with false/undefined values.
 */
export function parseStructuredRules(rules: unknown): ParsedRule[] {
  if (!rules || typeof rules !== "object" || Array.isArray(rules)) return [];
  const obj = rules as Record<string, any>;
  const result: ParsedRule[] = [];
  for (const [key, val] of Object.entries(obj)) {
    if (val === false || val === undefined || val === null) continue;
    if (val === true) {
      result.push({ type: key });
    } else {
      result.push({ type: key, arg: val });
    }
  }
  return result;
}
