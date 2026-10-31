import OpenUILang
import SwiftUI

struct OpenUINativeField: View {
    enum Kind { case input, textArea, select, radio, checkbox, switches, slider, date, chips, optionCards }
    let context: OpenUIComponentContext
    let kind: Kind
    @Environment(\.openUIFormValidation) private var validation
    @Environment(\.openUIFieldLabel) private var fieldLabel
    @Environment(\.locale) private var locale
    @Environment(\.openUIFieldPresentation) private var presentation
    @ScaledMetric(relativeTo: .body) private var textScale: CGFloat = 1
    private var inputFont: OpenUIFont { context.theme.typography.field(context.string("size")) }
    private var lineHeight: CGFloat { inputFont.size * (1.2 + context.theme.typography.lineSpacing) * textScale }
    @FocusState private var focused: Bool
    @State private var localError: String?
    @State private var registration = UUID()
    @State private var registeredName: OpenUIString?
    private var field: NativeFieldState { .init(context: context) }
    private var label: String { fieldLabel ?? field.name.displayString }
    private var placeholder: String { context.string("placeholder") ?? "" }

    var body: some View {
        feedback.disabled(!context.canInteract)
            .onAppear {
                field.initialize()
                register()
            }
            .onChange(of: context.canInteract) { complete in
                if complete {
                    field.initialize()
                    register()
                }
            }
            .onChange(of: context.element) { _ in
                register()
                field.mirror()
            }
            .onChange(of: field.value) { _ in
                field.mirror()
                if let validation {
                    validation.changed(field.name, value: field.validationValue, rules: field.rules)
                } else {
                    localError = OpenUILang.validate(field.validationValue, rules: field.rules)
                }
            }
            .onDisappear {
                if let registeredName { validation?.unregister(registeredName, owner: registration) }
            }
    }
    @ViewBuilder private var feedback: some View {
        if let validation {
            NativeValidatedField(validation: validation, name: field.name) { error in fieldBody(error) }
        } else {
            fieldBody(localError)
        }
    }
    private func fieldBody(_ error: String?) -> some View {
        VStack(alignment: .leading, spacing: context.theme.spacing("xs")) {
            control.accessibilityIdentifier("openui.field.\(field.name.displayString)")
            if let error {
                Label(error, systemImage: "exclamationmark.circle.fill")
                    .openUIFont(context.theme.typography.caption).foregroundStyle(context.theme.error)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("openui.error.\(field.name.displayString)")
            }
        }.environment(\.openUIFieldError, error)
    }
    private func register() {
        guard context.canInteract else { return }
        if let registeredName, registeredName != field.name {
            validation?.unregister(registeredName, owner: registration)
        }
        validation?.register(
            field.name, owner: registration, rules: field.rules, value: { field.validationValue })
        registeredName = field.name
    }
    @ViewBuilder private var control: some View {
        switch kind {
        case .input:
            Group {
                if context.string("type") == "password" {
                    SecureField(placeholder, text: field.text, prompt: inputPrompt)
                } else {
                    TextField(placeholder, text: field.text, prompt: inputPrompt).openUIKeyboard(
                        context.string("type"))
                }
            }
            .textFieldStyle(.plain).focused($focused).accessibilityLabel(label)
            .multilineTextAlignment(presentation == .inline ? .trailing : .leading)
            .submitLabel(.done).onSubmit {
                #if os(iOS)
                    focused = false
                #endif
            }
            .modifier(NativeFieldSurface(theme: context.theme, focused: focused))
        case .textArea:
            ZStack(alignment: .topLeading) {
                TextEditor(text: field.text).openUIFont(inputFont).openUIEditorBackground().focused($focused)
                    .frame(minHeight: CGFloat(min(20, max(2, context.number("rows") ?? 4))) * lineHeight)
                    .accessibilityLabel(label)
                if field.text.wrappedValue.isEmpty {
                    Text(placeholder).openUIFont(inputFont).foregroundStyle(context.theme.secondary)
                        .padding(.horizontal, 5).padding(.vertical, 8).allowsHitTesting(false)
                        .accessibilityHidden(true)
                }
            }.modifier(NativeFieldSurface(theme: context.theme, focused: focused, textEditor: true))
        case .select:
            Menu {
                Picker(label, selection: field.selected) {
                    if !options.contains(where: { $0.value == field.selected.wrappedValue }) {
                        Text(selectionTitle).tag(field.selected.wrappedValue)
                    }
                    ForEach(options) { option in Text(option.label).tag(option.value) }
                }
            } label: {
                HStack(spacing: context.theme.spacing("s")) {
                    if presentation == .inline { Spacer(minLength: 0) }
                    Text(selectionTitle).fixedSize(horizontal: false, vertical: true)
                        .foregroundStyle(
                            field.selected.wrappedValue.isEmpty
                                ? context.theme.secondary : context.theme.foreground)
                    if presentation != .inline { Spacer(minLength: 8) }
                    Image(systemName: "chevron.up.chevron.down").openUIFont(context.theme.typography.caption.weight(.semibold)).foregroundStyle(
                        context.theme.secondary)
                }.frame(maxWidth: .infinity, alignment: .leading)
                    .modifier(NativeFieldSurface(theme: context.theme, size: context.string("size")))
            }.buttonStyle(.plain).accessibilityLabel(label).accessibilityValue(selectionTitle)
        case .radio:
            #if os(macOS)
                Picker(selection: field.selected) {
                    if field.selected.wrappedValue.isEmpty {
                        Text("Select", bundle: NativeControlResources.bundle).tag(OpenUIString(""))
                    }
                    ForEach(options) { option in optionLabel(option).tag(option.value) }
                } label: {
                    Text(label)
                }
                .pickerStyle(.radioGroup).openUIHideLabel(fieldLabel != nil)
                .modifier(NativeFieldSurface(theme: context.theme))
            #else
                VStack(alignment: .leading, spacing: context.theme.spacing("s")) {
                    ForEach(options) { option in
                        let selected = option.value == field.selected.wrappedValue
                        Button {
                            field.selected.wrappedValue = option.value
                        } label: {
                            HStack(alignment: .top, spacing: context.theme.spacing("sm")) {
                                Image(systemName: selected ? "largecircle.fill.circle" : "circle")
                                    .openUIFont(context.theme.typography.body).foregroundStyle(
                                        selected ? context.theme.accent : context.theme.secondary
                                    )
                                    .padding(.top, 2)
                                optionLabel(option).frame(maxWidth: .infinity, alignment: .leading)
                            }.frame(minHeight: 44)
                            .modifier(NativeFieldSurface(theme: context.theme))
                        }.buttonStyle(.plain)
                            .accessibilityLabel(option.label).accessibilityHint(option.description)
                            .accessibilityValue(
                                selected
                                    ? Text("Selected", bundle: NativeControlResources.bundle)
                                    : Text("Not selected", bundle: NativeControlResources.bundle)
                            )
                            .accessibilityAddTraits(selected ? .isSelected : [])
                    }
                }.accessibilityElement(children: .contain).accessibilityLabel(label)
            #endif
        case .checkbox, .switches:
            VStack(alignment: .leading, spacing: context.theme.spacing("s")) {
                ForEach(options) { option in
                    Toggle(isOn: field.toggle(option.value)) {
                        VStack(alignment: .leading, spacing: context.theme.spacing("3xs")) {
                            Text(option.label).openUIFont(context.theme.typography.body).foregroundStyle(context.theme.foreground)
                            if !option.description.isEmpty {
                                Text(option.description).openUIFont(context.theme.typography.caption).foregroundStyle(
                                    context.theme.secondary)
                            }
                        }.fixedSize(horizontal: false, vertical: true)
                    }.openUIToggleStyle(checkbox: kind == .checkbox, theme: context.theme)
                        .tint(context.theme.accent).frame(minHeight: choiceHeight)
                }
            }.openUISwitchSurface(kind == .switches ? context.string("variant") : nil, theme: context.theme)
        case .slider: NativeSliderField(context: context)
        case .date: NativeDateField(context: context, label: label)
        case .chips, .optionCards:
            NativeChoiceField(context: context, cards: kind == .optionCards)
        }
    }
    // Text.foregroundColor preserves a Text value for the prompt API.
    private var inputPrompt: Text { Text(placeholder).foregroundColor(context.theme.secondary) }
    private func optionLabel(_ option: NativeFieldOption) -> some View {
        VStack(alignment: .leading, spacing: context.theme.spacing("3xs")) {
            Text(option.label).openUIFont(context.theme.typography.body).foregroundStyle(context.theme.foreground)
            if !option.description.isEmpty {
                Text(option.description).openUIFont(context.theme.typography.caption).foregroundStyle(context.theme.secondary)
            }
        }.fixedSize(horizontal: false, vertical: true)
    }
    private var options: [NativeFieldOption] { NativeFieldOption.read(field.options) }
    private var choiceHeight: CGFloat {
        #if os(iOS)
            48
        #else
            32
        #endif
    }
    private var selectionTitle: String {
        options.first(where: { $0.value == field.selected.wrappedValue })?.label
            ?? (field.selected.wrappedValue.isEmpty
                ? (context.string("placeholder")
                    ?? NativeControlText.localized("Select", locale: locale))
                : field.selected.wrappedValue.displayString)
    }
}

private struct NativeValidatedField<Content: View>: View {
    @ObservedObject var validation: NativeFormValidation
    let name: OpenUIString
    let content: (String?) -> Content
    var body: some View { content(validation.errors[name]) }
}

struct NativeFieldOption: Identifiable {
    let id: OpenUIString
    let value: OpenUIString
    let label: String
    let description: String
    static func read(_ elements: [EvaluatedElement]) -> [NativeFieldOption] {
        var seen = Set<OpenUIString>()
        return elements.compactMap { item in
            guard
                let value = PropValue.codeUnitString(item, "value") ?? PropValue.codeUnitString(item, "name"),
                seen.insert(value).inserted
            else { return nil }
            return NativeFieldOption(
                id: value, value: value, label: PropValue.string(item, "label") ?? value.displayString,
                description: PropValue.string(item, "description") ?? "")
        }
    }
}

private struct NativeCheckboxStyle: ToggleStyle {
    let theme: OpenUITheme
    func makeBody(configuration: Configuration) -> some View {
        Button {
            configuration.isOn.toggle()
        } label: {
            HStack(alignment: .top, spacing: theme.spacing("sm")) {
                Image(systemName: configuration.isOn ? "checkmark.square.fill" : "square")
                    .openUIFont(theme.typography.body).foregroundStyle(configuration.isOn ? theme.accent : theme.secondary).padding(
                        .top, 2)
                configuration.label.frame(maxWidth: .infinity, alignment: .leading)
            }.frame(minHeight: 44).modifier(NativeFieldSurface(theme: theme))
        }.buttonStyle(.plain)
            .accessibilityValue(
                configuration.isOn ? Text("On", bundle: NativeControlResources.bundle) : Text("Off", bundle: NativeControlResources.bundle)
            )
            .accessibilityAddTraits(configuration.isOn ? .isSelected : [])
    }
}

extension View {
    @ViewBuilder fileprivate func openUISwitchSurface(_ variant: String?, theme: OpenUITheme) -> some View {
        switch variant {
        case "card":
            self.padding(12).background(
                theme.controlSurface, in: RoundedRectangle(cornerRadius: theme.controlCornerRadius)
            )
            .overlay(RoundedRectangle(cornerRadius: theme.controlCornerRadius).strokeBorder(theme.border))
        case "sunk":
            self.padding(12).background(
                theme.surface, in: RoundedRectangle(cornerRadius: theme.controlCornerRadius))
        default: self
        }
    }
    @ViewBuilder fileprivate func openUIHideLabel(_ hidden: Bool) -> some View {
        if hidden { labelsHidden() } else { self }
    }
    @ViewBuilder fileprivate func openUIEditorBackground() -> some View {
        scrollContentBackground(.hidden)
    }
    @ViewBuilder fileprivate func openUIKeyboard(_ kind: String?) -> some View {
        #if os(iOS)
            switch kind {
            case "email":
                self.keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled()
            case "url": self.keyboardType(.URL).textInputAutocapitalization(.never).autocorrectionDisabled()
            case "number": self.keyboardType(.decimalPad)
            default: self
            }
        #else
            self
        #endif
    }
    @ViewBuilder fileprivate func openUIToggleStyle(checkbox: Bool, theme: OpenUITheme) -> some View {
        if checkbox {
            #if os(macOS)
                self.toggleStyle(.checkbox)
            #else
                self.toggleStyle(NativeCheckboxStyle(theme: theme))
            #endif
        } else {
            self.toggleStyle(.switch)
        }
    }
}
