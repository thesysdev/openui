/// Edit mode: applies a patch program to an existing one. Port of lang-core's
/// `parser/merge.ts`.

private struct ParsedStatement {
  var id: String
  var ast: ASTNode
  var raw: String
}

/// Splits source into top-level statements at newlines outside brackets and
/// strings. Indexes UTF-16 code units, like the JavaScript it mirrors.
private func splitStatementSource(_ input: String) -> [String] {
  let units = Array(input.utf16)
  var statements: [String] = []
  var depth = 0
  var quote: UInt16?
  var escaped = false
  var start = 0

  func appendTrimmed(_ range: Range<Int>) {
    let statement = jsTrim(String(decoding: units[range], as: UTF16.self))
    if !statement.isEmpty { statements.append(statement) }
  }

  for (i, c) in units.enumerated() {
    if escaped {
      escaped = false
      continue
    }
    if let open = quote {
      if c == UInt16(ascii: "\\") {
        escaped = true
      } else if c == open {
        quote = nil
      }
      continue
    }
    switch c {
    case UInt16(ascii: "\""), UInt16(ascii: "'"):
      quote = c
    case UInt16(ascii: "("), UInt16(ascii: "["), UInt16(ascii: "{"):
      depth += 1
    case UInt16(ascii: ")"), UInt16(ascii: "]"), UInt16(ascii: "}"):
      depth = max(0, depth - 1)
    case UInt16(ascii: "\n") where depth <= 0:
      appendTrimmed(start..<i)
      start = i + 1
    default:
      break
    }
  }
  appendTrimmed(start..<units.count)
  return statements
}

private func parseStatements(_ input: String) -> [ParsedStatement] {
  let trimmed = jsTrim(input)
  if trimmed.isEmpty { return [] }
  return splitStatementSource(trimmed).compactMap { raw in
    guard let statement = splitStatements(tokenize(raw)).first else { return nil }
    return ParsedStatement(id: statement.id, ast: parseExpression(statement.tokens), raw: raw)
  }
}

/// Removes statements unreachable from the root. `$state` declarations are
/// always kept: they're read at runtime, not through references.
private func removeUnreachable(
  _ order: inout [String], _ merged: inout [String: String], _ asts: [String: ASTNode],
  rootId: String
) {
  guard asts[rootId] != nil else { return }

  var reachable: Set<String> = [rootId]
  var queue = [rootId]
  while let id = queue.popLast() {
    asts[id]?.walk { node in
      let name: String
      switch node {
      case .ref(let ref): name = ref
      case .runtimeRef(let ref, _): name = ref
      default: return
      }
      if !reachable.contains(name), asts[name] != nil {
        reachable.insert(name)
        queue.append(name)
      }
    }
  }
  for id in order where id.hasPrefix("$") { reachable.insert(id) }

  for id in order where !reachable.contains(id) { merged[id] = nil }
  order.removeAll { !reachable.contains($0) }
}

/// Merges a patch into an existing program. Patch statements replace existing
/// ones with the same name, `name = null` deletes a statement, and statements
/// no longer reachable from `rootId` are dropped.
public func mergeStatements(_ existing: String, _ patch: String, rootId: String = "root")
  -> String
{
  let existingStatements = parseStatements(existing)
  let patchStatements = parseStatements(stripFences(patch))

  if existingStatements.isEmpty {
    return patchStatements.map(\.raw).joined(separator: "\n")
  }
  if patchStatements.isEmpty { return existing }

  var merged: [String: String] = [:]
  var asts: [String: ASTNode] = [:]
  var order: [String] = []

  // A repeated name stays in `order` twice, as in lang-core; both copies print
  // the last definition.
  for statement in existingStatements {
    order.append(statement.id)
    merged[statement.id] = statement.raw
    asts[statement.id] = statement.ast
  }

  for statement in patchStatements {
    if statement.ast == .null {
      merged[statement.id] = nil
      asts[statement.id] = nil
      if let index = order.firstIndex(of: statement.id) { order.remove(at: index) }
      continue
    }
    if merged[statement.id] == nil { order.append(statement.id) }
    merged[statement.id] = statement.raw
    asts[statement.id] = statement.ast
  }

  removeUnreachable(&order, &merged, asts, rootId: rootId)

  return order.compactMap { merged[$0] }.joined(separator: "\n")
}
