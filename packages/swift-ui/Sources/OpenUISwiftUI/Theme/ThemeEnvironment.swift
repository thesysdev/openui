import SwiftUI

private struct OpenUIThemeKey: EnvironmentKey {
    static let defaultValue = OpenUITheme()
}

extension EnvironmentValues {
    public var openUITheme: OpenUITheme {
        get { self[OpenUIThemeKey.self] }
        set { self[OpenUIThemeKey.self] = newValue }
    }
}

extension View {
    /// Replace the theme for this subtree with a complete theme value.
    public func openUITheme(_ value: OpenUITheme) -> some View {
        environment(\.openUITheme, value)
    }

    /// Modify the inherited theme for this subtree. Unchanged fields and
    /// sibling subtrees retain their parent theme; no global state is used.
    public func openUITheme(_ update: @escaping (inout OpenUITheme) -> Void) -> some View {
        transformEnvironment(\.openUITheme, transform: update)
    }
}
