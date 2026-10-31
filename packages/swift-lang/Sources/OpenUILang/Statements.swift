/// A raw `identifier = expression` statement before expression parsing.
struct RawStatement: Sendable {
  var id: String
  /// Token type of the identifier, used to classify the statement.
  var idTokenType: TokenType
  var tokens: [Token]
}

/// Closes unterminated strings and brackets so partial, streaming input parses
/// without syntax errors.
public func autoClose(_ input: String) -> (text: String, wasIncomplete: Bool) {
  var stack: [UInt16] = []
  var inString: UInt16? = nil
  var escaped = false

  for c in input.utf16 {
    if escaped {
      escaped = false
      continue
    }
    if c == UInt16(ascii: "\\") && inString != nil {
      escaped = true
      continue
    }
    if let quote = inString {
      if c == quote { inString = nil }
      continue
    }
    switch c {
    case UInt16(ascii: "\""), UInt16(ascii: "'"):
      inString = c
    case UInt16(ascii: "("), UInt16(ascii: "["), UInt16(ascii: "{"):
      stack.append(c)
    case UInt16(ascii: ")"):
      if stack.last == UInt16(ascii: "(") { stack.removeLast() }
    case UInt16(ascii: "]"):
      if stack.last == UInt16(ascii: "[") { stack.removeLast() }
    case UInt16(ascii: "}"):
      if stack.last == UInt16(ascii: "{") { stack.removeLast() }
    default:
      break
    }
  }

  let wasIncomplete = inString != nil || !stack.isEmpty
  guard wasIncomplete else { return (input, false) }

  var out = input
  if let quote = inString {
    if escaped { out += "\\" }
    out += String(decoding: [quote], as: UTF16.self)
  }
  for opener in stack.reversed() {
    switch opener {
    case UInt16(ascii: "("): out += ")"
    case UInt16(ascii: "["): out += "]"
    default: out += "}"
    }
  }
  return (out, true)
}

/// Splits the token stream into `identifier = expression` statements.
///
/// Statements end at newlines at bracket depth 0. A newline followed by `?`
/// (or by `:` inside a ternary) continues a multi-line ternary. Lines without
/// an identifier and `=` are skipped.
func splitStatements(_ tokens: [Token]) -> [RawStatement] {
  var statements: [RawStatement] = []
  var pos = 0

  func skipLine() {
    while pos < tokens.count && tokens[pos].type != .newline && tokens[pos].type != .eof {
      pos += 1
    }
  }

  while pos < tokens.count {
    while pos < tokens.count && tokens[pos].type == .newline { pos += 1 }
    if pos >= tokens.count || tokens[pos].type == .eof { break }

    let token = tokens[pos]
    guard token.type == .ident || token.type == .type || token.type == .stateVar else {
      skipLine()
      continue
    }
    let id = token.string ?? ""
    let idTokenType = token.type
    pos += 1

    guard pos < tokens.count, tokens[pos].type == .equals else {
      skipLine()
      continue
    }
    pos += 1

    var expr: [Token] = []
    var depth = 0
    var ternaryDepth = 0
    while pos < tokens.count && tokens[pos].type != .eof {
      let type = tokens[pos].type
      if type == .newline && depth <= 0 && ternaryDepth <= 0 {
        var peek = pos + 1
        while peek < tokens.count && tokens[peek].type == .newline { peek += 1 }
        let nextType = peek < tokens.count ? tokens[peek].type : .eof
        if nextType == .question || (nextType == .colon && ternaryDepth > 0) {
          pos += 1
          continue
        }
        break
      }
      if type == .newline {
        pos += 1
        continue
      }
      if type == .lParen || type == .lBrack || type == .lBrace {
        depth += 1
      } else if (type == .rParen || type == .rBrack || type == .rBrace) && depth > 0 {
        depth -= 1
      } else if type == .question && depth == 0 {
        // Colons inside {} are object key separators, so only depth-0 `?`/`:` count.
        ternaryDepth += 1
      } else if type == .colon && depth == 0 && ternaryDepth > 0 {
        ternaryDepth -= 1
      }
      expr.append(tokens[pos])
      pos += 1
    }

    if !expr.isEmpty {
      statements.append(RawStatement(id: id, idTokenType: idTokenType, tokens: expr))
    }
  }

  return statements
}
