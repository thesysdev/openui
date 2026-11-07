import SwiftUI
import OpenUILang

// Native-string conveniences do not define the language's string semantics.
// Semantic values, field keys, and wire data use OpenUIString end to end.
extension OpenUIState {
    @_disfavoredOverload public func stateValue<S: StringProtocol>(_ name: S) -> Value { stateValue(OpenUIString(String(name))) }
    @_disfavoredOverload public func setState<S: StringProtocol>(_ name: S, value: Value) { setState(OpenUIString(String(name)), value: value) }
    @_disfavoredOverload public func fieldValue<S: StringProtocol>(form: S?, name: S, fallback: Value = .null) -> Value {
        fieldValue(form: form.map { OpenUIString(String($0)) }, name: OpenUIString(String(name)), fallback: fallback)
    }
    @_disfavoredOverload public func setFieldValue<S: StringProtocol>(form: S?, name: S, value: Value, componentType: String = "input") {
        setFieldValue(form: form.map { OpenUIString(String($0)) }, name: OpenUIString(String(name)), value: value, componentType: componentType)
    }
    @_disfavoredOverload public func initializeField<S: StringProtocol>(form: S?, name: S, value: Value, componentType: String = "input") {
        initializeField(form: form.map { OpenUIString(String($0)) }, name: OpenUIString(String(name)), value: value, componentType: componentType)
    }
    @_disfavoredOverload public func fieldBinding<S: StringProtocol>(form: S?, name: S, fallback: Value = .null, componentType: String = "input") -> Binding<Value> {
        fieldBinding(form: form.map { OpenUIString(String($0)) }, name: OpenUIString(String(name)), fallback: fallback, componentType: componentType)
    }
    @_disfavoredOverload public func perform<S: StringProtocol>(_ plan: ActionPlan, formName: S?) async -> [ActionEvent] {
        await perform(plan, formName: formName.map { OpenUIString(String($0)) })
    }
    @_disfavoredOverload public func triggerAction<S: StringProtocol>(_ message: String, formName: S?, action: Value? = nil) async -> [ActionEvent] {
        await triggerAction(message, formName: formName.map { OpenUIString(String($0)) }, action: action)
    }
    @_disfavoredOverload public func runQuery<S: StringProtocol>(statementId: String, tool: S, args: Value, defaults: Value = .null) {
        runQuery(statementId: statementId, tool: OpenUIString(String(tool)), args: args, defaults: defaults)
    }
    @_disfavoredOverload public func restoreState<S: StringProtocol & Hashable>(_ values: [S: Value]) {
        restoreState(Dictionary(values.map { (OpenUIString(String($0.key)), $0.value) }, uniquingKeysWith: { _, new in new }))
    }
    @_disfavoredOverload public convenience init<S: StringProtocol & Hashable>(schema: LibrarySchema, functions: [String: CustomFunction] = [:],
        toolProvider: ToolProvider? = nil, persistedState: [S: Value]) {
        self.init(schema: schema, functions: functions, toolProvider: toolProvider,
                  persistedState: Dictionary(persistedState.map { (OpenUIString(String($0.key)), $0.value) }, uniquingKeysWith: { _, new in new }))
    }
}
