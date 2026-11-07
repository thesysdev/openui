import SwiftUI
import OpenUILang

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
