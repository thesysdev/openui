import OpenUILang
import SwiftUI

enum OpenUIFormComponents {
    static let fieldNames = ["Input", "TextArea", "Select", "CheckBoxGroup", "RadioGroup", "SwitchGroup", "DatePicker", "Slider"]
    static var components: [OpenUIComponent] {
        [
            OpenUIReference.component("Form") { OpenUINativeForm(context: $0) },
            OpenUIReference.component("FormControl") { OpenUINativeFormControl(context: $0) },
            OpenUIReference.component("Buttons") { OpenUINativeButtons(context: $0) },
            OpenUIReference.component("Input") { OpenUINativeField(context: $0, kind: .input) },
            OpenUIReference.component("TextArea") { OpenUINativeField(context: $0, kind: .textArea) },
            OpenUIReference.component("Select") { OpenUINativeField(context: $0, kind: .select) },
            OpenUIReference.component("RadioGroup") { OpenUINativeField(context: $0, kind: .radio) },
            OpenUIReference.component("CheckBoxGroup") { OpenUINativeField(context: $0, kind: .checkbox) },
            OpenUIReference.component("SwitchGroup") { OpenUINativeField(context: $0, kind: .switches) },
            OpenUIReference.component("Slider") { OpenUINativeField(context: $0, kind: .slider) },
            OpenUIReference.component("DatePicker") { OpenUINativeField(context: $0, kind: .date) },
            OpenUIReference.component("Chips") { OpenUINativeField(context: $0, kind: .chips) },
            OpenUIReference.component("OptionCards") { OpenUINativeField(context: $0, kind: .optionCards) },
            OpenUIReference.component("SelectItem") { _ in EmptyView() },
            OpenUIReference.component("RadioItem") { _ in EmptyView() },
            OpenUIReference.component("CheckBoxItem") { _ in EmptyView() },
            OpenUIReference.component("SwitchItem") { _ in EmptyView() },
            OpenUIReference.component("ChipItem") { _ in EmptyView() },
            OpenUIReference.component("OptionCard") { _ in EmptyView() }
        ]
    }
}

private struct OpenUINativeForm: View {
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

private struct OpenUINativeFormControl: View {
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

private struct OpenUINativeButtons: View {
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
