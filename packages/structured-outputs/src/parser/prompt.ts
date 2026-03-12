import type { DefinedType } from "../defineType";
import { isArrayType, isOptionalType, resolveTypeAnnotation } from "../utils/zod";

export interface PromptOptions {
  preamble?: string;
  additionalRules?: string[];
  examples?: string[];
}

export interface TypeGroup {
  name: string;
  types: string[];
  notes?: string[];
}

export interface PromptInput {
  types: Record<string, DefinedType>;
  root: string | undefined;
  typeGroups: TypeGroup[] | undefined;
}

function syntaxRules(rootName: string): string {
  return `
Respond using OpenUI Lang, a structured output format. Your ENTIRE response must be valid OpenUI Lang — no markdown, no explanations.

## Syntax Rules

1. Each statement is on its own line: \`identifier = Expression\`
2. \`root\` is the entry point — every program must define \`root = ${rootName}(...)\`
3. Expressions are: strings ("..."), numbers, booleans (true/false), arrays ([...]), objects ({...}), or type calls TypeName(arg1, arg2, ...)
4. Use references for readability: define \`name = ...\` on one line, then use \`name\` later
5. EVERY variable (except root) MUST be referenced by at least one other variable. Unreferenced variables are silently dropped. Always include defined variables in their parent's children/items array.
6. Arguments are POSITIONAL (order matters, not names)
7. Arguments are POSITIONAL — you CANNOT skip optional arguments in the middle. Pass null explicitly for any optional argument you want to omit, e.g. TypeName(arg1, null, arg3).
8. No operators, no logic, no variables — only declarations
9. Strings use double quotes with backslash escaping`;
}

function streamingRules(rootName: string): string {
  return `## Hoisting & Forward References

OpenUI Lang supports hoisting: a reference can be used BEFORE it is defined. The parser resolves all references after the full input is parsed.

**Recommended statement order:**
1. \`root = ${rootName}(...)\` — top-level structure first
2. Type definitions — fill in as they are defined
3. Data values — leaf content last

Always write the root = ${rootName}(...) statement first.`;
}

function importantRules(rootName: string): string {
  return `## Important Rules
- ALWAYS start with root = ${rootName}(...)
- Write statements in TOP-DOWN order: root → types → data (leverages hoisting)
- Each statement on its own line
- No trailing text or explanations — output ONLY OpenUI Lang code
- Generate realistic/plausible data when extracting information
- NEVER define a variable without referencing it from the tree. Every variable must be reachable from root.`;
}

// ─── Field analysis ───

interface FieldInfo {
  name: string;
  isOptional: boolean;
  isArray: boolean;
  typeAnnotation?: string;
}

function analyzeFields(shape: Record<string, unknown>): FieldInfo[] {
  return Object.entries(shape).map(([name, schema]) => ({
    name,
    isOptional: isOptionalType(schema),
    isArray: isArrayType(schema),
    typeAnnotation: resolveTypeAnnotation(schema),
  }));
}

// ─── Signature generation ───

function buildSignature(typeName: string, fields: FieldInfo[]): string {
  const params = fields.map((f) => {
    if (f.typeAnnotation) {
      return f.isOptional ? `${f.name}?: ${f.typeAnnotation}` : `${f.name}: ${f.typeAnnotation}`;
    }
    if (f.isArray) {
      return f.isOptional ? `[${f.name}]?` : `[${f.name}]`;
    }
    return f.isOptional ? `${f.name}?` : f.name;
  });
  return `${typeName}(${params.join(", ")})`;
}

function buildTypeLine(typeName: string, def: DefinedType): string {
  const fields = analyzeFields(def.props.shape);
  const sig = buildSignature(typeName, fields);
  if (def.description) {
    return `${sig} — ${def.description}`;
  }
  return sig;
}

// ─── Prompt assembly ───

function generateTypeSignatures(input: PromptInput): string {
  const lines: string[] = [
    "## Type Signatures",
    "",
    "Arguments marked with ? are optional. Sub-types can be inline or referenced; prefer references for better readability.",
  ];

  if (input.typeGroups?.length) {
    const groupedTypes = new Set<string>();

    for (const group of input.typeGroups) {
      lines.push("");
      lines.push(`### ${group.name}`);
      for (const name of group.types) {
        if (groupedTypes.has(name)) {
          console.warn(
            `[prompt] Type "${name}" appears in multiple groups; keeping the first occurrence only.`,
          );
          continue;
        }
        const def = input.types[name];
        if (!def) {
          console.warn(
            `[prompt] Type "${name}" listed in group "${group.name}" was not found and will be omitted from the prompt.`,
          );
          continue;
        }
        groupedTypes.add(name);
        lines.push(buildTypeLine(name, def));
      }
      if (group.notes?.length) {
        for (const note of group.notes) {
          lines.push(note);
        }
      }
    }

    const ungrouped = Object.keys(input.types).filter((name) => !groupedTypes.has(name));
    if (ungrouped.length) {
      lines.push("");
      lines.push("### Ungrouped");
      for (const name of ungrouped) {
        const def = input.types[name];
        lines.push(buildTypeLine(name, def));
      }
    }
  } else {
    lines.push("");
    for (const [name, def] of Object.entries(input.types)) {
      lines.push(buildTypeLine(name, def));
    }
  }

  return lines.join("\n");
}

export function generatePrompt(input: PromptInput, options?: PromptOptions): string {
  const rootName = input.root ?? "Root";
  const parts: string[] = [];

  parts.push(options?.preamble ?? "");
  parts.push(syntaxRules(rootName));
  parts.push("");
  parts.push(generateTypeSignatures(input));
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
