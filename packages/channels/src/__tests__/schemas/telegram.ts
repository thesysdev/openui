/**
 * Telegram payload validation, generated from the community-maintained
 * machine-readable Bot API spec (PaulSonOfLars/telegram-bot-api-spec, vendored
 * as telegram-api-spec.json; re-download to refresh - it regenerates from the
 * official docs daily and currently tracks Bot API 10.2).
 *
 * The generator walks the spec's type graph from a root type and emits a JSON
 * Schema that ajv compiles. RichText is special-cased: the spec models only
 * its object subtypes, but per the docs it may also be a plain String or an
 * Array of RichText.
 */
import type { ValidateFunction } from "ajv";
import Ajv from "ajv";
import { readFileSync } from "node:fs";

type SpecField = { name: string; types: string[]; required: boolean };
type SpecType = { name: string; fields?: SpecField[]; subtypes?: string[]; subtype_of?: string[] };
type Spec = { version: string; types: Record<string, SpecType> };

const spec: Spec = JSON.parse(
  readFileSync(new URL("./telegram-api-spec.json", import.meta.url), "utf8"),
);

const PRIMITIVES: Record<string, object> = {
  String: { type: "string" },
  Integer: { type: "integer" },
  Float: { type: "number" },
  Boolean: { type: "boolean" },
  True: { const: true },
};

function typeToSchema(t: string, defs: Record<string, object>): object {
  if (PRIMITIVES[t]) return PRIMITIVES[t];
  if (t.startsWith("Array of ")) return { type: "array", items: typeToSchema(t.slice(9), defs) };
  ensureDef(t, defs);
  return { $ref: `#/$defs/${t}` };
}

function ensureDef(name: string, defs: Record<string, object>): void {
  if (defs[name]) return;
  defs[name] = {}; // placeholder to break cycles
  const type = spec.types[name];
  if (!type) {
    defs[name] = {}; // unknown type: accept anything rather than fail falsely
    return;
  }
  if (name === "RichText") {
    defs[name] = {
      anyOf: [
        { type: "string" },
        { type: "array", items: { $ref: "#/$defs/RichText" } },
        ...(type.subtypes ?? []).map((s) => typeToSchema(s, defs)),
      ],
    };
    return;
  }
  if (type.subtypes?.length) {
    defs[name] = { anyOf: type.subtypes.map((s) => typeToSchema(s, defs)) };
    return;
  }
  const properties: Record<string, object> = {};
  const required: string[] = [];
  for (const f of type.fields ?? []) {
    properties[f.name] =
      f.types.length === 1
        ? typeToSchema(f.types[0], defs)
        : { anyOf: f.types.map((t) => typeToSchema(t, defs)) };
    if (f.required) required.push(f.name);
  }
  defs[name] = {
    type: "object",
    properties,
    ...(required.length ? { required } : {}),
    additionalProperties: false,
  };
}

const ajv = new Ajv({ allowUnionTypes: true, strict: false });
const validators = new Map<string, ValidateFunction>();

/** Compile (and cache) an ajv validator for a Bot API type from the spec. */
export function telegramValidator(rootType: string): ValidateFunction {
  let v = validators.get(rootType);
  if (!v) {
    const defs: Record<string, object> = {};
    ensureDef(rootType, defs);
    v = ajv.compile({ $ref: `#/$defs/${rootType}`, $defs: defs });
    validators.set(rootType, v);
  }
  return v;
}

export const specVersion = spec.version;
