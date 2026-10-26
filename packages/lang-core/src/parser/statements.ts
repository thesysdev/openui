// ─────────────────────────────────────────────────────────────────────────────
// Statement splitter for openui-lang
// ─────────────────────────────────────────────────────────────────────────────

import { tokenize } from "./lexer";
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
  let inStr: false | '"' | "'" = false;
  let esc = false;

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
    if (inStr) {
      if (c === inStr) inStr = false;
      continue;
    }
    if (c === '"' || c === "'") {
      inStr = c;
      continue;
    }
    if (c === "(" || c === "[" || c === "{") stack.push(c);
    else if (c === ")" && stack[stack.length - 1] === "(") stack.pop();
    else if (c === "]" && stack[stack.length - 1] === "[") stack.pop();
    else if (c === "}" && stack[stack.length - 1] === "{") stack.pop();
  }

  const wasIncomplete = !!inStr || stack.length > 0;
  if (!wasIncomplete) return { text: input, wasIncomplete: false };

  let out = input;
  if (inStr) {
    if (esc) out += "\\";
    out += inStr; // close with matching quote
  }
  for (let j = stack.length - 1; j >= 0; j--)
    out += stack[j] === "(" ? ")" : stack[j] === "[" ? "]" : "}";

  return { text: out, wasIncomplete: true };
}

/** `name =` or `$name =` at the start of a statement (but not `name ==`). */
const STATEMENT_HEAD = /\$?[A-Za-z_][A-Za-z0-9_]*[ \t]*=(?!=)/y;

const isBlank = (c: string) => c === " " || c === "\t" || c === "\r" || c === "\n";

/**
 * Find where the statement starting at `start` ends (spec section 1.4).
 *
 * A statement continues past a newline inside an unclosed bracket, inside an
 * unterminated string, while a ternary is open (from its `?` until the first
 * operand after its matching `:`), or when the next line starts with `?`.
 * A line that does not start with `name =` ends at its first newline outside
 * a string.
 *
 * Returns the index of the newline that ends the statement, or -1 when the
 * statement runs to the end of the text. With `final` false (streaming), a
 * boundary that depends on text not yet received (the next line's first
 * character) is not decided and -1 is returned.
 */
function findStatementEnd(text: string, start: number, final: boolean): number {
  STATEMENT_HEAD.lastIndex = start;
  const isStatement = STATEMENT_HEAD.test(text);
  let depth = 0;
  let ternary = 0; // `?` seen without its matching `:`
  let awaitingElse = false; // after a matching `:`, before the else operand starts
  let quote: string | null = null;

  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      awaitingElse = false;
      continue;
    }
    if (c === "\n") {
      if (!isStatement) return i;
      if (depth > 0 || ternary > 0 || awaitingElse) continue;
      let next = i + 1;
      while (next < text.length && isBlank(text[next])) next++;
      if (next >= text.length) return final ? i : -1;
      if (text[next] === "?") continue;
      return i;
    }
    if (!isStatement || c === " " || c === "\t" || c === "\r") continue;
    if (c === "(" || c === "[" || c === "{") {
      depth++;
      awaitingElse = false;
    } else if (c === ")" || c === "]" || c === "}") {
      depth = Math.max(0, depth - 1);
    } else if (depth === 0 && c === "?") {
      ternary++;
    } else if (depth === 0 && c === ":" && ternary > 0) {
      ternary--;
      awaitingElse = true;
    } else if (c !== "!" && c !== "-") {
      awaitingElse = false;
    }
  }
  return -1;
}

/**
 * Split preprocessed source into statement texts, using the statement
 * boundary rules of spec section 1.4. This is the one boundary scanner shared
 * by the batch parser, the streaming parser and the edit merge.
 *
 * Returns the `[start, end)` ranges of the statements found from `from`, and
 * `pendingStart`: where the text that is not yet a completed statement begins.
 * With `final` true every statement is complete and `pendingStart` is the text
 * length. With `final` false (streaming), the last statement stays pending
 * until its boundary is decided.
 */
export function scanStatements(
  text: string,
  from = 0,
  final = true,
): { ranges: Array<[number, number]>; pendingStart: number } {
  const ranges: Array<[number, number]> = [];
  let i = from;
  while (i < text.length) {
    while (i < text.length && isBlank(text[i])) i++;
    if (i >= text.length) break;
    const end = findStatementEnd(text, i, final);
    if (end === -1) {
      if (!final) return { ranges, pendingStart: i };
      ranges.push([i, text.length]);
      break;
    }
    ranges.push([i, end]);
    i = end + 1;
  }
  return { ranges, pendingStart: text.length };
}

/**
 * Parse the text of one statement (as found by `scanStatements`) into a raw
 * statement. Newlines inside it are continuations, so they are dropped before
 * splitting. Returns undefined for a line without the `name = expression` shape.
 */
export function splitStatementText(text: string): RawStmt | undefined {
  return split(tokenize(text).filter((tok) => tok.t !== T.Newline))[0];
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
    let awaitingElse = false; // after a ternary's `:`, before its else operand
    while (pos < tokens.length && tokens[pos].t !== T.EOF) {
      const tt = tokens[pos].t;
      if (tt === T.Newline && depth <= 0 && ternaryDepth <= 0 && !awaitingElse) {
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
      const wasAwaitingElse: boolean = awaitingElse;
      awaitingElse = false;
      if (tt === T.LParen || tt === T.LBrack || tt === T.LBrace) depth++;
      else if ((tt === T.RParen || tt === T.RBrack || tt === T.RBrace) && depth > 0) depth--;
      // Track ternary ? and : at bracket depth 0 (colons inside {} are object key separators)
      else if (tt === T.Question && depth === 0) ternaryDepth++;
      else if (tt === T.Colon && depth === 0 && ternaryDepth > 0) {
        ternaryDepth--;
        awaitingElse = true;
      } else if (tt === T.Not || tt === T.Minus) awaitingElse = wasAwaitingElse;
      expr.push(tokens[pos++]);
    }

    if (expr.length) stmts.push({ id, idTokenType, tokens: expr });
  }

  return stmts;
}
