import OpenUILang
import SwiftUI

@MainActor
final class NativeFormValidation: ObservableObject {
    struct Field {
        let rules: [ParsedRule]
        let value: () -> Value
    }
    private var fields: [OpenUIString: Field] = [:]
    private var owners: [OpenUIString: UUID] = [:]
    @Published private(set) var errors: [OpenUIString: String] = [:]
    @Published private(set) var firstInvalid: OpenUIString?

    static func requiresValidation(_ plan: ActionPlan?) -> Bool {
        guard let plan else { return true }
        return plan.steps.contains { step in
            switch step {
            case .continueConversation, .custom: return true
            case .run(_, let kind): return kind == .mutation
            default: return false
            }
        }
    }
    func register(
        _ name: OpenUIString, owner: UUID? = nil, rules: [ParsedRule], value: @escaping () -> Value
    ) {
        fields[name] = Field(rules: rules, value: value)
        owners[name] = owner ?? owners[name] ?? UUID()
    }
    func unregister(_ name: OpenUIString, owner: UUID? = nil) {
        if let owner, owners[name] != owner { return }
        owners.removeValue(forKey: name)
        fields.removeValue(forKey: name)
        if errors[name] != nil { errors.removeValue(forKey: name) }
    }
    @discardableResult func validateAll() -> Bool {
        let next = fields.reduce(into: [OpenUIString: String]()) { result, entry in
            if let error = OpenUILang.validate(entry.value.value(), rules: entry.value.rules) {
                result[entry.key] = error
            }
        }
        if errors != next { errors = next }
        firstInvalid = next.keys.sorted().first
        return next.isEmpty
    }
    func changed(_ name: OpenUIString, value: Value, rules: [ParsedRule]) {
        let error = OpenUILang.validate(value, rules: rules)
        if errors[name] != error { errors[name] = error }
    }
}

private struct OpenUIFormValidationKey: EnvironmentKey {
    static let defaultValue: NativeFormValidation? = nil
}
private struct OpenUIFieldLabelKey: EnvironmentKey { static let defaultValue: String? = nil }
private struct OpenUIExactFormNameKey: EnvironmentKey { static let defaultValue: OpenUIString? = nil }
extension EnvironmentValues {
    var openUIFieldLabel: String? {
        get { self[OpenUIFieldLabelKey.self] }
        set { self[OpenUIFieldLabelKey.self] = newValue }
    }

    var openUIFormValidation: NativeFormValidation? {
        get { self[OpenUIFormValidationKey.self] }
        set { self[OpenUIFormValidationKey.self] = newValue }
    }
    var openUIExactFormName: OpenUIString? {
        get { self[OpenUIExactFormNameKey.self] }
        set { self[OpenUIExactFormNameKey.self] = newValue }
    }
}

/// Shared field adapter; no additional store or server state protocol.
@MainActor
struct NativeFieldState {
    let context: OpenUIComponentContext
    var name: OpenUIString { context.codeUnitString("name") ?? "" }
    private var componentType: String { context.element.typeName }
    var rules: [ParsedRule] {
        guard let raw = context.value("rules"), let json = try? raw.jsonValue() else { return [] }
        if case .array = json { return parseRules(json) }
        return parseStructuredRules(json)
    }
    var options: [EvaluatedElement] {
        context.children("items").compactMap {
            if case .element(let item) = $0.value { return item }
            return nil
        }
    }
    var initialValue: Value {
        if let value = context.value("value"), context.binding("value") == nil, value != .null {
            return value
        }
        if ["Chips", "OptionCards"].contains(componentType) {
            let values = NativeChoiceSelection.values(context.value("defaultValue") ?? .undefined)
            return NativeChoiceSelection.stored(values, single: NativeChoiceSelection.isSingle(context))
        }
        if let defaults = context.value("defaultValue") { return defaults }
        if ["CheckBoxGroup", "SwitchGroup"].contains(context.element.typeName) {
            return .object(
                options.compactMap { item in
                    guard let key = PropValue.codeUnitString(item, "name") else { return nil }
                    return ObjectField(
                        key: key, value: PropValue.value(item, "defaultChecked") ?? .boolean(false))
                })
        }
        return .null
    }
    var value: Value {
        context.binding("value")?.wrappedValue ?? context.fieldValue(name, fallback: initialValue)
    }
    func write(_ value: Value) {
        guard context.canInteract else { return }
        if let binding = context.binding("value") {
            binding.wrappedValue = value
        } else {
            context.fieldBinding(name, componentType: componentType).wrappedValue = value
        }
        mirror()
    }
    func initialize() {
        guard context.canInteract else { return }
        if context.binding("value") == nil {
            context.initializeField(name, value: initialValue, componentType: componentType)
        }
        mirror()
    }
    func mirror() {
        guard context.canInteract, context.exactFormName != nil, context.binding("value") != nil else {
            return
        }
        if context.fieldValue(name) != value {
            context.fieldBinding(name, componentType: componentType).wrappedValue = value
        }
    }
    var validationValue: Value {
        if context.element.typeName == "Slider", case .array(let items) = value {
            return items.first ?? .null
        }
        return value
    }
    var text: Binding<String> {
        Binding(
            get: {
                if case .string(let value) = value { return value.displayString }
                return ""
            }, set: { write(.string($0)) })
    }
    var selected: Binding<OpenUIString> {
        Binding(
            get: {
                if case .string(let value) = value { return value }
                return ""
            }, set: { write(.string($0)) })
    }
    func toggle(_ key: OpenUIString) -> Binding<Bool> {
        Binding(
            get: {
                if case .object(let object) = value, case .boolean(let checked) = object[key] {
                    return checked
                }
                return false
            },
            set: { checked in
                var fields: [ObjectField] = []
                if case .object(let object) = value { fields = Array(object).filter { $0.key != key } }
                fields.append(ObjectField(key: key, value: .boolean(checked)))
                write(.object(fields))
            })
    }
}
