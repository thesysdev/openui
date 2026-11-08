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
    @ScaledMetric(relativeTo: .body) private var scale: CGFloat = 1
    func body(content: Content) -> some View {
        content.font(font.nativeFont(scale: scale))
            .lineSpacing(font.additionalLineSpacing(scale: scale))
            .tracking(font.letterSpacing * font.size * scale)
            .environment(\.openUIInheritedFont, font)
    }
}
private struct OpenUIControlTarget: ViewModifier {
    @Environment(\.openUIPresentation) private var nativePresentation

    let alignment: Alignment
    func body(content: Content) -> some View {
        content.frame(minWidth: nativePresentation.minimumControlTargetSize, minHeight: nativePresentation.minimumControlTargetSize,
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
    @Environment(\.openUIPresentation) private var nativePresentation

    let theme: OpenUIThemeValues
    var fill: Color? = nil
    var bordered = true

    func body(content: Content) -> some View {
        content
            .background {
                RoundedRectangle(cornerRadius: theme.radius3xl, style: .continuous)
                    .fill(fill ?? theme.foreground)
                    .shadow(color: .black.opacity(bordered ? theme.shadowM.opacity : 0),
                            radius: theme.shadowM.radius, x: theme.shadowM.x, y: theme.shadowM.y)
            }
            .overlay {
                RoundedRectangle(cornerRadius: theme.radius3xl, style: .continuous)
                    .strokeBorder(bordered ? nativePresentation.resolvedCardBorderColor(with: theme) : .clear,
                        lineWidth: nativePresentation.borderWidth)
                    .allowsHitTesting(false)
            }
    }
}

/// Floating previews share one surface treatment; a compact tooltip keeps the
/// content-card radius while a place preview uses the larger overlay radius.
struct NativeOverlaySurface: ViewModifier {
    @Environment(\.openUIPresentation) private var nativePresentation

    let theme: OpenUIThemeValues
    var material = false
    var compact = false
    var materialStyle: Material = .thin
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    private var shape: RoundedRectangle {
        RoundedRectangle(cornerRadius: compact ? theme.radius3xl : theme.radius5xl, style: .continuous)
    }
    func body(content: Content) -> some View {
        content.background {
            if material && !reduceTransparency { shape.fill(materialStyle) }
            else { shape.fill(theme.popoverBackground) }
        }
        .overlay(shape.strokeBorder(theme.borderDefault.opacity(0.45), lineWidth: nativePresentation.borderWidth))
        .shadow(color: .black.opacity(theme.shadowL.opacity), radius: theme.shadowL.radius, x: theme.shadowL.x, y: theme.shadowL.y)
    }
}
