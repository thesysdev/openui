// ─────────────────────────────────────────────────────────────────────────────
// ElementNode → openui-lang source text serializer
// Inverse of the parse + materialize pipeline.
// ─────────────────────────────────────────────────────────────────────────────

import type { Library } from "../library";
import type { ASTNode } from "./ast";
import { isASTNode } from "./ast";
import { isBuiltin } from "./builtins";
import { compileSchema } from "./parser";
import { isElementNode, type ElementNode, type ParamMap } from "./types";

// ─── Operator precedence (mirrors expressions.ts) ────────────────────────────

const PRECEDENCE: Record<string, number> = {
  "||": 2,
  "&&": 3,
  "==": 4,
  "!=": 4,
  ">": 5,
  "<": 5,
  ">=": 5,
  "<=": 5,
  "+": 6,
  "-": 6,
  "*": 7,
  "/": 7,
  "%": 7,
};

// ─── Statement collector ─────────────────────────────────────────────────────

interface CollectedStatement {
  id: string;
  text: string;
}

class StatementCollector {
  private statements: CollectedStatement[] = [];
  private registered = new Set<string>();

  /** Register an ElementNode as a named statement. Returns the statementId for use as a reference. */
  register(id: string, text: string): void {
    if (this.registered.has(id)) return;
    this.registered.add(id);
    this.statements.push({ id, text });
  }

  has(id: string): boolean {
    return this.registered.has(id);
  }

  getStatements(): CollectedStatement[] {
    return this.statements;
  }
}

// ─── AST node serializer ─────────────────────────────────────────────────────

function serializeASTNode(node: ASTNode): string {
  switch (node.k) {
    case "Str":
      return JSON.stringify(node.v);
    case "Num":
      return String(node.v);
    case "Bool":
      return node.v ? "true" : "false";
    case "Null":
      return "null";
    case "Ph":
      return node.n;
    case "StateRef":
      return node.n; // already includes $ prefix
    case "RuntimeRef":
      return node.n;
    case "Arr":
      return "[" + node.els.map(serializeASTNode).join(", ") + "]";
    case "Obj":
      return "{" + node.entries.map(([k, v]) => `${k}: ${serializeASTNode(v)}`).join(", ") + "}";
    case "BinOp": {
      const left = serializeBinOpChild(node.left, node.op, "left");
      const right = serializeBinOpChild(node.right, node.op, "right");
      return `${left} ${node.op} ${right}`;
    }
    case "UnaryOp":
      return `${node.op}${serializeASTNode(node.operand)}`;
    case "Ternary":
      return `${serializeASTNode(node.cond)} ? ${serializeASTNode(node.then)} : ${serializeASTNode(node.else)}`;
    case "Member":
      return `${serializeASTNode(node.obj)}.${node.field}`;
    case "Index":
      return `${serializeASTNode(node.obj)}[${serializeASTNode(node.index)}]`;
    case "Assign":
      return `${node.target} = ${serializeASTNode(node.value)}`;
    case "Comp": {
      const args = node.args.map(serializeASTNode).join(", ");
      // Builtin (not Action) → @-prefix
      if (isBuiltin(node.name) && node.name !== "Action") {
        return `@${node.name}(${args})`;
      }
      // Action, reserved calls (Query/Mutation), catalog components → no prefix
      return `${node.name}(${args})`;
    }
    // Ref nodes should not appear after materialization, but handle defensively
    case "Ref":
      return node.n;
    default:
      return "null";
  }
}

/** Wrap a BinOp child in parens if its precedence is lower than the parent's. */
function serializeBinOpChild(child: ASTNode, parentOp: string, _side: "left" | "right"): string {
  const inner = serializeASTNode(child);
  if (child.k !== "BinOp") return inner;
  const parentPrec = PRECEDENCE[parentOp] ?? 0;
  const childPrec = PRECEDENCE[child.op] ?? 0;
  if (childPrec < parentPrec) return `(${inner})`;
  return inner;
}

// ─── Value serializer ────────────────────────────────────────────────────────

function serializeValue(value: unknown, paramMap: ParamMap, collector: StatementCollector): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";

  // ElementNode — check before isASTNode (they don't overlap, but order is clear)
  if (isElementNode(value)) {
    return serializeElementValue(value, paramMap, collector);
  }

  // ASTNode (surviving runtime expressions in dynamic props)
  if (isASTNode(value)) {
    return serializeASTNode(value);
  }

  // Array
  if (Array.isArray(value)) {
    const items = value.map((el) => serializeValue(el, paramMap, collector));
    return "[" + items.join(", ") + "]";
  }

  // Plain object
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const entries = Object.entries(obj).map(
      ([k, v]) => `${k}: ${serializeValue(v, paramMap, collector)}`,
    );
    return "{" + entries.join(", ") + "}";
  }

  return "null";
}

/** Serialize an ElementNode — either as a reference (if it has statementId) or inline. */
function serializeElementValue(
  node: ElementNode,
  paramMap: ParamMap,
  collector: StatementCollector,
): string {
  if (node.statementId) {
    // Register as separate statement if not already registered
    if (!collector.has(node.statementId)) {
      // Serialize the expression first (depth-first → children registered before parent)
      const expr = serializeElementExpr(node, paramMap, collector);
      collector.register(node.statementId, `${node.statementId} = ${expr}`);
    }
    // Emit bare reference
    return node.statementId;
  }
  // Inline (no statementId)
  return serializeElementExpr(node, paramMap, collector);
}

// ─── ElementNode → expression string ─────────────────────────────────────────

function serializeElementExpr(
  node: ElementNode,
  paramMap: ParamMap,
  collector: StatementCollector,
): string {
  const def = paramMap.get(node.typeName);

  if (def) {
    // Map named props back to positional args using ParamMap order
    const args: string[] = [];
    for (const param of def.params) {
      const val = node.props[param.name];
      args.push(serializeValue(val, paramMap, collector));
    }

    // Trim trailing null/undefined/default args
    while (args.length > 0) {
      const last = args[args.length - 1];
      if (last !== "null") break;
      const paramIdx = args.length - 1;
      const param = def.params[paramIdx];
      if (!param) break;
      // Only trim if the param is optional or has a default matching null
      if (param.required) break;
      args.pop();
    }

    return `${node.typeName}(${args.join(", ")})`;
  }

  // Unknown component — fallback to Object.keys() order
  const fallbackArgs = Object.values(node.props).map((v) => serializeValue(v, paramMap, collector));
  return `${node.typeName}(${fallbackArgs.join(", ")})`;
}

// ─── State declaration serializer ────────────────────────────────────────────

function serializeStateDeclarations(
  stateDeclarations: Record<string, unknown>,
  paramMap: ParamMap,
  collector: StatementCollector,
): string[] {
  const lines: string[] = [];
  for (const [name, value] of Object.entries(stateDeclarations)) {
    // Auto-declared null defaults ($var = null) can be omitted for cleaner output
    if (value === null) continue;
    lines.push(`${name} = ${serializeValue(value, paramMap, collector)}`);
  }
  return lines;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface SerializeOptions {
  /** $variable declarations to include (e.g. from ParseResult.stateDeclarations). */
  stateDeclarations?: Record<string, unknown>;
}

/**
 * Convert an ElementNode tree back to openui-lang source text.
 * Output is compatible with `mergeStatements()` for patching existing programs.
 *
 * @param json - The root ElementNode tree
 * @param library - The component Library (for positional arg ordering)
 * @param options - Optional state declarations
 * @returns openui-lang source text (multiple statements joined by newlines)
 */
export function jsonToOpenUI(
  json: ElementNode,
  library: Library,
  options?: SerializeOptions,
): string {
  const paramMap = compileSchema(library.toJSONSchema());
  const collector = new StatementCollector();

  // Serialize root — this recursively registers all child statements
  const rootExpr = serializeElementExpr(json, paramMap, collector);
  const rootId = json.statementId || "root";

  // Build output: root first, then children (depth-first post-order), then state
  const lines: string[] = [];

  // Root statement
  lines.push(`${rootId} = ${rootExpr}`);

  // Child statements (already in depth-first post-order from collector)
  for (const stmt of collector.getStatements()) {
    // Skip root if it was also registered in collector
    if (stmt.id === rootId) continue;
    lines.push(stmt.text);
  }

  // State declarations
  if (options?.stateDeclarations) {
    const stateLines = serializeStateDeclarations(options.stateDeclarations, paramMap, collector);
    lines.push(...stateLines);
  }

  return lines.join("\n");
}
