import Foundation

/// The reactive state store: `$bindings` as top-level keys, form fields nested
/// under their form name.
public final class Store {
  private var state = OpenUIObject()
  private var listeners: [UUID: () -> Void] = [:]
  private var listenerOrder: [UUID] = []

  public init() {}

  public func get(_ name: String) -> OpenUIValue {
    state[name] ?? .undefined
  }

  /// Sets a value and notifies listeners, unless the value is unchanged (plain
  /// objects compare shallowly, as form data is replaced on every edit).
  public func set(_ name: String, _ value: OpenUIValue) {
    let existing = state[name] ?? .undefined
    if existing.isSameValue(value) { return }
    if case .object(let next) = value, case .object(let current) = existing,
      next.keys.count == current.keys.count,
      next.keys.allSatisfy({ (next[$0] ?? .undefined).isSameValue(current[$0] ?? .undefined) })
    {
      return
    }
    state[name] = value
    notify()
  }

  /// Registers a listener; returns a function that removes it.
  @discardableResult
  public func subscribe(_ listener: @escaping () -> Void) -> () -> Void {
    let id = UUID()
    listeners[id] = listener
    listenerOrder.append(id)
    return { [weak self] in
      self?.listeners[id] = nil
      self?.listenerOrder.removeAll { $0 == id }
    }
  }

  public var snapshot: OpenUIObject { state }

  /// Applies persisted values, then defaults for keys that don't exist yet.
  /// Values the user already changed are never overwritten or deleted: while
  /// streaming, declarations can briefly disappear and deleting would lose input.
  public func initialize(defaults: OpenUIObject, persisted: OpenUIObject) {
    for (key, value) in persisted { state[key] = value }
    for (key, value) in defaults where !state.contains(key) { state[key] = value }
    notify()
  }

  public func dispose() {
    state = OpenUIObject()
    listeners.removeAll()
    listenerOrder.removeAll()
  }

  private func notify() {
    for id in listenerOrder { listeners[id]?() }
  }
}

/// A form field or `$binding` a component reads and writes.
public struct StateField {
  public var name: String
  public var value: OpenUIValue
  public var setValue: (OpenUIValue) -> Void
  /// True when the field is bound to a `$state` variable.
  public var isReactive: Bool
}

/// Resolves the field a component should read and write: a reactive binding
/// when the prop is bound to `$state`, otherwise the form field `name`.
public func resolveStateField(
  name: String, bindingValue: OpenUIValue, store: Store?, evaluationContext: EvaluationContext?,
  getField: @escaping (String) -> OpenUIValue,
  setField: @escaping (String, OpenUIValue) -> Void
) -> StateField {
  if case .reactiveAssign(let assign) = bindingValue, let store, let evaluationContext {
    return StateField(
      name: name, value: store.get(assign.target),
      setValue: { newValue in
        var context = evaluationContext
        context.extraScope = ["$value": newValue]
        store.set(assign.target, evaluate(assign.expr, context))
      }, isReactive: true)
  }
  let current = getField(name)
  return StateField(
    name: name, value: current.isNullish ? bindingValue : current,
    setValue: { setField(name, $0) }, isReactive: false)
}
