// ─────────────────────────────────────────────────────────────────────────────
// Pratt precedence expression parser for openui-lang
// ─────────────────────────────────────────────────────────────────────────────

import type { ASTNode } from "./ast";
import { isBuiltin } from "./builtins";
import { T, type Token } from "./tokens";

// ── Precedence levels (from spec Section 2.11) ─────────────────────────────
const PREC_TERNARY = 1;
const PREC_OR = 2;
const PREC_AND = 3;
const PREC_EQ = 4;
const PREC_CMP = 5;
const PREC_ADD = 6;
const PREC_MUL = 7;
const PREC_UNARY = 8;
const PREC_MEMBER = 9;

/**
 * Parse a token array into an AST node using a Pratt (top-down operator
 * precedence) parser.
 */
export function parseExpression(tokens: Token[]): ASTNode {
  let pos = 0;

  const cur = (): Token => tokens[pos] ?? { t: T.EOF };
  const adv = (): Token => {
    const tok = cur();
    pos++;
    return tok;
  };
  const eat = (kind: T): void => {
    if (cur().t === kind) pos++;
  };

  // ── Infix precedence lookup ─────────────────────────────────────────────
  function getInfixPrec(tok: Token): number {
    switch (tok.t) {
      case T.Question:
        return PREC_TERNARY;
      case T.Or:
        return PREC_OR;
      case T.And:
        return PREC_AND;
      case T.EqEq:
      case T.NotEq:
        return PREC_EQ;
      case T.Greater:
      case T.Less:
      case T.GreaterEq:
      case T.LessEq:
        return PREC_CMP;
      case T.Plus:
      case T.Minus:
        return PREC_ADD;
      case T.Star:
      case T.Slash:
      case T.Percent:
        return PREC_MUL;
      case T.Dot:
      case T.LBrack:
        return PREC_MEMBER;
      default:
        return 0;
    }
  }

  // ── Main Pratt loop ─────────────────────────────────────────────────────
  function parseExpr(minPrec: number = 0): ASTNode {
    let left = parsePrefix();
    while (getInfixPrec(cur()) > minPrec) {
      left = parseInfix(left);
    }
    return left;
  }

  // ── Prefix / atoms ─────────────────────────────────────────────────────
  function parsePrefix(): ASTNode {
    const tok = cur();

    // String literal
    if (tok.t === T.Str) {
      adv();
      return { k: "Str", v: tok.v as string };
    }

    // Number literal
    if (tok.t === T.Num) {
      adv();
      return { k: "Num", v: tok.v as number };
    }

    // Boolean literals
    if (tok.t === T.True) {
      adv();
      return { k: "Bool", v: true };
    }
    if (tok.t === T.False) {
      adv();
      return { k: "Bool", v: false };
    }

    // Null literal
    if (tok.t === T.Null) {
      adv();
      return { k: "Null" };
    }

    // Array
    if (tok.t === T.LBrack) return parseArr();

    // Object
    if (tok.t === T.LBrace) return parseObj();

    // State variable — may be assignment or reference
    if (tok.t === T.StateVar) {
      const name = tok.v as string;
      adv();
      // Check for assignment: $var = expr (Equals, NOT EqEq)
      if (cur().t === T.Equals) {
        adv(); // consume =
        const value = parseExpr(0);
        return { k: "Assign", target: name, value };
      }
      return { k: "StateRef", n: name };
    }

    // PascalCase — component call or reference
    if (tok.t === T.Type) {
      const name = tok.v as string;
      // Builtins (Count, Each, Set, Run, etc.) require @-prefix — only Action is exempt
      if (tokens[pos + 1]?.t === T.LParen && (!isBuiltin(name) || name === "Action"))
        return parseComp();
      adv();
      return { k: "Ref", n: name };
    }

    // @-prefixed builtin call: @Count(...), @Each(...), @Set(...), etc.
    if (tok.t === T.BuiltinCall) {
      if (tokens[pos + 1]?.t === T.LParen) return parseComp();
      adv();
      return { k: "Ref", n: tok.v as string };
    }

    // Lowercase identifier — reference
    if (tok.t === T.Ident) {
      adv();
      return { k: "Ref", n: tok.v as string };
    }

    // Unary NOT
    if (tok.t === T.Not) {
      adv();
      return { k: "UnaryOp", op: "!", operand: parseExpr(PREC_UNARY) };
    }

    // Unary negation
    if (tok.t === T.Minus) {
      adv();
      return { k: "UnaryOp", op: "-", operand: parseExpr(PREC_UNARY) };
    }

    // Grouped expression
    if (tok.t === T.LParen) {
      adv(); // skip (
      const inner = parseExpr(0);
      eat(T.RParen);
      return inner;
    }

    // Unknown token — skip and return Null
    adv();
    return { k: "Null" };
  }

  // ── Infix / postfix ────────────────────────────────────────────────────
  function parseInfix(left: ASTNode): ASTNode {
    const tok = cur();

    // Arithmetic: + -
    if (tok.t === T.Plus) {
      adv();
      return { k: "BinOp", op: "+", left, right: parseExpr(PREC_ADD) };
    }
    if (tok.t === T.Minus) {
      adv();
      return { k: "BinOp", op: "-", left, right: parseExpr(PREC_ADD) };
    }

    // Arithmetic: * / %
    if (tok.t === T.Star) {
      adv();
      return { k: "BinOp", op: "*", left, right: parseExpr(PREC_MUL) };
    }
    if (tok.t === T.Slash) {
      adv();
      return { k: "BinOp", op: "/", left, right: parseExpr(PREC_MUL) };
    }
    if (tok.t === T.Percent) {
      adv();
      return { k: "BinOp", op: "%", left, right: parseExpr(PREC_MUL) };
    }

    // Equality: == !=
    if (tok.t === T.EqEq) {
      adv();
      return { k: "BinOp", op: "==", left, right: parseExpr(PREC_EQ) };
    }
    if (tok.t === T.NotEq) {
      adv();
      return { k: "BinOp", op: "!=", left, right: parseExpr(PREC_EQ) };
    }

    // Comparison: > < >= <=
    if (tok.t === T.Greater) {
      adv();
      return { k: "BinOp", op: ">", left, right: parseExpr(PREC_CMP) };
    }
    if (tok.t === T.Less) {
      adv();
      return { k: "BinOp", op: "<", left, right: parseExpr(PREC_CMP) };
    }
    if (tok.t === T.GreaterEq) {
      adv();
      return { k: "BinOp", op: ">=", left, right: parseExpr(PREC_CMP) };
    }
    if (tok.t === T.LessEq) {
      adv();
      return { k: "BinOp", op: "<=", left, right: parseExpr(PREC_CMP) };
    }

    // Logical AND
    if (tok.t === T.And) {
      adv();
      return { k: "BinOp", op: "&&", left, right: parseExpr(PREC_AND) };
    }

    // Logical OR
    if (tok.t === T.Or) {
      adv();
      return { k: "BinOp", op: "||", left, right: parseExpr(PREC_OR) };
    }

    // Ternary: cond ? then : else (right-associative)
    if (tok.t === T.Question) {
      adv(); // consume ?
      const then = parseExpr(0);
      eat(T.Colon);
      const els = parseExpr(0); // right-assoc: parse at lowest prec
      return { k: "Ternary", cond: left, then, else: els };
    }

    // Member access: obj.field
    if (tok.t === T.Dot) {
      adv(); // consume .
      const fieldTok = cur();
      const field =
        fieldTok.t === T.Ident ||
        fieldTok.t === T.Type ||
        fieldTok.t === T.Str ||
        fieldTok.t === T.Num
          ? (adv(), String(fieldTok.v))
          : fieldTok.t === T.StateVar
            ? (adv(), (fieldTok.v as string).replace(/^\$/, ""))
            : (adv(), "?");
      return { k: "Member", obj: left, field };
    }

    // Index access: obj[expr]
    if (tok.t === T.LBrack) {
      adv(); // consume [
      const index = parseExpr(0);
      eat(T.RBrack);
      return { k: "Index", obj: left, index };
    }

    // Fallback — should not be reached if getInfixPrec is correct
    return left;
  }

  // ── Compound parsers ───────────────────────────────────────────────────

  /** Parse `TypeName(arg1, arg2, ...)` */
  function parseComp(): ASTNode {
    const name = cur().v as string;
    adv(); // consume TypeName
    eat(T.LParen);
    const args: ASTNode[] = [];
    while (cur().t !== T.RParen && cur().t !== T.EOF) {
      args.push(parseExpr(0));
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
      els.push(parseExpr(0));
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
          : kt.t === T.StateVar
            ? (adv(), (kt.v as string).replace(/^\$/, ""))
            : (adv(), "?");
      eat(T.Colon);
      entries.push([key, parseExpr(0)]);
      if (cur().t === T.Comma) adv();
    }
    eat(T.RBrace);
    return { k: "Obj", entries };
  }

  return parseExpr(0);
}
