// OpenUILang — native async transport and lifecycle bridge to lang-core.
import Foundation

public protocol ToolProvider {
    func callTool(name: OpenUIString, arguments: OpenUIObject) async throws -> Value
}

public struct ToolNotFoundError: Error, Sendable {
    public var toolName: OpenUIString
    public var availableTools: [OpenUIString]
    public init(toolName: OpenUIString, availableTools: [OpenUIString] = []) {
        self.toolName = toolName
        self.availableTools = availableTools
    }
    @_disfavoredOverload public init(toolName: String, availableTools: [String] = []) {
        self.init(toolName: OpenUIString(toolName), availableTools: availableTools.map { OpenUIString($0) })
    }

}

public enum QueryStatus: String, Sendable { case idle, loading, success, error }

public struct QueryState: Sendable {
    public var status: QueryStatus
    public var data: Value?
    public var error: OpenUIError?
    public init(status: QueryStatus, data: Value? = nil, error: OpenUIError? = nil) {
        self.status = status; self.data = data; self.error = error
    }
}

public struct MutationState: Sendable {
    public let status: QueryStatus
    public let data: Value?
    public let error: OpenUIError?
    /// The reference result object is stable until the lifecycle changes.
    public let value: Value
    public init(status: QueryStatus, data: Value? = nil, error: OpenUIError? = nil, errorText: OpenUIString? = nil) {
        self.init(status: status, data: data, error: error, errorText: errorText, sharedValue: nil)
    }
    init(status: QueryStatus, data: Value?, error: OpenUIError?, errorText: OpenUIString?, sharedValue: Value?) {
        self.status = status; self.data = data; self.error = error
        var fields = [ObjectField(key: "status", value: .string(status.rawValue))]
        if let data { fields.append(ObjectField(key: "data", value: data)) }
        if let text = errorText ?? error.map({ OpenUIString($0.message) }) { fields.append(ObjectField(key: "error", value: .string(text))) }
        self.value = sharedValue ?? .object(fields)
    }
}

/// Evaluated declarations. Renderers synchronize these only after generation ends.
public struct QueryRequest: Sendable {
    public var statementId: String
    public var tool: OpenUIString
    public var args: Value
    public var defaults: Value
    public var deps: Value?
    public var refreshInterval: Double?
    public var complete: Bool
    public init(statementId: String, tool: OpenUIString, args: Value, defaults: Value = .null,
                deps: Value? = nil, refreshInterval: Double? = nil, complete: Bool = true) {
        self.statementId = statementId; self.tool = tool; self.args = args; self.defaults = defaults
        self.deps = deps; self.refreshInterval = refreshInterval; self.complete = complete
    }
    @_disfavoredOverload public init(statementId: String, tool: String, args: Value, defaults: Value = .null,
                deps: Value? = nil, refreshInterval: Double? = nil, complete: Bool = true) {
        self.init(statementId: statementId, tool: OpenUIString(tool), args: args, defaults: defaults, deps: deps, refreshInterval: refreshInterval, complete: complete)
    }

}

import JavaScriptCore

/// Native lifecycle/transport adapter; cache, query state and mutation state are
/// executed by lang-core. Each declaration owns its upstream mutation manager so
/// replacing one declaration invalidates exactly that declaration's awaits.
public final class QueryManager {
    public typealias ToolFn = @Sendable (OpenUIObject) async throws -> Value
    private let core = SharedCore.shared
    private let provider: ToolProvider?
    private let tools: [OpenUIString: ToolFn]?
    private var manager: JSValue!
    private var mutations: [String: JSValue] = [:]
    private var mutationTools: [String: OpenUIString] = [:]
    private var requests: [String: QueryRequest] = [:]
    private var listeners: [UUID: @Sendable () -> Void] = [:]
    private var pending: [UUID: (Task<Void, Never>, JSValue)] = [:]
    private var settled: [String: [@Sendable () -> Void]] = [:]
    private var disposed = false
    private var providerObject: JSValue!
    public init(provider: ToolProvider?) { self.provider = provider; tools = nil; initialize() }
    public init(tools: [String: ToolFn]) {
        provider = nil; self.tools = Dictionary(tools.map { (OpenUIString($0.key), $0.value) }, uniquingKeysWith: { _, new in new }); initialize()
    }
    public init(toolEntries: [(OpenUIString, ToolFn)]) { provider = nil; tools = Dictionary(toolEntries, uniquingKeysWith: { _, new in new }); initialize() }
    deinit { dispose() }
    private func initialize() { core.sync {
        let call: @convention(block) (JSValue, JSValue) -> JSValue = { [weak self] name, args in
            guard let self else { return JSValue(undefinedIn: SharedCore.shared.context) }
            let start: @convention(block) (JSValue, JSValue) -> Void = { [weak self] resolve, reject in self?.startTool(name, args, resolve, reject) }
            return self.core.call("promise", [start])
        }
        providerObject = core.object()
        providerObject.setObject(call, forKeyedSubscript: "callTool" as NSString)
        manager = makeManager()
    } }
    private func makeManager() -> JSValue {
        let js = core.call("queryManager", [provider != nil || tools != nil ? providerObject! : JSValue(nullIn: core.context)!])
        let changed: @convention(block) () -> Void = { [weak self] in self?.notify() }
        _ = js.invokeMethod("subscribe", withArguments: [changed]);return js
    }
    private func startTool(_ name: JSValue, _ args: JSValue, _ resolve: JSValue, _ reject: JSValue) {
        guard !disposed else { reject.call(withArguments: [core.call("error", ["Disposed"])]); return }
        let tool = core.string(name), id = UUID(), provider = self.provider, tools = self.tools
        let decoded = core.decode(args, interpret: false)
        let arguments: OpenUIObject
        if case .object(let fields) = decoded { arguments = fields } else { arguments = OpenUIObject([]) }
        let task = Task { [weak self] in
            let result: Result<Value, Error>
            do {
                if let tools {
                    guard let fn = tools[tool] else { throw ToolNotFoundError(toolName: tool, availableTools: tools.keys.sorted { $0.codeUnits.lexicographicallyPrecedes($1.codeUnits) }) }
                    result = .success(try await fn(arguments))
                } else if let provider { result = .success(try await provider.callTool(name: tool, arguments: arguments)) }
                else { throw ToolNotFoundError(toolName: tool) }
            } catch { result = .failure(error) }
            self?.finishTool(id, result, resolve, reject)
        }
        pending[id] = (task, reject)
    }
    private func finishTool(_ id: UUID, _ result: Result<Value, Error>, _ resolve: JSValue, _ reject: JSValue) { core.sync {
        guard pending.removeValue(forKey: id) != nil, !disposed else { return }
        switch result {
        case .success(let value): resolve.call(withArguments: [core.encode(value)])
        case .failure(let error):
            let js: JSValue
            if let error = error as? ToolNotFoundError { js = core.call("toolError", [core.string(error.toolName), core.array(error.availableTools.map(core.string))]) }
            else if let error = error as? MCPToolError { js = core.call("mcpError", [core.string(error.toolErrorText)]) }
            else { js = core.call("error", [String(describing: error)]) }
            reject.call(withArguments: [js])
        }
    } }
    @discardableResult public func subscribe(_ listener: @escaping @Sendable () -> Void) -> () -> Void {
        let id = UUID();core.sync { if !disposed { listeners[id] = listener } }
        return { [weak self] in self?.core.sync { _ = self?.listeners.removeValue(forKey: id) } }
    }
    private func notify() {
        for (id, callbacks) in settled where manager?.invokeMethod("isLoading", withArguments: [id]).toBool() == false {
            settled.removeValue(forKey: id);callbacks.forEach { $0() }
        }
        Array(listeners.values).forEach { $0() }
    }
    public func synchronizeQueries(_ requests: [QueryRequest]) { core.sync {
        guard !disposed else { return }
        self.requests = Dictionary(requests.filter(\.complete).map { ($0.statementId, $0) }, uniquingKeysWith: { _, new in new })
        evaluateQueries()
    } }
    private func evaluateQueries() {
        let nodes = requests.values.sorted { $0.statementId < $1.statementId }.map { r -> JSValue in
            core.call("queryNode", [r.statementId, core.string(r.tool), core.encode(r.args), core.encode(r.defaults), core.encode(r.deps ?? .null), r.refreshInterval ?? 0, r.complete])
        }
        _ = manager.invokeMethod("evaluateQueries", withArguments: [core.array(nodes)])
    }
    public func invalidateQuery(statementId: String) { core.sync {
        guard !disposed, requests[statementId] != nil else { return }
        _ = manager.invokeMethod("invalidate", withArguments: [[statementId]])
    } }
    public func runQuery(statementId: String, tool: OpenUIString, args: Value, defaults: Value, onSettled: (@Sendable () -> Void)? = nil) { core.sync {
        guard !disposed else { return }
        let previous = requests[statementId]
        requests[statementId] = QueryRequest(statementId: statementId, tool: tool, args: args, defaults: defaults, deps: previous?.deps, refreshInterval: previous?.refreshInterval)
        if let onSettled { settled[statementId, default: []].append(onSettled) }
        if let previous, previous.tool == tool, previous.args == args,
           previous.defaults == defaults {
            invalidateQuery(statementId: statementId)
        } else {
            let sameRequest = previous.map { $0.tool == tool && $0.args == args } ?? false
            let wasLoading = manager.invokeMethod("isLoading", withArguments: [statementId]).toBool()
            // A changed declaration starts its upstream fetch once. Only
            // invalidate if synchronization reused settled data instead, or
            // queue Run behind the same request that was already in flight.
            evaluateQueries()
            if (sameRequest && wasLoading) || manager.invokeMethod("isLoading", withArguments: [statementId]).toBool() == false {
                invalidateQuery(statementId: statementId)
            }
        }
    } }
    public func queryState(for id: String) -> QueryState? { core.sync {
        guard requests[id] != nil else { return nil }
        let snapshot = manager.invokeMethod("getSnapshot", withArguments: [])!
        let error = core.items(snapshot.forProperty("__openui_errors")).first { $0.forProperty("statementId").toString() == id }.map(core.error)
        let loading = manager.invokeMethod("isLoading", withArguments: [id]).toBool()
        return QueryState(status: loading ? .loading : error != nil ? .error : provider == nil && tools == nil ? .idle : .success, data: core.decode(manager.invokeMethod("getResult", withArguments: [id])), error: error)
    } }
    public func registerMutations(_ declarations: [String: OpenUIString]) { core.sync {
        guard !disposed else { return }
        for id in Array(mutations.keys) where declarations[id] != mutationTools[id] {
            _ = mutations.removeValue(forKey: id)?.invokeMethod("dispose", withArguments: [])
        }
        mutationTools = declarations
        for (id, name) in declarations where mutations[id] == nil {
            let js = makeManager()
            _ = js.invokeMethod("registerMutations", withArguments: [core.array([core.object([("statementId", core.string(OpenUIString(id))), ("toolName", core.string(name))])])])
            mutations[id] = js
        }
    } }
    public func invalidateMutations() { core.sync {
        let declarations = mutationTools
        mutations.values.forEach { _ = $0.invokeMethod("dispose", withArguments: []) }
        mutations.removeAll();registerMutations(declarations)
    } }
    public func mutationState(for id: String) -> MutationState? { core.sync {
        guard let js = mutations[id] else { return nil }
        let value = js.invokeMethod("getMutationResult", withArguments: [id])!
        let snapshot = js.invokeMethod("getSnapshot", withArguments: [])!
        let error = core.items(snapshot.forProperty("__openui_errors")).first.map(core.error)
        return MutationState(status: QueryStatus(rawValue: value.forProperty("status").toString()) ?? .idle,
            data: value.forProperty("data").isUndefined ? nil : core.decode(value.forProperty("data")), error: error,
            errorText: value.forProperty("error").isUndefined || value.forProperty("error").isNull ? nil : core.string(value.forProperty("error")), sharedValue: core.decode(value))
    } }
    public func runMutation(statementId: String, tool: OpenUIString, args: Value) async -> MutationState {
        await withCheckedContinuation { continuation in core.sync {
            guard !disposed else { continuation.resume(returning: MutationState(status: .error));return }
            if mutationTools[statementId] != tool {
                var declarations = mutationTools;declarations[statementId] = tool;registerMutations(declarations)
            }
            guard let js = mutations[statementId], js.invokeMethod("getMutationResult", withArguments: [statementId]).forProperty("status").toString() != "loading" else {
                continuation.resume(returning: mutationState(for: statementId) ?? MutationState(status: .error));return
            }
            let promise = js.invokeMethod("fireMutation", withArguments: [statementId, core.encode(args)])!
            let finish: @convention(block) (Bool) -> Void = { [weak self] success in
                guard let self else { continuation.resume(returning: MutationState(status: .error));return }
                self.core.sync {
                    guard self.mutations[statementId] === js else { continuation.resume(returning: MutationState(status: .error));return }
                    continuation.resume(returning: self.mutationState(for: statementId) ?? MutationState(status: .error))
                }
            }
            _ = promise.invokeMethod("then", withArguments: [finish])
        } }
    }
    public func dispose() { core.sync {
        guard !disposed else { return };disposed = true
        _ = manager?.invokeMethod("dispose", withArguments: [])
        mutations.values.forEach { _ = $0.invokeMethod("dispose", withArguments: []) }
        listeners.removeAll();settled.removeAll();requests.removeAll();mutations.removeAll()
        let tasks = pending;pending.removeAll()
        for (_, (task, reject)) in tasks { task.cancel();reject.call(withArguments: [core.call("error", ["Disposed"])]) }
    } }
}
