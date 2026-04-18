import type { ASTNode, Statement } from "./ast";
import { isASTNode, walkAST } from "./ast";
import { isBuiltin, RESERVED_CALLS } from "./builtins";
import { parseExpression } from "./expressions";
import { tokenize } from "./lexer";
import { materializeValue, type MaterializeCtx } from "./materialize";
import { autoClose, split, type RawStmt } from "./statements";
import { T } from "./tokens";
import {
  isElementNode,
  type LibraryJSONSchema,
  type MutationStatementInfo,
  type ParamMap,
  type ParseResult,
  type QueryStatementInfo,
  type ValidationError,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Result building
// ─────────────────────────────────────────────────────────────────────────────

function emptyResult(incomplete = true): ParseResult {
  return {
    root: null,
    meta: {
      incomplete,
      unresolved: [],
      orphaned: [],
      statementCount: 0,
      errors: [],
    },
    stateDeclarations: {},
    queryStatements: [],
    mutationStatements: [],
  };
}

/**
 * Walk an AST node to collect all StateRef ($variable) names referenced
 * within. Used at parse time to pre-compute per-query state dependencies.
 */
export function collectQueryDeps(node: unknown): string[] {
  if (!isASTNode(node)) return [];
  const refs = new Set<string>();
  walkAST(node, (current) => {
    if (current.k === "StateRef") refs.add(current.n);
  });
  return [...refs];
}

/**
 * Classify a raw statement + parsed expression into a typed Statement.
 * Determined at parse time from token type + expression shape.
 */
function classifyStatement(raw: RawStmt, expr: ASTNode): Statement {
  // Query(...) → query declaration — check BEFORE $var to handle `$foo = Query(...)` correctly
  if (expr.k === "Comp" && expr.name === RESERVED_CALLS.Query) {
    const deps = collectQueryDeps(expr.args[1]);
    return {
      kind: "query",
      id: raw.id,
      call: { callee: RESERVED_CALLS.Query, args: expr.args },
      expr,
      deps: deps.length > 0 ? deps : undefined,
    };
  }
  // Mutation(...) → mutation declaration
  if (expr.k === "Comp" && expr.name === RESERVED_CALLS.Mutation) {
    return {
      kind: "mutation",
      id: raw.id,
      call: { callee: RESERVED_CALLS.Mutation, args: expr.args },
      expr,
    };
  }
  // $variables → state declaration
  if (raw.idTokenType === T.StateVar) {
    return { kind: "state", id: raw.id, init: expr };
  }
  // Everything else → value declaration
  return { kind: "value", id: raw.id, expr };
}

/**
 * Extract typed statements from the symbol table.
 * State defaults are materialized to plain values (no raw AST in output).
 */
function extractStatements(
  stmts: Statement[],
  ctx: MaterializeCtx,
): {
  stateDeclarations: Record<string, unknown>;
  queryStatements: QueryStatementInfo[];
  mutationStatements: MutationStatementInfo[];
} {
  const stateDeclarations: Record<string, unknown> = {};
  const queryStatements: QueryStatementInfo[] = [];
  const mutationStatements: MutationStatementInfo[] = [];

  for (const stmt of stmts) {
    switch (stmt.kind) {
      case "state":
        stateDeclarations[stmt.id] = materializeValue(stmt.init, ctx);
        break;
      case "query":
        queryStatements.push({
          statementId: stmt.id,
          toolAST: stmt.call.args[0] ?? null,
          argsAST: stmt.call.args[1] ?? null,
          defaultsAST: stmt.call.args[2] ?? null,
          refreshAST: stmt.call.args[3] ?? null,
          deps: stmt.deps,
          complete: true,
        });
        break;
      case "mutation":
        mutationStatements.push({
          statementId: stmt.id,
          toolAST: stmt.call.args[0] ?? null,
          argsAST: stmt.call.args[1] ?? null,
        });
        break;
    }
  }

  // Auto-declare: any $var referenced in code but not explicitly declared → null default.
  // collectQueryDeps already walks AST for StateRef nodes — reuse it here.
  for (const stmt of stmts) {
    const nodes =
      stmt.kind === "state"
        ? [stmt.init]
        : stmt.kind === "value"
          ? [stmt.expr]
          : stmt.kind === "query" || stmt.kind === "mutation"
            ? stmt.call.args
            : [];
    for (const node of nodes) {
      for (const dep of collectQueryDeps(node)) {
        if (!(dep in stateDeclarations)) {
          stateDeclarations[dep] = null;
        }
      }
    }
  }

  return { stateDeclarations, queryStatements, mutationStatements };
}

const DEFAULT_ROOT_STATEMENT_ID = "root";

function isComponentStatement(
  stmt: Statement,
): stmt is Extract<Statement, { kind: "value" }> & { expr: Extract<ASTNode, { k: "Comp" }> } {
  return (
    stmt.kind === "value" &&
    stmt.expr.k === "Comp" &&
    !isBuiltin(stmt.expr.name) &&
    stmt.expr.name !== RESERVED_CALLS.Query &&
    stmt.expr.name !== RESERVED_CALLS.Mutation
  );
}

function pickEntryId(
  stmtMap: Map<string, Statement>,
  typedStmts: Statement[],
  firstId: string,
  rootName?: string,
): string {
  if (stmtMap.has(DEFAULT_ROOT_STATEMENT_ID)) return DEFAULT_ROOT_STATEMENT_ID;
  if (rootName && stmtMap.has(rootName)) return rootName;

  const preferredComponent = rootName
    ? typedStmts.find((stmt) => isComponentStatement(stmt) && stmt.expr.name === rootName)
    : undefined;
  if (preferredComponent) return preferredComponent.id;

  const firstComponent = typedStmts.find(isComponentStatement);
  return firstComponent?.id ?? firstId;
}

function buildResult(
  stmtMap: Map<string, Statement>,
  typedStmts: Statement[],
  firstId: string,
  wasIncomplete: boolean,
  stmtCount: number,
  cat: ParamMap | undefined,
  rootName?: string,
): ParseResult {
  const entryId = pickEntryId(stmtMap, typedStmts, firstId, rootName);
  if (!stmtMap.has(entryId)) return emptyResult(wasIncomplete);

  const syms = new Map<string, ASTNode>();
  for (const [id, stmt] of stmtMap) {
    syms.set(id, stmt.kind === "state" ? stmt.init : stmt.expr);
  }
  const unres: string[] = [];
  const errors: ValidationError[] = [];
  // Track orphaned: start with value statement IDs, delete as they're reached.
  // Exclude root, state ($var), query, and mutation declarations — they're consumed separately.
  const unreached = new Set<string>();
  for (const [id, stmt] of stmtMap) {
    if (id === entryId) continue;
    if (stmt.kind === "state" || stmt.kind === "query" || stmt.kind === "mutation") continue;
    unreached.add(id);
  }
  const ctx: MaterializeCtx = {
    syms,
    cat,
    errors,
    unres,
    visited: new Set(),
    partial: wasIncomplete,
    currentStatementId: entryId,
    unreached,
  };
  const materialized = materializeValue(syms.get(entryId)!, ctx);

  const root = isElementNode(materialized) ? materialized : null;
  if (root) root.statementId = entryId;

  const { stateDeclarations, queryStatements, mutationStatements } = extractStatements(
    typedStmts,
    ctx,
  );

  const orphaned = [...unreached];

  return {
    root,
    meta: {
      incomplete: wasIncomplete,
      unresolved: unres,
      orphaned,
      statementCount: stmtCount,
      errors: errors,
    },
    stateDeclarations,
    queryStatements,
    mutationStatements,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/** Extract code from markdown fences, or return as-is if no fences found.
 *  String-context-aware: skips ``` inside double-quoted strings. */
export function stripFences(input: string): string {
  const blocks: string[] = [];
  let i = 0;

  while (i < input.length) {
    // Look for opening ```
    const fenceStart = input.indexOf("```", i);
    if (fenceStart === -1) break;

    // Skip language tag until newline
    let j = fenceStart + 3;
    while (j < input.length && input[j] !== "\n") j++;
    if (j >= input.length) {
      // No newline after opening fence (streaming) — take everything after fence marker + lang tag
      blocks.push(input.slice(fenceStart + 3).replace(/^[^\n]*\n?/, ""));
      i = input.length;
      break;
    }
    j++; // skip the newline

    // Scan for closing ``` while tracking string context
    let inStr = false;
    let closePos = -1;
    let k = j;
    while (k < input.length) {
      const c = input[k];
      if (inStr) {
        if (c === "\\" && k + 1 < input.length) {
          k += 2; // skip escaped character
          continue;
        }
        if (c === '"') inStr = false;
        k++;
        continue;
      }
      // Not in string
      if (c === '"') {
        inStr = true;
        k++;
        continue;
      }
      if (
        c === "`" &&
        k + 1 < input.length &&
        input[k + 1] === "`" &&
        k + 2 < input.length &&
        input[k + 2] === "`"
      ) {
        closePos = k;
        break;
      }
      k++;
    }

    if (closePos !== -1) {
      blocks.push(input.slice(j, closePos));
      i = closePos + 3;
    } else {
      // No closing fence found (streaming) — take everything after opening fence
      blocks.push(input.slice(j));
      i = input.length;
    }
  }

  if (blocks.length > 0) return blocks.join("\n");

  // Fallback: if input starts with ``` but wasn't matched (e.g. no newline after fence)
  if (input.startsWith("```")) {
    let j = 3;
    while (j < input.length && input[j] !== "\n") j++;
    const start = j < input.length ? j + 1 : 3;
    // Try to strip trailing ```
    const body = input.slice(start);
    const trailingFence = body.lastIndexOf("```");
    if (trailingFence !== -1) {
      return body.slice(0, trailingFence);
    }
    return body;
  }

  return input;
}

/** Strip // and # line comments outside of strings (handles both " and ' delimiters). */
function stripComments(input: string): string {
  return input
    .split("\n")
    .map((line) => {
      let inStr: false | '"' | "'" = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inStr) {
          if (c === "\\" && i + 1 < line.length) {
            i++; // skip escaped char
            continue;
          }
          if (c === inStr) inStr = false;
          continue;
        }
        if (c === '"' || c === "'") {
          inStr = c;
          continue;
        }
        // // style comments
        if (c === "/" && line[i + 1] === "/") {
          return line.substring(0, i).trimEnd();
        }
        // # style comments (Python/YAML style — LLMs sometimes use these)
        if (c === "#") {
          return line.substring(0, i).trimEnd();
        }
      }
      return line;
    })
    .join("\n");
}

/** Clean LLM response: strip fences, comments, whitespace. */
function preprocess(input: string): string {
  return stripComments(stripFences(input.trim())).trim();
}

/**
 * Parse a complete openui-lang string in one pass.
 *
 * @param input  - Full openui-lang source text (may be partial/streaming)
 * @param cat    - Param map for positional-arg → named-prop mapping
 * @returns      ParseResult with root ElementNode (or null) and metadata
 */
export function parse(input: string, cat: ParamMap, rootName?: string): ParseResult {
  const trimmed = preprocess(input);
  if (!trimmed) return emptyResult();

  const { text, wasIncomplete } = autoClose(trimmed);
  const stmts = split(tokenize(text));
  if (!stmts.length) return emptyResult(wasIncomplete);

  const stmtMap = new Map<string, Statement>();
  let firstId = "";
  for (const s of stmts) {
    const expr = parseExpression(s.tokens);
    const stmt = classifyStatement(s, expr);
    stmtMap.set(s.id, stmt);
    if (!firstId) firstId = s.id;
  }
  // Derive from map to deduplicate — Map.set overwrites duplicates
  const typedStmts = [...stmtMap.values()];

  return buildResult(stmtMap, typedStmts, firstId, wasIncomplete, stmtMap.size, cat, rootName);
}

export interface StreamParser {
  /** Feed the next SSE/stream chunk and get the latest ParseResult. */
  push(chunk: string): ParseResult;
  /** Set the full text — diffs against internal buffer, pushes only the delta.
   *  Resets automatically if the text was replaced (not appended). */
  set(fullText: string): ParseResult;
  /** Get the latest ParseResult without consuming new data. */
  getResult(): ParseResult;
}

export function createStreamParser(cat: ParamMap, rootName?: string): StreamParser {
  let buf = "";
  let completedEnd = 0;
  const completedStmtMap = new Map<string, Statement>();

  let completedCount = 0;
  let firstId = "";

  function addStmt(text: string) {
    // Strip comments and skip fence markers
    const cleaned = stripComments(text).trim();
    if (!cleaned || /^```/.test(cleaned)) return;
    for (const s of split(tokenize(cleaned))) {
      const expr = parseExpression(s.tokens);
      const stmt = classifyStatement(s, expr);
      completedStmtMap.set(s.id, stmt);
      completedCount++;
      if (!firstId) firstId = s.id;
    }
  }

  function scanNewCompleted(): number {
    let depth = 0,
      ternaryDepth = 0,
      inStr: false | '"' | "'" = false,
      esc = false;
    let stmtStart = completedEnd;

    for (let i = completedEnd; i < buf.length; i++) {
      const c = buf[i];
      if (esc) {
        esc = false;
        continue;
      }
      if (c === "\\" && inStr) {
        esc = true;
        continue;
      }
      if (inStr) {
        if (c === inStr) inStr = false;
        continue;
      }
      if (c === '"' || c === "'") {
        inStr = c;
        continue;
      }

      if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") depth = Math.max(0, depth - 1);
      // Track ternary ? and : at bracket depth 0 (colons inside {} are object key separators)
      else if (c === "?" && depth === 0) ternaryDepth++;
      else if (c === ":" && depth === 0 && ternaryDepth > 0) ternaryDepth--;
      else if (c === "\n" && depth <= 0 && ternaryDepth <= 0) {
        // Before splitting, look ahead past whitespace to see if the next
        // meaningful character is `?` or `:` — ternary continuation.
        let peek = i + 1;
        while (
          peek < buf.length &&
          (buf[peek] === " " || buf[peek] === "\t" || buf[peek] === "\r" || buf[peek] === "\n")
        )
          peek++;
        if (peek < buf.length && (buf[peek] === "?" || (buf[peek] === ":" && ternaryDepth > 0))) {
          continue; // ternary continuation — don't split
        }
        // Depth-0 newline = end of a statement
        const t = buf.slice(stmtStart, i).trim();
        if (t) addStmt(t);
        stmtStart = i + 1; // next statement begins after this newline
        completedEnd = i + 1; // advance the "already processed" watermark
      }
    }

    return stmtStart; // start of the current pending (incomplete) statement
  }

  function currentResult(): ParseResult {
    const pendingStart = scanNewCompleted();
    const pendingText = buf.slice(pendingStart).trim();

    // No pending text — all statements are complete
    if (!pendingText) {
      if (completedCount === 0) return emptyResult();
      return buildResult(
        completedStmtMap,
        [...completedStmtMap.values()],
        firstId,
        false,
        completedCount,
        cat,
        rootName,
      );
    }

    // Apply same cleanup as parse() — strip fences, comments, whitespace
    const cleaned = stripComments(stripFences(pendingText)).trim();
    if (!cleaned) {
      if (completedCount === 0) return emptyResult();
      return buildResult(
        completedStmtMap,
        [...completedStmtMap.values()],
        firstId,
        false,
        completedCount,
        cat,
        rootName,
      );
    }
    // Autoclose the incomplete last statement so it's syntactically valid
    const { text: closed, wasIncomplete } = autoClose(cleaned);
    const stmts = split(tokenize(closed));

    if (!stmts.length) {
      if (completedCount === 0) return emptyResult(wasIncomplete);
      return buildResult(
        completedStmtMap,
        [...completedStmtMap.values()],
        firstId,
        wasIncomplete,
        completedCount,
        cat,
        rootName,
      );
    }

    // Merge: completed cache + re-parsed pending statement.
    // Pending statements can only add NEW IDs — they cannot overwrite completed ones.
    // This prevents mid-stream partial text (e.g. `root = Card`) from corrupting
    // existing completed statements during edit streaming.
    const allStmtMap = new Map(completedStmtMap);
    for (const s of stmts) {
      if (completedStmtMap.has(s.id)) continue;
      const expr = parseExpression(s.tokens);
      const stmt = classifyStatement(s, expr);
      allStmtMap.set(s.id, stmt);
    }
    // Derive from map to deduplicate
    const allTypedStmts = [...allStmtMap.values()];

    const fid = firstId || stmts[0].id;
    return buildResult(
      allStmtMap,
      allTypedStmts,
      fid,
      wasIncomplete,
      completedCount + stmts.length,
      cat,
      rootName,
    );
  }

  function reset() {
    buf = "";
    completedEnd = 0;
    completedStmtMap.clear();
    completedCount = 0;
    firstId = "";
  }

  return {
    push(chunk) {
      buf += chunk;
      return currentResult();
    },
    set(fullText) {
      if (fullText.length < buf.length || !fullText.startsWith(buf)) {
        reset();
      }
      const delta = fullText.slice(buf.length);
      if (delta) buf += delta;
      return currentResult();
    },
    getResult: currentResult,
  };
}

export interface Parser {
  parse(input: string): ParseResult;
}

function getSchemaDefaultValue(property: unknown): unknown {
  if (!property || typeof property !== "object" || Array.isArray(property)) {
    return undefined;
  }
  return (property as { default?: unknown }).default;
}

function getSchemaType(property: unknown): string | undefined {
  if (!property || typeof property !== "object" || Array.isArray(property)) return undefined;
  const type = (property as { type?: unknown }).type;
  if (typeof type !== "string") return undefined;
  // Normalize "integer" to "number" to match AST type inference
  if (type === "integer") return "number";
  return type;
}

function compileSchema(schema: LibraryJSONSchema): ParamMap {
  const map: ParamMap = new Map();
  const defs = schema.$defs ?? {};

  for (const [name, def] of Object.entries(defs)) {
    const properties = def.properties ?? {};
    const required = def.required ?? [];
    const params = Object.keys(properties).map((key) => ({
      name: key,
      required: required.includes(key),
      defaultValue: getSchemaDefaultValue(properties[key]),
      type: getSchemaType(properties[key]),
    }));
    map.set(name, { params });
  }

  return map;
}

/**
 * Create a parser from a library JSON Schema document.
 * Pass `library.toJSONSchema()` to get the schema.
 *
 * @example
 * ```ts
 * const parser = createParser(library.toJSONSchema());
 * const result = parser.parse(openuiLangString);
 * ```
 */
export function createParser(schema: LibraryJSONSchema, rootName?: string): Parser {
  const paramMap = compileSchema(schema);
  return {
    parse(input: string): ParseResult {
      return parse(input, paramMap, rootName);
    },
  };
}

/**
 * Create a streaming parser from a library JSON Schema document.
 * Pass `library.toJSONSchema()` to get the schema.
 */
export function createStreamingParser(schema: LibraryJSONSchema, rootName?: string): StreamParser {
  return createStreamParser(compileSchema(schema), rootName);
}
