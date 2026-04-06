// ─────────────────────────────────────────────────────────────────────────────
// AST node types for openui-lang
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Discriminated union representing every value that can appear in an
 * openui-lang expression. The `k` field is the discriminant.
 *
 * Literal & structural nodes:
 * - `Comp`       — a component call: `Header("Hello", "Subtitle")`
 * - `Str`        — a string literal: `"hello"`
 * - `Num`        — a number literal: `42` or `3.14`
 * - `Bool`       — a boolean literal: `true` or `false`
 * - `Null`       — the null literal
 * - `Arr`        — an array: `[a, b, c]`
 * - `Obj`        — an object: `{ key: value }`
 * - `Ref`        — a reference to another statement: `myTable`
 * - `Ph`         — a placeholder for an unresolvable reference
 *
 * Reactive & expression nodes:
 * - `StateRef`   — a reactive state variable reference: `$count`
 * - `RuntimeRef` — a reference resolved at runtime (e.g. Query results)
 * - `BinOp`      — a binary operation: `a + b`, `x == y`
 * - `UnaryOp`    — a unary operation: `!flag`
 * - `Ternary`    — a conditional expression: `cond ? a : b`
 * - `Member`     — dot member access: `obj.field`
 * - `Index`      — bracket index access: `arr[0]`
 * - `Assign`     — state assignment: `$count = $count + 1`
 */
export type ASTNode =
  | { k: "Comp"; name: string; args: ASTNode[]; mappedProps?: Record<string, ASTNode> }
  | { k: "Str"; v: string }
  | { k: "Num"; v: number }
  | { k: "Bool"; v: boolean }
  | { k: "Null" }
  | { k: "Arr"; els: ASTNode[] }
  | { k: "Obj"; entries: [string, ASTNode][] }
  | { k: "Ref"; n: string }
  | { k: "Ph"; n: string }
  | { k: "StateRef"; n: string }
  | { k: "RuntimeRef"; n: string; refType: "query" | "mutation" }
  | { k: "BinOp"; op: string; left: ASTNode; right: ASTNode }
  | { k: "UnaryOp"; op: string; operand: ASTNode }
  | { k: "Ternary"; cond: ASTNode; then: ASTNode; else: ASTNode }
  | { k: "Member"; obj: ASTNode; field: string }
  | { k: "Index"; obj: ASTNode; index: ASTNode }
  | { k: "Assign"; target: string; value: ASTNode };

/**
 * Subset of ASTNode that must be preserved for runtime evaluation.
 * These nodes survive parser lowering and are resolved by the evaluator.
 */
export type RuntimeExprNode = Extract<
  ASTNode,
  | { k: "StateRef" }
  | { k: "RuntimeRef" }
  | { k: "BinOp" }
  | { k: "UnaryOp" }
  | { k: "Ternary" }
  | { k: "Member" }
  | { k: "Index" }
  | { k: "Assign" }
>;

/** Type guard for runtime expression nodes that survive parser lowering. */
export function isRuntimeExpr(node: ASTNode): node is RuntimeExprNode {
  switch (node.k) {
    case "StateRef":
    case "RuntimeRef":
    case "BinOp":
    case "UnaryOp":
    case "Ternary":
    case "Member":
    case "Index":
    case "Assign":
      return true;
    default:
      return false;
  }
}

/** Valid AST discriminant values. */
const AST_KINDS = new Set([
  "Comp",
  "Ref",
  "StateRef",
  "RuntimeRef",
  "BinOp",
  "UnaryOp",
  "Ternary",
  "Member",
  "Index",
  "Assign",
  "Str",
  "Num",
  "Bool",
  "Null",
  "Arr",
  "Obj",
  "Ph",
]);

/** Check if a value is an AST node (has a valid `k` discriminant field). */
export function isASTNode(value: unknown): value is ASTNode {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return AST_KINDS.has((value as Record<string, unknown>).k as string);
}

export function walkAST(node: ASTNode, visit: (node: ASTNode) => void): void {
  const walk = (current: ASTNode) => {
    visit(current);

    switch (current.k) {
      case "Comp":
        current.args.forEach(walk);
        Object.values(current.mappedProps ?? {}).forEach(walk);
        break;
      case "Arr":
        current.els.forEach(walk);
        break;
      case "Obj":
        current.entries.forEach(([, value]) => walk(value));
        break;
      case "BinOp":
        walk(current.left);
        walk(current.right);
        break;
      case "UnaryOp":
        walk(current.operand);
        break;
      case "Ternary":
        walk(current.cond);
        walk(current.then);
        walk(current.else);
        break;
      case "Member":
        walk(current.obj);
        break;
      case "Index":
        walk(current.obj);
        walk(current.index);
        break;
      case "Assign":
        walk(current.value);
        break;
    }
  };

  walk(node);
}

// ─── Typed Statement model ─────────────────────────────────────────────────
// Classification determined at parse time from token type + expression shape.
// Eliminates id.startsWith("$") and ast.name === "Query" hacks downstream.

/** Tool/Query call shape extracted from Comp nodes */
export interface CallNode {
  callee: string;
  args: ASTNode[];
}

/** Typed statement — kind known at parse time */
export type Statement =
  | { kind: "value"; id: string; expr: ASTNode }
  | { kind: "state"; id: string; init: ASTNode }
  | { kind: "query"; id: string; call: CallNode; expr: ASTNode; deps?: string[] }
  | { kind: "mutation"; id: string; call: CallNode; expr: ASTNode };
