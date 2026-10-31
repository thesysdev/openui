// OpenUISwiftUI — Error boundary.
//
// Swift port of react-lang's `ElementErrorBoundary`. Keeps the last
// registered element; if the input becomes unavailable, the last good
// version is shown. This does not catch SwiftUI runtime crashes.

import SwiftUI
import OpenUILang

/// A view that keeps the last successful render when its input becomes unavailable.
///
/// SwiftUI has no try/catch around view builders, so this boundary works at
/// the element level: it stores the last `EvaluatedElement` that rendered
/// without the registry reporting an error, and falls back to it when the
/// current element has no registered component.
public struct ElementErrorBoundary<Content: View>: View {
    private let element: EvaluatedElement?
    private let content: (EvaluatedElement) -> Content
    @State private var lastGood: EvaluatedElement?

    public init(
        element: EvaluatedElement?,
        @ViewBuilder content: @escaping (EvaluatedElement) -> Content
    ) {
        self.element = element
        self.content = content
    }

    public var body: some View {
        Group {
            if let shown = element ?? lastGood {
                content(shown)
            } else {
                EmptyView()
            }
        }
        .onAppear { if let element { lastGood = element } }
        .onChange(of: element) { if let element = $0 { lastGood = element } }
    }
}
