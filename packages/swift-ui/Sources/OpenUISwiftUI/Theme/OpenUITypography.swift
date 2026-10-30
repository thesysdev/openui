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
    private var detailHeavyOverride: OpenUIFont?
    public var detailHeavy: OpenUIFont {
        get { detailHeavyOverride ?? detail.weight(.semibold) }
        set { detailHeavyOverride = newValue }
    }
    public var bodyLarge = OpenUIFont(size: 18)
    private var bodyLargeHeavyOverride: OpenUIFont?
    public var bodyLargeHeavy: OpenUIFont {
        get { bodyLargeHeavyOverride ?? bodyLarge.weight(.semibold) }
        set { bodyLargeHeavyOverride = newValue }
    }
    public var label = OpenUIFont(size: 14)
    public var caption = OpenUIFont(size: 12)
    public var metric = OpenUIFont(size: 16, weight: .medium).monospacedDigit()
    public var inlineMetric = OpenUIFont(size: 16, weight: .medium).monospacedDigit()
    public var actionCompact = OpenUIFont(size: 14, weight: .medium)
    public var actionRegular = OpenUIFont(size: 16, weight: .medium)
    public var code = OpenUIFont(size: 14, design: .monospaced)
    public init() {}

    func inline(_ size: String?, emphasized: Bool = false) -> OpenUIFont {
        switch size {
        case "xs": return emphasized ? detailHeavy : detail
        case "lg": return emphasized ? bodyLargeHeavy : bodyLarge
        default: return emphasized ? bodyHeavy : body
        }
    }
    func field(_ size: String?) -> OpenUIFont { size == "small" ? detail : body }
    func resolve(_ font: OpenUIFont) -> OpenUIFont {
        var resolved = font
        resolved.family = font.family ?? (font.design == .monospaced ? nil : family)
        return resolved
    }
}

