import SwiftUI

/// System follows the nearest SwiftUI color scheme, including a containing theme scope.
public enum OpenUIThemeMode: Equatable { case system, light, dark }

extension EnvironmentValues {
    @Entry public var openUITheme = OpenUIThemeValues.defaults
    @Entry public var openUIPresentation = OpenUIPresentation.defaults
}

private struct OpenUIThemeScope: ViewModifier {
    let mode: OpenUIThemeMode
    let light: OpenUITheme
    let dark: OpenUITheme?
    @Environment(\.colorScheme) private var inheritedScheme
    func body(content: Content) -> some View {
        let scheme: ColorScheme = mode == .light ? .light : mode == .dark ? .dark : inheritedScheme
        let values = (scheme == .dark ? dark ?? light : light).resolved()
        content.environment(\.openUITheme, values).environment(\.colorScheme, scheme)
    }
}

extension View {
    /// Each scope starts from SDK defaults, as in the pinned React ThemeProvider.
    /// When darkTheme is absent the light overrides are reused in dark mode.
    public func openUITheme(mode: OpenUIThemeMode = .system,
                            lightTheme: OpenUITheme = OpenUITheme(),
                            darkTheme: OpenUITheme? = nil) -> some View {
        modifier(OpenUIThemeScope(mode: mode, light: lightTheme, dark: darkTheme))
    }
    public func openUITheme(_ overrides: OpenUITheme) -> some View {
        openUITheme(lightTheme: overrides)
    }
    /// Build a fresh override set. An inner scope does not merge parent overrides.
    public func openUITheme(_ configure: (inout OpenUITheme) -> Void) -> some View {
        var overrides = OpenUITheme()
        configure(&overrides)
        return openUITheme(overrides)
    }
    public func openUIPresentation(_ value: OpenUIPresentation) -> some View {
        environment(\.openUIPresentation, value)
    }
    // Resolved scopes are used internally for artwork contrast and rendering tests.
    func openUITheme(_ values: OpenUIThemeValues) -> some View {
        environment(\.openUITheme, values)
    }
}
