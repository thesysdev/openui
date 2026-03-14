import type { ParseResult } from "./types";

/**
 * The JSON Schema document produced by `library.toJSONSchema()`.
 * All component schemas live in `$defs`, keyed by component name.
 */
export interface LibraryJSONSchema {
  $defs?: Record<
    string,
    {
      properties?: Record<string, unknown>;
      required?: string[];
    }
  >;
}

export interface ParamDef {
  /** Parameter name, e.g. "title", "columns". */
  name: string;
  /** Whether the parameter is required by the component. */
  required: boolean;
  /** Default value from JSON Schema — used when the required field is missing/null. */
  defaultValue?: unknown;
}

/**
 * Internal component lookup map.
 *
 * Keys include canonical component names and optional compact aliases.
 * Values always point to the canonical component metadata.
 */
export type ParamMap = Map<string, { params: ParamDef[]; canonicalName: string }>;

// ─────────────────────────────────────────────────────────────────────────────
// AST node types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Discriminated union representing every value that can appear in an
 * openui-lang expression. The `k` field is the discriminant.
 *
 * - `Comp`  — a component call: `Header("Hello", "Subtitle")`
 * - `Str`   — a string literal: `"hello"`
 * - `Num`   — a number literal: `42` or `3.14`
 * - `Bool`  — a boolean literal: `true` or `false`
 * - `Null`  — the null literal
 * - `Arr`   — an array: `[a, b, c]`
 * - `Obj`   — an object: `{ key: value }`
 * - `Ref`   — a reference to another statement: `myTable` (resolved later)
 * - `Ph`    — a placeholder for an unresolvable reference (dropped as null in output)
 */
type ASTNode =
  | { k: "Comp"; name: string; args: ASTNode[] }
  | { k: "Str"; v: string }
  | { k: "Num"; v: number }
  | { k: "Bool"; v: boolean }
  | { k: "Null" }
  | { k: "Arr"; els: ASTNode[] }
  | { k: "Obj"; entries: [string, ASTNode][] }
  | { k: "Ref"; n: string }
  | { k: "Ph"; n: string };

const enum T {
  Newline = 0,
  LParen = 1, // (
  RParen = 2, // )
  LBrack = 3, // [
  RBrack = 4, // ]
  LBrace = 5, // {
  RBrace = 6, // }
  Comma = 7, // ,
  Colon = 8, // :
  Equals = 9, // =
  True = 10,
  False = 11,
  Null = 12,
  EOF = 13,
  Str = 14, // carries string value
  Num = 15, // carries numeric value
  Ident = 16, // lowercase identifier — becomes a reference
  Type = 17, // PascalCase identifier — becomes a component name or reference
}

type Token = { t: T; v?: string | number };

function autoClose(input: string): { text: string; wasIncomplete: boolean } {
  const stack: string[] = [];
  let inStr = false,
    esc = false;

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

    if (c === "(" || c === "[" || c === "{") stack.push(c);
    else if (c === ")" && stack[stack.length - 1] === "(") stack.pop();
    else if (c === "]" && stack[stack.length - 1] === "[") stack.pop();
    else if (c === "}" && stack[stack.length - 1] === "{") stack.pop();
  }

  const wasIncomplete = inStr || stack.length > 0;
  if (!wasIncomplete) return { text: input, wasIncomplete: false };

  let out = input;
  if (inStr) {
    if (esc) out += "\\";
    out += '"';
  } // close open string
  for (
    let j = stack.length - 1;
    j >= 0;
    j-- // close brackets in reverse
  )
    out += stack[j] === "(" ? ")" : stack[j] === "[" ? "]" : "}";

  return { text: out, wasIncomplete: true };
}

// lexer
function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = src.length;

  while (i < n) {
    // Skip horizontal whitespace (not newlines — they're significant)
    while (i < n && (src[i] === " " || src[i] === "\t" || src[i] === "\r")) i++;
    if (i >= n) break;

    const c = src[i];

    // ── Single-character punctuation ──────────────────────────────────────
    if (c === "\n") {
      tokens.push({ t: T.Newline });
      i++;
      continue;
    }
    if (c === "(") {
      tokens.push({ t: T.LParen });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ t: T.RParen });
      i++;
      continue;
    }
    if (c === "[") {
      tokens.push({ t: T.LBrack });
      i++;
      continue;
    }
    if (c === "]") {
      tokens.push({ t: T.RBrack });
      i++;
      continue;
    }
    if (c === "{") {
      tokens.push({ t: T.LBrace });
      i++;
      continue;
    }
    if (c === "}") {
      tokens.push({ t: T.RBrace });
      i++;
      continue;
    }
    if (c === ",") {
      tokens.push({ t: T.Comma });
      i++;
      continue;
    }
    if (c === ":") {
      tokens.push({ t: T.Colon });
      i++;
      continue;
    }
    if (c === "=") {
      tokens.push({ t: T.Equals });
      i++;
      continue;
    }

    // string literal: "..."
    if (c === '"') {
      const start = i;
      i++; // skip opening quote

      let isClosed = false;
      // Fast-forward to the closing quote, respecting escapes
      while (i < n) {
        if (src[i] === "\\") {
          i += 2; // skip backslash and the escaped character
        } else if (src[i] === '"') {
          i++; // include the closing quote
          isClosed = true;
          break;
        } else {
          i++;
        }
      }

      const rawString = src.slice(start, i);

      try {
        // Let JavaScript's native JSON parser handle all unescaping (\n, \t, \uXXXX, etc.)
        // If the string is incomplete (streaming), we add a closing quote to parse what we have so far.
        const validJsonString = isClosed ? rawString : rawString + '"';

        tokens.push({ t: T.Str, v: JSON.parse(validJsonString) });
      } catch {
        // Fallback if JSON.parse fails (e.g., malformed unicode escape during streaming)
        // Strip the quotes and return the raw text so the UI doesn't crash
        const stripped = rawString.replace(/^"|"$/g, "");
        tokens.push({ t: T.Str, v: stripped });
      }
      continue;
    }

    // number literal: 42, -3, 1.5
    const isDigit = c >= "0" && c <= "9";
    const isNegDigit = c === "-" && i + 1 < n && src[i + 1] >= "0" && src[i + 1] <= "9";
    if (isDigit || isNegDigit) {
      const start = i;
      if (src[i] === "-") i++; // optional minus
      while (i < n && src[i] >= "0" && src[i] <= "9") i++; // integer part
      if (i < n && src[i] === ".") {
        // optional decimal
        i++;
        while (i < n && src[i] >= "0" && src[i] <= "9") i++;
      }
      if (i < n && (src[i] === "e" || src[i] === "E")) {
        // optional exponent
        i++;
        if (i < n && (src[i] === "+" || src[i] === "-")) i++;
        while (i < n && src[i] >= "0" && src[i] <= "9") i++;
      }
      tokens.push({ t: T.Num, v: +src.slice(start, i) });
      continue;
    }

    // keyword or identifier
    const isAlpha = (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
    if (isAlpha) {
      const start = i;
      while (
        i < n &&
        ((src[i] >= "a" && src[i] <= "z") ||
          (src[i] >= "A" && src[i] <= "Z") ||
          (src[i] >= "0" && src[i] <= "9") ||
          src[i] === "_")
      )
        i++;

      const word = src.slice(start, i);

      if (word === "true") {
        tokens.push({ t: T.True });
        continue;
      }
      if (word === "false") {
        tokens.push({ t: T.False });
        continue;
      }
      if (word === "null") {
        tokens.push({ t: T.Null });
        continue;
      }

      // PascalCase → component type name; lowercase → variable reference
      const kind = c >= "A" && c <= "Z" ? T.Type : T.Ident;
      tokens.push({ t: kind, v: word });
      continue;
    }

    i++; // skip any other character (e.g. @, #, emojis)
  }

  tokens.push({ t: T.EOF });
  return tokens;
}

interface RawStmt {
  id: string;
  tokens: Token[];
}

/**
 * Splits the flat token stream into individual statements.
 *
 * Each statement has the form `identifier = expression`. Statements are
 * separated by newlines at depth 0 (newlines inside brackets are ignored).
 *
 * Example input tokens for:
 *   `root = Root([tbl])\ntbl = Table(...)`
 *
 * Produces two RawStmts:
 *   { id: "root", tokens: [Root, (, [, tbl, ], )] }
 *   { id: "tbl",  tokens: [Table, (, ..., )] }
 *
 * Invalid lines (no `=`, or no identifier) are silently skipped.
 */
function split(tokens: Token[]): RawStmt[] {
  const stmts: RawStmt[] = [];
  let pos = 0;

  while (pos < tokens.length) {
    // Skip blank lines
    while (pos < tokens.length && tokens[pos].t === T.Newline) pos++;
    if (pos >= tokens.length || tokens[pos].t === T.EOF) break;

    // Expect: Ident|Type = expression
    const tok = tokens[pos];
    if (tok.t !== T.Ident && tok.t !== T.Type) {
      while (pos < tokens.length && tokens[pos].t !== T.Newline && tokens[pos].t !== T.EOF) pos++;
      continue;
    }
    const id = tok.v as string;
    pos++;

    // Must be followed by `=`
    if (pos >= tokens.length || tokens[pos].t !== T.Equals) {
      while (pos < tokens.length && tokens[pos].t !== T.Newline && tokens[pos].t !== T.EOF) pos++;
      continue;
    }
    pos++;

    // Collect expression tokens until a depth-0 newline or EOF
    const expr: Token[] = [];
    let depth = 0;
    while (pos < tokens.length && tokens[pos].t !== T.EOF) {
      const tt = tokens[pos].t;
      if (tt === T.Newline && depth <= 0) break; // statement boundary
      if (tt === T.Newline) {
        pos++;
        continue;
      } // newline inside bracket — skip
      if (tt === T.LParen || tt === T.LBrack || tt === T.LBrace) depth++;
      else if (tt === T.RParen || tt === T.RBrack || tt === T.RBrace) depth--;
      expr.push(tokens[pos++]);
    }

    if (expr.length) stmts.push({ id, tokens: expr });
  }

  return stmts;
}

function parseTokens(tokens: Token[]): ASTNode {
  let pos = 0;
  const cur = (): Token => tokens[pos] ?? { t: T.EOF };
  const adv = () => pos++;
  const eat = (kind: T) => {
    if (cur().t === kind) adv();
  };

  function parseExpr(): ASTNode {
    const tok = cur();

    if (tok.t === T.Type) {
      // PascalCase followed by `(` → component call; otherwise a reference
      return tokens[pos + 1]?.t === T.LParen
        ? parseComp()
        : (adv(), { k: "Ref", n: tok.v as string });
    }
    if (tok.t === T.Str) {
      adv();
      return { k: "Str", v: tok.v as string };
    }
    if (tok.t === T.Num) {
      adv();
      return { k: "Num", v: tok.v as number };
    }
    if (tok.t === T.True) {
      adv();
      return { k: "Bool", v: true };
    }
    if (tok.t === T.False) {
      adv();
      return { k: "Bool", v: false };
    }
    if (tok.t === T.Null) {
      adv();
      return { k: "Null" };
    }
    if (tok.t === T.LBrack) return parseArr();
    if (tok.t === T.LBrace) return parseObj();
    if (tok.t === T.Ident) {
      adv();
      return { k: "Ref", n: tok.v as string };
    }

    adv();
    return { k: "Null" }; // unknown token — treat as null
  }

  /** Parse `TypeName(arg1, arg2, ...)` */
  function parseComp(): ASTNode {
    const name = cur().v as string;
    adv();
    eat(T.LParen);
    const args: ASTNode[] = [];
    while (cur().t !== T.RParen && cur().t !== T.EOF) {
      args.push(parseExpr());
      if (cur().t === T.Comma) adv();
    }
    eat(T.RParen);
    return { k: "Comp", name, args };
  }

  /** Parse `[elem1, elem2, ...]` */
  function parseArr(): ASTNode {
    adv(); // skip [
    const els: ASTNode[] = [];
    while (cur().t !== T.RBrack && cur().t !== T.EOF) {
      els.push(parseExpr());
      if (cur().t === T.Comma) adv();
    }
    eat(T.RBrack);
    return { k: "Arr", els };
  }

  /** Parse `{ key: value, ... }` */
  function parseObj(): ASTNode {
    adv(); // skip {
    const entries: [string, ASTNode][] = [];
    while (cur().t !== T.RBrace && cur().t !== T.EOF) {
      const kt = cur();
      const key =
        kt.t === T.Ident || kt.t === T.Str || kt.t === T.Type || kt.t === T.Num
          ? (adv(), String(kt.v))
          : (adv(), "?");
      eat(T.Colon);
      entries.push([key, parseExpr()]);
      if (cur().t === T.Comma) adv();
    }
    eat(T.RBrace);
    return { k: "Obj", entries };
  }

  return parseExpr();
}

function resolveNode(
  node: ASTNode,
  syms: Map<string, ASTNode>,
  unres: string[],
  visited: Set<string>,
): ASTNode {
  if (node.k === "Ref") {
    const { n } = node;
    if (visited.has(n)) {
      unres.push(n);
      return { k: "Ph", n };
    } // cycle
    if (!syms.has(n)) {
      unres.push(n);
      return { k: "Ph", n };
    } // missing

    visited.add(n);
    const resolved = resolveNode(syms.get(n)!, syms, unres, visited);
    visited.delete(n);
    return resolved;
  }

  if (node.k === "Comp")
    return {
      ...node,
      args: node.args.map((a) => resolveNode(a, syms, unres, visited)),
    };
  if (node.k === "Arr")
    return {
      ...node,
      els: node.els.map((e) => resolveNode(e, syms, unres, visited)),
    };
  if (node.k === "Obj")
    return {
      ...node,
      entries: node.entries.map(([k, v]) => [k, resolveNode(v, syms, unres, visited)]),
    };

  // Literals and placeholders pass through unchanged
  return node;
}

type JsonVal = string | number | boolean | null | JsonVal[] | { [k: string]: JsonVal };

function toJson(
  node: ASTNode,
  partial: boolean,
  errors: ParseResult["meta"]["validationErrors"],
  cat: ParamMap | undefined,
): JsonVal {
  if (node.k === "Str") return node.v;
  if (node.k === "Num") return node.v;
  if (node.k === "Bool") return node.v;
  if (node.k === "Null") return null;
  if (node.k === "Arr") {
    const items: JsonVal[] = [];
    for (const e of node.els) {
      // Drop unresolved references from arrays to avoid null entries like [null, element]
      if (e.k === "Ph") continue;
      const value = toJson(e, partial, errors, cat);
      // Drop invalid component entries from arrays (e.g. incomplete required props while streaming)
      if (e.k === "Comp" && value === null) continue;
      items.push(value);
    }
    return items;
  }
  if (node.k === "Obj") {
    const o: { [k: string]: JsonVal } = {};
    for (const [k, v] of node.entries) o[k] = toJson(v, partial, errors, cat);
    return o;
  }
  if (node.k === "Comp") return mapNode(node, partial, errors, cat) as unknown as JsonVal;
  if (node.k === "Ph") return null;
  return null;
}

function mapNode(
  node: ASTNode,
  partial: boolean,
  errors: ParseResult["meta"]["validationErrors"],
  cat: ParamMap | undefined,
): ParseResult["root"] {
  if (node.k === "Ph") return null;
  if (node.k !== "Comp") return null;

  const { name, args } = node;
  const def = cat?.get(name);
  const canonicalName = def?.canonicalName ?? name;
  const props: { [k: string]: JsonVal } = {};

  if (def) {
    // Map positional args → named props using library param order
    for (let i = 0; i < def.params.length && i < args.length; i++)
      props[def.params[i].name] = toJson(args[i], partial, errors, cat);

    // Validate required props — try defaultValue first before dropping
    const missingRequired = def.params.filter(
      (p) => p.required && (!(p.name in props) || props[p.name] === null),
    );
    if (missingRequired.length) {
      const stillInvalid = missingRequired.filter((p) => {
        if (p.defaultValue !== undefined) {
          props[p.name] = p.defaultValue as JsonVal;
          return false;
        }
        return true;
      });
      if (stillInvalid.length) {
        for (const p of stillInvalid)
          errors.push({
            component: canonicalName,
            path: `/${p.name}`,
            message:
              p.name in props
                ? `required field "${p.name}" cannot be null`
                : `missing required field "${p.name}"`,
          });
        return null;
      }
    }
  } else {
    // No library entry for this component — preserve all args under _args
    props._args = args.map((a) => toJson(a, partial, errors, cat));
  }

  return { type: "element", typeName: canonicalName, props, partial };
}

function emptyResult(incomplete = true): ParseResult {
  return {
    root: null,
    meta: {
      incomplete,
      unresolved: [],
      statementCount: 0,
      validationErrors: [],
    },
  };
}

function buildResult(
  syms: Map<string, ASTNode>,
  firstId: string,
  wasIncomplete: boolean,
  stmtCount: number,
  cat: ParamMap | undefined,
): ParseResult {
  if (!syms.has(firstId)) return emptyResult(wasIncomplete);

  const unres: string[] = [];
  const resolved = resolveNode(syms.get(firstId)!, syms, unres, new Set());
  const errors: ParseResult["meta"]["validationErrors"] = [];
  const root = mapNode(resolved, wasIncomplete, errors, cat);

  return {
    root,
    meta: {
      incomplete: wasIncomplete,
      unresolved: unres,
      statementCount: stmtCount,
      validationErrors: errors,
    },
  };
}

/**
 * Parse a complete openui-lang string in one pass.
 *
 * @param input  - Full openui-lang source text (may be partial/streaming)
 * @param cat    - Optional param map for positional-arg → named-prop mapping
 * @returns      ParseResult with root ElementNode (or null) and metadata
 */
export function parse(input: string, cat?: ParamMap): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) return emptyResult();

  const { text, wasIncomplete } = autoClose(trimmed);
  const stmts = split(tokenize(text));
  if (!stmts.length) return emptyResult(wasIncomplete);

  const syms = new Map<string, ASTNode>();
  let firstId = "";
  for (const s of stmts) {
    syms.set(s.id, parseTokens(s.tokens));
    if (!firstId) firstId = s.id;
  }

  return buildResult(syms, firstId, wasIncomplete, stmts.length, cat);
}

export interface StreamParser {
  /** Feed the next SSE/stream chunk and get the latest ParseResult. */
  push(chunk: string): ParseResult;
  /** Get the latest ParseResult without consuming new data. */
  getResult(): ParseResult;
}

export function createStreamParser(cat?: ParamMap): StreamParser {
  let buf = "";
  let completedEnd = 0;
  const completedSyms = new Map<string, ASTNode>();

  let completedCount = 0;
  let firstId = "";

  function addStmt(text: string) {
    for (const s of split(tokenize(text))) {
      completedSyms.set(s.id, parseTokens(s.tokens));
      completedCount++;
      if (!firstId) firstId = s.id;
    }
  }

  function scanNewCompleted(): number {
    let depth = 0,
      inStr = false,
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
      if (c === '"') {
        inStr = !inStr;
        continue;
      }
      if (inStr) continue;

      if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") depth--;
      else if (c === "\n" && depth <= 0) {
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
      return buildResult(completedSyms, firstId, false, completedCount, cat);
    }

    // Autoclose the incomplete last statement so it's syntactically valid
    const { text: closed, wasIncomplete } = autoClose(pendingText);
    const stmts = split(tokenize(closed));

    if (!stmts.length) {
      if (completedCount === 0) return emptyResult(wasIncomplete);
      return buildResult(completedSyms, firstId, wasIncomplete, completedCount, cat);
    }

    // Merge: completed cache + re-parsed pending statement
    // (Map spread is cheap since completedSyms only grows by one entry at a time)
    const allSyms = new Map(completedSyms);
    for (const s of stmts) allSyms.set(s.id, parseTokens(s.tokens));

    const fid = firstId || stmts[0].id;
    return buildResult(allSyms, fid, wasIncomplete, completedCount + stmts.length, cat);
  }

  return {
    push(chunk) {
      buf += chunk;
      return currentResult();
    },
    getResult: currentResult,
  };
}

export interface Parser {
  parse(input: string): ParseResult;
}

function deriveCompactAliases(componentNames: string[]): Map<string, string> {
  const aliases = new Map<string, string>();
  const occupied = new Set(componentNames);

  const sorted = [...componentNames].sort((a, b) => a.length - b.length || a.localeCompare(b));

  for (const name of sorted) {
    for (let len = 1; len < name.length; len++) {
      const alias = name.slice(0, len);
      const startsWithUpper = alias[0] >= "A" && alias[0] <= "Z";
      if (!startsWithUpper || occupied.has(alias)) continue;

      occupied.add(alias);
      aliases.set(name, alias);
      break;
    }
  }

  return aliases;
}

function compileSchema(schema: LibraryJSONSchema): ParamMap {
  const map: ParamMap = new Map();
  const defs = schema.$defs ?? {};
  const aliases = deriveCompactAliases(Object.keys(defs));

  for (const [name, def] of Object.entries(defs)) {
    const properties = def.properties ?? {};
    const required = def.required ?? [];
    const params = Object.keys(properties).map((k) => ({
      name: k,
      required: required.includes(k),
      defaultValue: (properties[k] as any)?.default,
    }));

    const entry = { params, canonicalName: name };
    map.set(name, entry);

    const alias = aliases.get(name);
    if (alias) {
      map.set(alias, entry);
    }
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
export function createParser(schema: LibraryJSONSchema): Parser {
  const paramMap = compileSchema(schema);
  return {
    parse(input: string): ParseResult {
      return parse(input, paramMap);
    },
  };
}

/**
 * Create a streaming parser from a library JSON Schema document.
 * Pass `library.toJSONSchema()` to get the schema.
 */
export function createStreamingParser(schema: LibraryJSONSchema): StreamParser {
  return createStreamParser(compileSchema(schema));
}
