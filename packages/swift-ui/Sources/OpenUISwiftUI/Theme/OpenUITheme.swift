import SwiftUI

/// Partial overrides using the pinned React Theme names. Nil keeps the SDK default.
/// Typography roles are complete values; overriding one never mutates another role.
public struct OpenUITheme {
    public var textNeutralPrimary: Color?
    public var textNeutralSecondary: Color?
    public var textNeutralTertiary: Color?
    public var textNeutralLink: Color?
    public var background: Color?
    public var foreground: Color?
    public var popoverBackground: Color?
    public var sunk: Color?
    public var sunkLight: Color?
    public var highlight: Color?
    public var borderDefault: Color?
    public var borderInteractive: Color?
    public var borderAccent: Color?
    public var borderDanger: Color?
    public var invertedBackground: Color?
    public var textInfoPrimary: Color?
    public var textSuccessPrimary: Color?
    public var textAlertPrimary: Color?
    public var textDangerPrimary: Color?
    public var textDangerTertiary: Color?
    public var infoBackground: Color?
    public var successBackground: Color?
    public var alertBackground: Color?
    public var dangerBackground: Color?
    public var interactiveAccentDefault: Color?
    public var interactiveAccentHover: Color?
    public var interactiveAccentPressed: Color?
    public var interactiveAccentDisabled: Color?
    public var interactiveDestructiveDefault: Color?
    public var interactiveDestructiveHover: Color?
    public var interactiveDestructivePressed: Color?
    public var interactiveDestructiveDisabled: Color?
    public var interactiveDestructiveAccentDefault: Color?
    public var interactiveDestructiveAccentHover: Color?
    public var interactiveDestructiveAccentPressed: Color?
    public var interactiveDestructiveAccentDisabled: Color?
    public var textAccentPrimary: Color?
    public var textDangerInvertedPrimary: Color?
    public var space000: CGFloat?
    public var space3xs: CGFloat?
    public var space2xs: CGFloat?
    public var spaceXs: CGFloat?
    public var spaceS: CGFloat?
    public var spaceSM: CGFloat?
    public var spaceM: CGFloat?
    public var spaceML: CGFloat?
    public var spaceL: CGFloat?
    public var spaceXl: CGFloat?
    public var space2xl: CGFloat?
    public var space3xl: CGFloat?
    public var radiusNone: CGFloat?
    public var radius3xs: CGFloat?
    public var radius2xs: CGFloat?
    public var radiusXs: CGFloat?
    public var radiusS: CGFloat?
    public var radiusM: CGFloat?
    public var radiusL: CGFloat?
    public var radiusXl: CGFloat?
    public var radius2xl: CGFloat?
    public var radius3xl: CGFloat?
    public var radius4xl: CGFloat?
    public var radius5xl: CGFloat?
    public var radius6xl: CGFloat?
    public var radius7xl: CGFloat?
    public var radius8xl: CGFloat?
    public var radius9xl: CGFloat?
    public var radiusFull: CGFloat?
    public var textHeadingMd: OpenUIFont?
    public var textHeadingSm: OpenUIFont?
    public var textHeadingXs: OpenUIFont?
    public var textBodyDefault: OpenUIFont?
    public var textBodyDefaultHeavy: OpenUIFont?
    public var textBodySm: OpenUIFont?
    public var textBodySmHeavy: OpenUIFont?
    public var textBodyLg: OpenUIFont?
    public var textBodyLgHeavy: OpenUIFont?
    public var textLabelSm: OpenUIFont?
    public var textBodyXs: OpenUIFont?
    public var textNumbersDefaultHeavy: OpenUIFont?
    public var textLabelSmHeavy: OpenUIFont?
    public var textLabelDefaultHeavy: OpenUIFont?
    public var textCodeDefault: OpenUIFont?
    public var defaultChartPalette: [Color]?
    public var barChartPalette: [Color]?
    public var lineChartPalette: [Color]?
    public var areaChartPalette: [Color]?
    public var pieChartPalette: [Color]?
    public var radarChartPalette: [Color]?
    public var radialChartPalette: [Color]?
    public var horizontalBarChartPalette: [Color]?
    public var shadow0: OpenUIShadow?
    public var shadowS: OpenUIShadow?
    public var shadowM: OpenUIShadow?
    public var shadowL: OpenUIShadow?
    public init() {}

    /// Resolve this override set against the SDK defaults. Colors remain appearance-aware.
    public func resolved() -> OpenUIThemeValues {
        var values = OpenUIThemeValues.defaults
        if let textNeutralPrimary { values.textNeutralPrimary = textNeutralPrimary }
        if let textNeutralSecondary { values.textNeutralSecondary = textNeutralSecondary }
        if let textNeutralTertiary { values.textNeutralTertiary = textNeutralTertiary }
        if let textNeutralLink { values.textNeutralLink = textNeutralLink }
        if let background { values.background = background }
        if let foreground { values.foreground = foreground }
        if let popoverBackground { values.popoverBackground = popoverBackground }
        if let sunk { values.sunk = sunk }
        if let sunkLight { values.sunkLight = sunkLight }
        if let highlight { values.highlight = highlight }
        if let borderDefault { values.borderDefault = borderDefault }
        if let borderInteractive { values.borderInteractive = borderInteractive }
        if let borderAccent { values.borderAccent = borderAccent }
        if let borderDanger { values.borderDanger = borderDanger }
        if let invertedBackground { values.invertedBackground = invertedBackground }
        if let textInfoPrimary { values.textInfoPrimary = textInfoPrimary }
        if let textSuccessPrimary { values.textSuccessPrimary = textSuccessPrimary }
        if let textAlertPrimary { values.textAlertPrimary = textAlertPrimary }
        if let textDangerPrimary { values.textDangerPrimary = textDangerPrimary }
        if let textDangerTertiary { values.textDangerTertiary = textDangerTertiary }
        if let infoBackground { values.infoBackground = infoBackground }
        if let successBackground { values.successBackground = successBackground }
        if let alertBackground { values.alertBackground = alertBackground }
        if let dangerBackground { values.dangerBackground = dangerBackground }
        if let interactiveAccentDefault { values.interactiveAccentDefault = interactiveAccentDefault }
        if let interactiveAccentHover { values.interactiveAccentHover = interactiveAccentHover }
        if let interactiveAccentPressed { values.interactiveAccentPressed = interactiveAccentPressed }
        if let interactiveAccentDisabled { values.interactiveAccentDisabled = interactiveAccentDisabled }
        if let interactiveDestructiveDefault { values.interactiveDestructiveDefault = interactiveDestructiveDefault }
        if let interactiveDestructiveHover { values.interactiveDestructiveHover = interactiveDestructiveHover }
        if let interactiveDestructivePressed { values.interactiveDestructivePressed = interactiveDestructivePressed }
        if let interactiveDestructiveDisabled { values.interactiveDestructiveDisabled = interactiveDestructiveDisabled }
        if let interactiveDestructiveAccentDefault { values.interactiveDestructiveAccentDefault = interactiveDestructiveAccentDefault }
        if let interactiveDestructiveAccentHover { values.interactiveDestructiveAccentHover = interactiveDestructiveAccentHover }
        if let interactiveDestructiveAccentPressed { values.interactiveDestructiveAccentPressed = interactiveDestructiveAccentPressed }
        if let interactiveDestructiveAccentDisabled { values.interactiveDestructiveAccentDisabled = interactiveDestructiveAccentDisabled }
        if let textAccentPrimary { values.textAccentPrimary = textAccentPrimary }
        if let textDangerInvertedPrimary { values.textDangerInvertedPrimary = textDangerInvertedPrimary }
        if let space000 { values.space000 = space000 }
        if let space3xs { values.space3xs = space3xs }
        if let space2xs { values.space2xs = space2xs }
        if let spaceXs { values.spaceXs = spaceXs }
        if let spaceS { values.spaceS = spaceS }
        if let spaceSM { values.spaceSM = spaceSM }
        if let spaceM { values.spaceM = spaceM }
        if let spaceML { values.spaceML = spaceML }
        if let spaceL { values.spaceL = spaceL }
        if let spaceXl { values.spaceXl = spaceXl }
        if let space2xl { values.space2xl = space2xl }
        if let space3xl { values.space3xl = space3xl }
        if let radiusNone { values.radiusNone = radiusNone }
        if let radius3xs { values.radius3xs = radius3xs }
        if let radius2xs { values.radius2xs = radius2xs }
        if let radiusXs { values.radiusXs = radiusXs }
        if let radiusS { values.radiusS = radiusS }
        if let radiusM { values.radiusM = radiusM }
        if let radiusL { values.radiusL = radiusL }
        if let radiusXl { values.radiusXl = radiusXl }
        if let radius2xl { values.radius2xl = radius2xl }
        if let radius3xl { values.radius3xl = radius3xl }
        if let radius4xl { values.radius4xl = radius4xl }
        if let radius5xl { values.radius5xl = radius5xl }
        if let radius6xl { values.radius6xl = radius6xl }
        if let radius7xl { values.radius7xl = radius7xl }
        if let radius8xl { values.radius8xl = radius8xl }
        if let radius9xl { values.radius9xl = radius9xl }
        if let radiusFull { values.radiusFull = radiusFull }
        if let textHeadingMd { values.textHeadingMd = textHeadingMd }
        if let textHeadingSm { values.textHeadingSm = textHeadingSm }
        if let textHeadingXs { values.textHeadingXs = textHeadingXs }
        if let textBodyDefault { values.textBodyDefault = textBodyDefault }
        if let textBodyDefaultHeavy { values.textBodyDefaultHeavy = textBodyDefaultHeavy }
        if let textBodySm { values.textBodySm = textBodySm }
        if let textBodySmHeavy { values.textBodySmHeavy = textBodySmHeavy }
        if let textBodyLg { values.textBodyLg = textBodyLg }
        if let textBodyLgHeavy { values.textBodyLgHeavy = textBodyLgHeavy }
        if let textLabelSm { values.textLabelSm = textLabelSm }
        if let textBodyXs { values.textBodyXs = textBodyXs }
        if let textNumbersDefaultHeavy { values.textNumbersDefaultHeavy = textNumbersDefaultHeavy }
        if let textLabelSmHeavy { values.textLabelSmHeavy = textLabelSmHeavy }
        if let textLabelDefaultHeavy { values.textLabelDefaultHeavy = textLabelDefaultHeavy }
        if let textCodeDefault { values.textCodeDefault = textCodeDefault }
        if let defaultChartPalette { values.defaultChartPalette = defaultChartPalette }
        if let barChartPalette { values.barChartPalette = barChartPalette }
        if let lineChartPalette { values.lineChartPalette = lineChartPalette }
        if let areaChartPalette { values.areaChartPalette = areaChartPalette }
        if let pieChartPalette { values.pieChartPalette = pieChartPalette }
        if let radarChartPalette { values.radarChartPalette = radarChartPalette }
        if let radialChartPalette { values.radialChartPalette = radialChartPalette }
        if let horizontalBarChartPalette { values.horizontalBarChartPalette = horizontalBarChartPalette }
        if let shadow0 { values.shadow0 = shadow0 }
        if let shadowS { values.shadowS = shadowS }
        if let shadowM { values.shadowM = shadowM }
        if let shadowL { values.shadowL = shadowL }
        return values
    }
}

/// Complete values received by native and application-defined components.
/// The native font, chart palette and contrast defaults retain the existing Swift presentation.
public struct OpenUIThemeValues {
    // Dynamic Color providers are reused across scope resolution and stream updates.
    static let defaults = OpenUIThemeValues()
    public var textNeutralPrimary: Color = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFAFAFA)
    public var textNeutralSecondary: Color = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFAFAFA).opacity(0.6)
    public var textNeutralTertiary: Color = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFAFAFA).opacity(0.2)
    public var textNeutralLink: Color = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFAFAFA)
    public var background: Color = NativeControlPalette.adaptive(light: 0xF5F5F5, dark: 0x0A0A0A)
    public var foreground: Color = NativeControlPalette.adaptive(light: 0xFDFDFD, dark: 0x171717)
    public var popoverBackground: Color = NativeControlPalette.adaptive(light: 0xFDFDFD, dark: 0x171717)
    public var sunk: Color = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFDFDFD).opacity(0.04)
    public var sunkLight: Color = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFDFDFD).opacity(0.02)
    public var highlight: Color = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFDFDFD).opacity(0.04)
    public var borderDefault: Color = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFDFDFD).opacity(0.06)
    public var borderInteractive: Color = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFDFDFD).opacity(0.12)
    public var borderAccent: Color = NativeControlPalette.ink.opacity(0.08)
    public var borderDanger: Color = NativeControlPalette.error.opacity(0.08)
    public var invertedBackground: Color = NativeControlPalette.adaptive(light: 0x030303, dark: 0xFAFAFA)
    public var textInfoPrimary: Color = NativeControlPalette.info
    public var textSuccessPrimary: Color = NativeControlPalette.success
    public var textAlertPrimary: Color = NativeControlPalette.warning
    public var textDangerPrimary: Color = NativeControlPalette.error
    public var textDangerTertiary: Color = NativeControlPalette.error.opacity(0.2)
    public var infoBackground: Color = NativeControlPalette.info.opacity(0.12)
    public var successBackground: Color = NativeControlPalette.success.opacity(0.12)
    public var alertBackground: Color = NativeControlPalette.warning.opacity(0.12)
    public var dangerBackground: Color = NativeControlPalette.error.opacity(0.12)
    public var interactiveAccentDefault: Color = NativeControlPalette.ink
    public var interactiveAccentHover: Color = NativeControlPalette.ink.opacity(0.8)
    public var interactiveAccentPressed: Color = NativeControlPalette.ink
    public var interactiveAccentDisabled: Color = NativeControlPalette.ink.opacity(0.4)
    public var interactiveDestructiveDefault: Color = NativeControlPalette.error.opacity(0.02)
    public var interactiveDestructiveHover: Color = NativeControlPalette.error.opacity(0.08)
    public var interactiveDestructivePressed: Color = NativeControlPalette.error.opacity(0.08)
    public var interactiveDestructiveDisabled: Color = NativeControlPalette.error.opacity(0.02)
    public var interactiveDestructiveAccentDefault: Color = NativeControlPalette.error
    public var interactiveDestructiveAccentHover: Color = NativeControlPalette.error.opacity(0.8)
    public var interactiveDestructiveAccentPressed: Color = NativeControlPalette.error
    public var interactiveDestructiveAccentDisabled: Color = NativeControlPalette.error.opacity(0.4)
    public var textAccentPrimary: Color? = nil
    public var textDangerInvertedPrimary: Color? = nil
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
    public var radiusNone: CGFloat = 0
    public var radius3xs: CGFloat = 1
    public var radius2xs: CGFloat = 2
    public var radiusXs: CGFloat = 4
    public var radiusS: CGFloat = 6
    public var radiusM: CGFloat = 8
    public var radiusL: CGFloat = 10
    public var radiusXl: CGFloat = 12
    public var radius2xl: CGFloat = 14
    public var radius3xl: CGFloat = 16
    public var radius4xl: CGFloat = 20
    public var radius5xl: CGFloat = 24
    public var radius6xl: CGFloat = 28
    public var radius7xl: CGFloat = 32
    public var radius8xl: CGFloat = 40
    public var radius9xl: CGFloat = 48
    public var radiusFull: CGFloat = 9999
    public var textHeadingMd: OpenUIFont = OpenUIFont(size: 24, weight: .semibold)
    public var textHeadingSm: OpenUIFont = OpenUIFont(size: 18, weight: .semibold)
    public var textHeadingXs: OpenUIFont = OpenUIFont(size: 16, weight: .semibold)
    public var textBodyDefault: OpenUIFont = OpenUIFont(size: 16, weight: .regular)
    public var textBodyDefaultHeavy: OpenUIFont = OpenUIFont(size: 16, weight: .semibold)
    public var textBodySm: OpenUIFont = OpenUIFont(size: 14, weight: .regular)
    public var textBodySmHeavy: OpenUIFont = OpenUIFont(size: 14, weight: .semibold)
    public var textBodyLg: OpenUIFont = OpenUIFont(size: 18, weight: .regular)
    public var textBodyLgHeavy: OpenUIFont = OpenUIFont(size: 18, weight: .semibold)
    public var textLabelSm: OpenUIFont = OpenUIFont(size: 14, weight: .regular)
    public var textBodyXs: OpenUIFont = OpenUIFont(size: 12, weight: .regular)
    public var textNumbersDefaultHeavy: OpenUIFont = OpenUIFont(size: 16, weight: .medium).monospacedDigit()
    public var textLabelSmHeavy: OpenUIFont = OpenUIFont(size: 14, weight: .medium)
    public var textLabelDefaultHeavy: OpenUIFont = OpenUIFont(size: 16, weight: .medium)
    public var textCodeDefault: OpenUIFont = OpenUIFont(size: 14, weight: .regular, design: .monospaced)
    public var defaultChartPalette: [Color]? = nil
    public var barChartPalette: [Color]? = nil
    public var lineChartPalette: [Color]? = nil
    public var areaChartPalette: [Color]? = nil
    public var pieChartPalette: [Color]? = nil
    public var radarChartPalette: [Color]? = nil
    public var radialChartPalette: [Color]? = nil
    public var horizontalBarChartPalette: [Color]? = nil
    public var shadow0: OpenUIShadow = OpenUIShadow()
    public var shadowS: OpenUIShadow = OpenUIShadow(opacity: 0.05, radius: 2, y: 1)
    public var shadowM: OpenUIShadow = OpenUIShadow()
    public var shadowL: OpenUIShadow = OpenUIShadow(opacity: 0.08, radius: 8, y: 3)
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
    func cardRadius(for kind: String) -> CGFloat {
        kind == "Context" ? radiusXl : ["Overview", "Snippet"].contains(kind) ? radius2xl : radius3xl
    }
    func inlineFont(_ size: String?, emphasized: Bool = false) -> OpenUIFont {
        switch size {
        case "xs": return emphasized ? textBodySmHeavy : textBodySm
        case "lg": return emphasized ? textBodyLgHeavy : textBodyLg
        default: return emphasized ? textBodyDefaultHeavy : textBodyDefault
        }
    }
    func fieldFont(_ size: String?) -> OpenUIFont { size == "small" ? textBodySm : textBodyDefault }
    public func chartColors(forSeriesCount count: Int, chartType: String? = nil) -> [Color] {
        let palette: [Color]?
        switch chartType {
        case "BarChart": palette = barChartPalette
        case "LineChart": palette = lineChartPalette
        case "AreaChart": palette = areaChartPalette
        case "PieChart", "SingleStackedBarChart": palette = pieChartPalette
        case "RadarChart": palette = radarChartPalette
        case "RadialChart": palette = radialChartPalette
        case "HorizontalBarChart": palette = horizontalBarChartPalette
        default: palette = nil
        }
        if let colors = palette ?? defaultChartPalette { return colors.isEmpty ? [interactiveAccentDefault] : colors }
        return NativeChartPalette.swatches(count: count).map(\.color)
    }
}

/// A native shadow value; dimensions are points, not CSS strings.
public struct OpenUIShadow: Equatable {
    public var opacity: Double
    public var radius: CGFloat
    public var x: CGFloat
    public var y: CGFloat
    public init(opacity: Double = 0, radius: CGFloat = 0, x: CGFloat = 0, y: CGFloat = 0) {
        self.opacity = opacity; self.radius = radius; self.x = x; self.y = y
    }
}
