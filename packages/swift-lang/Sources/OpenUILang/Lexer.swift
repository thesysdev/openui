/// Token types for OpenUI Lang (mirrors lang-core's `T` enum).
public enum TokenType: Sendable, Equatable {
  case newline
  case lParen, rParen, lBrack, rBrack, lBrace, rBrace
  case comma, colon, equals
  case `true`, `false`, null
  case eof
  /// Carries a string value.
  case str
  /// Carries a numeric value.
  case num
  /// Lowercase identifier: a reference.
  case ident
  /// PascalCase identifier: a component name or reference.
  case type
  /// `$identifier`: a reactive state reference.
  case stateVar
  case dot, plus, minus, star, slash, percent
  case eqEq, notEq, greater, less, greaterEq, lessEq
  case and, or, not, question
  /// `@identifier`: a builtin call.
  case builtinCall
}

public struct Token: Sendable, Equatable {
  public var type: TokenType
  public var string: String?
  public var number: Double?

  init(_ type: TokenType, string: String? = nil, number: Double? = nil) {
    self.type = type
    self.string = string
    self.number = number
  }

  /// `String(tok.v)` for identifier-like tokens used as keys.
  var valueString: String {
    if let string { return string }
    if let number { return jsNumberToString(number) }
    return "undefined"
  }
}

extension UInt16 {
  fileprivate var isASCIIDigit: Bool { self >= 0x30 && self <= 0x39 }
  fileprivate var isASCIILower: Bool { self >= 0x61 && self <= 0x7A }
  fileprivate var isASCIIUpper: Bool { self >= 0x41 && self <= 0x5A }
  fileprivate var isIdentifierStart: Bool { isASCIILower || isASCIIUpper || self == 0x5F }
  fileprivate var isIdentifierPart: Bool { isIdentifierStart || isASCIIDigit }
}

private func char(_ scalar: Unicode.Scalar) -> UInt16 { UInt16(scalar.value) }

/// Tokenizes OpenUI Lang source into a flat token array ending with `.eof`.
///
/// Works on UTF-16 code units, like the JavaScript lexer, so string slicing,
/// escapes and skipped characters (emoji outside strings) behave identically.
public func tokenize(_ source: String) -> [Token] {
  let src = Array(source.utf16)
  let n = src.count
  var tokens: [Token] = []
  var i = 0

  func push(_ type: TokenType) { tokens.append(Token(type)) }

  while i < n {
    // Horizontal whitespace; newlines are significant.
    while i < n && (src[i] == char(" ") || src[i] == char("\t") || src[i] == char("\r")) { i += 1 }
    if i >= n { break }

    let c = src[i]
    let next: UInt16? = i + 1 < n ? src[i + 1] : nil

    switch c {
    case char("\n"):
      push(.newline)
      i += 1
      continue
    case char("("):
      push(.lParen)
      i += 1
      continue
    case char(")"):
      push(.rParen)
      i += 1
      continue
    case char("["):
      push(.lBrack)
      i += 1
      continue
    case char("]"):
      push(.rBrack)
      i += 1
      continue
    case char("{"):
      push(.lBrace)
      i += 1
      continue
    case char("}"):
      push(.rBrace)
      i += 1
      continue
    case char(","):
      push(.comma)
      i += 1
      continue
    case char(":"):
      push(.colon)
      i += 1
      continue
    case char("="):
      if next == char("=") {
        push(.eqEq)
        i += 2
      } else {
        push(.equals)
        i += 1
      }
      continue
    case char("!"):
      if next == char("=") {
        push(.notEq)
        i += 2
      } else {
        push(.not)
        i += 1
      }
      continue
    case char(">"):
      if next == char("=") {
        push(.greaterEq)
        i += 2
      } else {
        push(.greater)
        i += 1
      }
      continue
    case char("<"):
      if next == char("=") {
        push(.lessEq)
        i += 2
      } else {
        push(.less)
        i += 1
      }
      continue
    case char("&"):
      // A single `&` is accepted as `&&`.
      push(.and)
      i += next == char("&") ? 2 : 1
      continue
    case char("|"):
      // A single `|` is accepted as `||`.
      push(.or)
      i += next == char("|") ? 2 : 1
      continue
    case char("."):
      push(.dot)
      i += 1
      continue
    case char("?"):
      push(.question)
      i += 1
      continue
    case char("+"):
      push(.plus)
      i += 1
      continue
    case char("*"):
      push(.star)
      i += 1
      continue
    case char("/"):
      push(.slash)
      i += 1
      continue
    case char("%"):
      push(.percent)
      i += 1
      continue
    case char("\""):
      let start = i
      i += 1
      var isClosed = false
      while i < n {
        if src[i] == char("\\") {
          i += 2
        } else if src[i] == char("\"") {
          i += 1
          isClosed = true
          break
        } else {
          i += 1
        }
      }
      i = min(i, n)
      let raw = Array(src[start..<i])
      // Same as lang-core's `JSON.parse(isClosed ? raw : raw + '"')`, which a
      // streaming (unterminated) string reaches by closing it first.
      let body = isClosed ? Array(raw.dropFirst().dropLast()) : Array(raw.dropFirst())
      if let decoded = decodeJSONStringBody(body) {
        tokens.append(Token(.str, string: decoded))
      } else {
        // Malformed escape mid-stream: strip the quotes and keep the raw text.
        var stripped = raw[...]
        if stripped.first == char("\"") { stripped = stripped.dropFirst() }
        if stripped.last == char("\"") { stripped = stripped.dropLast() }
        tokens.append(Token(.str, string: String(decoding: stripped, as: UTF16.self)))
      }
      continue
    case char("'"):
      i += 1
      var result: [UInt16] = []
      while i < n {
        if src[i] == char("\\") {
          i += 1
          if i < n {
            switch src[i] {
            case char("'"): result.append(char("'"))
            case char("\\"): result.append(char("\\"))
            case char("n"): result.append(char("\n"))
            case char("t"): result.append(char("\t"))
            default: result.append(src[i])
            }
            i += 1
          }
        } else if src[i] == char("'") {
          i += 1
          break
        } else {
          result.append(src[i])
          i += 1
        }
      }
      tokens.append(Token(.str, string: String(decoding: result, as: UTF16.self)))
      continue
    default:
      break
    }

    // Minus: a negative number literal, or subtraction / unary minus.
    if c == char("-") {
      let afterValue: Bool
      switch tokens.last?.type {
      case .num, .str, .ident, .type, .rParen, .rBrack, .true, .false, .null, .stateVar,
        .builtinCall:
        afterValue = true
      default:
        afterValue = false
      }
      if afterValue || !(next?.isASCIIDigit ?? false) {
        push(.minus)
        i += 1
        continue
      }
    }

    // Number literal: 42, -3, 1.5, 1e10
    if c.isASCIIDigit || (c == char("-") && (next?.isASCIIDigit ?? false)) {
      let start = i
      if src[i] == char("-") { i += 1 }
      while i < n && src[i].isASCIIDigit { i += 1 }
      if i < n && src[i] == char(".") && i + 1 < n && src[i + 1].isASCIIDigit {
        i += 1
        while i < n && src[i].isASCIIDigit { i += 1 }
      }
      if i < n && (src[i] == char("e") || src[i] == char("E")) {
        i += 1
        if i < n && (src[i] == char("+") || src[i] == char("-")) { i += 1 }
        while i < n && src[i].isASCIIDigit { i += 1 }
      }
      let text = String(decoding: src[start..<i], as: UTF16.self)
      tokens.append(Token(.num, number: jsStringToNumber(text)))
      continue
    }

    // State variable: $identifier
    if c == char("$"), let next, next.isIdentifierStart {
      let start = i
      i += 1
      while i < n && src[i].isIdentifierPart { i += 1 }
      tokens.append(Token(.stateVar, string: String(decoding: src[start..<i], as: UTF16.self)))
      continue
    }

    // Keyword or identifier
    if c.isIdentifierStart {
      let start = i
      while i < n && src[i].isIdentifierPart { i += 1 }
      let word = String(decoding: src[start..<i], as: UTF16.self)
      switch word {
      case "true": push(.true)
      case "false": push(.false)
      case "null": push(.null)
      default: tokens.append(Token(c.isASCIIUpper ? .type : .ident, string: word))
      }
      continue
    }

    // Builtin call: @identifier
    if c == char("@"), let next, next.isIdentifierStart {
      i += 1
      let start = i
      while i < n && src[i].isIdentifierPart { i += 1 }
      tokens.append(Token(.builtinCall, string: String(decoding: src[start..<i], as: UTF16.self)))
      continue
    }

    i += 1  // skip any other character (e.g. #, emoji)
  }

  push(.eof)
  return tokens
}
