import Foundation

/// Calls the tools behind `Query(...)` and `Mutation(...)` statements: MCP,
/// REST, GraphQL or anything else.
public protocol ToolProvider: Sendable {
  func callTool(_ name: String, arguments: OpenUIObject) async throws -> OpenUIValue
}

/// Thrown when a tool name has no handler.
public struct ToolNotFoundError: Error, CustomStringConvertible {
  public var toolName: String
  public var availableTools: [String]

  public init(toolName: String, availableTools: [String] = []) {
    self.toolName = toolName
    self.availableTools = availableTools
  }

  public var description: String {
    let available = availableTools.isEmpty ? "(none)" : availableTools.joined(separator: ", ")
    return "[openui] No handler for tool \"\(toolName)\". Available: \(available)"
  }
}

/// A tool call that returned an MCP error result.
public struct McpToolError: Error, CustomStringConvertible {
  public var toolErrorText: String

  public init(toolErrorText: String) {
    self.toolErrorText = toolErrorText
  }

  public var description: String {
    "MCP tool error: \(toolErrorText.isEmpty ? "Unknown error" : toolErrorText)"
  }
}

/// Unwraps an MCP `callTool` result (`{ content, structuredContent, isError }`):
/// throws `McpToolError` for error results, prefers `structuredContent`, then
/// text content parsed as JSON (or returned as text).
public func extractToolResult(_ result: OpenUIValue) throws -> OpenUIValue {
  let textParts = (result["content"].arrayValue ?? [])
    .filter { $0["type"].stringValue == "text" }
    .map { $0["text"].stringValue ?? "" }
  if result["isError"].isTruthy {
    let errorText = textParts.joined(separator: "\n")
    throw McpToolError(toolErrorText: errorText.isEmpty ? "Unknown error" : errorText)
  }
  if !result["structuredContent"].isNullish { return result["structuredContent"] }
  if !textParts.isEmpty {
    let text = textParts.joined()
    return (try? JSON.parse(text)) ?? .string(text)
  }
  return .null
}

/// A thrown error's message, as lang-core reads `err.message`: a
/// `LocalizedError`'s description, a Cocoa error's localized description
/// (its debug form reads `Error Domain=… Code=0 "(null)"`), or the error as
/// text, which for this package's errors is their description.
func errorMessage(_ error: Error) -> String {
  if let description = (error as? LocalizedError)?.errorDescription { return description }
  if type(of: error) is NSError.Type { return (error as NSError).localizedDescription }
  return "\(error)"
}

/// A tool provider backed by a map of async handlers.
public struct FunctionToolProvider: ToolProvider {
  public typealias Handler = @Sendable (OpenUIObject) async throws -> OpenUIValue

  private let handlers: [String: Handler]

  public init(_ handlers: [String: Handler]) {
    self.handlers = handlers
  }

  public func callTool(_ name: String, arguments: OpenUIObject) async throws -> OpenUIValue {
    guard let handler = handlers[name] else {
      throw ToolNotFoundError(toolName: name, availableTools: handlers.keys.sorted())
    }
    return try await handler(arguments)
  }
}

/// A tool provider for an MCP client, like passing one to react-lang's
/// Renderer as its `toolProvider`. `callTool` returns the client's raw result
/// (`{ content, structuredContent, isError }`); the provider unwraps it with
/// `extractToolResult`, so error results become `McpToolError`s, which
/// `onError` reports as `mcp-error`.
///
/// It takes a closure rather than a client type, so any MCP client works
/// without this package depending on one: convert the client's result to an
/// `OpenUIValue` (for a JSON-RPC result, `JSON.parse` its text).
public struct McpToolProvider: ToolProvider {
  public typealias CallTool =
    @Sendable (_ name: String, _ arguments: OpenUIObject) async throws -> OpenUIValue

  private let call: CallTool

  public init(callTool: @escaping CallTool) {
    call = callTool
  }

  public func callTool(_ name: String, arguments: OpenUIObject) async throws -> OpenUIValue {
    try extractToolResult(await call(name, arguments))
  }
}

/// A Query statement evaluated against the current state.
public struct QueryNode: Sendable {
  public var statementId: String
  public var toolName: String
  public var args: OpenUIValue
  public var defaults: OpenUIValue
  public var refreshInterval: Double?
  /// Values of the `$state` the query depends on; part of the cache key.
  public var deps: OpenUIObject?
  public var complete: Bool
}

public struct MutationNode: Sendable {
  public var statementId: String
  public var toolName: String
}

/// Query results and status, published to observers when anything changes.
public struct QuerySnapshot: Sendable, Equatable {
  /// Result per Query statement (data, previous data, or defaults) and per
  /// Mutation statement (`{ status, data?, error? }`).
  public var results: OpenUIObject = OpenUIObject()
  public var loading: [String] = []
  public var refetching: [String] = []
  public var errors: [OpenUIError] = []
}

private func stableStringify(_ value: OpenUIValue) -> String {
  func normalize(_ value: OpenUIValue) -> OpenUIValue {
    switch value {
    case .undefined: return "__undefined__"
    case .number(let number) where number.isNaN: return "__NaN__"
    case .number(let number) where number == .infinity: return "__Inf__"
    case .number(let number) where number == -.infinity: return "__-Inf__"
    case .array(let items): return .array(items.map(normalize))
    case .object(let object):
      return .object(OpenUIObject(object.keys.sorted().map { ($0, normalize(object[$0]!)) }))
    default: return value
    }
  }
  return JSON.stringify(normalize(value.jsonRepresentation))
}

private func cacheKey(_ toolName: String, _ args: OpenUIValue, _ deps: OpenUIObject?) -> String {
  let depsKey = deps.map { "::" + stableStringify(.object($0)) } ?? ""
  return toolName + "::" + stableStringify(args) + depsKey
}

/// Fetches, caches and refreshes Query results and runs Mutations. Ports
/// lang-core's `createQueryManager`.
@MainActor
public final class QueryManager {
  private struct QueryEntry {
    var toolName: String
    var args: OpenUIValue
    var defaults: OpenUIValue
    var cacheKey: String
    var prevCacheKey: String?
    var loading = false
    var everFetched = false
    var refreshInterval: Double = 0
    var timer: Task<Void, Never>?
    var needsRefetch = false
    var error: OpenUIError?
  }

  private struct MutationEntry {
    var toolName: String
    var result: OpenUIValue
    var error: OpenUIError?
  }

  private struct CacheEntry {
    var data: OpenUIValue = .undefined
    var inFlight = false
  }

  private let toolProvider: (any ToolProvider)?
  private var queryOrder: [String] = []
  private var queries: [String: QueryEntry] = [:]
  private var mutationOrder: [String] = []
  private var mutations: [String: MutationEntry] = [:]
  private var cache: [String: CacheEntry] = [:]
  private var listeners: [Int: () -> Void] = [:]
  private var nextListenerId = 0
  private var disposed = false
  private var generation = 0

  public private(set) var snapshot = QuerySnapshot()

  public init(toolProvider: (any ToolProvider)?) {
    self.toolProvider = toolProvider
  }

  // MARK: Snapshot

  @discardableResult
  private func rebuildSnapshot() -> Bool {
    var out = QuerySnapshot()
    for id in queryOrder {
      guard let query = queries[id] else { continue }
      out.results[id] = resultValue(query)
      if query.loading {
        out.loading.append(id)
        if query.everFetched { out.refetching.append(id) }
      }
      if let error = query.error { out.errors.append(error) }
    }
    for id in mutationOrder {
      guard let mutation = mutations[id] else { continue }
      out.results[id] = mutation.result
      if let error = mutation.error { out.errors.append(error) }
    }
    guard out != snapshot else { return false }
    snapshot = out
    return true
  }

  private func resultValue(_ query: QueryEntry) -> OpenUIValue {
    if let data = cache[query.cacheKey]?.data, data != .undefined { return data }
    if let previous = query.prevCacheKey, let data = cache[previous]?.data, data != .undefined {
      return data
    }
    return query.defaults
  }

  private func notify() {
    for listener in listeners.sorted(by: { $0.key < $1.key }).map(\.value) { listener() }
  }

  @discardableResult
  public func subscribe(_ listener: @escaping () -> Void) -> () -> Void {
    let id = nextListenerId
    nextListenerId += 1
    listeners[id] = listener
    return { [weak self] in self?.listeners[id] = nil }
  }

  // MARK: Queries

  /// Starts a fetch. Like the JavaScript async function, everything before the
  /// tool call runs synchronously, so the query is marked loading right away.
  private func startFetch(_ fetchKey: String, _ statementId: String) {
    guard let toolProvider, let query = queries[statementId] else { return }
    let toolName = query.toolName
    let args = query.args.objectValue ?? OpenUIObject()
    cache[fetchKey, default: CacheEntry()].inFlight = true
    queries[statementId]?.loading = true
    rebuildSnapshot()
    notify()
    Task {
      let outcome: Result<OpenUIValue, Error>
      do {
        outcome = .success(try await toolProvider.callTool(toolName, arguments: args))
      } catch {
        outcome = .failure(error)
      }
      finishFetch(fetchKey, statementId, toolName, outcome)
    }
  }

  private func finishFetch(
    _ fetchKey: String, _ statementId: String, _ toolName: String,
    _ outcome: Result<OpenUIValue, Error>
  ) {
    switch outcome {
    case .success(let data):
      if disposed { return }
      guard queries[statementId]?.cacheKey == fetchKey else {
        cache[fetchKey]?.inFlight = false
        return
      }
      cache[fetchKey]?.data = data.isNullish ? .null : data
      queries[statementId]?.everFetched = true
      queries[statementId]?.error = nil
      if let previous = queries[statementId]?.prevCacheKey, previous != fetchKey {
        queries[statementId]?.prevCacheKey = nil
        cleanupCacheEntry(previous)
      }
    case .failure(let error):
      if queries[statementId]?.cacheKey == fetchKey {
        queries[statementId]?.error = queryError(
          error, toolName: toolName, statementId: statementId)
      }
    }

    cache[fetchKey]?.inFlight = false
    if queries[statementId]?.cacheKey == fetchKey {
      queries[statementId]?.loading = false
      if rebuildSnapshot() { notify() }
      if queries[statementId]?.needsRefetch == true {
        queries[statementId]?.needsRefetch = false
        if let key = queries[statementId]?.cacheKey { startFetch(key, statementId) }
      }
    } else if rebuildSnapshot() {
      notify()
    }
  }

  private func queryError(_ error: Error, toolName: String, statementId: String) -> OpenUIError {
    if let error = error as? ToolNotFoundError {
      return OpenUIError(
        source: .query, code: "tool-not-found", message: "Query tool \"\(toolName)\" not found",
        statementId: statementId, component: "Query", toolName: toolName,
        hint: error.availableTools.isEmpty
          ? nil : "Available tools: \(error.availableTools.joined(separator: ", "))")
    }
    if let error = error as? McpToolError {
      return OpenUIError(
        source: .query, code: "mcp-error",
        message: "Query \"\(toolName)\" returned an error: \(error.toolErrorText)",
        statementId: statementId, component: "Query", toolName: toolName)
    }
    return OpenUIError(
      source: .query, code: "tool-error",
      message: "Query \"\(toolName)\" failed: \(errorMessage(error))",
      statementId: statementId, component: "Query", toolName: toolName)
  }

  private func cleanupCacheEntry(_ key: String) {
    for query in queries.values where query.cacheKey == key || query.prevCacheKey == key { return }
    cache[key] = nil
  }

  /// Syncs the active Query statements: drops removed ones, fetches new or
  /// changed ones, and (re)schedules refresh intervals.
  public func evaluateQueries(_ nodes: [QueryNode]) {
    if disposed { return }
    let activeIds = Set(nodes.map(\.statementId))
    for id in queryOrder where !activeIds.contains(id) {
      guard let query = queries.removeValue(forKey: id) else { continue }
      query.timer?.cancel()
      cleanupCacheEntry(query.cacheKey)
      if let previous = query.prevCacheKey { cleanupCacheEntry(previous) }
    }
    queryOrder.removeAll { !activeIds.contains($0) }

    for node in nodes where node.complete {
      let key = cacheKey(node.toolName, node.args, node.deps)
      if var existing = queries[node.statementId] {
        if existing.cacheKey != key { existing.prevCacheKey = existing.cacheKey }
        existing.toolName = node.toolName
        existing.args = node.args
        existing.defaults = node.defaults
        existing.cacheKey = key
        queries[node.statementId] = existing
      } else {
        queries[node.statementId] = QueryEntry(
          toolName: node.toolName, args: node.args, defaults: node.defaults, cacheKey: key)
        queryOrder.append(node.statementId)
      }

      let entry = cache[key]
      let hasSettledData = entry.map { $0.data != .undefined && !$0.inFlight } ?? false
      if toolProvider != nil, !hasSettledData, entry?.inFlight != true {
        startFetch(key, node.statementId)
      }

      let interval = node.refreshInterval ?? 0
      if interval != queries[node.statementId]?.refreshInterval {
        queries[node.statementId]?.timer?.cancel()
        queries[node.statementId]?.timer = nil
        if interval > 0 {
          let statementId = node.statementId
          // At most setInterval's longest delay (2³¹−1 ms): the interval comes
          // from the response, and an infinite one can't be slept for.
          let nanoseconds = UInt64(min(interval, 2_147_483.647) * 1_000_000_000)
          queries[node.statementId]?.timer = Task { [weak self] in
            while !Task.isCancelled {
              try? await Task.sleep(nanoseconds: nanoseconds)
              guard let self, !Task.isCancelled, !self.disposed, self.toolProvider != nil,
                let current = self.queries[statementId]
              else { return }
              if self.cache[current.cacheKey]?.inFlight != true {
                self.startFetch(current.cacheKey, statementId)
              }
            }
          }
        }
        queries[node.statementId]?.refreshInterval = interval
      }
    }
    if rebuildSnapshot() { notify() }
  }

  /// The current value for a Query: fetched data, the previous result while a
  /// new key loads, or the declared defaults. `null` for unknown statements.
  public func result(_ statementId: String) -> OpenUIValue {
    guard let query = queries[statementId] else { return .null }
    return resultValue(query)
  }

  public func isLoading(_ statementId: String) -> Bool { queries[statementId]?.loading ?? false }

  public var isAnyLoading: Bool { queries.values.contains { $0.loading } }

  /// Refetches the given queries (all when nil or empty). Queries already in
  /// flight refetch once they settle.
  public func invalidate(_ statementIds: [String]? = nil) {
    if disposed || toolProvider == nil { return }
    let targets =
      (statementIds?.isEmpty == false) ? statementIds!.filter { queries[$0] != nil } : queryOrder
    for id in targets {
      guard let query = queries[id] else { continue }
      if cache[query.cacheKey]?.inFlight == true {
        queries[id]?.needsRefetch = true
      } else {
        startFetch(query.cacheKey, id)
      }
    }
  }

  // MARK: Mutations

  public func registerMutations(_ nodes: [MutationNode]) {
    let activeIds = Set(nodes.map(\.statementId))
    for id in mutationOrder where !activeIds.contains(id) { mutations[id] = nil }
    mutationOrder.removeAll { !activeIds.contains($0) }
    for node in nodes {
      if let existing = mutations[node.statementId] {
        if existing.toolName != node.toolName {
          mutations[node.statementId] = MutationEntry(
            toolName: node.toolName, result: ["status": "idle", "data": .null, "error": .null])
        }
      } else {
        mutations[node.statementId] = MutationEntry(
          toolName: node.toolName, result: ["status": "idle"])
        mutationOrder.append(node.statementId)
      }
    }
    if rebuildSnapshot() { notify() }
  }

  /// Runs a mutation. Returns false when it fails, is already running, or
  /// there is no tool provider; a failure halts the action's remaining steps.
  public func fireMutation(
    _ statementId: String, args: OpenUIObject, refreshQueryIds: [String]? = nil
  ) async -> Bool {
    guard !disposed, let toolProvider, let mutation = mutations[statementId],
      mutation.result["status"].stringValue != "loading"
    else { return false }
    let currentGeneration = generation
    mutations[statementId]?.result = ["status": "loading"]
    rebuildSnapshot()
    notify()

    var success = false
    do {
      let data = try await toolProvider.callTool(mutation.toolName, arguments: args)
      if disposed || currentGeneration != generation { return false }
      mutations[statementId]?.result = ["status": "success", "data": data]
      mutations[statementId]?.error = nil
      success = true
    } catch {
      if disposed || currentGeneration != generation { return false }
      mutations[statementId]?.result = ["status": "error", "error": .string(errorMessage(error))]
      mutations[statementId]?.error = mutationError(
        error, toolName: mutation.toolName, statementId: statementId)
    }
    rebuildSnapshot()
    notify()
    if success, let refreshQueryIds, !refreshQueryIds.isEmpty { invalidate(refreshQueryIds) }
    return success
  }

  private func mutationError(_ error: Error, toolName: String, statementId: String) -> OpenUIError {
    if let error = error as? ToolNotFoundError {
      return OpenUIError(
        source: .mutation, code: "tool-not-found",
        message: "Mutation tool \"\(toolName)\" not found", statementId: statementId,
        component: "Mutation", toolName: toolName,
        hint: error.availableTools.isEmpty
          ? nil : "Available tools: \(error.availableTools.joined(separator: ", "))")
    }
    if let error = error as? McpToolError {
      return OpenUIError(
        source: .mutation, code: "mcp-error",
        message: "Mutation \"\(toolName)\" returned an error: \(error.toolErrorText)",
        statementId: statementId, component: "Mutation", toolName: toolName)
    }
    return OpenUIError(
      source: .mutation, code: "tool-error",
      message: "Mutation \"\(toolName)\" failed: \(errorMessage(error))",
      statementId: statementId, component: "Mutation", toolName: toolName)
  }

  /// `{ status, data?, error? }` for a Mutation statement, or nil.
  public func mutationResult(_ statementId: String) -> OpenUIValue? {
    mutations[statementId]?.result
  }

  public func activate() { disposed = false }

  public func dispose() {
    disposed = true
    generation += 1
    listeners.removeAll()
    for id in queryOrder {
      queries[id]?.timer?.cancel()
      queries[id]?.timer = nil
      queries[id]?.refreshInterval = 0
      queries[id]?.loading = false
      queries[id]?.needsRefetch = false
    }
    mutations.removeAll()
    mutationOrder.removeAll()
  }
}
