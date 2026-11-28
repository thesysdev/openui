/// An insertion-ordered statement map with JavaScript `Map` semantics:
/// re-setting a key replaces the value but keeps its original position.
struct StatementMap {
  private(set) var order: [String] = []
  private var storage: [String: Statement] = [:]

  var count: Int { order.count }
  var values: [Statement] { order.map { storage[$0]! } }

  subscript(id: String) -> Statement? { storage[id] }

  func contains(_ id: String) -> Bool { storage[id] != nil }

  mutating func set(_ statement: Statement) {
    if storage.updateValue(statement, forKey: statement.id) == nil { order.append(statement.id) }
  }

  mutating func removeAll() {
    order.removeAll()
    storage.removeAll()
  }
}

// MARK: - Statement classification

/// The `$variable` names referenced anywhere in a node, in first-seen order.
func collectQueryDeps(_ node: ASTNode?) -> [String] {
  guard let node else { return [] }
  var refs: [String] = []
  var seen: Set<String> = []
  node.walk { current in
    if case .stateRef(let name) = current, seen.insert(name).inserted { refs.append(name) }
  }
  return refs
}

private func classifyStatement(_ raw: RawStatement, _ expr: ASTNode) -> Statement {
  // Query is checked before $var so `$foo = Query(...)` is still a query.
  if case .comp(let name, let args, _) = expr, name == ReservedCall.query {
    let deps = collectQueryDeps(args.count > 1 ? args[1] : nil)
    return .query(
      id: raw.id, call: CallNode(callee: ReservedCall.query, args: args), expr: expr,
      deps: deps.isEmpty ? nil : deps)
  }
  if case .comp(let name, let args, _) = expr, name == ReservedCall.mutation {
    return .mutation(
      id: raw.id, call: CallNode(callee: ReservedCall.mutation, args: args), expr: expr)
  }
  if raw.idTokenType == .stateVar { return .state(id: raw.id, initial: expr) }
  return .value(id: raw.id, expr: expr)
}

private func extractStatements(_ statements: [Statement], _ ctx: MaterializeContext) -> (
  OpenUIObject, [QueryStatementInfo], [MutationStatementInfo]
) {
  var stateDeclarations = OpenUIObject()
  var queries: [QueryStatementInfo] = []
  var mutations: [MutationStatementInfo] = []

  for statement in statements {
    switch statement {
    case .state(let id, let initial):
      stateDeclarations[id] = materializeValue(initial, ctx)
    case .query(let id, let call, _, let deps):
      let args = call.args
      queries.append(
        QueryStatementInfo(
          statementId: id, toolAST: args.first, argsAST: args.count > 1 ? args[1] : nil,
          defaultsAST: args.count > 2 ? args[2] : nil, refreshAST: args.count > 3 ? args[3] : nil,
          deps: deps, complete: true))
    case .mutation(let id, let call, _):
      let args = call.args
      mutations.append(
        MutationStatementInfo(
          statementId: id, toolAST: args.first, argsAST: args.count > 1 ? args[1] : nil))
    case .value:
      break
    }
  }

  // Any $var referenced but never declared defaults to null.
  for statement in statements {
    let nodes: [ASTNode]
    switch statement {
    case .state(_, let initial): nodes = [initial]
    case .value(_, let expr): nodes = [expr]
    case .query(_, let call, _, _), .mutation(_, let call, _): nodes = call.args
    }
    for node in nodes {
      for dep in collectQueryDeps(node) where !stateDeclarations.contains(dep) {
        stateDeclarations[dep] = .null
      }
    }
  }

  return (stateDeclarations, queries, mutations)
}

private let defaultRootStatementId = "root"

private func isComponentStatement(_ statement: Statement) -> String? {
  guard case .value(_, .comp(let name, _, _)) = statement, !isBuiltin(name),
    name != ReservedCall.query, name != ReservedCall.mutation
  else { return nil }
  return name
}

/// The entry statement: `root`, then a statement named after the library root,
/// then the first statement calling the root component, then the first
/// component statement, then the first statement.
private func pickEntryId(
  _ map: StatementMap, _ statements: [Statement], _ firstId: String, _ rootName: String?
) -> String {
  if map.contains(defaultRootStatementId) { return defaultRootStatementId }
  if let rootName, map.contains(rootName) { return rootName }
  if let rootName,
    let preferred = statements.first(where: { isComponentStatement($0) == rootName })
  {
    return preferred.id
  }
  return statements.first(where: { isComponentStatement($0) != nil })?.id ?? firstId
}

private func buildResult(
  _ map: StatementMap, _ statements: [Statement], _ firstId: String, _ wasIncomplete: Bool,
  _ statementCount: Int, _ cat: ParamMap?, _ rootName: String?
) -> ParseResult {
  let entryId = pickEntryId(map, statements, firstId, rootName)
  guard map.contains(entryId) else { return .empty(incomplete: wasIncomplete) }

  var syms: [String: ASTNode] = [:]
  var unreached: [String] = []
  for id in map.order {
    guard let statement = map[id] else { continue }
    switch statement {
    case .state(_, let initial):
      syms[id] = initial
    case .value(_, let expr), .query(_, _, let expr, _), .mutation(_, _, let expr):
      syms[id] = expr
    }
    // Orphan tracking covers value statements other than the entry; state,
    // Query and Mutation declarations are consumed separately.
    if id != entryId, case .value = statement { unreached.append(id) }
  }

  let ctx = MaterializeContext(
    syms: syms, cat: cat, partial: wasIncomplete, currentStatementId: entryId)
  ctx.unreached = unreached
  var root: ElementNode? = nil
  if let entry = syms[entryId], case .element(var element) = materializeValue(entry, ctx) {
    element.statementId = entryId
    root = element
  }

  let (stateDeclarations, queries, mutations) = extractStatements(statements, ctx)

  return ParseResult(
    root: root,
    meta: .init(
      incomplete: wasIncomplete, unresolved: ctx.unres, orphaned: ctx.unreached ?? [],
      statementCount: statementCount, errors: ctx.errors),
    stateDeclarations: stateDeclarations, queryStatements: queries, mutationStatements: mutations)
}

// MARK: - Preprocessing

private let quote = UInt16(ascii: "\"")
private let singleQuote = UInt16(ascii: "'")
private let backslash = UInt16(ascii: "\\")
private let backtick = UInt16(ascii: "`")
private let newline = UInt16(ascii: "\n")

/// Index after a double-quoted string starting at `start`, or `start` if none starts there.
private func skipString(_ input: [UInt16], _ start: Int) -> Int {
  guard start < input.count, input[start] == quote else { return start }
  var i = start + 1
  while i < input.count {
    if input[i] == backslash {
      i += 2
    } else if input[i] == quote {
      return i + 1
    } else {
      i += 1
    }
  }
  return i
}

private func isFence(_ input: [UInt16], _ i: Int) -> Bool {
  i + 2 < input.count && input[i] == backtick && input[i + 1] == backtick
    && input[i + 2] == backtick
}

private func string(_ units: ArraySlice<UInt16>) -> String {
  String(decoding: units, as: UTF16.self)
}

/// Extracts code from markdown fences (joining multiple blocks), or returns the
/// input unchanged when there are none. Fences inside double-quoted strings are ignored.
public func stripFences(_ text: String) -> String {
  let input = Array(text.utf16)
  var blocks: [String] = []
  var i = 0

  while i < input.count {
    var fenceStart = -1
    while i < input.count {
      let next = skipString(input, i)
      if next > i {
        i = next
        continue
      }
      if isFence(input, i) {
        fenceStart = i
        break
      }
      i += 1
    }
    if fenceStart == -1 { break }

    // Skip the language tag.
    var j = fenceStart + 3
    while j < input.count && input[j] != newline { j += 1 }
    if j >= input.count {
      // No newline after the opening fence yet (streaming): the rest is the tag line.
      blocks.append("")
      i = input.count
      break
    }
    j += 1

    var closePos = -1
    var k = j
    while k < input.count {
      let next = skipString(input, k)
      if next > k {
        k = next
        continue
      }
      if isFence(input, k) {
        closePos = k
        break
      }
      k += 1
    }

    if closePos != -1 {
      blocks.append(string(input[j..<closePos]))
      i = closePos + 3
    } else {
      // No closing fence yet (streaming).
      blocks.append(string(input[j...]))
      i = input.count
    }
  }

  if !blocks.isEmpty { return blocks.joined(separator: "\n") }

  if isFence(input, 0) {
    var j = 3
    while j < input.count && input[j] != newline { j += 1 }
    let start = j < input.count ? j + 1 : 3
    let body = Array(input[min(start, input.count)...])
    if let trailing = lastFence(body) { return string(body[..<trailing]) }
    return string(body[...])
  }
  return text
}

private func lastFence(_ units: [UInt16]) -> Int? {
  guard units.count >= 3 else { return nil }
  for i in stride(from: units.count - 3, through: 0, by: -1) where isFence(units, i) { return i }
  return nil
}

/// Strips `//` and `#` line comments outside strings. String state carries
/// across lines, as in lang-core.
private func stripComments(_ text: String) -> String {
  var inString: UInt16? = nil
  // Split on UTF-16 newlines like `split("\n")`; Swift treats "\r\n" as one Character.
  let lines = Array(text.utf16).split(separator: newline, omittingEmptySubsequences: false)
  return lines.map { line -> String in
    let units = Array(line)
    var i = 0
    while i < units.count {
      let c = units[i]
      if let quoteChar = inString {
        if c == backslash && i + 1 < units.count {
          i += 2
          continue
        }
        if c == quoteChar { inString = nil }
        i += 1
        continue
      }
      if c == quote || c == singleQuote {
        inString = c
        i += 1
        continue
      }
      if c == UInt16(ascii: "/") && i + 1 < units.count && units[i + 1] == UInt16(ascii: "/") {
        return jsTrimEnd(string(units[..<i]))
      }
      if c == UInt16(ascii: "#") {
        return jsTrimEnd(string(units[..<i]))
      }
      i += 1
    }
    return string(line)
  }.joined(separator: "\n")
}

/// Cleans an LLM response: strips fences, comments and surrounding whitespace.
func preprocess(_ input: String) -> String {
  jsTrim(stripComments(stripFences(jsTrim(input))))
}

// MARK: - Parsing

/// Compiles positional parameter lists from a library JSON Schema
/// (`$defs` keyed by component name, properties in positional order).
public func compileSchema(_ schema: OpenUIValue) -> ParamMap {
  var map = ParamMap()
  guard let defs = schema["$defs"].objectValue else { return map }
  let components = schema["properties"].objectValue.map { Set($0.keys) }
  for (name, def) in defs {
    // Skip non-component defs, e.g. zod's hoisted recursive schemas (__schema0).
    if let components, !components.contains(name) { continue }
    let properties = def["properties"].objectValue ?? OpenUIObject()
    let required = (def["required"].arrayValue ?? []).compactMap(\.stringValue)
    map[name] = properties.keys.map { key in
      ParamDef(
        name: key, required: required.contains(key),
        defaultValue: schemaDefaultValue(properties[key]), schema: properties[key])
    }
  }
  return map
}

/// Parses a complete (or partial) OpenUI Lang response in one pass.
public func parse(_ input: String, _ cat: ParamMap?, rootName: String? = nil) -> ParseResult {
  let trimmed = preprocess(input)
  if trimmed.isEmpty { return .empty() }

  let (text, wasIncomplete) = autoClose(trimmed)
  let rawStatements = splitStatements(tokenize(text))
  if rawStatements.isEmpty { return .empty(incomplete: wasIncomplete) }

  var map = StatementMap()
  var firstId = ""
  for raw in rawStatements {
    map.set(classifyStatement(raw, parseExpression(raw.tokens)))
    if firstId.isEmpty { firstId = raw.id }
  }
  return buildResult(map, map.values, firstId, wasIncomplete, map.count, cat, rootName)
}

/// A parser that keeps completed statements between calls, so each streamed
/// chunk only re-parses the statement still being written.
public final class StreamParser {
  private let cat: ParamMap?
  private let rootName: String?

  /// Raw accumulated input, kept for `set(_:)` diffing.
  private var buffer: [UInt16] = []
  /// Preprocessed view of the buffer. Statement boundaries are scanned on this,
  /// so markdown prose or fences before the program can't confuse them.
  private var cleaned: [UInt16] = []
  /// How far into `cleaned` statements are complete.
  private var completedEnd = 0
  private var completedMap = StatementMap()
  private var completedCount = 0
  private var firstId = ""

  public init(_ cat: ParamMap?, rootName: String? = nil) {
    self.cat = cat
    self.rootName = rootName
  }

  /// Feeds the next chunk and returns the latest result.
  public func push(_ chunk: String) -> ParseResult {
    buffer.append(contentsOf: chunk.utf16)
    return currentResult()
  }

  /// Sets the full text so far. Appended text is diffed against the buffer;
  /// replaced text resets the parser.
  public func set(_ fullText: String) -> ParseResult {
    let units = Array(fullText.utf16)
    if units.count < buffer.count || !units.starts(with: buffer) { reset() }
    if units.count > buffer.count { buffer.append(contentsOf: units[buffer.count...]) }
    return currentResult()
  }

  /// The latest result without consuming new data.
  public func result() -> ParseResult { currentResult() }

  private func reset() {
    buffer = []
    cleaned = []
    completedEnd = 0
    completedMap.removeAll()
    completedCount = 0
    firstId = ""
  }

  private func addStatements(_ text: String) {
    let trimmed = jsTrim(text)
    if trimmed.isEmpty { return }
    for raw in splitStatements(tokenize(trimmed)) {
      completedMap.set(classifyStatement(raw, parseExpression(raw.tokens)))
      completedCount += 1
      if firstId.isEmpty { firstId = raw.id }
    }
  }

  /// Recomputes `cleaned`. If the completed prefix moved (e.g. an opening fence
  /// just appeared), the cache is stale and scanning restarts.
  private func refreshCleaned() {
    let next = Array(preprocess(String(decoding: buffer, as: UTF16.self)).utf16)
    if !next.starts(with: cleaned.prefix(completedEnd)) {
      completedEnd = 0
      completedMap.removeAll()
      completedCount = 0
      firstId = ""
    }
    cleaned = next
  }

  /// Moves completed statements into the cache; returns where the pending one starts.
  private func scanNewCompleted() -> Int {
    var depth = 0
    var ternaryDepth = 0
    var inString: UInt16? = nil
    var escaped = false
    var statementStart = completedEnd

    var i = completedEnd
    while i < cleaned.count {
      defer { i += 1 }
      let c = cleaned[i]
      if escaped {
        escaped = false
        continue
      }
      if c == backslash && inString != nil {
        escaped = true
        continue
      }
      if let quoteChar = inString {
        if c == quoteChar { inString = nil }
        continue
      }
      if c == quote || c == singleQuote {
        inString = c
        continue
      }
      switch c {
      case UInt16(ascii: "("), UInt16(ascii: "["), UInt16(ascii: "{"):
        depth += 1
      case UInt16(ascii: ")"), UInt16(ascii: "]"), UInt16(ascii: "}"):
        depth = max(0, depth - 1)
      case UInt16(ascii: "?") where depth == 0:
        ternaryDepth += 1
      case UInt16(ascii: ":") where depth == 0 && ternaryDepth > 0:
        ternaryDepth -= 1
      case newline where depth <= 0 && ternaryDepth <= 0:
        // A following `?` (or `:` inside a ternary) continues the statement.
        var peek = i + 1
        while peek < cleaned.count,
          [UInt16(ascii: " "), UInt16(ascii: "\t"), UInt16(ascii: "\r"), newline].contains(
            cleaned[peek])
        {
          peek += 1
        }
        if peek < cleaned.count,
          cleaned[peek] == UInt16(ascii: "?")
            || (cleaned[peek] == UInt16(ascii: ":") && ternaryDepth > 0)
        {
          continue
        }
        let text = jsTrim(string(cleaned[statementStart..<i]))
        if !text.isEmpty { addStatements(text) }
        statementStart = i + 1
        completedEnd = i + 1
      default:
        break
      }
    }
    return statementStart
  }

  private func currentResult() -> ParseResult {
    refreshCleaned()
    let pendingStart = scanNewCompleted()
    let pendingText = jsTrim(string(cleaned[min(pendingStart, cleaned.count)...]))

    if pendingText.isEmpty {
      if completedCount == 0 { return .empty() }
      return buildResult(
        completedMap, completedMap.values, firstId, false, completedCount, cat, rootName)
    }

    // `cleaned` is already preprocessed; only the trailing statement needs closing.
    let (closed, wasIncomplete) = autoClose(pendingText)
    let rawStatements = splitStatements(tokenize(closed))

    if rawStatements.isEmpty {
      if completedCount == 0 { return .empty(incomplete: wasIncomplete) }
      return buildResult(
        completedMap, completedMap.values, firstId, wasIncomplete, completedCount, cat, rootName)
    }

    // New ids render progressively; an existing id is only replaced once its
    // pending expression no longer needs closing.
    var allMap = completedMap
    for raw in rawStatements {
      if completedMap.contains(raw.id) && wasIncomplete { continue }
      allMap.set(classifyStatement(raw, parseExpression(raw.tokens)))
    }
    let entryFallback = firstId.isEmpty ? rawStatements[0].id : firstId
    return buildResult(
      allMap, allMap.values, entryFallback, wasIncomplete, completedCount + rawStatements.count,
      cat, rootName)
  }
}

/// A batch parser bound to a library's JSON Schema.
public struct Parser: Sendable {
  public let paramMap: ParamMap
  public let rootName: String?

  /// - Parameter schema: the library JSON Schema (`library.toJSONSchema()` in lang-core).
  public init(schema: OpenUIValue, rootName: String? = nil) {
    self.paramMap = compileSchema(schema)
    self.rootName = rootName
  }

  public func parse(_ input: String) -> ParseResult {
    OpenUILang.parse(input, paramMap, rootName: rootName)
  }

  public func makeStreamParser() -> StreamParser {
    StreamParser(paramMap, rootName: rootName)
  }
}
