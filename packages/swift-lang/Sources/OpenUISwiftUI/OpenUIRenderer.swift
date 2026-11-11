import OpenUILang
import SwiftUI

/// Renders an OpenUI Lang response with a component library, updating as the
/// response streams in.
///
/// ```swift
/// OpenUIRenderer(response: text, isStreaming: isStreaming, library: OpenUIChatLibrary.library) {
///   event in send(event.humanFriendlyMessage)
/// }
/// ```
public struct OpenUIRenderer<QueryLoader: View>: View {
  let response: String?
  let isStreaming: Bool
  let queryLoader: QueryLoader
  let onAction: ((ActionEvent) -> Void)?
  let onStateUpdate: ((OpenUIObject) -> Void)?
  let onParseResult: ((ParseResult?) -> Void)?
  let onError: (([OpenUIError]) -> Void)?

  // A StateObject because its initializer is an autoclosure: the context (and
  // the runtime behind it) is created once per view, not each time a parent
  // redraws and builds this struct again.
  @StateObject private var holder: ContextHolder
  private var context: OpenUIContext { holder.context }
  @Environment(\.openUITheme) private var theme

  /// - Parameters:
  ///   - response: The response text so far.
  ///   - isStreaming: Whether more text is still arriving.
  ///   - library: The components the response may use. Changing it requires a new view identity.
  ///   - initialState: Restored `$state` and form values, e.g. from a saved conversation.
  ///   - toolProvider: Handles `Query` and `Mutation` tool calls.
  ///   - publishObservability: Whether to publish stream events on `Observability.shared`.
  ///   - queryLoader: Shown in the top trailing corner while queries load.
  ///   - onAction: Called for actions the host handles (continue the conversation, open a URL).
  ///     A trailing closure binds here.
  ///   - onStateUpdate: Called when `$state` or form values change.
  ///   - onParseResult: Called whenever the parse result changes.
  ///   - onError: Called with errors an LLM can fix once the response finishes, and with `[]`
  ///     when they clear. See `OpenUIRuntime.onError`.
  public init(
    response: String?, isStreaming: Bool = false, library: SwiftUILibrary,
    initialState: OpenUIObject? = nil, toolProvider: (any ToolProvider)? = nil,
    publishObservability: Bool = true, queryLoader: QueryLoader,
    onAction: ((ActionEvent) -> Void)? = nil,
    onStateUpdate: ((OpenUIObject) -> Void)? = nil,
    onParseResult: ((ParseResult?) -> Void)? = nil,
    onError: (([OpenUIError]) -> Void)? = nil
  ) {
    self.response = response
    self.isStreaming = isStreaming
    self.queryLoader = queryLoader
    self.onAction = onAction
    self.onStateUpdate = onStateUpdate
    self.onParseResult = onParseResult
    self.onError = onError
    // The context parses the response up front, so the first frame shows it.
    // Without that, a renderer in a lazy stack is rebuilt empty each time it
    // scrolls back into view, then grows, and the stack keeps re-placing rows.
    _holder = StateObject(
      wrappedValue: ContextHolder(
        OpenUIContext(
          library: library, initialState: initialState, toolProvider: toolProvider,
          publishObservability: publishObservability, response: response,
          isStreaming: isStreaming)))
  }

  public var body: some View {
    let _ = syncHandlers()
    // Not a Group: modifiers on a Group apply to its children, and before the
    // first update there are none, so a nested renderer whose response never
    // changes (a restored message) would never run the onChange below.
    VStack(alignment: .leading, spacing: 0) {
      if let root = context.root {
        OpenUIElementView(element: root)
          .transition(.openUIInsertion)
          .opacity(context.isQueryLoading ? 0.7 : 1)
          .animation(.easeInOut(duration: 0.2), value: context.isQueryLoading)
          .overlay(alignment: .topTrailing) {
            if context.isQueryLoading { queryLoader.padding(8) }
          }
      }
    }
    .environment(context)
    .tint(theme.accent)
    .onChange(of: response, initial: true) {
      context.update(response: response, isStreaming: isStreaming)
    }
    .onChange(of: isStreaming) {
      context.update(response: response, isStreaming: isStreaming)
    }
  }

  /// Hands the latest closures to the context. They aren't observed, so this
  /// never triggers another render.
  private func syncHandlers() -> Bool {
    context.onAction = onAction
    context.onStateUpdate = onStateUpdate
    context.onParseResult = onParseResult
    context.onError = onError
    return true
  }
}

extension OpenUIRenderer where QueryLoader == DefaultQueryLoader {
  /// A renderer with the default query loading indicator.
  public init(
    response: String?, isStreaming: Bool = false, library: SwiftUILibrary,
    initialState: OpenUIObject? = nil, toolProvider: (any ToolProvider)? = nil,
    publishObservability: Bool = true, onAction: ((ActionEvent) -> Void)? = nil,
    onStateUpdate: ((OpenUIObject) -> Void)? = nil,
    onParseResult: ((ParseResult?) -> Void)? = nil,
    onError: (([OpenUIError]) -> Void)? = nil
  ) {
    self.init(
      response: response, isStreaming: isStreaming, library: library, initialState: initialState,
      toolProvider: toolProvider, publishObservability: publishObservability,
      queryLoader: DefaultQueryLoader(), onAction: onAction,
      onStateUpdate: onStateUpdate, onParseResult: onParseResult, onError: onError)
  }
}

/// The small spinner shown while queries load.
public struct DefaultQueryLoader: View {
  public init() {}

  public var body: some View {
    ProgressView().controlSize(.small)
  }
}

/// Keeps a renderer's context for the life of the view.
@MainActor
private final class ContextHolder: ObservableObject {
  let context: OpenUIContext
  init(_ context: OpenUIContext) { self.context = context }
}
