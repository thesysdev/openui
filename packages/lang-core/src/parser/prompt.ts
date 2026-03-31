import { z } from "zod";
import type { DefinedComponent, Library, PromptOptions } from "../library";

const PREAMBLE = `You are an AI assistant that responds using openui-lang, a declarative UI language. Your ENTIRE response must be valid openui-lang code — no markdown, no explanations, just openui-lang.`;

function syntaxRules(rootName: string): string {
  return `## Syntax Rules

1. Each statement is on its own line: \`identifier = Expression\`
2. \`root\` is the entry point — every program must define \`root = ${rootName}(...)\`
3. Expressions are: strings ("..."), numbers, booleans (true/false), arrays ([...]), objects ({...}), or component calls TypeName(arg1, arg2, ...)
4. Use references for readability: define \`name = ...\` on one line, then use \`name\` later
5. EVERY variable (except root) MUST be referenced by at least one other variable. Unreferenced variables are silently dropped and will NOT render. Always include defined variables in their parent's children/items array.
6. Arguments are POSITIONAL (order matters, not names)
7. Optional arguments can be omitted from the end
8. No operators, no logic, no variables — only declarations
9. Strings use double quotes with backslash escaping`;
}

function streamingRules(rootName: string): string {
  return `## Hoisting & Streaming (CRITICAL)

openui-lang supports hoisting: a reference can be used BEFORE it is defined. The parser resolves all references after the full input is parsed.

During streaming, the output is re-parsed on every chunk. Undefined references are temporarily unresolved and appear once their definitions stream in. This creates a progressive top-down reveal — structure first, then data fills in.

**Recommended statement order for optimal streaming:**
1. \`root = ${rootName}(...)\` — UI shell appears immediately
2. Component definitions — fill in as they stream
3. Data values — leaf content last

Always write the root = ${rootName}(...) statement first so the UI shell appears immediately, even before child data has streamed in.`;
}

function importantRules(rootName: string): string {
  return `## Important Rules
- ALWAYS start with root = ${rootName}(...)
- Write statements in TOP-DOWN order: root → components → data (leverages hoisting for progressive streaming)
- Each statement on its own line
- No trailing text or explanations — output ONLY openui-lang code
- When asked about data, generate realistic/plausible data
- Choose components that best represent the content (tables for comparisons, charts for trends, forms for input, etc.)
- NEVER define a variable without referencing it from the tree. Every variable must be reachable from root, otherwise it will not render.`;
}

function getZodDef(schema: unknown): any {
  return (schema as any)?._zod?.def;
}

function getZodType(schema: unknown): string | undefined {
  return getZodDef(schema)?.type;
}

function isOptionalType(schema: unknown): boolean {
  return getZodType(schema) === "optional";
}

function unwrapOptional(schema: unknown): unknown {
  const def = getZodDef(schema);
  if (def?.type === "optional") return def.innerType;
  return schema;
}

/** Strip optional wrapper to reach the core schema. */
function unwrap(schema: unknown): unknown {
  return unwrapOptional(schema);
}

function isArrayType(schema: unknown): boolean {
  const s = unwrap(schema);
  return getZodType(s) === "array";
}

function getArrayInnerType(schema: unknown): unknown | undefined {
  const s = unwrap(schema);
  const def = getZodDef(s);
  if (def?.type === "array") return def.element ?? def.innerType;
  return undefined;
}

function getEnumValues(schema: unknown): string[] | undefined {
  const s = unwrap(schema);
  const def = getZodDef(s);
  if (def?.type !== "enum") return undefined;
  if (Array.isArray(def.values)) return def.values;
  if (def.entries && typeof def.entries === "object") return Object.keys(def.entries);
  return undefined;
}

function getSchemaId(schema: unknown): string | undefined {
  try {
    const meta = z.globalRegistry.get(schema as z.ZodType);
    return meta?.id;
  } catch {
    return undefined;
  }
}

function getUnionOptions(schema: unknown): unknown[] | undefined {
  const def = getZodDef(schema);
  if (def?.type === "union" && Array.isArray(def.options)) return def.options;
  return undefined;
}

function getObjectShape(schema: unknown): Record<string, unknown> | undefined {
  const def = getZodDef(schema);
  if (def?.type === "object" && def.shape && typeof def.shape === "object")
    return def.shape as Record<string, unknown>;
  return undefined;
}

/**
 * Resolve the type annotation for a schema field.
 * Returns a human-readable type string for the schema.
 *
 * Examples:
 *  - z.string()                   → "string"
 *  - z.number()                   → "number"
 *  - z.boolean()                  → "boolean"
 *  - z.enum(["a","b"])            → '"a" | "b"'
 *  - z.array(TabItemSchema)       → "TabItem[]"
 *  - z.union([Input, TextArea])   → "Input | TextArea"
 *  - z.array(z.union([A, B]))     → "(A | B)[]"
 *  - ButtonGroupSchema            → "ButtonGroup"
 *  - z.object({src: z.string()})  → "{src: string}" (inline when unregistered)
 */
function resolveTypeAnnotation(schema: unknown): string | undefined {
  const inner = unwrap(schema);

  const directId = getSchemaId(inner);
  if (directId) return directId;

  const unionOpts = getUnionOptions(inner);
  if (unionOpts) {
    const resolved = unionOpts.map((o) => resolveTypeAnnotation(o));
    const names = resolved.filter(Boolean) as string[];
    if (names.length > 0) {
      if (names.length < unionOpts.length) {
        console.warn(
          `[prompt] Partially resolved union: ${names.length}/${unionOpts.length} options resolved`,
        );
      }
      return names.join(" | ");
    }
  }

  if (isArrayType(schema)) {
    const arrayInner = getArrayInnerType(schema);
    if (!arrayInner) return undefined;

    const innerType = resolveTypeAnnotation(arrayInner);
    if (innerType) {
      const isUnion = getUnionOptions(unwrap(arrayInner)) !== undefined;
      return isUnion ? `(${innerType})[]` : `${innerType}[]`;
    }

    console.warn(
      `[prompt] Could not resolve array element type (inner zod type: "${getZodType(arrayInner) ?? "unknown"}")`,
    );
    return undefined;
  }

  const zodType = getZodType(inner);
  if (zodType === "string") return "string";
  if (zodType === "number") return "number";
  if (zodType === "boolean") return "boolean";

  const enumVals = getEnumValues(inner);
  if (enumVals) return enumVals.map((v) => `"${v}"`).join(" | ");

  if (zodType === "literal") {
    const vals = getZodDef(inner)?.values;
    if (Array.isArray(vals) && vals.length === 1) {
      const v = vals[0];
      return typeof v === "string" ? `"${v}"` : String(v);
    }
  }

  const shape = getObjectShape(inner);
  if (shape) {
    const fields = Object.entries(shape).map(([name, fieldSchema]) => {
      const opt = isOptionalType(fieldSchema) ? "?" : "";
      const fieldType = resolveTypeAnnotation(fieldSchema as z.ZodType);
      return fieldType ? `${name}${opt}: ${fieldType}` : `${name}${opt}`;
    });
    return `{${fields.join(", ")}}`;
  }

  if (zodType === "lazy") {
    console.warn(
      `[prompt] z.lazy() schemas are not resolved — remove z.lazy() wrapper from the schema`,
    );
  } else if (zodType) {
    console.warn(`[prompt] Unresolved schema type: "${zodType}"`);
  }

  return undefined;
}

// ─── Field analysis ───

interface FieldInfo {
  name: string;
  isOptional: boolean;
  isArray: boolean;
  typeAnnotation?: string;
}

function analyzeFields(shape: Record<string, z.ZodType>): FieldInfo[] {
  return Object.entries(shape).map(([name, schema]) => ({
    name,
    isOptional: isOptionalType(schema),
    isArray: isArrayType(schema),
    typeAnnotation: resolveTypeAnnotation(schema),
  }));
}

// ─── Signature generation ───

function buildSignature(componentName: string, fields: FieldInfo[]): string {
  const params = fields.map((f) => {
    if (f.typeAnnotation) {
      return f.isOptional ? `${f.name}?: ${f.typeAnnotation}` : `${f.name}: ${f.typeAnnotation}`;
    }
    if (f.isArray) {
      return f.isOptional ? `[${f.name}]?` : `[${f.name}]`;
    }
    return f.isOptional ? `${f.name}?` : f.name;
  });
  return `${componentName}(${params.join(", ")})`;
}

function buildComponentLine(componentName: string, def: DefinedComponent): string {
  const fields = analyzeFields(def.props.shape);
  const sig = buildSignature(componentName, fields);
  const artifactTag = def.artifact ? " [artifact]" : "";
  if (def.description) {
    return `${sig} — ${def.description}${artifactTag}`;
  }
  return `${sig}${artifactTag}`;
}

// ─── Prompt assembly ───

function generateComponentSignatures(library: Library): string {
  const lines: string[] = [
    "## Component Signatures",
    "",
    "Arguments marked with ? are optional. Sub-components can be inline or referenced; prefer references for better streaming.",
    "The `action` prop type accepts: ContinueConversation (sends message to LLM), OpenUrl (navigates to URL), or Custom (app-defined).",
  ];

  if (library.componentGroups?.length) {
    const groupedComponents = new Set<string>();

    for (const group of library.componentGroups) {
      lines.push("");
      lines.push(`### ${group.name}`);
      for (const name of group.components) {
        if (groupedComponents.has(name)) {
          console.warn(
            `[prompt] Component "${name}" appears in multiple groups; keeping the first occurrence only.`,
          );
          continue;
        }
        const def = library.components[name];
        if (!def) {
          console.warn(
            `[prompt] Component "${name}" listed in group "${group.name}" was not found in the library and will be omitted from the prompt.`,
          );
          continue;
        }
        groupedComponents.add(name);
        lines.push(buildComponentLine(name, def));
      }
      if (group.notes?.length) {
        for (const note of group.notes) {
          lines.push(note);
        }
      }
    }

    const ungrouped = Object.keys(library.components).filter(
      (name) => !groupedComponents.has(name),
    );
    if (ungrouped.length) {
      lines.push("");
      lines.push("### Ungrouped");
      for (const name of ungrouped) {
        const def = library.components[name];
        lines.push(buildComponentLine(name, def));
      }
    }
  } else {
    lines.push("");
    for (const [name, def] of Object.entries(library.components)) {
      lines.push(buildComponentLine(name, def));
    }
  }

  return lines.join("\n");
}

export function generatePrompt(library: Library, options?: PromptOptions): string {
  const rootName = library.root ?? "Root";
  const parts: string[] = [];

  parts.push(options?.preamble ?? PREAMBLE);
  parts.push("");
  parts.push(syntaxRules(rootName));
  parts.push("");
  parts.push(generateComponentSignatures(library));
  parts.push("");
  parts.push(streamingRules(rootName));

  const examples = options?.examples;
  if (examples?.length) {
    parts.push("");
    parts.push("## Examples");
    parts.push("");
    for (const ex of examples) {
      parts.push(ex);
      parts.push("");
    }
  }

  parts.push(importantRules(rootName));

  if (options?.additionalRules?.length) {
    parts.push("");
    for (const rule of options.additionalRules) {
      parts.push(`- ${rule}`);
    }
  }

  return parts.join("\n");
}
