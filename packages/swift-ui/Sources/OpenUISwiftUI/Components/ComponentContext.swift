import SwiftUI
import OpenUILang

/// Semantic defaults can be replaced by the product without changing programs.
public struct OpenUITheme {
    // Pinned react-ui f08a6605 neutral palette, converted from OKLCH to sRGB.
    // Translucent roles remain translucent so nested surfaces do not gain a tint.
    public var foreground = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFAFAFA)
    public var secondary = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFAFAFA).opacity(0.6)
    public var canvas = NativeControlPalette.adaptive(light: 0xF5F5F5, dark: 0x0A0A0A)
    public var surface = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFDFDFD).opacity(0.04)
    public var border = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFDFDFD).opacity(0.06)
    public var interactiveBorder = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFDFDFD).opacity(0.12)
    public var subtleSurface = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFDFDFD).opacity(0.02)
    // The assistant uses the reference's neutral brand treatment. A product
    // accent remains an explicit theme override, not a default blue CTA.
    public var accent = NativeControlPalette.ink
    public var accentForeground: Color? = nil
    public var controlSurface = NativeControlPalette.adaptive(light: 0xFDFDFD, dark: 0x171717)
    public var error = NativeControlPalette.error
    public var info = NativeControlPalette.info
    public var success = NativeControlPalette.success
    public var warning = NativeControlPalette.warning
    public var controlCornerRadius: CGFloat = 10
    public var cornerRadius: CGFloat = 16
    public var overlayCornerRadius: CGFloat = 24
    #if os(iOS)
    public var minimumControlTargetSize: CGFloat = 44
    #else
    public var minimumControlTargetSize: CGFloat = 24
    #endif
    public var cardPadding: CGFloat = 12
    public var typography = OpenUITypography()
    public var motion = OpenUIMotion()
    public var mediaCornerRadius: CGFloat = 8
    public var thumbnailSize: CGFloat = 112
    public var compactThumbnailSize: CGFloat = 80
    public var inlineThumbnailSize: CGFloat = 40
    public var minimumTextColumnWidth: CGFloat = 160
    public var coverAspectRatio: CGFloat = 3 / 2
    public var maximumCarouselCardWidth: CGFloat = 320
    public var carouselPeek: CGFloat = 32
    public var cardBorderWidth: CGFloat = 1
    public var cardShadowOpacity: Double = 0
    public var cardShadowRadius: CGFloat = 0
    public var cardShadowY: CGFloat = 0
    public var contentSpacing: CGFloat = 12
    public var metricSurface = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFDFDFD).opacity(0.04)
    private var customDataColors: [Color]?
    /// Explicit host colors retain their existing override behavior.
    public var dataColors: [Color] {
        get { customDataColors ?? NativeChartPalette.swatches(count: 6).map(\.color) }
        set { customDataColors = newValue }
    }
    public func chartColors(forSeriesCount count: Int) -> [Color] {
        if let customDataColors { return customDataColors.isEmpty ? [accent] : customDataColors }
        return NativeChartPalette.swatches(count: count).map(\.color)
    }
    public var chartGrid = NativeControlPalette.adaptive(light: 0xE8EAEE, dark: 0x34373C)
    public var chartAxis = NativeControlPalette.adaptive(light: 0x6A6F78, dark: 0xB4BBC6)
    public var minimumCardWidth: CGFloat = 240
    public var minimumCompactCardWidth: CGFloat = 160
    public var minimumChoiceWidth: CGFloat = 136
    public init() {}

    public func spacing(_ token: String?) -> CGFloat {
        switch token {
        case "none": return 0
        case "3xs": return 2
        case "2xs": return 4
        case "xs": return 6
        case "s": return 8
        case "sm": return 10
        case "ml": return 16
        case "l": return 18
        case "xl": return 24
        case "2xl": return 36
        case "3xl": return 48
        default: return 12
        }
    }
}

private struct OpenUIThemeKey: EnvironmentKey { static let defaultValue = OpenUITheme() }
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
    public var openUITheme: OpenUITheme {
        get { self[OpenUIThemeKey.self] }
        set { self[OpenUIThemeKey.self] = newValue }
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
    public func openUITheme(_ value: OpenUITheme) -> some View { environment(\.openUITheme, value) }
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

/// For a card with one primary action. Its label must contain presentation only,
/// not nested buttons. The host decides how the resulting event is handled.
public struct OpenUIActionSurface<Content: View>: View {
    private let context: OpenUIComponentContext
    private enum Dispatch { case plan(ActionPlan), value(String, Value?) }
    private let dispatch: Dispatch
    private let content: Content
    private let role: ButtonRole?
    private let useNativeStyle: Bool
    private let validateForm: Bool
    private let showsProgress: Bool
    // Source readiness can change interaction eligibility without changing props.
    @EnvironmentObject private var state: OpenUIState
    @Environment(\.openUIFormValidation) private var validation
    @State private var performing = false

    public init(context: OpenUIComponentContext, action: ActionPlan, role: ButtonRole? = nil, useNativeStyle: Bool = false, validateForm: Bool = false, showsProgress: Bool = false, @ViewBuilder content: () -> Content) {
        self.context = context; self.dispatch = .plan(action); self.content = content()
        self.role = role; self.useNativeStyle = useNativeStyle; self.validateForm = validateForm
        self.showsProgress = showsProgress
    }

    public init(context: OpenUIComponentContext, message: String, action: Value? = nil, role: ButtonRole? = nil, useNativeStyle: Bool = false, validateForm: Bool = false, showsProgress: Bool = false, @ViewBuilder content: () -> Content) {
        self.context = context; self.dispatch = .value(message, action); self.content = content()
        self.role = role; self.useNativeStyle = useNativeStyle; self.validateForm = validateForm
        self.showsProgress = showsProgress
    }

    @ViewBuilder public var body: some View {
        if useNativeStyle { button } else { button.buttonStyle(.plain) }
    }
    private var button: some View {
        Button(role:role) {
            guard !performing, context.canActivate else { return }
            if validateForm && needsValidation && validation?.validateAll() == false { return }
            performing = true
            Task { @MainActor in
                defer { performing = false }
                switch dispatch {
                case .plan(let plan): await context.perform(plan)
                case .value(let message, let action): await context.triggerAction(message, action: action)
                }
            }
        } label: {
            Group {
                if useNativeStyle { content }
                else { content.openUIControlTarget(alignment: .leading) }
            }.contentShape(Rectangle())
                .opacity(showsProgress && performing ? 0 : 1)
                .overlay {
                    if showsProgress && performing { ProgressView().controlSize(.small) }
                }
        }
        .accessibilityValue(showsProgress && performing ? Text("In progress", bundle: NativeControlResources.bundle) : Text(""))
        .disabled(!context.canInteract || performing)
    }
    private var needsValidation: Bool {
        let plan: ActionPlan?
        switch dispatch {
        case .plan(let action): plan = action
        case .value(_,let value):
            if case .actionPlan(let action) = value { plan = action } else { plan = nil }
        }
        return NativeFormValidation.requiresValidation(plan)
    }
}

public enum OpenUIActions {
    public static func openURL(_ url: String) -> ActionPlan { ActionPlan(steps: [.openUrl(urlAST: .str(url))]) }
    public static func continueConversation(_ message: String, context: ASTNode? = nil) -> ActionPlan {
        ActionPlan(steps: [.continueConversation(messageAST: .str(message), contextAST: context)])
    }
}
