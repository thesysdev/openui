import type { z } from "zod";
import type { ParseResult, StreamingParser, ValidationError } from "../types";
import { getZodType, isOptionalType, unwrapOptional } from "../utils/zod";

export interface ParamDef {
  name: string;
  required: boolean;
  defaultValue?: unknown;
}

export type ParamMap = Map<string, { params: ParamDef[] }>;

/**
 * Zod schemas keyed by type name — used for Zod-level validation
 * of each mapped node instead of the manual required-prop check
 * used in react-lang.
 */
export type ZodSchemaMap = Record<string, z.ZodObject<any>>;

// ── AST node types ──────────────────────────────────────────────────────────

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
  LParen = 1,
  RParen = 2,
  LBrack = 3,
  RBrack = 4,
  LBrace = 5,
  RBrace = 6,
  Comma = 7,
  Colon = 8,
  Equals = 9,
  True = 10,
  False = 11,
  Null = 12,
  EOF = 13,
  Str = 14,
  Num = 15,
  Ident = 16,
  Type = 17,
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
  }
  for (let j = stack.length - 1; j >= 0; j--)
    out += stack[j] === "(" ? ")" : stack[j] === "[" ? "]" : "}";

  return { text: out, wasIncomplete: true };
}

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = src.length;

  while (i < n) {
    while (i < n && (src[i] === " " || src[i] === "\t" || src[i] === "\r")) i++;
    if (i >= n) break;

    const c = src[i];

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

    if (c === '"') {
      const start = i;
      i++;

      let isClosed = false;
      while (i < n) {
        if (src[i] === "\\") {
          i += 2;
        } else if (src[i] === '"') {
          i++;
          isClosed = true;
          break;
        } else {
          i++;
        }
      }

      const rawString = src.slice(start, i);

      try {
        const validJsonString = isClosed ? rawString : rawString + '"';
        tokens.push({ t: T.Str, v: JSON.parse(validJsonString) });
      } catch {
        const stripped = rawString.replace(/^"|"$/g, "");
        tokens.push({ t: T.Str, v: stripped });
      }
      continue;
    }

    const isDigit = c >= "0" && c <= "9";
    const isNegDigit = c === "-" && i + 1 < n && src[i + 1] >= "0" && src[i + 1] <= "9";
    if (isDigit || isNegDigit) {
      const start = i;
      if (src[i] === "-") i++;
      while (i < n && src[i] >= "0" && src[i] <= "9") i++;
      if (i < n && src[i] === ".") {
        i++;
        while (i < n && src[i] >= "0" && src[i] <= "9") i++;
      }
      if (i < n && (src[i] === "e" || src[i] === "E")) {
        i++;
        if (i < n && (src[i] === "+" || src[i] === "-")) i++;
        while (i < n && src[i] >= "0" && src[i] <= "9") i++;
      }
      tokens.push({ t: T.Num, v: +src.slice(start, i) });
      continue;
    }

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
      if (word === "null" || word === "undefined") {
        tokens.push({ t: T.Null });
        continue;
      }

      const kind = c >= "A" && c <= "Z" ? T.Type : T.Ident;
      tokens.push({ t: kind, v: word });
      continue;
    }

    i++;
  }

  tokens.push({ t: T.EOF });
  return tokens;
}

interface RawStmt {
  id: string;
  tokens: Token[];
}

function split(tokens: Token[]): RawStmt[] {
  const stmts: RawStmt[] = [];
  let pos = 0;

  while (pos < tokens.length) {
    while (pos < tokens.length && tokens[pos].t === T.Newline) pos++;
    if (pos >= tokens.length || tokens[pos].t === T.EOF) break;

    const tok = tokens[pos];
    if (tok.t !== T.Ident && tok.t !== T.Type) {
      while (pos < tokens.length && tokens[pos].t !== T.Newline && tokens[pos].t !== T.EOF) pos++;
      continue;
    }
    const id = tok.v as string;
    pos++;

    if (pos >= tokens.length || tokens[pos].t !== T.Equals) {
      while (pos < tokens.length && tokens[pos].t !== T.Newline && tokens[pos].t !== T.EOF) pos++;
      continue;
    }
    pos++;

    const expr: Token[] = [];
    let depth = 0;
    while (pos < tokens.length && tokens[pos].t !== T.EOF) {
      const tt = tokens[pos].t;
      if (tt === T.Newline && depth <= 0) break;
      if (tt === T.Newline) {
        pos++;
        continue;
      }
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
    return { k: "Null" };
  }

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

  function parseArr(): ASTNode {
    adv();
    const els: ASTNode[] = [];
    while (cur().t !== T.RBrack && cur().t !== T.EOF) {
      els.push(parseExpr());
      if (cur().t === T.Comma) adv();
    }
    eat(T.RBrack);
    return { k: "Arr", els };
  }

  function parseObj(): ASTNode {
    adv();
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
    }
    if (!syms.has(n)) {
      unres.push(n);
      return { k: "Ph", n };
    }

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

  return node;
}

type JsonVal = string | number | boolean | null | JsonVal[] | { [k: string]: JsonVal };

function toJson(
  node: ASTNode,
  partial: boolean,
  errors: ValidationError[],
  cat: ParamMap | undefined,
  zodSchemas: ZodSchemaMap | undefined,
): JsonVal {
  if (node.k === "Str") return node.v;
  if (node.k === "Num") return node.v;
  if (node.k === "Bool") return node.v;
  if (node.k === "Null") return null;
  if (node.k === "Arr") {
    const items: JsonVal[] = [];
    for (const e of node.els) {
      if (e.k === "Ph") continue;
      const value = toJson(e, partial, errors, cat, zodSchemas);
      if (e.k === "Comp" && value === null) continue;
      items.push(value);
    }
    return items;
  }
  if (node.k === "Obj") {
    const o: { [k: string]: JsonVal } = {};
    for (const [k, v] of node.entries) o[k] = toJson(v, partial, errors, cat, zodSchemas);
    return o;
  }
  if (node.k === "Comp")
    return mapNode(node, partial, errors, cat, zodSchemas) as unknown as JsonVal;
  if (node.k === "Ph") return null;
  return null;
}

/**
 * Map a Comp AST node to a plain JS object.
 *
 * Key difference from react-lang: returns the Zod-validated props object
 * directly instead of wrapping in `{ type: "element", typeName, props, partial }`.
 * Validation uses `zodSchema.safeParse()` for full Zod validation.
 */
function mapNode(
  node: ASTNode,
  partial: boolean,
  errors: ValidationError[],
  cat: ParamMap | undefined,
  zodSchemas: ZodSchemaMap | undefined,
): JsonVal {
  if (node.k === "Ph") return null;
  if (node.k !== "Comp") return null;

  const { name, args } = node;
  const def = cat?.get(name);
  const props: { [k: string]: JsonVal } = {};

  if (def) {
    for (let i = 0; i < def.params.length && i < args.length; i++)
      props[def.params[i].name] = toJson(args[i], partial, errors, cat, zodSchemas);
  } else {
    props._args = args.map((a) => toJson(a, partial, errors, cat, zodSchemas));
  }

  const zodSchema = zodSchemas?.[name];
  if (zodSchema) {
    const shape = zodSchema.shape as Record<string, unknown> | undefined;
    if (shape) {
      for (const key of Object.keys(props)) {
        if (props[key] === null && isOptionalType(shape[key])) {
          const inner = unwrapOptional(shape[key]);
          if (getZodType(inner) !== "nullable") {
            delete props[key];
          }
        }
      }
    }

    const result = zodSchema.safeParse(props);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          type: name,
          path: "/" + issue.path.join("/"),
          message: issue.message,
        });
      }
      return null;
    }
    return result.data as JsonVal;
  }

  return props;
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
  zodSchemas: ZodSchemaMap | undefined,
): ParseResult {
  if (!syms.has(firstId)) return emptyResult(wasIncomplete);

  const unres: string[] = [];
  const resolved = resolveNode(syms.get(firstId)!, syms, unres, new Set());
  const errors: ValidationError[] = [];
  const root = mapNode(resolved, wasIncomplete, errors, cat, zodSchemas);

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

export function parse(input: string, cat?: ParamMap, zodSchemas?: ZodSchemaMap): ParseResult {
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

  return buildResult(syms, firstId, wasIncomplete, stmts.length, cat, zodSchemas);
}

export function createStreamParser(cat?: ParamMap, zodSchemas?: ZodSchemaMap): StreamingParser {
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
        const t = buf.slice(stmtStart, i).trim();
        if (t) addStmt(t);
        stmtStart = i + 1;
        completedEnd = i + 1;
      }
    }

    return stmtStart;
  }

  function currentResult(): ParseResult {
    const pendingStart = scanNewCompleted();
    const pendingText = buf.slice(pendingStart).trim();

    if (!pendingText) {
      if (completedCount === 0) return emptyResult();
      return buildResult(completedSyms, firstId, false, completedCount, cat, zodSchemas);
    }

    const { text: closed, wasIncomplete } = autoClose(pendingText);
    const stmts = split(tokenize(closed));

    if (!stmts.length) {
      if (completedCount === 0) return emptyResult(wasIncomplete);
      return buildResult(completedSyms, firstId, wasIncomplete, completedCount, cat, zodSchemas);
    }

    const allSyms = new Map(completedSyms);
    for (const s of stmts) allSyms.set(s.id, parseTokens(s.tokens));

    const fid = firstId || stmts[0].id;
    return buildResult(allSyms, fid, wasIncomplete, completedCount + stmts.length, cat, zodSchemas);
  }

  function nullRootIfUnresolved(result: ParseResult): ParseResult {
    if (result.meta.unresolved.length > 0) {
      return { ...result, root: null };
    }
    return result;
  }

  return {
    push(chunk) {
      buf += chunk;
      return nullRootIfUnresolved(currentResult());
    },
    getResult() {
      return nullRootIfUnresolved(currentResult());
    },
  };
}

export function compileSchema(schema: {
  $defs?: Record<
    string,
    {
      properties?: Record<string, unknown>;
      required?: string[];
    }
  >;
}): ParamMap {
  const map: ParamMap = new Map();
  const defs = schema.$defs ?? {};

  for (const [name, def] of Object.entries(defs)) {
    const properties = def.properties ?? {};
    const required = def.required ?? [];
    const params = Object.keys(properties).map((k) => ({
      name: k,
      required: required.includes(k),
      defaultValue: (properties[k] as any)?.default,
    }));
    map.set(name, { params });
  }

  return map;
}
