import Observation
import OpenUILang
import SwiftUI

/// How a component renders: it receives its evaluated props and returns a view.
public typealias ComponentContent = @MainActor (ComponentProps) -> AnyView

/// A SwiftUI component library.
public typealias SwiftUILibrary = Library<ComponentContent>

/// A component definition rendered with SwiftUI.
public typealias SwiftUIComponent = ComponentDefinition<ComponentContent>

extension ComponentDefinition where Content == ComponentContent {
  /// Pairs a schema with the SwiftUI view that renders it.
  public init<V: View>(
    _ schema: ComponentSchema, @ViewBuilder view: @escaping @MainActor (ComponentProps) -> V
  ) {
    self.init(schema, content: { AnyView(view($0)) })
  }
}

/// The renderer state shared with every component through the environment:
/// the runtime, streaming status, form fields and actions. Observing it
/// re-renders the tree when state or query results change.
@MainActor
@Observable
public final class OpenUIContext {
  public let runtime: OpenUIRuntime
  public let library: SwiftUILibrary

  /// Bumped whenever the response, `$state` or query results change.
  public private(set) var revision = 0

  /// The chart whose tooltip is open. A tapped tooltip stays open until it's
  /// tapped again, so opening another one closes it.
  var chartWithTooltip: UUID?

  @ObservationIgnored var onAction: ((ActionEvent) -> Void)?
  @ObservationIgnored var onStateUpdate: ((OpenUIObject) -> Void)?
  @ObservationIgnored var onParseResult: ((ParseResult?) -> Void)?
  @ObservationIgnored var onError: (([OpenUIError]) -> Void)?
  @ObservationIgnored private var unsubscribers: [() -> Void] = []

  /// - Parameter response: The response to show on the first render, before
  ///   ``update(response:isStreaming:)`` is called.
  public init(
    library: SwiftUILibrary, initialState: OpenUIObject? = nil,
    toolProvider: (any ToolProvider)? = nil, publishObservability: Bool = true,
    response: String? = nil, isStreaming: Bool = false
  ) {
    self.library = library
    self.runtime = OpenUIRuntime(
      library: library, initialState: initialState, toolProvider: toolProvider)
    runtime.onAction = { [weak self] event in self?.onAction?(event) }
    runtime.onStateUpdate = { [weak self] state in self?.onStateUpdate?(state) }
    runtime.onParseResult = { [weak self] result in self?.onParseResult?(result) }
    runtime.onError = { [weak self] errors in self?.onError?(errors) }
    unsubscribers.append(runtime.store.subscribe { [weak self] in self?.revision += 1 })
    unsubscribers.append(runtime.queries.subscribe { [weak self] in self?.revision += 1 })
    runtime.publishesObservability = publishObservability
    runtime.preload(response: response, isStreaming: isStreaming)
  }

  /// Feeds the latest response text.
  public func update(response: String?, isStreaming: Bool) {
    runtime.update(response: response, isStreaming: isStreaming)
    revision += 1
  }

  /// The evaluated root element for the current state.
  public var root: ElementNode? {
    _ = revision
    return runtime.evaluatedRoot()
  }

  public var isStreaming: Bool {
    _ = revision
    return runtime.isStreaming
  }

  public var isQueryLoading: Bool {
    _ = revision
    return runtime.queries.isAnyLoading
  }

  /// Runs a component's action (see `OpenUIRuntime.triggerAction`).
  public func triggerAction(_ label: String, form: String? = nil, action: OpenUIValue? = nil) {
    Task { await runtime.triggerAction(label, form: form, action: action) }
  }

  /// The form field or `$binding` a component reads and writes.
  public func stateField(name: String, binding: OpenUIValue, form: String?) -> StateField {
    _ = revision
    return runtime.stateField(name: name, binding: binding, form: form)
  }

  public func fieldValue(form: String?, name: String) -> OpenUIValue {
    _ = revision
    return runtime.fieldValue(form: form, name: name)
  }

  /// Seeds a field's default once streaming ends, without notifying the host
  /// (react-lang's `useSetDefaultValue`).
  public func setDefaultValue(
    form: String?, componentType: String, name: String, value: OpenUIValue
  ) {
    guard !runtime.isStreaming, !value.isNullish,
      runtime.fieldValue(form: form, name: name) == .undefined
    else { return }
    runtime.setFieldValue(
      form: form, componentType: componentType, name: name, value: value, notifyHost: false)
  }

  /// Stops query refreshes and drops subscriptions.
  public func dispose() {
    for unsubscribe in unsubscribers { unsubscribe() }
    unsubscribers.removeAll()
    runtime.dispose()
  }
}

private struct FormNameKey: EnvironmentKey {
  static let defaultValue: String? = nil
}

extension EnvironmentValues {
  /// The enclosing form's name; form fields store their values under it.
  public var openUIFormName: String? {
    get { self[FormNameKey.self] }
    set { self[FormNameKey.self] = newValue }
  }
}
