// OpenUISwiftUI — Renderer.
//
// The top-level SwiftUI view for OpenUI. Takes an OpenUIState and a
// ComponentRegistry, renders the evaluated tree.

import SwiftUI
import OpenUILang

/// Renders an OpenUI stream.
///
/// ```swift
/// struct ContentView: View {
///     @StateObject var uiState = OpenUIState(schema: mySchema)
///
///     var body: some View {
///         OpenUIRenderer(state: uiState, registry: myRegistry)
///             .onAppear {
///                 // Feed chunks as they arrive from the model.
///                 uiState.push("root = Stack([Text(\"Hello\")])")
///                 uiState.complete()
///             }
///     }
/// }
///
/// let myRegistry: ComponentRegistry = [
///     "Stack": { el, registry in
///         AnyView(VStack {
///             ForEach(0..<PropValue.children(el).count, id: \.self) { i in
///                 RenderNode(element: PropValue.children(el)[i], registry: registry)
///             }
///         })
///     },
///     "Text": { el, _ in
///         AnyView(Text(PropValue.string(el, "text") ?? ""))
///     },
/// ]
/// ```
public struct OpenUIRenderer: View {
    @ObservedObject private var state: OpenUIState
    private let registry: ComponentRegistry
    @Environment(\.openUITheme) private var theme

    public init(state: OpenUIState, registry: ComponentRegistry) {
        self.state = state
        self.registry = registry
    }

    public var body: some View {
        Group {
            if let root = state.root {
                RenderNode(element: root, registry: registry)
            } else {
                // Nothing to render yet (or root failed).
                EmptyView()
            }
        }
        .environmentObject(state)
        .openUIFont(theme.typography.body).foregroundStyle(theme.foreground).tint(theme.accent)
    }
}
