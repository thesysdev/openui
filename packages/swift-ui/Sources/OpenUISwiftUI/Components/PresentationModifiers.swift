import SwiftUI

private struct OpenUIInheritedFontKey: EnvironmentKey { static let defaultValue: OpenUIFont? = nil }
extension EnvironmentValues {
    var openUIInheritedFont: OpenUIFont? {
        get { self[OpenUIInheritedFontKey.self] }
        set { self[OpenUIInheritedFontKey.self] = newValue }
    }
}
private struct OpenUIFontModifier: ViewModifier {
    let font: OpenUIFont
    @Environment(\.openUITheme) private var theme
    @ScaledMetric(relativeTo: .body) private var scale: CGFloat = 1
    func body(content: Content) -> some View {
        content.font(theme.typography.resolve(font).nativeFont(scale: scale))
            .lineSpacing(font.size * (font.lineSpacing ?? theme.typography.lineSpacing) * scale)
            .environment(\.openUIInheritedFont, font)
    }
}
private struct OpenUIControlTarget: ViewModifier {
    let alignment: Alignment
    @Environment(\.openUITheme) private var theme
    func body(content: Content) -> some View {
        content.frame(minWidth: theme.minimumControlTargetSize, minHeight: theme.minimumControlTargetSize,
                      alignment: alignment).contentShape(Rectangle())
    }
}
extension View {
    public func openUIFont(_ font: OpenUIFont) -> some View { modifier(OpenUIFontModifier(font: font)) }
    public func openUIControlTarget(alignment: Alignment = .center) -> some View {
        modifier(OpenUIControlTarget(alignment: alignment))
    }
}

/// A surface draws its own shape but never changes content layout or semantics.
/// Plain/sunken surfaces opt out of both border and elevation.
struct NativeCardSurface: ViewModifier {
    let theme: OpenUITheme
    var fill: Color? = nil
    var bordered = true

    func body(content: Content) -> some View {
        content
            .background {
                RoundedRectangle(cornerRadius: theme.cornerRadius, style: .continuous)
                    .fill(fill ?? theme.controlSurface)
                    .shadow(color: .black.opacity(bordered ? theme.cardShadowOpacity : 0),
                            radius: theme.cardShadowRadius, y: theme.cardShadowY)
            }
            .overlay {
                RoundedRectangle(cornerRadius: theme.cornerRadius, style: .continuous)
                    .strokeBorder(bordered ? theme.border : .clear, lineWidth: theme.cardBorderWidth)
                    .allowsHitTesting(false)
            }
    }
}

/// Floating previews share one surface treatment; a compact tooltip keeps the
/// content-card radius while a place preview uses the larger overlay radius.
struct NativeOverlaySurface: ViewModifier {
    let theme: OpenUITheme
    var material = false
    var compact = false
    var materialStyle: Material = .thin
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    private var shape: RoundedRectangle {
        RoundedRectangle(cornerRadius: compact ? theme.cornerRadius : theme.overlayCornerRadius, style: .continuous)
    }
    func body(content: Content) -> some View {
        content.background {
            if material && !reduceTransparency { shape.fill(materialStyle) }
            else { shape.fill(theme.controlSurface) }
        }
        .overlay(shape.strokeBorder(theme.border.opacity(0.45), lineWidth: theme.cardBorderWidth))
        .shadow(color: .black.opacity(0.08), radius: 8, y: 3)
    }
}
