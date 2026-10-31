import SwiftUI
import OpenUILang

private struct OpenUIResourcesKey: EnvironmentKey { static let defaultValue: [String: Value] = [:] }
private struct OpenUIFormKey: EnvironmentKey { static let defaultValue: String? = nil }
private struct OpenUIProgramScopeKey: EnvironmentKey { static let defaultValue: ObjectIdentifier? = nil }
private struct NativeInteractionScopeKey: EnvironmentKey { static let defaultValue = true }
private struct NativeInlineLinksKey: EnvironmentKey { static let defaultValue = true }

extension EnvironmentValues {
    var openUIInteractionScopeReady: Bool {
        get { self[NativeInteractionScopeKey.self] }
        set { self[NativeInteractionScopeKey.self] = newValue }
    }
    var openUIInlineLinksReady: Bool {
        get { self[NativeInlineLinksKey.self] }
        set { self[NativeInlineLinksKey.self] = newValue }
    }
    public var openUIResources: [String: Value] {
        get { self[OpenUIResourcesKey.self] }
        set { self[OpenUIResourcesKey.self] = newValue }
    }
    public var openUIFormName: String? {
        get { self[OpenUIFormKey.self] }
        set { self[OpenUIFormKey.self] = newValue }
    }
    fileprivate var openUIProgramScoped: ObjectIdentifier? {
        get { self[OpenUIProgramScopeKey.self] }
        set { self[OpenUIProgramScopeKey.self] = newValue }
    }
}

extension View {
    /// Resources belong to this host/message, not a process-global store.
    public func openUIResources(_ value: [String: Value]) -> some View { environment(\.openUIResources, value) }
    public func openUIForm(_ name: String?) -> some View {
        environment(\.openUIFormName, name).environment(\.openUIExactFormName, name.map { OpenUIString($0) })
    }
}

/// Created by the registered component host; all operations use the same runtime.
public struct OpenUIComponentContext {
    public let element: EvaluatedElement
    public let theme: OpenUITheme
    public let resources: [String: Value]
    public let formName: String?
    public let exactFormName: OpenUIString?
    /// Program transport state. Individual controls use canInteract, which
    /// checks their own source, dependencies and enclosing card/form scope.
    public let isStreaming: Bool
    public let isQueryLoading: Bool
    // A one-level native layout proposal. Component hosts consume it so a
    // stretched row item cannot accidentally stretch all nested descendants.
    var stretchesVertically = false
    var interactionScopeReady = true
    var activationIntent: NativeActivationIntent?
    private let state: OpenUIState
    private let registry: ComponentRegistry
    private let sourceRevision: Int

    @MainActor public init(element: EvaluatedElement, registry: ComponentRegistry, state: OpenUIState,
                theme: OpenUITheme = OpenUITheme(), resources: [String: Value] = [:], formName: String? = nil, exactFormName: OpenUIString? = nil) {
        self.element = element; self.registry = registry; self.state = state
        self.theme = theme; self.resources = resources; self.formName = exactFormName?.displayString ?? formName
        self.exactFormName = exactFormName ?? formName.map { OpenUIString($0) }
        self.sourceRevision = state.sourceRevision
        self.isStreaming = !state.isComplete
        self.isQueryLoading = state.isQueryLoading
    }

    @MainActor public var canInteract: Bool { interactionScopeReady && state.isElementReady(element) && isCurrentPresentation }
    /// Discrete activations also reject the release of a reading/paging drag.
    @MainActor public var canActivate: Bool { canInteract && activationIntent?.permitsActivation != false }
    @MainActor func canDispatch(_ action: Value?) -> Bool {
        guard canInteract else { return false }
        if case .actionPlan(let plan) = action { return state.isPlanReady(state.currentActionPlan(plan, source: element)) }
        return true
    }
    @MainActor var isCurrentPresentation: Bool { state.sourceRevision == sourceRevision }
    var presentationSourceRevision: Int { sourceRevision }
    /// Local presentation controls such as Modal close can update their value
    /// while streaming. Epoch checks still reject callbacks from replaced UI.
    @MainActor func presentationBinding(_ name: String) -> Binding<Value>? {
        guard let binding = state.binding(for: element, prop: name) else { return nil }
        return Binding(get: { binding.wrappedValue }, set: { if isCurrentPresentation { binding.wrappedValue = $0 } })
    }
    @MainActor func presentationFieldValue(_ name: OpenUIString, fallback: Value) -> Value {
        state.fieldValue(form: exactFormName, name: name, fallback: fallback)
    }
    @MainActor func setPresentationFieldValue(_ name: OpenUIString, value: Value) {
        guard isCurrentPresentation else { return }
        state.setFieldValue(form: exactFormName, name: name, value: value, componentType: nil)
    }
    public func value(_ name: String) -> Value? { element.props.last(where: { $0.0 == name })?.1 }
    /// Native display text. Use codeUnitString/value for semantic action data.
    public func string(_ name: String) -> String? { codeUnitString(name)?.displayString }
    public func codeUnitString(_ name: String) -> OpenUIString? {
        guard case .string(let text) = value(name) else { return nil }; return text
    }
    public func number(_ name: String) -> Double? {
        guard case .number(let number) = value(name), number.isFinite else { return nil }; return number
    }
    public func flag(_ name: String) -> Bool? {
        guard case .boolean(let flag) = value(name) else { return nil }; return flag
    }
    public func resource(_ id: String) -> Value? { resource(OpenUIString(id)) }
    public func resource(_ id: OpenUIString) -> Value? {
        resources.first(where: { OpenUIString($0.key) == id })?.value
    }
    public func slot(_ name: String = "children") -> RenderValue { RenderValue(value(name) ?? .null, registry: registry) }
    public func render(_ value: Value) -> RenderValue { RenderValue(value, registry: registry) }
    func renderTableCell(_ value: Value, policy: OpenUITableCellPolicy) -> RenderValue {
        RenderValue(value, registry: NativeTableCellContent.registry(from: registry, policy: policy))
    }
    public func children(_ name: String = "children") -> [OpenUIRenderChild] {
        OpenUIRenderChild.children(of: value(name) ?? .null)
    }
    @MainActor public func binding(_ name: String) -> Binding<Value>? {
        guard let binding = state.binding(for: element, prop: name) else { return nil }
        return Binding(get: { binding.wrappedValue }, set: { if canInteract { binding.wrappedValue = $0 } })
    }
    public func action(_ name: String = "action") -> ActionPlan? { PropValue.actionPlan(element, name) }

    @MainActor @_disfavoredOverload public func fieldValue<S: StringProtocol>(_ name: S, fallback: Value = .null) -> Value { fieldValue(OpenUIString(String(name)), fallback:fallback) }
    @MainActor public func fieldValue(_ name: OpenUIString, fallback: Value = .null) -> Value {
        state.fieldValue(form: exactFormName, name: name, fallback: fallback)
    }
    @MainActor @_disfavoredOverload public func fieldBinding<S: StringProtocol>(_ name: S, fallback: Value = .null, componentType: String = "input") -> Binding<Value> {
        fieldBinding(OpenUIString(String(name)), fallback:fallback, componentType:componentType)
    }
    @MainActor public func fieldBinding(_ name: OpenUIString, fallback: Value = .null, componentType: String = "input") -> Binding<Value> {
        let binding = state.fieldBinding(form: exactFormName, name: name, fallback: fallback, componentType: componentType)
        return Binding(get: { binding.wrappedValue }, set: { if canInteract { binding.wrappedValue = $0 } })
    }
    @MainActor @_disfavoredOverload public func initializeField<S: StringProtocol>(_ name: S, value: Value, componentType: String = "input") {
        initializeField(OpenUIString(String(name)), value:value, componentType:componentType)
    }
    @MainActor public func initializeField(_ name: OpenUIString, value: Value, componentType: String = "input") {
        guard canInteract else { return }
        state.initializeField(form: exactFormName, name: name, value: value, componentType: componentType)
    }

    @discardableResult
    @MainActor public func perform(_ action: ActionPlan) async -> [ActionEvent] {
        guard canInteract else { return [] }
        return await state.perform(action, formName: exactFormName, source: element)
    }

    @discardableResult
    @MainActor public func triggerAction(_ message: String, action: Value? = nil) async -> [ActionEvent] {
        guard canDispatch(action) else { return [] }
        return await state.triggerAction(message, formName: exactFormName, action: action, source: element)
    }
}

struct OpenUIComponentHost<Content: View>: View {
    let element: EvaluatedElement
    let registry: ComponentRegistry
    let content: (OpenUIComponentContext) -> Content
    @EnvironmentObject private var state: OpenUIState
    @Environment(\.openUITheme) private var theme
    @Environment(\.openUIResources) private var resources
    @Environment(\.openUIFormName) private var formName
    @Environment(\.openUIExactFormName) private var exactFormName
    @Environment(\.openUIStretchHeight) private var stretchesVertically
    @Environment(\.openUIProgramScoped) private var programScoped
    @Environment(\.openUIInteractionScopeReady) private var interactionScopeReady
    @Environment(\.openUIActivationIntent) private var activationIntent

    var body: some View {
        let element = self.element.isSourceComplete ? self.element : state.liveElement(matching: self.element)
        var context = OpenUIComponentContext(element: element, registry: registry, state: state,
            theme: theme, resources: resources, formName: formName, exactFormName: exactFormName)
        context.stretchesVertically = stretchesVertically
        context.interactionScopeReady = interactionScopeReady
        context.activationIntent = activationIntent
        let atomic = ["Card", "Form", "CompositeCardItem", "VisualCardItem", "ContextCardItem", "OverviewCardItem", "SnippetCardItem"].contains(element.typeName)
        let view = content(context).environment(\.openUIStretchHeight, false)
            .environment(\.openUIInteractionScopeReady, interactionScopeReady && (!atomic || context.canInteract))
            .environment(\.openUIInlineLinksReady, context.canInteract)
            .environment(\.openUIMediaSourceReady, element.isSourceComplete)
        // Reset once at the native tree's entry, including direct RenderNode
        // hosts. Repeating one explicit id on every descendant makes lazy
        // containers merge distinct siblings, losing cards and their content.
        return Group {
            if programScoped == ObjectIdentifier(state) { view }
            else {
                NativeProgramScope(owner: ObjectIdentifier(state), revision: state.presentationRevision, resources: state.resourceStore,
                    content: view.environment(\.openUIMediaCache, state.mediaCache))
            }
        }
    }
}

private struct NativeProgramScope<Content: View>: View {
    let owner: ObjectIdentifier
    let revision: Int
    let resources: NativeResourceStore
    let content: Content
    @Namespace private var instance
    @Environment(\.openUIResourceContext) private var parentResources
    var body: some View {
        content.environment(\.openUIProgramScoped, owner)
            .openUIResourceContext(resources.scoped(parentResources))
            .id(NativeProgramIdentity(instance: instance, owner: owner, revision: revision))
    }
}
private struct NativeProgramIdentity: Hashable {
    let instance: Namespace.ID
    let owner: ObjectIdentifier
    let revision: Int
}

