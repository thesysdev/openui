// OpenUISwiftUI — Query loading view.
//
// Shows a customizable spinner ONLY while a Query is loading.
// (The renderer itself has no spinners; this is the single loading UI.)

import SwiftUI
import OpenUILang

/// Renders a Query's lifecycle: spinner while loading, content on success.
///
/// - Parameters:
///   - state: The query's `QueryState` (from `OpenUIState.queryStates`).
///   - loading: Custom loader view.
///   - content: Rendered with the query data on success.
public struct QueryView<Loading: View, Content: View>: View {
    private let state: QueryState?
    private let loading: () -> Loading
    private let content: (Value) -> Content

    public init(
        state: QueryState?,
        @ViewBuilder loading: @escaping () -> Loading,
        @ViewBuilder content: @escaping (Value) -> Content
    ) {
        self.state = state
        self.loading = loading
        self.content = content
    }

    /// Convenience init with the default `ProgressView` spinner.
    public init(
        state: QueryState?,
        @ViewBuilder content: @escaping (Value) -> Content
    ) where Loading == ProgressView<EmptyView, EmptyView> {
        self.state = state
        self.loading = { ProgressView() }
        self.content = content
    }

    public var body: some View {
        Group {
            switch state?.status {
            case .loading:
                loading()
            case .success:
                if let data = state?.data {
                    content(data)
                }
            case .error:
                // Keep the last successful value (or defaults) visible on error.
                if let data = state?.data { content(data) }
            case .idle, .none:
                // Idle: render with defaults (data may be nil).
                if let data = state?.data {
                    content(data)
                }
            }
        }
    }
}
