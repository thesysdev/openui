import SwiftUI

/// One font description for both native text and Markdown/KaTeX text. Scaling
/// belongs to the receiving view's environment, never a process-wide screen.
public struct OpenUIFont: Equatable {
    public var size: CGFloat
    public var weight: Font.Weight
    public var family: String?
    public var design: Font.Design
    /// Additional line spacing in em; nil inherits the typography default.
    public var lineSpacing: CGFloat?
    public var monospacedDigits = false
    public init(size: CGFloat, weight: Font.Weight = .regular,
                family: String? = nil, design: Font.Design = .default, lineSpacing: CGFloat? = nil) {
        self.size = size; self.weight = weight; self.family = family; self.design = design
        self.lineSpacing = lineSpacing
    }
    public func weight(_ value: Font.Weight) -> Self { var copy = self; copy.weight = value; return copy }
    public func monospacedDigit() -> Self { var copy = self; copy.monospacedDigits = true; return copy }
    public func nativeFont(scale: CGFloat = 1) -> Font {
        let font = family.map { Font.custom($0, fixedSize: size * scale).weight(weight) }
            ?? .system(size: size * scale, weight: weight, design: design)
        return monospacedDigits ? font.monospacedDigit() : font
    }
}

/// Shared semantic roles. Official component size enums map into these roles;
/// they do not add language fields or classify business content.
public struct OpenUITypography: Equatable {
    public var family: String?
    public var lineSpacing: CGFloat = 0.20
    public var display = OpenUIFont(size: 24, weight: .semibold)
    public var title = OpenUIFont(size: 18, weight: .semibold)
    public var heading = OpenUIFont(size: 16, weight: .semibold)
    public var body = OpenUIFont(size: 16)
    private var bodyHeavyOverride: OpenUIFont?
    /// Upstream textBodyDefaultHeavy, used by ImageTextLarge's highlight text.
    public var bodyHeavy: OpenUIFont {
        get { bodyHeavyOverride ?? body.weight(.semibold) }
        set { bodyHeavyOverride = newValue }
    }
    public var detail = OpenUIFont(size: 14)
    public var label = OpenUIFont(size: 14)
    public var caption = OpenUIFont(size: 12)
    public var metric = OpenUIFont(size: 16, weight: .medium).monospacedDigit()
    public var inlineMetric = OpenUIFont(size: 16, weight: .medium).monospacedDigit()
    public var actionCompact = OpenUIFont(size: 14, weight: .medium)
    public var actionRegular = OpenUIFont(size: 16, weight: .medium)
    public var code = OpenUIFont(size: 14, design: .monospaced)
    public init() {}

    func inline(_ size: String?) -> OpenUIFont {
        switch size {
        case "xs": return detail
        case "sm", "md": return body
        case "lg": return title.weight(body.weight)
        default: return body
        }
    }
    func field(_ size: String?) -> OpenUIFont { size == "small" ? detail : body }
    func resolve(_ font: OpenUIFont) -> OpenUIFont {
        var resolved = font
        resolved.family = font.family ?? (font.design == .monospaced ? nil : family)
        return resolved
    }
}

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

/// Shared feedback timing. Views still honor the nearest Reduce Motion setting.
public struct OpenUIMotion {
    public var pressDuration: Double = 0.12
    public var pressedOpacity: Double = 0.82
    public var pressedScale: CGFloat = 0.985
    public var pagingResponse: Double = 0.32
    public var pagingDamping: Double = 0.86
    public var loadingShimmerDuration: Double = 1.6
    public var mediaRevealDuration: Double = 0.18
    public init() {}
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
