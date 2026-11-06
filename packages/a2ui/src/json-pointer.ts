import type { JsonObject, JsonValue } from "./types";

function decodeToken(token: string): string {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

// Keys that would walk onto the shared prototype chain instead of the data model
const RESERVED_TOKENS = new Set(["__proto__", "constructor", "prototype"]);

function tokensFor(path: string | undefined): string[] {
  if (path == null || path === "" || path === "/") return [];
  if (!path.startsWith("/")) throw new Error(`JSON Pointer must start with "/": ${path}`);
  const tokens = path.slice(1).split("/").map(decodeToken);
  for (const token of tokens) {
    if (RESERVED_TOKENS.has(token)) {
      throw new Error(`Reserved key in JSON Pointer: ${token}`);
    }
  }
  return tokens;
}

const hasOwn = (object: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(object, key);

function isArrayIndex(value: string): boolean {
  return /^(0|[1-9]\d*)$/.test(value);
}

// RFC 6902: an index may address an existing item or append right after the last one
function arrayIndexFor(array: JsonValue[], token: string): number {
  if (!isArrayIndex(token)) throw new Error(`Invalid array index in JSON Pointer: ${token}`);
  const index = Number(token);
  if (index > array.length) throw new Error(`Array index out of range in JSON Pointer: ${token}`);
  return index;
}

function containerFor(nextToken: string): JsonObject | JsonValue[] {
  return isArrayIndex(nextToken) ? [] : {};
}

export function applyDataModelUpdate(
  current: JsonObject,
  path: string | undefined,
  value: JsonValue,
): JsonObject {
  const tokens = tokensFor(path);
  if (tokens.length === 0) {
    if (value === null) return {};
    if (typeof value !== "object" || Array.isArray(value)) {
      throw new Error("The root A2UI data model must be an object");
    }
    return value;
  }

  const root = structuredClone(current);
  let cursor: JsonObject | JsonValue[] = root;

  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i]!;
    const nextToken = tokens[i + 1]!;
    if (Array.isArray(cursor)) {
      const index = arrayIndexFor(cursor, token);
      const existing = cursor[index];
      if (existing == null || typeof existing !== "object") {
        cursor[index] = containerFor(nextToken);
      }
      const child = cursor[index];
      if (child == null || typeof child !== "object") {
        throw new Error(`Cannot traverse JSON Pointer segment: ${token}`);
      }
      cursor = child as JsonObject | JsonValue[];
    } else {
      const existing = hasOwn(cursor, token) ? cursor[token] : undefined;
      if (existing == null || typeof existing !== "object") {
        cursor[token] = containerFor(nextToken);
      }
      const child = cursor[token];
      if (child == null || typeof child !== "object") {
        throw new Error(`Cannot traverse JSON Pointer segment: ${token}`);
      }
      cursor = child as JsonObject | JsonValue[];
    }
  }

  const leaf = tokens[tokens.length - 1]!;
  if (Array.isArray(cursor)) {
    const index = arrayIndexFor(cursor, leaf);
    if (value === null) cursor.splice(index, 1);
    else cursor[index] = value;
  } else if (value === null) {
    delete cursor[leaf];
  } else {
    cursor[leaf] = value;
  }

  return root;
}

function unwrapFormValue(value: unknown): JsonValue | undefined {
  if (value === undefined) return undefined;
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(unwrapFormValue).filter((item): item is JsonValue => item !== undefined);
  }
  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    if ("value" in object && "componentType" in object) return unwrapFormValue(object.value);
    const result: JsonObject = {};
    for (const [key, child] of Object.entries(object)) {
      const unwrapped = unwrapFormValue(child);
      if (unwrapped !== undefined) result[key] = unwrapped;
    }
    return result;
  }
  return undefined;
}

export function dataModelToOpenUIState(
  dataModel: JsonObject,
  formStateKeys: Iterable<string> = [],
): Record<string, unknown> {
  const state: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(dataModel)) {
    // $key is the canonical owner for Lang bindings such as $user.name.
    state[`$${key}`] = value;
  }
  // Form namespaces are opt-in so a stale form mirror cannot overwrite a
  // reactive $binding with the same top-level data-model key.
  for (const key of formStateKeys) {
    if (key in dataModel) state[key] = dataModel[key];
  }
  return state;
}

export function mergeOpenUIStateIntoDataModel(
  current: JsonObject,
  state: Record<string, unknown>,
): JsonObject {
  const next = structuredClone(current);
  const keys = new Set([
    ...Object.keys(current),
    ...Object.keys(state).map((key) => (key.startsWith("$") ? key.slice(1) : key)),
  ]);
  for (const key of keys) {
    if (RESERVED_TOKENS.has(key)) continue;
    const hasFormState = Object.prototype.hasOwnProperty.call(state, key);
    const hasBindingState = Object.prototype.hasOwnProperty.call(state, `$${key}`);
    const formValue = hasFormState ? unwrapFormValue(state[key]) : undefined;
    const bindingValue = hasBindingState ? unwrapFormValue(state[`$${key}`]) : undefined;

    // Once a real form namespace exists it owns that data-model key. Bindings
    // own every other key. This avoids change-detection races between mirrors.
    if (hasFormState && formValue !== undefined) next[key] = formValue;
    else if (hasBindingState && bindingValue !== undefined) next[key] = bindingValue;
  }
  return next;
}

export function toJsonObject(value: Record<string, unknown> | undefined): JsonObject {
  return (unwrapFormValue(value ?? {}) as JsonObject | undefined) ?? {};
}
