import OpenUILang
import SwiftUI


struct OpenUINativeForm: View {
    let context: OpenUIComponentContext
    @StateObject private var validation = NativeFormValidation()
    var body: some View {
        // The reference Form is an open vertical flow, not a second card around
        // already surfaced fields. Each input has one mounted presentation.
        VStack(alignment: .leading, spacing: context.theme.spacing("ml")) {
            ForEach(context.children("fields")) { context.render($0.value) }
            context.slot("buttons").environment(\.openUIFormActions, true)
        }
        .environment(\.openUIFieldPresentation, .standalone)
        .environment(\.openUIExactFormName, context.codeUnitString("name"))
        .environment(\.openUIFormValidation, validation)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(context.string("name") ?? "Form")
    }
}

struct OpenUINativeFormControl: View {
    let context: OpenUIComponentContext
    var body: some View {
        VStack(alignment: .leading, spacing: context.theme.spacing("s")) {
            Text(context.string("label") ?? "")
                .openUIFont(context.theme.typography.body)
                .foregroundStyle(context.theme.foreground)
                .fixedSize(horizontal: false, vertical: true)
            context.slot("input")
            if let hint = context.string("hint"), !hint.isEmpty {
                Text(hint).openUIFont(context.theme.typography.detail).foregroundStyle(context.theme.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
        .environment(\.openUIFieldLabel, context.string("label"))
    }
}

struct OpenUINativeButtons: View {
    let context: OpenUIComponentContext
    @Environment(\.layoutDirection) private var direction
    var body: some View {
        NativeButtonsLayout(column: context.string("direction") == "column",
            rightToLeft: direction == .rightToLeft,
            rowGap: context.theme.spacing("m"), columnGap: context.theme.spacing("s")) { buttons }
    }
    private var buttons: some View {
        ForEach(context.children("buttons")) { context.render($0.value) }
    }
}
