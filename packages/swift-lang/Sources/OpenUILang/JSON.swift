/// JSON reading and writing with JavaScript semantics.
///
/// Reading preserves object key order, which matters because a library's JSON
/// Schema lists props in positional-argument order. Writing matches
/// `JSON.stringify`, so Swift output can be compared with lang-core's.
public enum JSON {
  public struct SyntaxError: Error, CustomStringConvertible {
    public var description: String
  }

  /// `JSON.parse`. Objects keep JavaScript key order.
  public static func parse(_ text: String) throws -> OpenUIValue {
    var reader = Reader(units: Array(text.utf16))
    reader.skipWhitespace()
    let value = try reader.readValue()
    reader.skipWhitespace()
    guard reader.index == reader.units.count else {
      throw SyntaxError(description: "Unexpected trailing characters at \(reader.index)")
    }
    return value
  }

  /// `JSON.stringify` without indentation. `undefined` object members are
  /// omitted, `undefined` array items and non-finite numbers become `null`.
  public static func stringify(_ value: OpenUIValue) -> String {
    var out = ""
    write(value.jsonRepresentation, into: &out)
    return out
  }

  private static func write(_ value: OpenUIValue, into out: inout String) {
    switch value {
    case .undefined, .null:
      out += "null"
    case .bool(let bool):
      out += bool ? "true" : "false"
    case .number(let number):
      out += number.isFinite ? jsNumberToString(number) : "null"
    case .string(let string):
      writeString(string, into: &out)
    case .array(let items):
      out += "["
      for (offset, item) in items.enumerated() {
        if offset > 0 { out += "," }
        write(item, into: &out)
      }
      out += "]"
    case .object(let object):
      out += "{"
      var first = true
      for (key, member) in object where member != .undefined {
        if !first { out += "," }
        first = false
        writeString(key, into: &out)
        out += ":"
        write(member, into: &out)
      }
      out += "}"
    default:
      write(value.jsonRepresentation, into: &out)
    }
  }

  private static func writeString(_ string: String, into out: inout String) {
    out += "\""
    for scalar in string.unicodeScalars {
      switch scalar {
      case "\"": out += "\\\""
      case "\\": out += "\\\\"
      case "\u{08}": out += "\\b"
      case "\u{0C}": out += "\\f"
      case "\n": out += "\\n"
      case "\r": out += "\\r"
      case "\t": out += "\\t"
      default:
        if scalar.value < 0x20 {
          let hex = String(scalar.value, radix: 16)
          out += "\\u" + String(repeating: "0", count: 4 - hex.count) + hex
        } else {
          out.unicodeScalars.append(scalar)
        }
      }
    }
    out += "\""
  }

  // MARK: Reader

  struct Reader {
    let units: [UInt16]
    var index = 0

    mutating func skipWhitespace() {
      while index < units.count,
        units[index] == 0x20 || units[index] == 0x09 || units[index] == 0x0A
          || units[index] == 0x0D
      {
        index += 1
      }
    }

    mutating func readValue() throws -> OpenUIValue {
      guard index < units.count else { throw SyntaxError(description: "Unexpected end of JSON") }
      switch units[index] {
      case UInt16(ascii: "{"): return try readObject()
      case UInt16(ascii: "["): return try readArray()
      case UInt16(ascii: "\""): return .string(try readString())
      case UInt16(ascii: "t"): return try readKeyword("true", .bool(true))
      case UInt16(ascii: "f"): return try readKeyword("false", .bool(false))
      case UInt16(ascii: "n"): return try readKeyword("null", .null)
      default: return try readNumber()
      }
    }

    mutating func readKeyword(_ word: String, _ value: OpenUIValue) throws -> OpenUIValue {
      let wordUnits = Array(word.utf16)
      guard index + wordUnits.count <= units.count,
        Array(units[index..<index + wordUnits.count]) == wordUnits
      else { throw SyntaxError(description: "Unexpected token at \(index)") }
      index += wordUnits.count
      return value
    }

    mutating func readNumber() throws -> OpenUIValue {
      let start = index
      if index < units.count, units[index] == UInt16(ascii: "-") { index += 1 }
      while index < units.count,
        (UInt16(ascii: "0")...UInt16(ascii: "9")).contains(units[index])
          || units[index] == UInt16(ascii: ".") || units[index] == UInt16(ascii: "e")
          || units[index] == UInt16(ascii: "E") || units[index] == UInt16(ascii: "+")
          || units[index] == UInt16(ascii: "-")
      {
        index += 1
      }
      let text = String(decoding: units[start..<index], as: UTF16.self)
      guard !text.isEmpty, let number = Double(text) else {
        throw SyntaxError(description: "Invalid number at \(start)")
      }
      return .number(number)
    }

    mutating func readString() throws -> String {
      index += 1  // opening quote
      let start = index
      while index < units.count {
        if units[index] == UInt16(ascii: "\\") {
          index += 2
        } else if units[index] == UInt16(ascii: "\"") {
          let body = Array(units[start..<index])
          index += 1
          guard let decoded = decodeJSONStringBody(body) else {
            throw SyntaxError(description: "Invalid string at \(start)")
          }
          return decoded
        } else {
          index += 1
        }
      }
      throw SyntaxError(description: "Unterminated string at \(start)")
    }

    mutating func readArray() throws -> OpenUIValue {
      index += 1
      var items: [OpenUIValue] = []
      skipWhitespace()
      if index < units.count, units[index] == UInt16(ascii: "]") {
        index += 1
        return .array(items)
      }
      while true {
        skipWhitespace()
        items.append(try readValue())
        skipWhitespace()
        guard index < units.count else { throw SyntaxError(description: "Unterminated array") }
        if units[index] == UInt16(ascii: ",") {
          index += 1
        } else if units[index] == UInt16(ascii: "]") {
          index += 1
          return .array(items)
        } else {
          throw SyntaxError(description: "Expected , or ] at \(index)")
        }
      }
    }

    mutating func readObject() throws -> OpenUIValue {
      index += 1
      var object = OpenUIObject()
      skipWhitespace()
      if index < units.count, units[index] == UInt16(ascii: "}") {
        index += 1
        return .object(object)
      }
      while true {
        skipWhitespace()
        guard index < units.count, units[index] == UInt16(ascii: "\"") else {
          throw SyntaxError(description: "Expected key at \(index)")
        }
        let key = try readString()
        skipWhitespace()
        guard index < units.count, units[index] == UInt16(ascii: ":") else {
          throw SyntaxError(description: "Expected : at \(index)")
        }
        index += 1
        skipWhitespace()
        object[key] = try readValue()
        skipWhitespace()
        guard index < units.count else { throw SyntaxError(description: "Unterminated object") }
        if units[index] == UInt16(ascii: ",") {
          index += 1
        } else if units[index] == UInt16(ascii: "}") {
          index += 1
          return .object(object)
        } else {
          throw SyntaxError(description: "Expected , or } at \(index)")
        }
      }
    }
  }
}

/// Decodes the body of a JSON string literal (without the quotes), following
/// `JSON.parse`: returns `nil` for raw control characters and invalid escapes.
/// Lone surrogates, which JavaScript strings can hold but Swift strings cannot,
/// decode to U+FFFD.
func decodeJSONStringBody(_ body: [UInt16]) -> String? {
  var out: [UInt16] = []
  out.reserveCapacity(body.count)
  var i = 0
  while i < body.count {
    let unit = body[i]
    if unit < 0x20 { return nil }
    if unit != UInt16(ascii: "\\") {
      out.append(unit)
      i += 1
      continue
    }
    guard i + 1 < body.count else { return nil }
    let escaped = body[i + 1]
    i += 2
    switch escaped {
    case UInt16(ascii: "\""): out.append(UInt16(ascii: "\""))
    case UInt16(ascii: "\\"): out.append(UInt16(ascii: "\\"))
    case UInt16(ascii: "/"): out.append(UInt16(ascii: "/"))
    case UInt16(ascii: "b"): out.append(0x08)
    case UInt16(ascii: "f"): out.append(0x0C)
    case UInt16(ascii: "n"): out.append(0x0A)
    case UInt16(ascii: "r"): out.append(0x0D)
    case UInt16(ascii: "t"): out.append(0x09)
    case UInt16(ascii: "u"):
      guard i + 4 <= body.count,
        let code = UInt16(String(decoding: body[i..<i + 4], as: UTF16.self), radix: 16)
      else { return nil }
      out.append(code)
      i += 4
    default:
      return nil
    }
  }
  return String(decoding: out, as: UTF16.self)
}

// MARK: - JSON shapes matching lang-core's objects

extension OpenUIValue {
  /// This value as plain JSON data, shaped like the object lang-core would
  /// serialize (element nodes, AST nodes and action markers included).
  public var jsonRepresentation: OpenUIValue {
    switch self {
    case .undefined, .null, .bool, .number, .string: return self
    case .array(let items): return .array(items.map(\.jsonRepresentation))
    case .object(let object):
      return .object(OpenUIObject(object.entries.map { ($0.key, $0.value.jsonRepresentation) }))
    case .element(let element): return element.jsonRepresentation
    case .ast(let node): return node.jsonRepresentation
    case .actionPlan(let plan): return plan.jsonRepresentation
    case .actionStep(let step): return step.jsonRepresentation
    case .reactiveAssign(let assign):
      return [
        "__reactive": "assign", "target": .string(assign.target),
        "expr": assign.expr.jsonRepresentation,
      ]
    }
  }
}

extension ElementNode {
  public var jsonRepresentation: OpenUIValue {
    var object = OpenUIObject()
    object["type"] = "element"
    object["typeName"] = .string(typeName)
    object["props"] = OpenUIValue.object(props).jsonRepresentation
    object["partial"] = .bool(partial)
    if let hasDynamicProps { object["hasDynamicProps"] = .bool(hasDynamicProps) }
    if let statementId { object["statementId"] = .string(statementId) }
    return .object(object)
  }
}

extension ASTNode {
  public var jsonRepresentation: OpenUIValue {
    var object = OpenUIObject()
    object["k"] = .string(kind)
    switch self {
    case .comp(let name, let args, let mappedProps):
      object["name"] = .string(name)
      object["args"] = .array(args.map(\.jsonRepresentation))
      if let mappedProps {
        object["mappedProps"] = .object(
          OpenUIObject(mappedProps.map { ($0.key, $0.value.jsonRepresentation) }))
      }
    case .str(let value): object["v"] = .string(value)
    case .num(let value): object["v"] = .number(value)
    case .bool(let value): object["v"] = .bool(value)
    case .null: break
    case .arr(let elements): object["els"] = .array(elements.map(\.jsonRepresentation))
    case .obj(let entries):
      object["entries"] = .array(entries.map { [.string($0.key), $0.value.jsonRepresentation] })
    case .ref(let name), .ph(let name), .stateRef(let name): object["n"] = .string(name)
    case .runtimeRef(let name, let refType):
      object["n"] = .string(name)
      object["refType"] = .string(refType.rawValue)
    case .binOp(let op, let left, let right):
      object["op"] = .string(op)
      object["left"] = left.jsonRepresentation
      object["right"] = right.jsonRepresentation
    case .unaryOp(let op, let operand):
      object["op"] = .string(op)
      object["operand"] = operand.jsonRepresentation
    case .ternary(let cond, let then, let otherwise):
      object["cond"] = cond.jsonRepresentation
      object["then"] = then.jsonRepresentation
      object["else"] = otherwise.jsonRepresentation
    case .member(let obj, let field):
      object["obj"] = obj.jsonRepresentation
      object["field"] = .string(field)
    case .index(let obj, let index):
      object["obj"] = obj.jsonRepresentation
      object["index"] = index.jsonRepresentation
    case .assign(let target, let value):
      object["target"] = .string(target)
      object["value"] = value.jsonRepresentation
    }
    return .object(object)
  }
}

extension ActionStep {
  public var jsonRepresentation: OpenUIValue {
    var object = OpenUIObject()
    object["type"] = .string(type)
    switch self {
    case .run(let statementId, let refType):
      object["statementId"] = .string(statementId)
      object["refType"] = .string(refType.rawValue)
    case .continueConversation(let message, let context):
      object["message"] = .string(message)
      if let context { object["context"] = .string(context) }
    case .openUrl(let url):
      object["url"] = .string(url)
    case .set(let target, let valueAST):
      object["target"] = .string(target)
      object["valueAST"] = valueAST.jsonRepresentation
    case .reset(let targets):
      object["targets"] = .array(targets.map { .string($0) })
    }
    return .object(object)
  }
}

extension ActionPlan {
  public var jsonRepresentation: OpenUIValue {
    ["steps": .array(steps.map(\.jsonRepresentation))]
  }
}

extension ValidationError {
  public var jsonRepresentation: OpenUIValue {
    var object = OpenUIObject()
    object["code"] = .string(code.rawValue)
    object["component"] = .string(component)
    object["path"] = .string(path)
    object["message"] = .string(message)
    if let statementId { object["statementId"] = .string(statementId) }
    return .object(object)
  }
}

extension OpenUIError {
  public var jsonRepresentation: OpenUIValue {
    var object = OpenUIObject()
    object["source"] = .string(source.rawValue)
    object["code"] = .string(code)
    object["message"] = .string(message)
    if let statementId { object["statementId"] = .string(statementId) }
    if let component { object["component"] = .string(component) }
    if let path { object["path"] = .string(path) }
    if let toolName { object["toolName"] = .string(toolName) }
    if let hint { object["hint"] = .string(hint) }
    return .object(object)
  }
}

extension ParseResult {
  public var jsonRepresentation: OpenUIValue {
    var meta = OpenUIObject()
    meta["incomplete"] = .bool(self.meta.incomplete)
    meta["unresolved"] = .array(self.meta.unresolved.map { .string($0) })
    meta["orphaned"] = .array(self.meta.orphaned.map { .string($0) })
    meta["statementCount"] = .number(Double(self.meta.statementCount))
    meta["errors"] = .array(self.meta.errors.map(\.jsonRepresentation))

    var object = OpenUIObject()
    object["root"] = root?.jsonRepresentation ?? .null
    object["meta"] = .object(meta)
    object["stateDeclarations"] = OpenUIValue.object(stateDeclarations).jsonRepresentation
    object["queryStatements"] = .array(
      queryStatements.map { query in
        var entry = OpenUIObject()
        entry["statementId"] = .string(query.statementId)
        entry["toolAST"] = query.toolAST?.jsonRepresentation ?? .null
        entry["argsAST"] = query.argsAST?.jsonRepresentation ?? .null
        entry["defaultsAST"] = query.defaultsAST?.jsonRepresentation ?? .null
        entry["refreshAST"] = query.refreshAST?.jsonRepresentation ?? .null
        if let deps = query.deps { entry["deps"] = .array(deps.map { .string($0) }) }
        entry["complete"] = .bool(query.complete)
        return .object(entry)
      })
    object["mutationStatements"] = .array(
      mutationStatements.map { mutation in
        var entry = OpenUIObject()
        entry["statementId"] = .string(mutation.statementId)
        entry["toolAST"] = mutation.toolAST?.jsonRepresentation ?? .null
        entry["argsAST"] = mutation.argsAST?.jsonRepresentation ?? .null
        return .object(entry)
      })
    return .object(object)
  }
}
