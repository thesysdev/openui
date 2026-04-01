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
        tokens.push({ t: T.EqEq });
        i += 2;
      } else {
        tokens.push({ t: T.Equals });
        i++;
      }
      continue;
    }

    // ── Not / NotEq ───────────────────────────────────────────────────
    if (c === "!") {
      if (i + 1 < n && src[i + 1] === "=") {
        tokens.push({ t: T.NotEq });
        i += 2;
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

    // ── String literal: "..." ─────────────────────────────────────────
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

    // ── String literal: '...' (single quotes) ────────────────────────
    if (c === "'") {
      i++; // skip opening quote
      let result = "";
      let isClosed = false;
      while (i < n) {
        if (src[i] === "\\") {
          i++; // skip backslash
          if (i < n) {
            const esc = src[i];
            if (esc === "'") result += "'";
            else if (esc === "\\") result += "\\";
            else if (esc === "n") result += "\n";
            else if (esc === "t") result += "\t";
            else result += esc; // pass through other escaped chars
            i++;
          }
        } else if (src[i] === "'") {
          i++; // skip closing quote
          isClosed = true;
          break;
        } else {
          result += src[i];
          i++;
        }
      }
      void isClosed; // consumed for streaming parity with double-quote path
      tokens.push({ t: T.Str, v: result });
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
