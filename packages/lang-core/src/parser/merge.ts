// ─────────────────────────────────────────────────────────────────────────────
// Edit/Merge for openui-lang
// ─────────────────────────────────────────────────────────────────────────────

import type { ASTNode } from "./ast";
import { walkAST } from "./ast";
import { parseExpression } from "./expressions";
import { preprocess } from "./parser";
import { scanStatements, splitStatementText } from "./statements";

interface ParsedStatement {
  id: string;
  ast: ASTNode;
  raw: string;
}

/**
 * Read a program with the parser's own rules: fence extraction, comment
 * stripping and trimming (spec 1.2), then the statement boundaries of spec 1.4.
 */
function parseStatements(input: string): ParsedStatement[] {
  const text = preprocess(input);
  const result: ParsedStatement[] = [];
  for (const [start, end] of scanStatements(text).ranges) {
    const raw = text.slice(start, end).trim();
    const stmt = splitStatementText(raw);
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
  const patchStmts = parseStatements(patch);

  if (!existingStmts.length) {
    return patchStmts.map((stmt) => stmt.raw).join("\n");
  }
  if (!patchStmts.length) return existing;

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
    if (stmt.ast.k === "Null" && !stmt.id.startsWith("$")) {
      // `name = null` in a patch means "delete this statement". A state
      // declaration set to null keeps its store key, so it stays.
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
