import { parseExpression, split, tokenize } from "@openuidev/lang-core";

interface Program {
  fenced: boolean;
  statements: Map<string, { source: string; expression: string }>;
}

/**
 * Conservative source extraction for the draft. Only bare programs and one complete
 * markdown fence are patchable. Keep source spelling intact (including expressions).
 * The caller validates both the repaired program and the actual concatenated output.
 */
function readProgram(input: string): Program | null {
  let code = input.trim();
  const fence = /^```[^\n`]*\n([\s\S]*?)\n```$/.exec(code);
  if (fence) code = fence[1]!;
  // Nested/partial fences and prose around fences need a richer patch contract.
  if (code.includes("```")) return null;

  const starts: number[] = [];
  const cleaned = code.split("");
  let quote = "";
  let escaped = false;
  let depth = 0;
  let comment = false;
  let lineStart = true;

  for (let i = 0; i < code.length; i++) {
    const c = code[i]!;
    if (comment) {
      if (c !== "\n") {
        cleaned[i] = " ";
        continue;
      }
      comment = false;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === quote) quote = "";
      continue;
    }
    if (lineStart && depth === 0) {
      if (/^[ \t]*[$A-Za-z_][\w$]*\s*=(?!=)/.test(code.slice(i))) starts.push(i);
      lineStart = false;
    }
    if (c === "#" || (c === "/" && code[i + 1] === "/")) {
      comment = true;
      cleaned[i] = " ";
    } else if (c === '"' || c === "'") quote = c;
    else if ("([{".includes(c)) depth++;
    else if (")]}".includes(c)) depth--;
    if (depth < 0) return null;
    if (c === "\n") lineStart = true;
  }
  if (quote || depth !== 0 || starts.length === 0) return null;

  const statements: Program["statements"] = new Map();
  const withoutComments = cleaned.join("");
  for (let i = 0; i < starts.length; i++) {
    const source = code.slice(starts[i], starts[i + 1] ?? code.length).trim();
    const parsed = split(tokenize(withoutComments.slice(starts[i], starts[i + 1] ?? code.length)));
    if (parsed.length !== 1) return null;
    const statement = parsed[0]!;
    statements.set(statement.id, {
      source,
      expression: JSON.stringify(parseExpression(statement.tokens)),
    });
  }
  return { fenced: !!fence, statements };
}

/** Return only added/changed statements. Never simulate deletion by assigning null. */
export function createAppendPatch(original: string, corrected: string): string | null {
  const before = readProgram(original);
  const after = readProgram(corrected);
  if (!before || !after) return null;

  for (const id of before.statements.keys()) {
    if (!after.statements.has(id)) return null;
  }

  const changes: string[] = [];
  for (const [id, statement] of after.statements) {
    const previous = before.statements.get(id);
    if (previous?.expression === statement.expression) continue;
    // Reactive defaults and tool declarations have runtime effects beyond replacing a value.
    if (
      id.startsWith("$") ||
      /\b(?:Query|Mutation)\s*\(/.test(statement.source) ||
      (previous && /\b(?:Query|Mutation)\s*\(/.test(previous.source))
    )
      return null;
    changes.push(statement.source);
  }
  if (changes.length === 0) return null;

  const patch = changes.join("\n");
  // A closing fence would otherwise make appended bare text invisible to the parser.
  return before.fenced ? `\n\n\`\`\`openui\n${patch}\n\`\`\`\n` : `\n${patch}\n`;
}
