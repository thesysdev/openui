// Precedence levels (spec section 2.11).
private let precTernary = 1
private let precOr = 2
private let precAnd = 3
private let precEq = 4
private let precCmp = 5
private let precAdd = 6
private let precMul = 7
private let precUnary = 8
private let precMember = 9

/// `name.replace(/^\$/, "")`
private func dropDollar(_ name: String) -> String {
  name.hasPrefix("$") ? String(name.dropFirst()) : name
}

/// Parses a statement's tokens into an AST with a Pratt (top-down operator
/// precedence) parser. Malformed input never throws: unknown tokens become
/// `Null` and missing closers are tolerated.
public func parseExpression(_ tokens: [Token]) -> ASTNode {
  var parser = ExpressionParser(tokens: tokens)
  return parser.parseExpr(0)
}

private struct ExpressionParser {
  let tokens: [Token]
  var pos = 0

  var cur: Token { pos < tokens.count ? tokens[pos] : Token(.eof) }

  @discardableResult
  mutating func adv() -> Token {
    let token = cur
    pos += 1
    return token
  }

  mutating func eat(_ type: TokenType) {
    if cur.type == type { pos += 1 }
  }

  func peekType(_ offset: Int) -> TokenType? {
    pos + offset < tokens.count ? tokens[pos + offset].type : nil
  }

  func infixPrecedence(_ token: Token) -> Int {
    switch token.type {
    case .question: return precTernary
    case .or: return precOr
    case .and: return precAnd
    case .eqEq, .notEq: return precEq
    case .greater, .less, .greaterEq, .lessEq: return precCmp
    case .plus, .minus: return precAdd
    case .star, .slash, .percent: return precMul
    case .dot, .lBrack: return precMember
    default: return 0
    }
  }

  mutating func parseExpr(_ minPrec: Int) -> ASTNode {
    var left = parsePrefix()
    while infixPrecedence(cur) > minPrec {
      left = parseInfix(left)
    }
    return left
  }

  mutating func parsePrefix() -> ASTNode {
    let token = cur
    switch token.type {
    case .str:
      adv()
      return .str(token.string ?? "")
    case .num:
      adv()
      return .num(token.number ?? .nan)
    case .true:
      adv()
      return .bool(true)
    case .false:
      adv()
      return .bool(false)
    case .null:
      adv()
      return .null
    case .lBrack:
      return parseArr()
    case .lBrace:
      return parseObj()
    case .stateVar:
      // `$var = expr` is an assignment (single `=`, not `==`).
      let name = token.string ?? ""
      adv()
      if cur.type == .equals {
        adv()
        return .assign(target: name, value: parseExpr(0))
      }
      return .stateRef(name)
    case .type:
      // Builtins need the @ prefix to be called; only Action is exempt.
      let name = token.string ?? ""
      if peekType(1) == .lParen && (!isBuiltin(name) || name == "Action") { return parseComp() }
      adv()
      return .ref(name)
    case .builtinCall:
      if peekType(1) == .lParen { return parseComp() }
      adv()
      return .ref(token.string ?? "")
    case .ident:
      adv()
      return .ref(token.string ?? "")
    case .not:
      adv()
      return .unaryOp(op: "!", operand: parseExpr(precUnary))
    case .minus:
      adv()
      return .unaryOp(op: "-", operand: parseExpr(precUnary))
    case .lParen:
      adv()
      let inner = parseExpr(0)
      eat(.rParen)
      return inner
    default:
      // Unknown token: skip it.
      adv()
      return .null
    }
  }

  mutating func parseInfix(_ left: ASTNode) -> ASTNode {
    let token = cur
    func binary(_ op: String, _ prec: Int) -> ASTNode {
      adv()
      return .binOp(op: op, left: left, right: parseExpr(prec))
    }
    switch token.type {
    case .plus: return binary("+", precAdd)
    case .minus: return binary("-", precAdd)
    case .star: return binary("*", precMul)
    case .slash: return binary("/", precMul)
    case .percent: return binary("%", precMul)
    case .eqEq: return binary("==", precEq)
    case .notEq: return binary("!=", precEq)
    case .greater: return binary(">", precCmp)
    case .less: return binary("<", precCmp)
    case .greaterEq: return binary(">=", precCmp)
    case .lessEq: return binary("<=", precCmp)
    case .and: return binary("&&", precAnd)
    case .or: return binary("||", precOr)
    case .question:
      // Right-associative: both branches parse at the lowest precedence.
      adv()
      let then = parseExpr(0)
      eat(.colon)
      let otherwise = parseExpr(0)
      return .ternary(cond: left, then: then, else: otherwise)
    case .dot:
      adv()
      let fieldToken = cur
      adv()
      let field: String
      switch fieldToken.type {
      case .ident, .type, .str, .num: field = fieldToken.valueString
      case .stateVar: field = dropDollar(fieldToken.string ?? "")
      default: field = "?"
      }
      return .member(obj: left, field: field)
    case .lBrack:
      adv()
      let index = parseExpr(0)
      eat(.rBrack)
      return .index(obj: left, index: index)
    default:
      return left
    }
  }

  /// `TypeName(arg1, arg2, ...)`
  mutating func parseComp() -> ASTNode {
    let name = cur.string ?? ""
    adv()
    eat(.lParen)
    var args: [ASTNode] = []
    while cur.type != .rParen && cur.type != .eof {
      args.append(parseExpr(0))
      if cur.type == .comma { adv() }
    }
    eat(.rParen)
    return .comp(name: name, args: args, mappedProps: nil)
  }

  /// `[elem1, elem2, ...]`
  mutating func parseArr() -> ASTNode {
    adv()
    var elements: [ASTNode] = []
    while cur.type != .rBrack && cur.type != .eof {
      elements.append(parseExpr(0))
      if cur.type == .comma { adv() }
    }
    eat(.rBrack)
    return .arr(elements)
  }

  /// `{ key: value, ... }`
  mutating func parseObj() -> ASTNode {
    adv()
    var entries: [ASTEntry] = []
    while cur.type != .rBrace && cur.type != .eof {
      let keyToken = cur
      adv()
      let key: String
      switch keyToken.type {
      case .ident, .str, .type, .num: key = keyToken.valueString
      case .stateVar: key = dropDollar(keyToken.string ?? "")
      default: key = "?"
      }
      eat(.colon)
      entries.append(ASTEntry(key, parseExpr(0)))
      if cur.type == .comma { adv() }
    }
    eat(.rBrace)
    return .obj(entries)
  }
}
