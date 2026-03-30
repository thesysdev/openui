// ─────────────────────────────────────────────────────────────────────────────
// Statement splitter for openui-lang
// ─────────────────────────────────────────────────────────────────────────────

import { T, type Token } from "./tokens";

export interface RawStmt {
  id: string;
  /** Token type of the LHS identifier — used to classify statement kind */
  idTokenType: T;
  tokens: Token[];
}

/**
 * Auto-close unclosed strings and brackets so that partial/streaming input
 * can be parsed without syntax errors.
 */
export function autoClose(input: string): { text: string; wasIncomplete: boolean } {
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
  for (let j = stack.length - 1; j >= 0; j--)
    out += stack[j] === "(" ? ")" : stack[j] === "[" ? "]" : "}";

  return { text: out, wasIncomplete: true };
}

/**
 * Splits the flat token stream into individual statements.
 *
 * Each statement has the form `identifier = expression`. Statements are
 * separated by newlines at depth 0 (newlines inside brackets are ignored).
 *
 * Accepts `Ident`, `Type`, and `StateVar` as statement identifiers.
 * For StateVar, the id is the full token value including $ (e.g., "$count").
 *
 * Invalid lines (no `=`, or no identifier) are silently skipped.
 */
export function split(tokens: Token[]): RawStmt[] {
  const stmts: RawStmt[] = [];
  let pos = 0;

  while (pos < tokens.length) {
    // Skip blank lines
    while (pos < tokens.length && tokens[pos].t === T.Newline) pos++;
    if (pos >= tokens.length || tokens[pos].t === T.EOF) break;

    // Expect: Ident|Type|StateVar = expression
    const tok = tokens[pos];
    if (tok.t !== T.Ident && tok.t !== T.Type && tok.t !== T.StateVar) {
      while (pos < tokens.length && tokens[pos].t !== T.Newline && tokens[pos].t !== T.EOF) pos++;
      continue;
    }
    const id = tok.v as string;
    const idTokenType = tok.t;
    pos++;

    // Must be followed by `=`
    if (pos >= tokens.length || tokens[pos].t !== T.Equals) {
      while (pos < tokens.length && tokens[pos].t !== T.Newline && tokens[pos].t !== T.EOF) pos++;
      continue;
    }
    pos++;

    // Collect expression tokens until a depth-0 newline or EOF.
    // Track both bracket depth and ternary depth so that multiline
    // ternary expressions (condition on one line, ? ... : on the next)
    // are not incorrectly split into separate statements.
    const expr: Token[] = [];
    let depth = 0;
    let ternaryDepth = 0;
    while (pos < tokens.length && tokens[pos].t !== T.EOF) {
      const tt = tokens[pos].t;
      if (tt === T.Newline && depth <= 0 && ternaryDepth <= 0) {
        // Before breaking, look ahead past whitespace/newlines to see if
        // the next meaningful token is `?` or `:` — if so, the ternary
        // continues on the next line and we should NOT split here.
        let peek = pos + 1;
        while (peek < tokens.length && tokens[peek].t === T.Newline) peek++;
        const nextT = peek < tokens.length ? tokens[peek].t : T.EOF;
        if (nextT === T.Question || (nextT === T.Colon && ternaryDepth > 0)) {
          // Ternary continuation — skip the newline and keep collecting
          pos++;
          continue;
        }
        break; // statement boundary
      }
      if (tt === T.Newline) {
        pos++;
        continue;
      } // newline inside bracket/ternary — skip
      if (tt === T.LParen || tt === T.LBrack || tt === T.LBrace) depth++;
      else if ((tt === T.RParen || tt === T.RBrack || tt === T.RBrace) && depth > 0) depth--;
      // Track ternary ? and : at bracket depth 0 (colons inside {} are object key separators)
      else if (tt === T.Question && depth === 0) ternaryDepth++;
      else if (tt === T.Colon && depth === 0 && ternaryDepth > 0) ternaryDepth--;
      expr.push(tokens[pos++]);
    }

    if (expr.length) stmts.push({ id, idTokenType, tokens: expr });
  }

  return stmts;
}
