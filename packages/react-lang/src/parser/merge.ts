// ─────────────────────────────────────────────────────────────────────────────
// Edit/Merge for openui-lang
// ─────────────────────────────────────────────────────────────────────────────

import type { ASTNode } from "./ast";
import { walkAST } from "./ast";
import { parseExpression } from "./expressions";
import { tokenize } from "./lexer";
import { stripFences } from "./parser";
import { split } from "./statements";

interface ParsedStatement {
  id: string;
  ast: ASTNode;
  raw: string;
}

function splitStatementSource(input: string): string[] {
  const stmts: string[] = [];
  let depth = 0;
  let inStr = false;
  let esc = false;
  let start = 0;

  for (let i = 0; i < input.length; i++) {
    const c = input[i];

    if (esc) {
      esc = false;
      continue;
    }
    if (c === "\\" && inStr) {
      esc = true;
      continue;
    }
    if (c === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;

    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth = Math.max(0, depth - 1);
    else if (c === "\n" && depth <= 0) {
      const stmt = input.slice(start, i).trim();
      if (stmt) stmts.push(stmt);
      start = i + 1;
    }
  }

  const tail = input.slice(start).trim();
  if (tail) stmts.push(tail);
  return stmts;
}

function parseStatements(input: string): ParsedStatement[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const result: ParsedStatement[] = [];
  for (const raw of splitStatementSource(trimmed)) {
    const stmt = split(tokenize(raw))[0];
    if (!stmt) continue;
    result.push({
      id: stmt.id,
      ast: parseExpression(stmt.tokens),
      raw,
    });
  }

  return result;
}

/**
 * Recursively collect all Ref names from an AST node.
 */
function collectRefs(node: ASTNode, out: Set<string>): void {
  walkAST(node, (current) => {
    if (current.k === "Ref") out.add(current.n);
    if (current.k === "RuntimeRef") out.add(current.n);
  });
}

/**
 * Remove statements unreachable from `root` (garbage collection).
 * Walks the AST graph from root, collecting all referenced statement IDs.
 * $state variables are always kept (they're referenced at runtime, not by Ref nodes).
 */
function gcUnreachable(
  order: string[],
  merged: Map<string, string>,
  asts: Map<string, ASTNode>,
  rootId = "root",
): void {
  const rootAst = asts.get(rootId);
  if (!rootAst) return; // no root → can't GC

  // BFS from root to find all reachable statements
  const reachable = new Set<string>([rootId]);
  const queue: string[] = [rootId];

  while (queue.length > 0) {
    const id = queue.pop()!;
    const ast = asts.get(id);
    if (!ast) continue;

    const refs = new Set<string>();
    collectRefs(ast, refs);

    for (const ref of refs) {
      if (!reachable.has(ref) && asts.has(ref)) {
        reachable.add(ref);
        queue.push(ref);
      }
    }
  }

  // Keep $state variables — they're bound at runtime, not via Ref
  for (const id of order) {
    if (id.startsWith("$")) reachable.add(id);
  }

  // Remove unreachable statements
  for (let i = order.length - 1; i >= 0; i--) {
    if (!reachable.has(order[i])) {
      merged.delete(order[i]);
      order.splice(i, 1);
    }
  }
}

/**
 * Merge an existing program with a patch (partial update).
 * Patch statements override existing ones by name.
 * Unreachable statements are automatically garbage-collected.
 * Returns the merged program as a string.
 */
export function mergeStatements(existing: string, patch: string, rootId = "root"): string {
  const existingStmts = parseStatements(existing);
  const patchStmts = parseStatements(stripFences(patch));

  if (!existingStmts.length) {
    return patchStmts.map((stmt) => stmt.raw).join("\n");
  }
  if (!patchStmts.length) return existing;

  // Rewrite guard: if patch re-emits >80% of existing statements, warn
  const overlapCount = patchStmts.filter((p) => existingStmts.some((e) => e.id === p.id)).length;
  const overlapRatio = existingStmts.length > 0 ? overlapCount / existingStmts.length : 0;

  if (overlapRatio > 0.8 && patchStmts.length >= existingStmts.length * 0.8) {
    console.warn(
      `[openui merge] Patch re-emits ${Math.round(overlapRatio * 100)}% of existing statements — this looks like a full rewrite, not an edit.`,
    );
  }

  // Merge: patch statements override existing by name
  const merged = new Map<string, string>();
  const asts = new Map<string, ASTNode>();
  const order: string[] = [];

  for (const stmt of existingStmts) {
    merged.set(stmt.id, stmt.raw);
    asts.set(stmt.id, stmt.ast);
    order.push(stmt.id);
  }

  for (const stmt of patchStmts) {
    if (stmt.ast.k === "Null") {
      // `name = null` in a patch means "delete this statement"
      merged.delete(stmt.id);
      asts.delete(stmt.id);
      const idx = order.indexOf(stmt.id);
      if (idx !== -1) order.splice(idx, 1);
      continue;
    }
    if (!merged.has(stmt.id)) {
      order.push(stmt.id);
    }
    merged.set(stmt.id, stmt.raw);
    asts.set(stmt.id, stmt.ast);
  }

  // GC: remove statements unreachable from root
  gcUnreachable(order, merged, asts, rootId);

  return order
    .filter((id) => merged.has(id))
    .map((id) => merged.get(id)!)
    .join("\n");
}
