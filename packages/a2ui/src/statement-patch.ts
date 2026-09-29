const STATEMENT_PATTERN = /^(\$?[A-Za-z_][A-Za-z0-9_]*)\s*=\s*([\s\S]*)$/u;

function stripFences(source: string): string {
  const trimmed = source.trim();
  if (!trimmed.startsWith("```")) return trimmed;

  const firstLineEnd = trimmed.indexOf("\n");
  const lastFence = trimmed.lastIndexOf("```");
  if (firstLineEnd === -1 || lastFence <= firstLineEnd) return trimmed;
  return trimmed.slice(firstLineEnd + 1, lastFence).trim();
}

function splitStatements(source: string): string[] {
  const statements: string[] = [];
  let depth = 0;
  let ternaryDepth = 0;
  let quote: false | '"' | "'" = false;
  let escaped = false;
  let start = 0;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\" && quote) {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = false;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === "(" || character === "[" || character === "{") depth += 1;
    else if (character === ")" || character === "]" || character === "}") {
      depth = Math.max(0, depth - 1);
    } else if (character === "?" && depth === 0) {
      ternaryDepth += 1;
    } else if (character === ":" && depth === 0 && ternaryDepth > 0) {
      ternaryDepth -= 1;
    } else if (character === "\n" && depth === 0 && ternaryDepth === 0) {
      // A top-level ternary may begin on the next line after its condition.
      let next = index + 1;
      while (next < source.length && /\s/u.test(source[next]!)) next += 1;
      if (source[next] === "?") continue;

      const statement = source.slice(start, index).trim();
      if (statement) statements.push(statement);
      start = index + 1;
    }
  }

  const finalStatement = source.slice(start).trim();
  if (finalStatement) statements.push(finalStatement);
  return statements;
}

function parseStatements(source: string): Array<{ id: string; expression: string; raw: string }> {
  return splitStatements(stripFences(source)).map((raw) => {
    const match = STATEMENT_PATTERN.exec(raw);
    if (!match) throw new Error(`Invalid OpenUI Lang statement: ${raw}`);
    return { id: match[1]!, expression: match[2]!.trim(), raw };
  });
}

/**
 * Applies statement-level A2UI component patches without removing temporarily
 * unreachable statements. A later update may attach those statements to root.
 */
export function mergeComponentStatements(existing: string, components: readonly string[]): string {
  const statements = new Map<string, string>();
  const order: string[] = [];

  const upsert = (source: string, allowDeletion: boolean): void => {
    for (const statement of parseStatements(source)) {
      if (allowDeletion && statement.expression === "null") {
        statements.delete(statement.id);
        const index = order.indexOf(statement.id);
        if (index !== -1) order.splice(index, 1);
        continue;
      }
      if (!statements.has(statement.id)) order.push(statement.id);
      statements.set(statement.id, statement.raw);
    }
  };

  if (existing.trim()) upsert(existing, false);
  for (const component of components) upsert(component, true);

  return order.map((id) => statements.get(id)!).join("\n");
}
