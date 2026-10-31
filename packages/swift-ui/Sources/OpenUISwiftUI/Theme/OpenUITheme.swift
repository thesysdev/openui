import SwiftUI

/// Semantic defaults can be replaced by the product without changing programs.
public struct OpenUITheme {
    // Pinned react-ui f08a6605 neutral palette, converted from OKLCH to sRGB.
    // Translucent roles remain translucent so nested surfaces do not gain a tint.
    public var foreground = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFAFAFA)
    public var secondary = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFAFAFA).opacity(0.6)
    public var canvas = NativeControlPalette.adaptive(light: 0xF5F5F5, dark: 0x0A0A0A)
    public var surface = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFDFDFD).opacity(0.04)
    public var border = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFDFDFD).opacity(0.06)
    public var interactiveBorder = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFDFDFD).opacity(0.12)
    public var subtleSurface = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFDFDFD).opacity(0.02)
    // The assistant uses the reference's neutral brand treatment. A product
    // accent remains an explicit theme override, not a default blue CTA.
    public var accent = NativeControlPalette.ink
    public var accentForeground: Color? = nil
    public var controlSurface = NativeControlPalette.adaptive(light: 0xFDFDFD, dark: 0x171717)
    public var error = NativeControlPalette.error
    public var info = NativeControlPalette.info
    public var success = NativeControlPalette.success
    public var warning = NativeControlPalette.warning
    // Layout tokens use the upstream ThemeProvider names and defaults.
    public var space000: CGFloat = 0
    public var space3xs: CGFloat = 2
    public var space2xs: CGFloat = 4
    public var spaceXs: CGFloat = 6
    public var spaceS: CGFloat = 8
    public var spaceSM: CGFloat = 10
    public var spaceM: CGFloat = 12
    public var spaceML: CGFloat = 16
    public var spaceL: CGFloat = 18
    public var spaceXl: CGFloat = 24
    public var space2xl: CGFloat = 36
    public var space3xl: CGFloat = 48
    public var radiusM: CGFloat = 8
    public var radiusL: CGFloat = 10
    public var radiusXl: CGFloat = 12
    public var radius2xl: CGFloat = 14
    public var radius3xl: CGFloat = 16
    public var radius5xl: CGFloat = 24

    // Existing native configuration remains source-compatible. An explicit
    // override wins; otherwise the component follows the shared token.
    private var controlRadiusOverride: CGFloat?
    private var cardRadiusOverride: CGFloat?
    private var overlayRadiusOverride: CGFloat?
    private var mediaRadiusOverride: CGFloat?
    private var cardPaddingOverride: CGFloat?
    private var contentSpacingOverride: CGFloat?
    public var controlCornerRadius: CGFloat {
        get { controlRadiusOverride ?? radiusL }
        set { controlRadiusOverride = newValue }
    }
    public var cornerRadius: CGFloat {
        get { cardRadiusOverride ?? radius3xl }
        set { cardRadiusOverride = newValue }
    }
    public var overlayCornerRadius: CGFloat {
        get { overlayRadiusOverride ?? radius5xl }
        set { overlayRadiusOverride = newValue }
    }
    public var cardPadding: CGFloat {
        get { cardPaddingOverride ?? spaceM }
        set { cardPaddingOverride = newValue }
    }
    public var contentSpacing: CGFloat {
        get { contentSpacingOverride ?? spaceM }
        set { contentSpacingOverride = newValue }
    }
    public var mediaCornerRadius: CGFloat {
        get { mediaRadiusOverride ?? radiusM }
        set { mediaRadiusOverride = newValue }
    }
    func cardRadius(for kind: String) -> CGFloat {
        if let override = cardRadiusOverride {
            return max(0, override - (kind == "Context" ? 4 : ["Overview", "Snippet"].contains(kind) ? 2 : 0))
        }
        return kind == "Context" ? radiusXl : ["Overview", "Snippet"].contains(kind) ? radius2xl : radius3xl
    }
    // Inverted text is independent of a chart/host canvas override.
    public var invertedForeground = NativeControlPalette.adaptive(light: 0xF5F5F5, dark: 0x0A0A0A)
    private var invertedBackgroundOverride: Color?
    public var invertedBackground: Color {
        get { invertedBackgroundOverride ?? foreground }
        set { invertedBackgroundOverride = newValue }
    }
    private var linkOverride: Color?
    public var link: Color {
        get { linkOverride ?? foreground }
        set { linkOverride = newValue }
    }
    #if os(iOS)
    public var minimumControlTargetSize: CGFloat = 44
    #else
    public var minimumControlTargetSize: CGFloat = 24
    #endif
    public var typography = OpenUITypography()
    public var motion = OpenUIMotion()
    public var thumbnailSize: CGFloat = 112
    public var compactThumbnailSize: CGFloat = 80
    public var inlineThumbnailSize: CGFloat = 40
    public var minimumTextColumnWidth: CGFloat = 160
    public var coverAspectRatio: CGFloat = 3 / 2
    public var maximumCarouselCardWidth: CGFloat = 320
    public var carouselPeek: CGFloat = 32
    public var cardBorderWidth: CGFloat = 1
    public var cardShadowOpacity: Double = 0
    public var cardShadowRadius: CGFloat = 0
    public var cardShadowY: CGFloat = 0
    public var metricSurface = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFDFDFD).opacity(0.04)
    private var customDataColors: [Color]?
    /// Explicit host colors retain their existing override behavior.
    public var dataColors: [Color] {
        get { customDataColors ?? NativeChartPalette.swatches(count: 6).map(\.color) }
        set { customDataColors = newValue }
    }
    public func chartColors(forSeriesCount count: Int) -> [Color] {
        if let customDataColors { return customDataColors.isEmpty ? [accent] : customDataColors }
        return NativeChartPalette.swatches(count: count).map(\.color)
    }
    public var chartGrid = NativeControlPalette.adaptive(light: 0xE8EAEE, dark: 0x34373C)
    public var chartAxis = NativeControlPalette.adaptive(light: 0x6A6F78, dark: 0xB4BBC6)
    public var minimumCardWidth: CGFloat = 240
    public var minimumCompactCardWidth: CGFloat = 160
    public var minimumChoiceWidth: CGFloat = 136
    public init() {}

    public func spacing(_ token: String?) -> CGFloat {
        switch token {
        case "none": return 0
        case "3xs": return space3xs
        case "2xs": return space2xs
        case "xs": return spaceXs
        case "s": return spaceS
        case "sm": return spaceSM
        case "ml": return spaceML
        case "l": return spaceL
        case "xl": return spaceXl
        case "2xl": return space2xl
        case "3xl": return space3xl
        default: return spaceM
        }
    }
}

