// SwiftUI ownership around the platform-independent OpenUI language runtime.
import SwiftUI
import OpenUILang
import Combine

/// Optional diagnostic evidence from the real action evaluation, before its
/// result is written. Observing this does not evaluate an expression twice.
public struct OpenUIActionEvaluation {
    public let sourceRevision: Int
    public let expression: ASTNode
    public let state: [OpenUIString: Value]
    public let result: Value
}

@MainActor
public final class OpenUIState: ObservableObject {
    @Published public private(set) var root: EvaluatedElement?
    @Published public private(set) var errors: [OpenUIError] = []
    @Published public private(set) var isComplete = false
    @Published public private(set) var queryStates: [String: QueryState] = [:]
    @Published public private(set) var mutationStates: [String: MutationState] = [:]
    /// Matches the reference context's loading signal, including declared
    /// Queries waiting for their streamed program to become executable.
    public var isQueryLoading: Bool {
        queryStates.values.contains { $0.status == .loading }
            || (!isComplete && !(latestResult?.queryStatements.isEmpty ?? true))
    }
    public var onAction: ((ActionEvent) -> Void)?
    public var onParseResult: ((ParseResult) -> Void)?
    public var onError: (([OpenUIError]) -> Void)?
    /// Replacing source invalidates callbacks belonging to an older UI tree.
    public var sourceRevision: Int { streamGeneration }
    /// Native presentation identity changes only when the program is replaced.
    /// Appended chunks, state writes, query results and patches keep local UI.
    public private(set) var presentationRevision = 0
    private var errorRevision: [String]?
    public var onStateUpdate: (([OpenUIString: Value]) -> Void)?
    public var onActionEvaluation: ((OpenUIActionEvaluation) -> Void)?

    private var parser: StreamParser
    private var store: Store
    private var queryManager: QueryManager
    private let schema: LibrarySchema
    private let functions: [String: CustomFunction]
    private let toolProvider: ToolProvider?
    private var latestResult: ParseResult?
    /// Stream termination alone does not make a truncated preview executable.
    /// Recoverable rendering diagnostics remain local to their components.
    var canExecuteActions: Bool {
        guard isComplete, let result = latestResult else { return false }
        return !result.meta.incomplete && result.meta.unresolved.isEmpty
    }
    private var liveElements: [String: [EvaluatedElement]] = [:]
    private var liveElementCache: [ObjectIdentifier: (snapshot: EvaluatedElement, current: EvaluatedElement)] = [:]
    func liveElement(matching element: EvaluatedElement) -> EvaluatedElement {
        guard let root, root !== element else { return element }
        let key = ObjectIdentifier(element)
        if let cached = liveElementCache[key], cached.snapshot === element { return cached.current }
        func same(_ a: Value, _ b: Value, depth: Int) -> Bool {
            guard depth < 256 else { return false }
            switch (a,b) {
            case (.element(let x), .element(let y)):
                return x.typeName == y.typeName && x.statementId == y.statementId && props(x,y,depth:depth+1)
            case (.array(let x), .array(let y)):
                return x.count == y.count && zip(x,y).allSatisfy { same($0,$1,depth:depth+1) }
            case (.object(let x), .object(let y)):
                return x.count == y.count && zip(x,y).allSatisfy { $0.key == $1.key && same($0.value,$1.value,depth:depth+1) }
            default: return a == b
            }
        }
        func props(_ x: EvaluatedElement, _ y: EvaluatedElement, depth: Int) -> Bool {
            x.props.count == y.props.count && zip(x.props,y.props).allSatisfy {
                $0.0 == $1.0 && same($0.1,$1.1,depth:depth+1)
            }
        }
        // A stable native child may hold an earlier readiness snapshot even
        // when its displayed props have not changed. Match nested values too;
        // never borrow readiness from a semantically different control.
        let matches = (liveElements[element.typeName] ?? []).filter {
            $0.statementId == element.statementId && props($0, element, depth: 0)
        }
        func readiness(_ a: Value, _ b: Value, depth: Int) -> Bool {
            guard depth < 256 else { return false }
            switch (a, b) {
            case (.element(let x), .element(let y)): return metadata(x, y, depth: depth + 1)
            case (.actionPlan(let x), .actionPlan(let y)): return x.isSourceComplete == y.isSourceComplete
            case (.array(let x), .array(let y)):
                return x.count == y.count && zip(x,y).allSatisfy { readiness($0,$1,depth:depth+1) }
            case (.object(let x), .object(let y)):
                return x.count == y.count && zip(x,y).allSatisfy { readiness($0.value,$1.value,depth:depth+1) }
            default: return true
            }
        }
        func metadata(_ x: EvaluatedElement, _ y: EvaluatedElement, depth: Int) -> Bool {
            x.isSourceComplete == y.isSourceComplete && x.props.count == y.props.count
                && zip(x.props,y.props).allSatisfy { readiness($0.1,$1.1,depth:depth+1) }
        }
        let current = matches.first.flatMap { first in
            matches.allSatisfy { metadata(first,$0,depth:0) } ? first : nil
        } ?? element
        liveElementCache[key] = (element, current)
        return current
    }
    private func indexLiveElements(_ root: EvaluatedElement?) {
        liveElements.removeAll(keepingCapacity: true)
        liveElementCache.removeAll(keepingCapacity: true)
        var seen: Set<ObjectIdentifier> = []
        func visit(_ value: Value, depth: Int) {
            guard depth < 256 else { return }
            switch value {
            case .element(let element):
                guard seen.insert(ObjectIdentifier(element)).inserted else { return }
                liveElements[element.typeName, default: []].append(element)
                element.props.forEach { visit($0.1, depth: depth + 1) }
            case .array(let values):
                guard seen.insert(ObjectIdentifier(values)).inserted else { return }
                values.forEach { visit($0, depth: depth + 1) }
            case .object(let values):
                guard seen.insert(ObjectIdentifier(values)).inserted else { return }
                values.forEach { visit($0.value, depth: depth + 1) }
            default: break
            }
        }
        if let root { visit(.element(root), depth: 0) }
    }
    func isElementReady(_ snapshot: EvaluatedElement) -> Bool {
        let element = snapshot.isSourceComplete ? snapshot : liveElement(matching: snapshot)
        guard latestResult != nil, element.isSourceComplete else { return false }
        func ready(_ value: Value) -> Bool {
            switch value {
            case .actionPlan(let plan): return isPlanReady(plan)
            case .array(let values): return values.allSatisfy(ready)
            case .object(let fields): return fields.allSatisfy { ready($0.value) }
            default: return true
            }
        }
        return element.props.allSatisfy { ready($0.1) }
    }
    func isPlanReady(_ plan: ActionPlan) -> Bool {
        guard plan.isSourceComplete else { return false }
        if canExecuteActions { return true }
        func ready(_ node: ASTNode) -> Bool {
            var complete = true
            walkAST(node) { node in
                switch node {
                case .ph, .ref: complete = false
                case .stateRef(let name):
                    if name != "$value", store.get(name) == nil { complete = false }
                case .runtimeRef(let name, let type):
                    if type == .query, queryManager.queryState(for: name)?.data == nil { complete = false }
                    if type == .mutation, queryManager.mutationState(for: name)?.status != .success { complete = false }
                case .runtimeValue(let value):
                    if case .undefined = value { complete = false }
                default: break
                }
            }
            return complete
        }
        return plan.steps.allSatisfy { step in
            switch step {
            case .openUrl(let node): return ready(node)
            case .continueConversation(let message, let context): return ready(message) && context.map(ready) != false
            case .set(_, let node): return ready(node)
            case .reset: return true
            case .custom(_, let args): return args.allSatisfy { ready($0.1) }
            case .run: return canExecuteActions
            }
        }
    }
    private var streamGeneration = 0
    private var persistedState: [OpenUIString: Value]
    private var unsubscribe: (() -> Void)?
    private var source = ""
    private var queryRequests: [String: QueryRequest] = [:]
    private var querySourceGeneration = -1
    private var queryStoreSnapshot: [OpenUIString: Value] = [:]
    private var idleMutations: [String: Value] = [:]
    let mediaCache = NativeMediaCache()
    let resourceStore = NativeResourceStore()

    public init(schema: LibrarySchema, functions: [String: CustomFunction] = [:],
                toolProvider: ToolProvider? = nil, persistedState: [OpenUIString: Value] = [:]) {
        self.toolProvider = toolProvider; self.persistedState = persistedState
        self.schema = schema; self.functions = functions
        parser = createStreamingParser(schema: schema); store = createStore()
        queryManager = QueryManager(provider: toolProvider)
        observeQueries()
    }

    deinit {
        unsubscribe?(); queryManager.dispose()
        // In-flight callers can retain the caches beyond this state. Cancel
        // their work when the owning state ends, on the caches' actor.
        let mediaCache = self.mediaCache
        let resourceStore = self.resourceStore
        Task { @MainActor in
            mediaCache.removeAll()
            resourceStore.removeAll()
        }
    }

    private func observeQueries() {
        let generation = streamGeneration
        unsubscribe = queryManager.subscribe { [weak self] in
            Task { @MainActor [weak self] in
                guard let self, self.streamGeneration == generation, let result = self.latestResult else { return }
                self.update(from: result, synchronizeQueries: false)
            }
        }
    }

    public func push(_ chunk: String) {
        if isComplete { reset() }
        source += chunk
        acceptSource(parser.push(chunk, complete: false))
    }

    public func complete() {
        guard !isComplete else { return }
        isComplete = true
        acceptSource(parser.getResult(complete: true))
    }

    public func reset() {
        let hadErrors = !errors.isEmpty
        streamGeneration += 1
        mediaCache.removeAll()
        resourceStore.removeAll()
        presentationRevision += 1
        unsubscribe?(); queryManager.dispose()
        queryManager = QueryManager(provider: toolProvider)
        parser = createStreamingParser(schema: schema); store = createStore()
        latestResult = nil; source = ""; persistedState = [:]
        indexLiveElements(nil)
        queryRequests = [:]; querySourceGeneration = -1; queryStoreSnapshot = [:]; idleMutations = [:]
        root = nil; errors = []; queryStates = [:]; mutationStates = [:]; isComplete = false
        errorRevision = nil
        observeQueries()
        if hadErrors { onError?([]) }
    }

    /// Host-owned full-response and editing surfaces can retain user state.
    public func setSource(_ text: String, streaming: Bool = false) {
        // Full-buffer streaming is also supported: a growing UTF-16 prefix is
        // the same presentation, including its final completion snapshot.
        let extendsStream = !isComplete && !source.isEmpty && text.utf16.starts(with: source.utf16)
        replaceSource(text, streaming: streaming, replacesPresentation: !extendsStream)
    }

    private func replaceSource(_ text: String, streaming: Bool, replacesPresentation: Bool) {
        streamGeneration += 1
        if replacesPresentation { presentationRevision += 1; mediaCache.removeAll(); resourceStore.removeAll() }
        unsubscribe?(); observeQueries()
        queryManager.invalidateMutations(); idleMutations = [:]
        source = text; isComplete = !streaming
        acceptSource(parser.set(text, complete: !streaming))
    }

    /// A patch is merged only once its stream is finished.
    public func applyPatch(_ patch: String) {
        guard isComplete else { return }
        replaceSource(mergeStatements(source, patch), streaming: false, replacesPresentation: false)
    }

    public func stateValue(_ name: OpenUIString) -> Value { store.get(name) ?? .null }

    public func setState(_ name: OpenUIString, value: Value) {
        guard let result = latestResult else { return }
        store.set(name, value: value, pristine: false)
        update(from: result); onStateUpdate?(store.getSnapshot())
    }

    public func snapshotState() -> [OpenUIString: Value] { store.getSnapshot() }

    public func restoreState(_ values: [OpenUIString: Value]) {
        persistedState = values
        if let result = latestResult { update(from: result) }
    }

    /// Components keep native Binding ownership while writing through this runtime.
    public func binding(for name: String) -> Binding<Value> {
        Binding(get: { [weak self] in self?.stateValue(name) ?? .null },
                set: { [weak self] in self?.setState(name, value: $0) })
    }

    public func binding(for element: EvaluatedElement, prop: String) -> Binding<Value>? {
        guard let value = element.props.last(where: { $0.0 == prop })?.1 else { return nil }
        if case .binding(let assignment) = value { return binding(for: assignment.target) }
        if case .reactiveBinding(let assignment) = value {
            let target = assignment.target, expression = assignment.expression
            return Binding(get: { [weak self] in self?.stateValue(target) ?? .null }, set: { [weak self] newValue in
                guard let self, let result = self.latestResult else { return }
                let evaluator = self.makeEvaluator(result: result, extraScope: ["$value": newValue])
                self.setState(target, value: evaluator.evaluate(expression))
            })
        }
        return nil
    }

    public func fieldValue(form: OpenUIString?, name: OpenUIString, fallback: Value = .null) -> Value {
        let value: Value?
        if let form, case .object(let fields) = store.get(form) {
            value = fields.last(where: { $0.key == name })?.value
        } else if form == nil { value = store.get(name) } else { value = nil }
        if case .object(let fields) = value { return fields.last(where: { $0.key == "value" })?.value ?? value ?? fallback }
        return value ?? fallback
    }

    public func setFieldValue(form: OpenUIString?, name: OpenUIString, value: Value, componentType: String? = "input") {
        var properties = [ObjectField(key: "value", value: value)]
        if let componentType { properties.append(ObjectField(key: "componentType", value: .string(componentType))) }
        let wrapped = Value.object(properties)
        if let form {
            var fields: [ObjectField] = []
            if case .object(let current) = store.get(form) { fields = Array(current) }
            fields.removeAll { $0.key == name }; fields.append(ObjectField(key: name, value: wrapped))
            setState(form, value: .object(fields))
        } else { setState(name, value: wrapped) }
    }

    /// Call when an application field mounts. Persisted/user-entered values
    /// win over the component's initial value.
    public func initializeField(form: OpenUIString?, name: OpenUIString, value: Value, componentType: String = "input") {
        let existing: Value?
        if let form, case .object(let fields) = store.get(form) { existing = fields.last(where: { $0.key == name })?.value }
        else if form == nil { existing = store.get(name) } else { existing = nil }
        guard existing == nil else { return }
        setFieldValue(form: form, name: name, value: value, componentType: componentType)
    }

    public func fieldBinding(form: OpenUIString?, name: OpenUIString, fallback: Value = .null, componentType: String = "input") -> Binding<Value> {
        Binding(get: { [weak self] in self?.fieldValue(form: form, name: name, fallback: fallback) ?? fallback },
                set: { [weak self] in self?.setFieldValue(form: form, name: name, value: $0, componentType: componentType) })
    }

    private func formPayload(_ name: OpenUIString?) -> [(OpenUIString, Value)] {
        if let name, let value = store.get(name) { return [(name, value)] }
        return store.getSnapshot().sorted { $0.key < $1.key }.map { ($0.key, $0.value) }
    }

    /// Button dispatch including the legacy action-object wire shape. JSON
    /// objects cannot impersonate a declared custom action; only @Name calls do.
    public func triggerAction(_ userMessage: String, formName: OpenUIString? = nil, action: Value? = nil) async -> [ActionEvent] {
        await triggerAction(userMessage, formName: formName, action: action, source: nil)
    }
    func triggerAction(_ userMessage: String, formName: OpenUIString?, action: Value?, source: EvaluatedElement?) async -> [ActionEvent] {
        guard source.map(isElementReady) ?? canExecuteActions else { return [] }
        if case .actionPlan(let plan) = action { return await perform(plan, formName: formName, source: source) }
        if case .object(let fields) = action {
            func field(_ key: String) -> Value? { fields.last(where: { $0.key == key })?.value }
            let type: OpenUIString
            if case .string(let name) = field("type"), !name.isEmpty { type = name } else { type = "continue_conversation" }
            guard schema.callDefs[type.displayString].map({ $0.kind == .action && !$0.isBuiltin }) != true else { return [] }
            var params: [ObjectField] = []
            if case .object(let values) = field("params") { params = Array(values) }
            for key in ["url", "context"] {
                if let value = field(key), isTruthy(value) {
                    params.removeAll { $0.key == key }; params.append(.init(key: key, value: value))
                }
            }
            let event = ActionEvent(type: type, params: params.map { ($0.key, $0.value) }, humanFriendlyMessage: OpenUIString(userMessage),
                                    formState: formPayload(formName), formName: formName)
            onAction?(event); return [event]
        }
        guard action == nil || action == .null else { return [] }
        return await perform(ActionPlan(steps: [.continueConversation(messageAST: .str(userMessage), contextAST: nil)]), formName: formName, source: source)
    }

    /// A retained control can outlive a parser readiness snapshot. Resolve only
    /// the same action in the same live source before checking or dispatching it.
    func currentActionPlan(_ plan: ActionPlan, source: EvaluatedElement?) -> ActionPlan {
        var plan = plan
        if !plan.isSourceComplete, let source {
            let live = liveElement(matching: source)
            func matching(_ value: Value) -> ActionPlan? {
                switch value {
                case .actionPlan(let current): return current == plan && current.isSourceComplete ? current : nil
                case .array(let values): return values.lazy.compactMap(matching).first
                case .object(let fields): return fields.lazy.compactMap { matching($0.value) }.first
                default: return nil
                }
            }
            if live !== source, let refreshed = live.props.lazy.compactMap({ matching($0.1) }).first { plan = refreshed }
        }
        return plan
    }

    public func perform(_ plan: ActionPlan, formName: OpenUIString? = nil) async -> [ActionEvent] {
        await perform(plan, formName: formName, source: nil)
    }
    func perform(_ plan: ActionPlan, formName: OpenUIString?, source: EvaluatedElement?) async -> [ActionEvent] {
        let plan = currentActionPlan(plan, source: source)
        guard source.map(isElementReady) ?? canExecuteActions, source == nil || isPlanReady(plan) else { return [] }
        let generation = streamGeneration
        let defaults = createStore()
        defaults.initialize(defaults: latestResult!.stateDeclarations, persisted: [:])
        let context = ActionRuntimeContext(
            store: store,
            evaluate: { [weak self] node in
                guard let self, let result = self.latestResult else { return .null }
                let snapshot = self.onActionEvaluation == nil ? [:] : self.store.getSnapshot()
                let value = self.makeEvaluator(result: result).evaluate(node)
                self.onActionEvaluation?(OpenUIActionEvaluation(sourceRevision: generation,
                    expression: node, state: snapshot, result: value))
                return value
            },
            stateDefaults: defaults.getSnapshot(),
            runQuery: { [weak self] in self?.runDeclaredQuery($0) },
            runMutation: { [weak self] id in
                guard let self, self.streamGeneration == generation else { return .failure }
                return await self.runDeclaredMutation(id, generation: generation)
            },
            formState: { [weak self] in self?.formPayload(formName) ?? [] }, formName: formName,
            isActive: { [weak self] in self?.streamGeneration == generation },
            onStateChange: { [weak self] in
                guard let self, self.streamGeneration == generation, let result = self.latestResult else { return }
                self.update(from: result); self.onStateUpdate?(self.store.getSnapshot())
            },
            onEvent: { [weak self] event in
                guard let self, self.streamGeneration == generation else { return }
                self.onAction?(event)
            }
        )
        let events = await runActionPlan(plan, context: context)
        guard streamGeneration == generation, let result = latestResult else { return [] }
        update(from: result)
        return events
    }

    private func runDeclaredQuery(_ id: String) {
        // Match the reference adapter: declarations are synchronized by source
        // and Store changes; Run only invalidates the current declaration.
        queryManager.invalidateQuery(statementId: id)
    }

    private func runDeclaredMutation(_ id: String, generation: Int) async -> MutationOutcome {
        guard let result = latestResult, queryManager.mutationState(for: id)?.status != .loading,
              let mutation = result.mutationStatements.first(where: { $0.statementId == id }),
              let toolAST = mutation.toolAST else { return .failure }
        let evaluator = makeEvaluator(result: result)
        guard case .string(let tool) = evaluator.evaluate(toolAST) else { return .failure }
        let args = mutation.argsAST.map { transport(evaluator.evaluate($0)) } ?? .object([])
        let outcome = await queryManager.runMutation(statementId: id, tool: tool, args: args)
        guard streamGeneration == generation else { return .failure }
        update(from: latestResult ?? result)
        return outcome.status == .success ? .success(outcome.data ?? .null) : .failure
    }

    public func runQuery(statementId: String, tool: OpenUIString, args: Value, defaults: Value = .null) {
        guard isComplete, let result = latestResult,
              result.queryStatements.contains(where: { $0.statementId == statementId }) else { return }
        let previous = queryRequests[statementId]
        queryRequests[statementId] = QueryRequest(statementId: statementId, tool: tool, args: transport(args), defaults: defaults,
                                                deps: previous?.deps, refreshInterval: previous?.refreshInterval)
        queryManager.runQuery(statementId: statementId, tool: tool, args: transport(args), defaults: defaults)
        update(from: result)
    }

    private func transport(_ value: Value) -> Value {
        switch value {
        case .binding(let assignment), .reactiveBinding(let assignment): return store.get(assignment.target) ?? .null
        case .array(let values):
            let next = values.map(transport)
            return zip(values, next).allSatisfy { $0.isSameValue(as: $1) } ? value : .array(next)
        case .object(let fields):
            let next = fields.map { ObjectField(key: $0.key, value: transport($0.value)) }
            return zip(fields, next).allSatisfy { $0.value.isSameValue(as: $1.value) } ? value : .object(next)
        default: return value
        }
    }

    private func makeEvaluator(result: ParseResult, extraScope: [String: Value]? = nil) -> Evaluator {
        final class Box { weak var evaluator: Evaluator!; var resolving = Set<String>(); var defaults: [String: Value] = [:] }
        let box = Box()
        let manager = queryManager
        for mutation in result.mutationStatements where idleMutations[mutation.statementId] == nil {
            idleMutations[mutation.statementId] = MutationState(status: .idle).value
        }
        let idleValues = idleMutations
        let ctx = EvaluationContext(
            getState: { [store] name in store.get(name) ?? .null },
            resolveRef: { name in
                if let state = manager.queryState(for: name), let data = state.data { return data }
                if let query = result.queryStatements.first(where: { $0.statementId == name }) {
                    if let value = box.defaults[name] { return value }
                    guard box.resolving.insert(name).inserted else { return .null }
                    defer { box.resolving.remove(name) }
                    let value = query.defaultsAST.map { box.evaluator.evaluate($0) } ?? .null
                    box.defaults[name] = value
                    return value
                }
                if result.mutationStatements.contains(where: { $0.statementId == name }) {
                    if let state = manager.mutationState(for: name) { return state.value }
                    return idleValues[name] ?? .null
                }
                return .null
            }, functions: functions, actions: schema.callDefs.filter { $0.value.kind == .action }, extraScope: extraScope)
        let evaluator = Evaluator(context: ctx, store: store, schema: schema)
        box.evaluator = evaluator
        return evaluator
    }

    private func acceptSource(_ result: ParseResult) {
        update(from: result)
        onParseResult?(result)
    }

    private func update(from result: ParseResult, synchronizeQueries: Bool = true) {
        latestResult = result
        store.initialize(defaults: result.stateDeclarations, persisted: persistedState)
        persistedState = [:]
        let evaluator = makeEvaluator(result: result)
        if isComplete { queryManager.registerMutations(Dictionary(result.mutationStatements.map { mutation in
            let tool = mutation.toolAST.map { evaluator.evaluate($0) }
            if case .string(let name) = tool { return (mutation.statementId, name) }
            return (mutation.statementId, "")
        }, uniquingKeysWith: { _, new in new })) }
        if isComplete && synchronizeQueries {
            let sourceChanged = querySourceGeneration != streamGeneration
            querySourceGeneration = streamGeneration
            let snapshot = store.getSnapshot()
            let stateChanged = snapshot.count != queryStoreSnapshot.count || snapshot.contains { queryStoreSnapshot[$0.key]?.isSameValue(as: $0.value) != true }
            queryStoreSnapshot = snapshot
            let requests = result.queryStatements.map { query -> QueryRequest in
                let deps = query.deps.map { names in Value.object(names.map { ObjectField(key: $0, value: store.get($0) ?? .null) }) }
                let previous = queryRequests[query.statementId]
                // As in the reference adapter, Store changes reevaluate query
                // arguments; query result notifications only redraw the tree.
                let reevaluate = sourceChanged || stateChanged || previous == nil
                let name: OpenUIString
                let args: Value
                if !reevaluate, let previous { name = previous.tool; args = previous.args }
                else {
                    if case .string(let value) = query.toolAST.map({ evaluator.evaluate($0) }) { name = value } else { name = "" }
                    args = query.argsAST.map { transport(evaluator.evaluate($0)) } ?? .object([])
                }
                return QueryRequest(statementId: query.statementId, tool: name, args: args,
                    defaults: (sourceChanged || stateChanged || previous == nil) ? (query.defaultsAST.map { evaluator.evaluate($0) } ?? .null) : (previous?.defaults ?? .null),
                    deps: deps, refreshInterval: query.refreshAST.map { toNumber(evaluator.evaluate($0)) }, complete: query.complete)
            }
            queryRequests = Dictionary(requests.map { ($0.statementId, $0) }, uniquingKeysWith: { _, new in new })
            if sourceChanged || stateChanged {
                queryManager.synchronizeQueries(requests)
            }
        }
        let evaluatedRoot = evaluator.evaluateRoot(result)
        indexLiveElements(evaluatedRoot)
        root = evaluatedRoot
        var queryValues: [String: QueryState] = [:]
        for query in result.queryStatements {
            queryValues[query.statementId] = queryManager.queryState(for: query.statementId)
                ?? QueryState(status: .idle, data: evaluator.context.resolveRef(query.statementId))
        }
        queryStates = queryValues
        mutationStates = Dictionary(uniqueKeysWithValues: result.mutationStatements.map {
            ($0.statementId, queryManager.mutationState(for: $0.statementId) ?? MutationState(status: .idle))
        })
        errors = result.meta.errors + (isComplete ? evaluator.errors : [])
            + queryValues.values.compactMap(\.error) + mutationStates.values.compactMap(\.error)
        let revision = errors.map { error in
            [error.source.rawValue, error.code.rawValue, error.statementId ?? "", error.component ?? "",
             error.path.map(jsonStringLiteral) ?? "", error.severity ?? "", error.message].joined(separator: "\u{0}")
        }
        if errorRevision != revision { errorRevision = revision; onError?(errors) }
    }


}
