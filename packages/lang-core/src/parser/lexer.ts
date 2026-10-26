// ─────────────────────────────────────────────────────────────────────────────
// Lexer for openui-lang
// ─────────────────────────────────────────────────────────────────────────────

import { T, type Token } from "./tokens";

/**
 * Tokenize an openui-lang source string into a flat token array.
 *
 * Handles all token types: identifiers, literals, operators,
 * state variables ($name), dot access, ternary.
 */
export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = src.length;

  while (i < n) {
    // Skip horizontal whitespace (not newlines — they're significant)
    while (i < n && (src[i] === " " || src[i] === "\t" || src[i] === "\r")) i++;
    if (i >= n) break;

    const c = src[i];

    // ── Newline ────────────────────────────────────────────────────────
    if (c === "\n") {
      tokens.push({ t: T.Newline });
      i++;
      continue;
    }

    // ── Single-character punctuation (brackets, comma, colon) ─────────
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

    // ── Equals / EqEq ─────────────────────────────────────────────────
    if (c === "=") {
      if (i + 1 < n && src[i + 1] === "=") {
        // `===` means exactly `==`
        tokens.push({ t: T.EqEq });
        i += i + 2 < n && src[i + 2] === "=" ? 3 : 2;
      } else {
        tokens.push({ t: T.Equals });
        i++;
      }
      continue;
    }

    // ── Not / NotEq ───────────────────────────────────────────────────
    if (c === "!") {
      if (i + 1 < n && src[i + 1] === "=") {
        // `!==` means exactly `!=`
        tokens.push({ t: T.NotEq });
        i += i + 2 < n && src[i + 2] === "=" ? 3 : 2;
      } else {
        tokens.push({ t: T.Not });
        i++;
      }
      continue;
    }

    // ── Greater / GreaterEq ───────────────────────────────────────────
    if (c === ">") {
      if (i + 1 < n && src[i + 1] === "=") {
        tokens.push({ t: T.GreaterEq });
        i += 2;
      } else {
        tokens.push({ t: T.Greater });
        i++;
      }
      continue;
    }

    // ── Less / LessEq ────────────────────────────────────────────────
    if (c === "<") {
      if (i + 1 < n && src[i + 1] === "=") {
        tokens.push({ t: T.LessEq });
        i += 2;
      } else {
        tokens.push({ t: T.Less });
        i++;
      }
      continue;
    }

    // ── And (&&) ──────────────────────────────────────────────────────
    if (c === "&") {
      if (i + 1 < n && src[i + 1] === "&") {
        tokens.push({ t: T.And });
        i += 2;
      } else {
        tokens.push({ t: T.And });
        i++;
      }
      continue;
    }

    // ── Or (||) ───────────────────────────────────────────────────────
    if (c === "|") {
      if (i + 1 < n && src[i + 1] === "|") {
        tokens.push({ t: T.Or });
        i += 2;
      } else {
        tokens.push({ t: T.Or });
        i++;
      }
      continue;
    }

    // ── Dot ───────────────────────────────────────────────────────────
    if (c === ".") {
      tokens.push({ t: T.Dot });
      i++;
      continue;
    }

    // ── Question ──────────────────────────────────────────────────────
    if (c === "?") {
      tokens.push({ t: T.Question });
      i++;
      continue;
    }

    // ── Plus ──────────────────────────────────────────────────────────
    if (c === "+") {
      tokens.push({ t: T.Plus });
      i++;
      continue;
    }

    // ── Star ──────────────────────────────────────────────────────────
    if (c === "*") {
      tokens.push({ t: T.Star });
      i++;
      continue;
    }

    // ── Slash ─────────────────────────────────────────────────────────
    if (c === "/") {
      tokens.push({ t: T.Slash });
      i++;
      continue;
    }

    // ── Percent ───────────────────────────────────────────────────────
    if (c === "%") {
      tokens.push({ t: T.Percent });
      i++;
      continue;
    }

    // ── String literal: "..." or '...' ───────────────────────────────
    if (c === '"' || c === "'") {
      const { value, end } = readString(src, i);
      tokens.push({ t: T.Str, v: value });
      i = end;
      continue;
    }

    // ── Minus: negative number literal or subtraction operator ────────
    if (c === "-") {
      const prev = tokens.length > 0 ? tokens[tokens.length - 1] : null;
      const afterValue =
        prev != null &&
        (prev.t === T.Num ||
          prev.t === T.Str ||
          prev.t === T.Ident ||
          prev.t === T.Type ||
          prev.t === T.RParen ||
          prev.t === T.RBrack ||
          prev.t === T.True ||
          prev.t === T.False ||
          prev.t === T.Null ||
          prev.t === T.StateVar ||
          prev.t === T.BuiltinCall);

      if (!afterValue && i + 1 < n && src[i + 1] >= "0" && src[i + 1] <= "9") {
        // Negative number literal — fall through to number parsing below
      } else {
        // Binary subtraction operator (or unary minus handled by expression parser)
        tokens.push({ t: T.Minus });
        i++;
        continue;
      }
    }

    // ── Number literal: 42, -3, 1.5, 1e10 ────────────────────────────
    const isDigit = c >= "0" && c <= "9";
    // After `.`, a run of digits is an integer field (`m.0.1` is `m[0][1]`),
    // never a decimal number.
    if (isDigit && tokens.length > 0 && tokens[tokens.length - 1].t === T.Dot) {
      const start = i;
      while (i < n && src[i] >= "0" && src[i] <= "9") i++;
      tokens.push({ t: T.Num, v: +src.slice(start, i) });
      continue;
    }
    const isNegDigit = c === "-" && i + 1 < n && src[i + 1] >= "0" && src[i + 1] <= "9";
    if (isDigit || isNegDigit) {
      const start = i;
      if (src[i] === "-") i++; // optional minus
      while (i < n && src[i] >= "0" && src[i] <= "9") i++; // integer part
      if (i < n && src[i] === "." && i + 1 < n && src[i + 1] >= "0" && src[i + 1] <= "9") {
        // optional decimal — only if a digit follows the dot
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

    // ── State variable: $identifier ───────────────────────────────────
    if (
      c === "$" &&
      i + 1 < n &&
      ((src[i + 1] >= "a" && src[i + 1] <= "z") ||
        (src[i + 1] >= "A" && src[i + 1] <= "Z") ||
        src[i + 1] === "_")
    ) {
      const start = i;
      i++; // skip $
      while (
        i < n &&
        ((src[i] >= "a" && src[i] <= "z") ||
          (src[i] >= "A" && src[i] <= "Z") ||
          (src[i] >= "0" && src[i] <= "9") ||
          src[i] === "_")
      )
        i++;
      tokens.push({ t: T.StateVar, v: src.slice(start, i) });
      continue;
    }

    // ── Keyword or identifier ─────────────────────────────────────────
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

    // ── Builtin call: @identifier ───────────────────────────────────
    if (
      c === "@" &&
      i + 1 < n &&
      ((src[i + 1] >= "a" && src[i + 1] <= "z") ||
        (src[i + 1] >= "A" && src[i + 1] <= "Z") ||
        src[i + 1] === "_")
    ) {
      i++; // skip @
      const start = i;
      while (
        i < n &&
        ((src[i] >= "a" && src[i] <= "z") ||
          (src[i] >= "A" && src[i] <= "Z") ||
          (src[i] >= "0" && src[i] <= "9") ||
          src[i] === "_")
      )
        i++;
      tokens.push({ t: T.BuiltinCall, v: src.slice(start, i) });
      continue;
    }

    i++; // skip any other character (e.g. #, emojis)
  }

  tokens.push({ t: T.EOF });
  return tokens;
}

const DOUBLE_QUOTE_ESCAPES: Record<string, string> = {
  '"': '"',
  "\\": "\\",
  "/": "/",
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
};

const SINGLE_QUOTE_ESCAPES: Record<string, string> = {
  "'": "'",
  "\\": "\\",
  n: "\n",
  t: "\t",
};

/**
 * Read a string literal starting at `start` (which holds the opening quote).
 *
 * Double-quoted strings use JSON escapes, single-quoted strings support only
 * `\'`, `\\`, `\n` and `\t`. Any other escaped character is kept as is
 * (without the backslash). Raw newlines are allowed inside strings. An
 * unterminated string runs to the end of the input.
 */
function readString(src: string, start: number): { value: string; end: number } {
  const quote = src[start];
  const escapes = quote === '"' ? DOUBLE_QUOTE_ESCAPES : SINGLE_QUOTE_ESCAPES;
  const n = src.length;
  let value = "";
  let i = start + 1;
  while (i < n) {
    const c = src[i];
    if (c === quote) return { value, end: i + 1 };
    if (c !== "\\") {
      value += c;
      i++;
      continue;
    }
    i++; // skip backslash
    if (i >= n) break;
    const esc = src[i];
    if (quote === '"' && esc === "u" && /^[0-9a-fA-F]{4}$/.test(src.slice(i + 1, i + 5))) {
      value += String.fromCharCode(parseInt(src.slice(i + 1, i + 5), 16));
      i += 5;
      continue;
    }
    value += escapes[esc] ?? esc;
    i++;
  }
  return { value, end: n };
}
