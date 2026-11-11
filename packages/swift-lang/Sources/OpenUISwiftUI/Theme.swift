import SwiftUI

/// Spacing, shapes and colors the built-in components use. Override parts of
/// it with `.environment(\.openUITheme, theme)`.
///
/// The defaults follow react-ui's design tokens (spacing, radii, and the
/// translucent fills and borders), so both renderers look alike.
public struct OpenUITheme: Sendable {
  public var spacing: CGFloat = 12
  public var compactSpacing: CGFloat = 6
  public var cornerRadius: CGFloat = 10
  public var smallCornerRadius: CGFloat = 6
  public var cardPadding: CGFloat = 18
  /// Primary buttons, selected options, steps and other emphasis. The
  /// renderer also tints its controls with it.
  public var accent: Color = .accentColor
  /// Text and icons on accent backgrounds, like primary buttons (react-ui's
  /// `textAccentPrimary`). Use a dark color with a light accent.
  public var onAccent: Color = .white
  /// Raised surfaces such as clickable cards (react-ui's `foreground`).
  public var surface: Color = .platformElevatedBackground
  /// Recessed fills such as inputs (react-ui's `sunk`).
  public var sunkSurface: Color = .primary.opacity(0.04)
  /// The faint fill of static cards (react-ui's `sunk-light`).
  public var subtleSurface: Color = .primary.opacity(0.02)
  public var border: Color = .primary.opacity(0.06)
  /// Borders of clickable cards (react-ui's `border-interactive`).
  public var interactiveBorder: Color = .primary.opacity(0.12)
  public var chartHeight: CGFloat = 220
  /// Colors for chart series, like react-ui's `defaultChartPalette`: a ramp
  /// that charts pick from the middle outwards. `nil` uses react-ui's default
  /// blue ramp.
  public var chartPalette: [Color]?
  /// A palette for one kind of chart, like react-ui's `barChartPalette` and
  /// the rest. A chart uses its own, then `chartPalette`, then the default.
  public var barChartPalette: [Color]?
  public var horizontalBarChartPalette: [Color]?
  public var lineChartPalette: [Color]?
  public var areaChartPalette: [Color]?
  public var pieChartPalette: [Color]?
  public var radialChartPalette: [Color]?
  public var radarChartPalette: [Color]?
  /// Status colors (react-ui's info, success, alert and danger text): callouts,
  /// tags, trends, form errors and confirmations.
  public var info: Color = .blue
  public var success: Color = .green
  public var alert: Color = .orange
  public var danger: Color = .red

  public init() {}

  public static let `default` = OpenUITheme()
}

private struct ThemeKey: EnvironmentKey {
  static let defaultValue = OpenUITheme.default
}

extension EnvironmentValues {
  public var openUITheme: OpenUITheme {
    get { self[ThemeKey.self] }
    set { self[ThemeKey.self] = newValue }
  }
}

extension Color {
  /// White in light mode and a raised gray in dark mode.
  static var platformElevatedBackground: Color {
    #if os(macOS)
      Color(nsColor: .controlBackgroundColor)
    #else
      Color(uiColor: .secondarySystemGroupedBackground)
    #endif
  }
}

extension OpenUITheme {
  /// The color for a status variant of a callout, tag or icon.
  func status(_ variant: String?) -> Color {
    switch variant {
    case "info": info
    case "warning": alert
    case "error", "danger": danger
    case "success": success
    default: .secondary
    }
  }

  /// The colors a chart picks from: its own palette, then `chartPalette`
  /// (nil leaves react-ui's default ramp), like react-ui's `resolvePalette`.
  func chartRamp(_ own: [Color]?) -> [Color]? {
    [own, chartPalette].first { $0?.isEmpty == false } ?? nil
  }
}

/// The surface behind a "card" / "sunk" / "clear" container variant.
struct SurfaceModifier: ViewModifier {
  let variant: String
  @Environment(\.openUITheme) private var theme

  func body(content: Content) -> some View {
    switch variant {
    case "clear":
      content
    case "sunk":
      content.padding(theme.cardPadding)
        .background(theme.sunkSurface, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(theme.border))
    default:
      // react-ui's "card" variant is a plain full-width column; the chat
      // bubble around it provides the frame.
      content
    }
  }
}

extension View {
  func surface(_ variant: String) -> some View { modifier(SurfaceModifier(variant: variant)) }
}
