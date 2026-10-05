import { isASTNode } from "./ast";
import {
  isElementNode,
  type ElementNode,
  type MaterializeCtx,
  type ParamDef,
  type ScalarParamType,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Schema & value introspection
// ─────────────────────────────────────────────────────────────────────────────

/** `typeof` results a scalar/enum leaf can be checked against. */
const SCALAR_TYPEOFS: readonly string[] = ["string", "number", "boolean"];

const NO_PROPS: Record<string, unknown> = {};
const NO_REQUIRED: readonly string[] = [];

function jsType(value: unknown): string {
  return Array.isArray(value) ? "array" : typeof value;
}

/** `{ $ref: "#/$defs/Name" }` → `"Name"`. */
function refName(s: Record<string, unknown>): string | undefined {
  return typeof s["$ref"] === "string" ? s["$ref"].split("/").pop() : undefined;
}

/** Composite shapes can't be reliably matched to a single plain value. */
function isCompositeSchema(s: Record<string, unknown>): boolean {
  return "$ref" in s || "anyOf" in s || "oneOf" in s || "allOf" in s;
}

/** Scalar type/enum info extracted from a JSON Schema leaf, for describeTypeMismatch. */
interface ScalarTypeInfo {
  /** Scalar leaf type, when the property is a plain string/number/boolean. */
  expectedType?: ScalarParamType;
  /** Allowed literal values from `enum`/`const`. */
  enumValues?: readonly unknown[];
}

/** Extract the scalar leaf type/enum from an already-narrowed JSON Schema object. */
export function getScalarTypeInfo(s: Record<string, unknown>): ScalarTypeInfo {
  if (Array.isArray(s["enum"])) return { enumValues: s["enum"] };
  if ("const" in s) return { enumValues: [s["const"]] };
  switch (s["type"]) {
    case "string":
      return { expectedType: "string" };
    case "number":
    case "integer":
      return { expectedType: "number" };
    case "boolean":
      return { expectedType: "boolean" };
    default:
      return {};
  }
}

/** Read a JSON Schema fragment's `default`, if it carries one. */
export function getSchemaDefaultValue(property: unknown): unknown {
  if (!property || typeof property !== "object" || Array.isArray(property)) {
    return undefined;
  }
  return (property as { default?: unknown }).default;
}

/** Returns the expected type for a param from its schema properties */
export function getTypeFromSchema(property: unknown): string | undefined {
  if (!property || typeof property !== "object" || Array.isArray(property)) {
    return undefined;
  }
  const p = property as Record<string, unknown>;
  // $refs and compound types aren't validator-checkable but still make useful hints.
  const ref = refName(p);
  if (ref) return ref;
  // Scalar/enum leaves: share the validator's schema-leaf interpretation so
  // signatures and type-mismatch messages never disagree.
  const leaf = getScalarTypeInfo(p);
  if (leaf.enumValues) {
    return leaf.enumValues.map((v) => JSON.stringify(v)).join("|");
  }
  if (leaf.expectedType) {
    return leaf.expectedType;
  }
  return typeof p.type === "string" ? p.type : undefined;
}

/**
 * Build a typed signature like `Header(title*: string, variant: "a"|"b")` from
 * compiled params — * marks required. Positional order is preserved so an LLM
 * can fix swapped args.
 */
export function buildParamsSignature(component: string, params: ParamDef[]): string {
  const rendered = params
    .map((p) => {
      const type = getTypeFromSchema(p.schema);
      const marked = p.required ? `${p.name}*` : p.name;
      return type ? `${marked}: ${type}` : marked;
    })
    .join(", ");
  return `${component}(${rendered})`;
}

/** Checks a param's returned value against its expected value */
function checkTypeMismatch(
  value: unknown,
  info: ScalarTypeInfo,
): { expected: string; actual: string } | null {
  const actual = typeof value;
  if (info.enumValues) {
    if (!SCALAR_TYPEOFS.includes(actual)) return null;
    if (info.enumValues.includes(value)) return null;
    return {
      expected: `one of [${info.enumValues.map((v) => JSON.stringify(v)).join(", ")}]`,
      actual: JSON.stringify(value),
    };
  }
  if (info.expectedType && info.expectedType !== actual) {
    return { expected: info.expectedType, actual: jsType(value) };
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A structured validation issue. Every error of a kind reads identically
 * because its message template lives in validationMessage — call sites only
 * supply the varying parts.
 */
export type ValidationIssue =
  | { code: "type-mismatch"; expected: string; actual: string }
  | { code: "missing-required"; signature?: string }
  | { code: "null-required"; signature?: string }
  | { code: "unknown-component"; available?: string[] }
  | { code: "inline-reserved" }
  | { code: "excess-args"; declared: number; got: number };

function validationMessage(component: string, path: string, issue: ValidationIssue): string {
  switch (issue.code) {
    case "type-mismatch":
      return `field "${path}" expects ${issue.expected} but got ${issue.actual}`;
    case "missing-required":
      return `missing required field "${path}"${issue.signature ? ` — signature: ${issue.signature}` : ""}`;
    case "null-required":
      return `required field "${path}" cannot be null${issue.signature ? ` — signature: ${issue.signature}` : ""}`;
    case "unknown-component":
      return `Unknown component "${component}" — not found in catalog or builtins${issue.available?.length ? `. Available components: ${issue.available.join(", ")}` : ""}`;
    case "inline-reserved":
      return `${component}() must be declared as a top-level statement, not used inline as a value`;
    case "excess-args":
      return `${component} takes ${issue.declared} arg(s), got ${issue.got} (${issue.got - issue.declared} excess dropped)`;
  }
}

/** Append a validation error, deriving its message from the structured issue. */
export function pushValidationIssue(
  ctx: MaterializeCtx,
  component: string,
  path: string,
  issue: ValidationIssue,
): void {
  ctx.errors.push({
    code: issue.code,
    component,
    path,
    message: validationMessage(component, path, issue),
    statementId: ctx.currentStatementId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Invalid-value resolution — the edge rule
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Override invalid value with a default one if present.
 * Propagate upwards if it's a required key.
 * Else, delete the key.
 */
export function resolveInvalidValue(
  container: Record<string, unknown>,
  key: string,
  required: boolean,
  defaultValue: unknown,
): boolean {
  if (defaultValue !== undefined) {
    container[key] = defaultValue;
    return false;
  }
  if (required) return true;
  delete container[key];
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validators — one per schema shape, dispatched by validateSchemaValue
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Position check for a component element in a data slot: slots that admit
 * components ($ref / anyOf / oneOf members) are left unchecked, a slot
 * declaring a plain-data shape can never be satisfied by a component, and
 * unconstrained slots stay conservative.
 */
function validateElementPosition(
  element: ElementNode,
  s: Record<string, unknown>,
  component: string,
  path: string,
  ctx: MaterializeCtx,
): boolean {
  if (isCompositeSchema(s)) return false;
  if (typeof s["type"] === "string" || Array.isArray(s["enum"]) || "const" in s) {
    pushValidationIssue(ctx, component, path, {
      code: "type-mismatch",
      expected: typeof s["type"] === "string" ? s["type"] : "a literal value",
      actual: `component "${element.typeName}"`,
    });
    return true;
  }
  return false;
}

/** The `$ref` names a slot allows: one for `$ref`, several for anyOf/oneOf. */
function slotRefNames(s: Record<string, unknown>): (string | undefined)[] {
  return ((s["anyOf"] ?? s["oneOf"] ?? [s]) as Record<string, unknown>[]).map(refName);
}

/** True when every option of the slot is a `$ref` to a component. */
function isOnlyComponentSlot(s: Record<string, unknown>, ctx: MaterializeCtx): boolean {
  const names = slotRefNames(s);
  return names.length > 0 && names.every((n) => n !== undefined && ctx.cat?.has(n));
}

/**
 * Validate an object-shaped slot: container type, required keys (absent/null
 * ones fill silently from their schema default), then each declared property
 * recursively, resolving invalid children via the edge rule.
 */
function validateObjectValue(
  value: unknown,
  s: Record<string, unknown>,
  component: string,
  path: string,
  ctx: MaterializeCtx,
): boolean {
  if (typeof value !== "object" || Array.isArray(value)) {
    pushValidationIssue(ctx, component, path, {
      code: "type-mismatch",
      expected: "object",
      actual: jsType(value),
    });
    return true;
  }
  const obj = value as Record<string, unknown>;
  const props =
    s["properties"] && typeof s["properties"] === "object"
      ? (s["properties"] as Record<string, unknown>)
      : NO_PROPS;
  const required = Array.isArray(s["required"]) ? (s["required"] as string[]) : NO_REQUIRED;
  let invalid = false;
  // Structural checks are streaming-sensitive — only run on complete input.
  if (!ctx.partial) {
    for (const key of required) {
      const present = key in obj;
      if (!present || obj[key] == null) {
        const fallback = getSchemaDefaultValue(props[key]);
        if (fallback !== undefined) {
          obj[key] = fallback;
          continue;
        }
        pushValidationIssue(ctx, component, `${path}/${key}`, {
          code: present ? "null-required" : "missing-required",
        });
        invalid = true;
      }
    }
  }
  for (const key of Object.keys(props)) {
    if (key in obj) {
      const sub = props[key];
      if (validateSchemaValue(obj[key], sub, component, `${path}/${key}`, ctx)) {
        if (resolveInvalidValue(obj, key, required.includes(key), getSchemaDefaultValue(sub))) {
          invalid = true;
        }
      }
    }
  }
  return invalid;
}

/**
 * Validate an array slot: Invalid items are pruned in
 * place: validated first so error paths keep original indices
 */
function validateArrayValue(
  value: unknown,
  s: Record<string, unknown>,
  component: string,
  path: string,
  ctx: MaterializeCtx,
): boolean {
  if (!Array.isArray(value)) {
    pushValidationIssue(ctx, component, path, {
      code: "type-mismatch",
      expected: "array",
      actual: jsType(value),
    });
    return true;
  }
  const items = s["items"];
  if (!items || typeof items !== "object" || Array.isArray(items)) return false;
  let invalid: number[] | undefined;
  for (let i = 0; i < value.length; i++) {
    if (validateSchemaValue(value[i], items, component, `${path}/${i}`, ctx)) {
      (invalid ??= []).push(i);
    }
  }
  if (invalid) {
    for (let i = invalid.length - 1; i >= 0; i--) value.splice(invalid[i], 1); // prune the array
  }
  return false;
}

/**
 * Validate a scalar/enum leaf. Enum membership defers while streaming — a
 * partial literal may still complete toward a valid member; scalar type
 * checks stay on (a wrong type won't become right with more input).
 */
function validateLeafValue(
  value: unknown,
  s: Record<string, unknown>,
  component: string,
  path: string,
  ctx: MaterializeCtx,
): boolean {
  const leaf = getScalarTypeInfo(s);
  if (leaf.expectedType == null && leaf.enumValues == null) return false;
  if (leaf.enumValues && ctx.partial) return false;
  const mismatch = checkTypeMismatch(value, leaf);
  if (mismatch) {
    pushValidationIssue(ctx, component, path, { code: "type-mismatch", ...mismatch });
    return true;
  }
  return false;
}

/**
 * Recursively validate a materialized value against a JSON Schema fragment,
 * pruning unsalvageable data along the way. Dispatches on the schema shape:
 * objects and arrays descend recursively (reporting nested errors with
 * JSON-pointer paths), leaf scalars check type/enum, and component elements
 * get a position check only (their own args validate separately).
 *
 * Every violation is reported, then the same rule (resolveInvalidValue)
 * applies at each recursion edge: schema default → substitute; REQUIRED edge →
 * parent invalid, caller repeats one level up; OPTIONAL edge → prune. ARRAY
 * ITEMS are always pruned. Absent/null required keys fill silently from their
 * schema default; reported violations keep their error even when a default steps in.
 */
export function validateSchemaValue(
  value: unknown,
  schema: unknown,
  component: string,
  path: string,
  ctx: MaterializeCtx,
): boolean {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return false;
  const s = schema as Record<string, unknown>;
  // Absence is handled by required checks on the parent; skip null/undefined.
  if (value == null) return false;
  // Dynamic runtime expressions ($var, builtins) resolve later — don't flag.
  if (isASTNode(value)) return false;
  // Child components: only their position is checked here.
  if (isElementNode(value)) return validateElementPosition(value, s, component, path, ctx);
  if (isCompositeSchema(s)) {
    // Data (an object, array, string, number or boolean) in a component-only slot is invalid.
    if (!isOnlyComponentSlot(s, ctx)) return false;
    pushValidationIssue(ctx, component, path, {
      code: "type-mismatch",
      expected: slotRefNames(s).join(" | "),
      actual: Array.isArray(value)
        ? "array"
        : typeof value === "object"
          ? "plain object"
          : typeof value,
    });
    return true;
  }

  const type = s["type"];
  if (type === "object") return validateObjectValue(value, s, component, path, ctx);
  if (type === "array") return validateArrayValue(value, s, component, path, ctx);
  return validateLeafValue(value, s, component, path, ctx);
}
