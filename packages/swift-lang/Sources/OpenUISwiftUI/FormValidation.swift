import Observation
import OpenUILang
import SwiftUI

/// Validation state for one `Form`: fields register their rules, primary
/// buttons validate the whole form before acting, and fields show their error.
/// Ports react-lang's `useCreateFormValidation`.
@MainActor
@Observable
public final class FormValidation {
  public private(set) var errors: [String: String] = [:]

  private struct Registration {
    var rules: [ParsedRule]
    var value: @MainActor () -> OpenUIValue
  }

  @ObservationIgnored private var fields: [String: Registration] = [:]

  public init() {}

  public func error(for name: String) -> String? { errors[name] }

  public func register(
    _ name: String, rules: [ParsedRule], value: @escaping @MainActor () -> OpenUIValue
  ) {
    fields[name] = Registration(rules: rules, value: value)
  }

  public func unregister(_ name: String) {
    fields[name] = nil
  }

  /// Validates one field, storing or clearing its error. Returns whether it is valid.
  @discardableResult
  public func validateField(_ name: String, value: OpenUIValue, rules: [ParsedRule]) -> Bool {
    let error = validate(value, rules)
    if errors[name] != error { errors[name] = error }
    return error == nil
  }

  /// Validates every registered field. Returns whether the form is valid.
  public func validateForm() -> Bool {
    var next: [String: String] = [:]
    for (name, field) in fields {
      if let error = validate(unwrapFieldValue(field.value()), field.rules) { next[name] = error }
    }
    errors = next
    return next.isEmpty
  }

  public func clearError(_ name: String) {
    if errors[name] != nil { errors[name] = nil }
  }
}

/// Form fields store `{ value, componentType }`; validation sees the raw value.
private func unwrapFieldValue(_ value: OpenUIValue) -> OpenUIValue {
  if case .object(let object) = value, object.contains("componentType"), let inner = object["value"]
  {
    return inner
  }
  return value
}

/// Registers a field's rules with the enclosing form while it is on screen.
struct FormFieldRegistration: ViewModifier {
  let name: String
  let rules: [ParsedRule]
  let value: OpenUIValue
  @Environment(FormValidation.self) private var validation: FormValidation?
  @Environment(OpenUIContext.self) private var context

  func body(content: Content) -> some View {
    content
      .onChange(
        of: RegistrationKey(name: name, rules: rules, isStreaming: context.isStreaming),
        initial: true
      ) {
        guard let validation, !rules.isEmpty, !context.isStreaming else { return }
        let current = value
        validation.register(name, rules: rules) { current }
      }
      .onChange(of: value) {
        guard let validation, !rules.isEmpty, !context.isStreaming else { return }
        let current = value
        validation.register(name, rules: rules) { current }
      }
      .onDisappear { validation?.unregister(name) }
  }

  private struct RegistrationKey: Equatable {
    let name: String
    let rules: [ParsedRule]
    let isStreaming: Bool
  }
}

extension View {
  func formField(_ name: String, rules: [ParsedRule], value: OpenUIValue) -> some View {
    modifier(FormFieldRegistration(name: name, rules: rules, value: value))
  }
}
