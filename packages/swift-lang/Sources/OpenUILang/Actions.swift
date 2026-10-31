// OpenUILang — Action execution.
//
// Runs an `ActionPlan`'s steps in order (spec §6.3), producing host
// `ActionEvent`s. There is no upstream executor in the shipped sources (it
// lives in the framework adapters), so this follows the spec text and the
// `ActionEvent` shape in parser/types.ts.

import Foundation

/// Host-provided runtime for action execution.
public struct ActionRuntimeContext {
    /// The state store (`Set`/`Reset` write through it).
    public var store: Store
    /// Evaluate a (possibly deferred) AST to a value at step-run time.
    public var evaluate: (ASTNode) -> Value
    /// Declared `$variable` defaults, used by `Reset`.
    public var stateDefaults: [OpenUIString: Value]
    /// Fire a query by statement id (fire-and-forget; never stops the plan).
    public var runQuery: (String) -> Void
    /// Run a mutation by statement id, awaiting its outcome.
    ///
    /// Await network-backed mutations without blocking the UI executor.
    /// A failed mutation stops the remaining steps of the plan.
    public var runMutation: (String) async -> MutationOutcome
    /// Raw form state at step-run time, read lazily per step so a `@Set`
    /// earlier in the same `Action([...])` is visible to later steps.
    public var formState: () -> [(OpenUIString, Value)]
    /// The form name that triggered this action, if any.
    public var formName: OpenUIString?
    /// An async host can invalidate a plan when a stream is reset or replaced.
    public var isActive: () -> Bool
    public var onStateChange: () -> Void
    public var onEvent: ((ActionEvent) -> Void)?

    public init(
        store: Store,
        evaluate: @escaping (ASTNode) -> Value,
        stateDefaults: [OpenUIString: Value] = [:],
        runQuery: @escaping (String) -> Void,
        runMutation: @escaping (String) async -> MutationOutcome,
        formState: @escaping () -> [(OpenUIString, Value)] = { [] },
        formName: OpenUIString? = nil,
        isActive: @escaping () -> Bool = { true },
        onStateChange: @escaping () -> Void = {},
        onEvent: ((ActionEvent) -> Void)? = nil
    ) {
        self.store = store
        self.evaluate = evaluate
        self.stateDefaults = stateDefaults
        self.runQuery = runQuery
        self.runMutation = runMutation
        self.formState = formState
        self.formName = formName
        self.isActive = isActive
        self.onStateChange = onStateChange
        self.onEvent = onEvent
    }
}

/// The settled outcome of running one mutation from an action plan.
public enum MutationOutcome {
    case success(Value)
    case failure
}

/// Run an action plan's steps in order (spec §6.3), returning the host events.
/// - `set` → evaluate `valueAST` NOW, `store.set` (not pristine).
/// - `reset` → restore declared defaults from `stateDefaults` (null if none).
/// - `run` → `runQuery`/`runMutation` by statement id. A failed mutation
///   STOPS the remaining steps; a query never stops the plan.
/// - `continueConversation` → `continue_conversation` event with the message,
///   an optional `context` param, and formState/formName as of this run.
/// - `openUrl` → `open_url` event.
/// - `custom` → event typed by the action name with args keyed by name.
@MainActor
public func runActionPlan(_ plan: ActionPlan, context: ActionRuntimeContext) async -> [ActionEvent] {
    var events: [ActionEvent] = []
    func emit(_ event: ActionEvent) { events.append(event); context.onEvent?(event) }
    for step in plan.steps {
        guard context.isActive() else { return events }
        switch step {
        case .set(let target, let valueAST):
            context.store.set(target, value: context.evaluate(valueAST), pristine: false)
            context.onStateChange()

        case .reset(let targets):
            for target in targets {
                context.store.set(target, value: context.stateDefaults[target] ?? .null, pristine: true)
            }
            context.onStateChange()

        case .run(let statementId, let refType):
            switch refType {
            case .query:
                context.runQuery(statementId)
            case .mutation:
                switch await context.runMutation(statementId) {
                case .success: break
                case .failure: return events // failed mutation stops remaining steps
                }
            }

        case .continueConversation(let messageAST, let contextAST):
            var params: [(OpenUIString, Value)] = []
            if let contextAST = contextAST {
                let value = context.evaluate(contextAST)
                if !value.isNullish { params.append(("context", value)) }
            }
            emit(ActionEvent(
                type: "continue_conversation",
                params: params,
                humanFriendlyMessage: concatString(context.evaluate(messageAST)),
                formState: context.formState(),
                formName: context.formName))

        case .openUrl(let urlAST):
            let url = context.evaluate(urlAST)
            emit(ActionEvent(
                type: "open_url",
                params: [("url", url)],
                humanFriendlyMessage: "",
                formState: context.formState(),
                formName: context.formName))

        case .custom(let name, let args):
            emit(ActionEvent(
                type: OpenUIString(name),
                params: args.map { (OpenUIString($0.0), context.evaluate($0.1)) },
                humanFriendlyMessage: "",
                formState: context.formState(),
                formName: context.formName))
        }
    }
    return events
}
