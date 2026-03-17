import type { Model } from "../defineModel";
import {
  getArrayInnerType,
  getEnumValues,
  getFieldDescription,
  getSchemaId,
  getZodType,
  isArrayType,
  isOptionalType,
  resolveTypeAnnotation,
  unwrap,
  getUnionOptions,
} from "../utils/zod";

export interface PromptOptions {
  preamble?: string;
  additionalRules?: string[];
  examples?: string[];
}

export interface PromptInput {
  models: Record<string, Model>;
  root: string | string[] | undefined;
}

function rootDisplay(root: string | string[] | undefined): string {
  return Array.isArray(root) ? root.join(" | ") : (root ?? "Root");
}

function syntaxRules(root: string | string[] | undefined): string {
  const rootRule = Array.isArray(root)
    ? `\`root\` is the entry point — every program must define \`root\` as one of: ${root.map((r) => `\`${r}(...)\``).join(", ")}`
    : `\`root\` is the entry point — every program must define \`root = ${root ?? "Root"}(...)\``;

  return `
Respond using OpenUI Lang, a structured output format. Your ENTIRE response must be valid OpenUI Lang — no markdown, no explanations.

## Syntax Rules

1. Each statement is on its own line: \`identifier = Expression\`
2. ${rootRule}
3. Expressions are: strings ("..."), numbers, booleans (true/false), arrays ([...]), objects ({...}), or type calls TypeName(arg1, arg2, ...)
4. Use references for readability: define \`name = TypeName(...)\` on one line, then use \`name\` later
5. EVERY variable (except root) MUST be referenced by at least one other variable. Unreferenced variables are silently dropped.
6. Arguments are POSITIONAL (order matters, not names)
7. Optional arguments can be omitted from the end. To skip an optional argument in the middle, pass null.
8. Strings use double quotes with backslash escaping
9. In inline objects ({key: value}), values MUST match the declared type. For \`{[key: string]: string}\` fields, ALL values must be quoted strings.
10. Forward references are allowed — a name can be used before it is defined.`;
}

function importantRules(root: string | string[] | undefined): string {
  const display = rootDisplay(root);
  return `## Rules
- ALWAYS start with root = ${display}(...)
- Write root first, then definitions, then leaf data — this enables progressive streaming
- Each statement on its own line — no trailing text or explanations
- Every variable must be reachable from root
- When building arrays, include ALL defined items. If you define t1 through tN, the array must list all of them.`;
}

// ─── Field analysis ───

interface FieldInfo {
  name: string;
  isOptional: boolean;
  isArray: boolean;
  typeAnnotation?: string;
  description?: string;
  rawSchema: unknown;
}

function analyzeFields(shape: Record<string, unknown>): FieldInfo[] {
  return Object.entries(shape).map(([name, schema]) => ({
    name,
    isOptional: isOptionalType(schema),
    isArray: isArrayType(schema),
    typeAnnotation: resolveTypeAnnotation(schema),
    description: getFieldDescription(schema),
    rawSchema: schema,
  }));
}

// ─── Signature generation ───

const MULTILINE_THRESHOLD = 6;

function buildSignature(typeName: string, fields: FieldInfo[]): string {
  const useNumbered = fields.length > MULTILINE_THRESHOLD;

  const params = fields.map((f, i) => {
    let param: string;
    if (f.typeAnnotation) {
      param = f.isOptional ? `${f.name}?: ${f.typeAnnotation}` : `${f.name}: ${f.typeAnnotation}`;
    } else if (f.isArray) {
      param = f.isOptional ? `[${f.name}]?` : `[${f.name}]`;
    } else {
      param = f.isOptional ? `${f.name}?` : f.name;
    }
    if (f.description) {
      param += ` (${f.description})`;
    }
    if (useNumbered) {
      return `  #${i + 1} ${param}`;
    }
    return param;
  });

  if (useNumbered) {
    return `${typeName}(  ← ${fields.length} positional args\n${params.join(",\n")}\n)`;
  }
  return `${typeName}(${params.join(", ")})`;
}

function buildTypeLine(typeName: string, def: Model): string {
  const fields = analyzeFields(def.schema.shape);
  const sig = buildSignature(typeName, fields);
  if (def.description) {
    return `${sig} — ${def.description}`;
  }
  return sig;
}

// ─── Example generation ───

let _varCounter = 0;
function nextVar(prefix: string): string {
  return `${prefix}${++_varCounter}`;
}

function generatePlaceholder(
  schema: unknown,
  models: Record<string, Model>,
  depth: number,
): [string, string[]] {
  const inner = unwrap(schema);
  const zodType = getZodType(inner);

  const modelId = getSchemaId(inner);
  if (modelId && models[modelId] && depth < 2) {
    const varName = nextVar(modelId.charAt(0).toLowerCase());
    const [line, extras] = generateModelInstance(modelId, models[modelId], models, depth + 1);
    return [varName, [...extras, `${varName} = ${line}`]];
  }

  const unionOpts = getUnionOptions(inner);
  if (unionOpts && unionOpts.length > 0) {
    for (const opt of unionOpts) {
      const optId = getSchemaId(unwrap(opt));
      if (optId && models[optId]) {
        return generatePlaceholder(opt, models, depth);
      }
    }
    return generatePlaceholder(unionOpts[0], models, depth);
  }

  const enumVals = getEnumValues(inner);
  if (enumVals && enumVals.length > 0) return [`"${enumVals[0]}"`, []];
  if (zodType === "literal") {
    const vals = (inner as any)?._zod?.def?.values;
    if (Array.isArray(vals) && vals.length > 0) {
      const v = vals[0];
      return [typeof v === "string" ? `"${v}"` : String(v), []];
    }
  }

  if (zodType === "string") return [`"example"`, []];
  if (zodType === "number") return ["1", []];
  if (zodType === "boolean") return ["true", []];

  if (isArrayType(schema)) {
    const elemSchema = getArrayInnerType(schema);
    if (elemSchema) {
      const [val, extras] = generatePlaceholder(elemSchema, models, depth);
      return [`[${val}]`, extras];
    }
    return [`["a"]`, []];
  }

  if (zodType === "record") return [`{"key": "value"}`, []];

  return [`"..."`, []];
}

function generateModelInstance(
  typeName: string,
  model: Model,
  allModels: Record<string, Model>,
  depth: number,
): [string, string[]] {
  const fields = analyzeFields(model.schema.shape);
  const args: string[] = [];
  const extras: string[] = [];

  const hasOptionals = fields.some((f) => f.isOptional);

  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    if (f.isOptional) {
      args.push("null");
    } else {
      const [val, ex] = generatePlaceholder(f.rawSchema, allModels, depth);
      args.push(val);
      extras.push(...ex);
    }
  }

  // Trim trailing nulls (optional args can be omitted from end)
  while (args.length > 0 && args[args.length - 1] === "null") {
    args.pop();
  }

  // If we trimmed everything, add one null back to show the pattern
  if (hasOptionals && args.length === fields.filter((f) => !f.isOptional).length) {
    const firstOptIdx = fields.findIndex((f) => f.isOptional);
    if (firstOptIdx >= 0 && firstOptIdx < fields.length - 1) {
      // There's an optional before required fields — show null padding
      while (args.length <= firstOptIdx) args.push("null");
    }
  }

  return [`${typeName}(${args.join(", ")})`, extras];
}

function generateAutoExample(input: PromptInput): string | null {
  const modelEntries = Object.entries(input.models);
  if (modelEntries.length === 0) return null;

  _varCounter = 0;
  const lines: string[] = [];

  const rootName = Array.isArray(input.root) ? input.root[0] : input.root;
  if (!rootName || !input.models[rootName]) return null;

  const rootModel = input.models[rootName];
  const [rootCall, rootExtras] = generateModelInstance(rootName, rootModel, input.models, 0);

  lines.push(`root = ${rootCall}`);
  for (const ex of rootExtras) {
    lines.push(ex);
  }

  return lines.join("\n");
}

// ─── Prompt assembly ───

function generateTypeSignatures(input: PromptInput): string {
  const lines: string[] = [
    "## Type Signatures",
    "",
    "Arguments marked with ? are optional. Sub-types can be inline or referenced; prefer references for readability.",
    "",
  ];

  for (const [name, def] of Object.entries(input.models)) {
    lines.push(buildTypeLine(name, def));
  }

  return lines.join("\n");
}

export function generatePrompt(input: PromptInput, options?: PromptOptions): string {
  const parts: string[] = [];

  parts.push(options?.preamble ?? "");
  parts.push(syntaxRules(input.root));
  parts.push("");
  parts.push(generateTypeSignatures(input));

  // Example section: auto-generated + good/bad patterns + user examples
  const autoExample = generateAutoExample(input);
  const userExamples = options?.examples ?? [];

  parts.push("");
  parts.push("## Example");
  if (autoExample) {
    parts.push("");
    parts.push("```");
    parts.push(autoExample);
    parts.push("```");
  }

  // Always show the do/don't for positional args
  parts.push("");
  parts.push("**WRONG** — do not use named arguments:");
  parts.push("`x = MyType(name=\"hello\", value=\"world\")`");
  parts.push("");
  parts.push("**CORRECT** — arguments are positional:");
  parts.push("`x = MyType(\"hello\", \"world\")`");
  parts.push("");
  parts.push("To skip an optional middle argument, use null:");
  parts.push("`x = MyType(\"hello\", null, \"world\")`");

  for (const ex of userExamples) {
    parts.push("");
    parts.push(ex);
  }

  parts.push("");
  parts.push(importantRules(input.root));

  if (options?.additionalRules?.length) {
    parts.push("");
    for (const rule of options.additionalRules) {
      parts.push(`- ${rule}`);
    }
  }

  return parts.join("\n");
}
