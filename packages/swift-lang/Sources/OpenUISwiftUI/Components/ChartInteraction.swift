import Charts
import OpenUILang
import SwiftUI

// MARK: - Number formats

/// The number formats react-ui's charts use.
enum ChartFormat {
  /// `numberTickFormatter`, for value axes: 950, 1.3K, 16K, 2.5M; fractions
  /// with two decimals.
  static func tick(_ value: Double) -> String {
    let magnitude = abs(value)
    for (limit, suffix) in [(1e12, "T"), (1e9, "B"), (1e6, "M"), (1e3, "K")]
    where magnitude >= limit {
      return toFixed(value / limit, magnitude >= limit * 10 ? 0 : 1) + suffix
    }
    return value.truncatingRemainder(dividingBy: 1) != 0
      ? toFixed(value, 2) : jsNumberToString(value)
  }

  /// `tooltipNumberFormatter`: grouped like `toLocaleString` below 100,000,
  /// then 123.4K, 5.6M and so on, rounded down to one decimal.
  static func tooltip(_ value: Double, locale: Locale = .current) -> String {
    let sign = value < 0 ? "-" : ""
    var scaled = abs(value)
    if scaled < 100_000 {
      return sign
        + scaled.formatted(
          .number.locale(locale).precision(.fractionLength(0...3))
            .rounded(rule: .toNearestOrAwayFromZero))
    }
    let units = ["", "K", "M", "B", "T"]
    var unit = 0
    while scaled >= 1000 && unit < units.count - 1 {
      scaled /= 1000
      unit += 1
    }
    return sign + jsNumberToString((scaled * 10).rounded(.down) / 10) + units[unit]
  }

  /// JavaScript's `toFixed`. `printf` rounds a value exactly halfway between
  /// two results to even; JavaScript rounds it away from zero (0.125 → "0.13").
  static func toFixed(_ value: Double, _ digits: Int) -> String {
    let scale = pow(10, Double(digits))
    let scaled = abs(value) * scale
    if scaled.truncatingRemainder(dividingBy: 1) == 0.5, scaled / scale == abs(value) {
      let rounded = scaled.rounded(.awayFromZero) / scale
      return String(format: "%.\(digits)f", value < 0 ? -rounded : rounded)
    }
    return String(format: "%.\(digits)f", value)
  }
}

// MARK: - Legend

/// One key of a chart legend.
struct LegendEntry: Identifiable, Equatable {
  let id: String
  let label: String
  let color: Color
  var percentage: Double?
}

/// react-ui's DefaultLegend: centered color keys under a chart. With
/// `hidden`, tapping a key hides its series (one always stays visible); with
/// `highlighted`, hovering a key highlights it in the chart. Keys that don't
/// fit on one line fold behind an "N more" button.
struct ChartLegend: View {
  let entries: [LegendEntry]
  var hidden: Binding<Set<String>>?
  var highlighted: Binding<String?>?
  @State private var expanded = false
  @State private var width: CGFloat = 0

  var body: some View {
    Group {
      if width == 0 {
        // One clipped line until the width is known, the height the folded
        // legend has, so nothing jumps when it folds.
        HStack(spacing: Self.gap) {
          ForEach(entries) { item($0).fixedSize() }
        }
        .frame(maxWidth: .infinity)
        .clipped()
      } else {
        let fitting = Self.fittingCount(
          entries.map(Self.width), available: width,
          button: Self.buttonWidth(entries.count))
        FlowLayout(spacing: Self.gap, alignment: .center) {
          ForEach(entries.prefix(expanded ? entries.count : fitting)) { item($0) }
          if fitting < entries.count {
            Button {
              withOpenUIAnimation(Motion.reveal) { expanded.toggle() }
            } label: {
              HStack(spacing: 2) {
                Text(expanded ? "Show Less" : "\(entries.count - fitting) more")
                Image(systemName: expanded ? "chevron.up" : "chevron.down").imageScale(.small)
              }
              .font(.caption)
            }
            .buttonStyle(.plain)
          }
        }
        .frame(maxWidth: .infinity)
      }
    }
    .onGeometryChange(for: CGFloat.self) {
      $0.size.width
    } action: {
      width = $0
    }
  }

  @ViewBuilder
  private func item(_ entry: LegendEntry) -> some View {
    let isHidden = hidden?.wrappedValue.contains(entry.id) ?? false
    let key = HStack(spacing: 6) {
      RoundedRectangle(cornerRadius: 2).fill(entry.color).frame(width: 10, height: 10)
      Text(entry.label).font(.caption)
      if let percentage = entry.percentage {
        Text(ChartFormat.toFixed(percentage, 1) + "%").font(.caption).foregroundStyle(.secondary)
      }
    }
    .opacity(isHidden ? 0.3 : 1)
    .contentShape(Rectangle())
    .onHover { inside in highlighted?.wrappedValue = inside ? entry.id : nil }
    if let hidden {
      Button {
        withOpenUIAnimation(Motion.dataMorph) {
          hidden.wrappedValue = Self.toggling(
            entry.id, in: hidden.wrappedValue, keys: entries.map(\.id))
        }
      } label: {
        key
      }
      .buttonStyle(.plain)
      .accessibilityValue(isHidden ? "Hidden" : "Shown")
    } else {
      key.accessibilityElement(children: .combine)
    }
  }

  /// The gap between keys, react-ui's `space-m`.
  static let gap: CGFloat = 12

  /// react-ui's `useSeriesVisibility`: hides or shows `key`, but never hides
  /// the last visible series.
  static func toggling(_ key: String, in hidden: Set<String>, keys: [String]) -> Set<String> {
    var next = hidden
    if next.contains(key) {
      next.remove(key)
    } else {
      guard keys.filter(next.contains).count < keys.count - 1 else { return hidden }
      next.insert(key)
    }
    return next
  }

  /// react-ui's `useDefaultLegend`: how many keys fit on one line. All of them
  /// if they fit the full width; otherwise as many as fit next to the button,
  /// and at least one.
  static func fittingCount(_ widths: [CGFloat], available: CGFloat, button: CGFloat) -> Int {
    guard available > 0, !widths.isEmpty else { return widths.count }
    func count(_ space: CGFloat) -> Int {
      var used: CGFloat = 0
      var fitting = 0
      for width in widths {
        let needed = fitting > 0 ? width + gap : width
        guard used + needed <= space else { break }
        used += needed
        fitting += 1
      }
      return fitting
    }
    if count(available) == widths.count { return widths.count }
    return max(count(available - button), 1)
  }

  /// A key's width as react-ui measures it: the text, the 10pt swatch and a gap.
  private static func width(_ entry: LegendEntry) -> CGFloat {
    var text = entry.label
    if let percentage = entry.percentage { text += " (\(ChartFormat.toFixed(percentage, 1))%)" }
    return textWidth(text) + 10 + gap
  }

  private static func buttonWidth(_ count: Int) -> CGFloat {
    textWidth("\(count) more") + 20
  }

  static func textWidth(_ text: String, style: Font.TextStyle = .caption) -> CGFloat {
    #if os(macOS)
      let font = NSFont.preferredFont(forTextStyle: style == .caption2 ? .caption2 : .caption1)
    #else
      let font = UIFont.preferredFont(forTextStyle: style == .caption2 ? .caption2 : .caption1)
    #endif
    return ceil((text as NSString).size(withAttributes: [.font: font]).width)
  }
}

// MARK: - Tooltip

/// What a chart's tooltip lists: react-ui's `{ label, items }` payload.
struct ChartTooltipContent: Equatable {
  struct Item: Equatable {
    let name: String
    let value: String
    let color: Color
  }

  let label: String
  let items: [Item]
}

/// react-ui's ChartTooltip: the label, then a swatch, name and value for each
/// item. One or two items stack each name over its value; more go in rows. Past
/// ten, the first five show with a count of the rest.
struct ChartTooltip: View {
  let content: ChartTooltipContent
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let items = content.items
    let shown = items.count > 10 ? Array(items.prefix(5)) : items
    VStack(alignment: .leading, spacing: 6) {
      Text(content.label)
      Divider()
      ForEach(Array(shown.enumerated()), id: \.offset) { _, item in
        let swatch = RoundedRectangle(cornerRadius: 2).fill(item.color).frame(width: 10, height: 10)
        if items.count <= 2 {
          HStack(alignment: .top, spacing: 6) {
            swatch.padding(.top, 2)
            VStack(alignment: .leading, spacing: 4) {
              Text(item.name).foregroundStyle(.secondary)
              Text(item.value).monospacedDigit()
            }
          }
        } else {
          HStack(spacing: 6) {
            swatch
            Text(item.name).foregroundStyle(.secondary).lineLimit(1)
            Spacer(minLength: 8)
            Text(item.value).monospacedDigit().lineLimit(1)
          }
        }
      }
      if items.count > 10 {
        Divider()
        Text("\(items.count - 5) more").foregroundStyle(.secondary)
      }
    }
    .font(.caption)
    .padding(6)
    .frame(minWidth: 128, maxWidth: 240, alignment: .leading)
    .fixedSize()
    .background(theme.surface, in: RoundedRectangle(cornerRadius: 10))
    .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(theme.border))
    .shadow(color: .black.opacity(0.08), radius: 4, y: 2)
  }
}

/// Places a tooltip like react-ui's floating one: 20pt right of the anchor,
/// flipped to the left when it would run off the trailing edge, and kept 8pt
/// inside the bounds. `.above` centers it 20pt over the anchor instead, as
/// the stacked bar does.
struct TooltipPlacement: Layout {
  enum Placement { case trailing, above }

  let anchor: CGPoint
  var placement = Placement.trailing

  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    proposal.replacingUnspecifiedDimensions()
  }

  func placeSubviews(
    in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()
  ) {
    for subview in subviews {
      let size = subview.sizeThatFits(.unspecified)
      subview.place(
        at: Self.origin(for: size, anchor: anchor, placement: placement, in: bounds),
        proposal: ProposedViewSize(size))
    }
  }

  static func origin(
    for size: CGSize, anchor: CGPoint, placement: Placement = .trailing, in bounds: CGRect
  ) -> CGPoint {
    if placement == .above {
      let x = min(
        max(bounds.minX + anchor.x - size.width / 2, bounds.minX + 8), bounds.maxX - 8 - size.width)
      return CGPoint(x: max(x, bounds.minX), y: bounds.minY + anchor.y - 20 - size.height)
    }
    var x = bounds.minX + anchor.x + 20
    if x + size.width > bounds.maxX - 8 { x = bounds.minX + anchor.x - 20 - size.width }
    x = max(bounds.minX + 8, x)
    let y = min(
      max(bounds.minY + anchor.y, bounds.minY), max(bounds.maxY - size.height, bounds.minY))
    return CGPoint(x: x, y: y)
  }
}

// MARK: - Picking a category

/// A category picked by hovering or tapping a chart, and where.
struct ChartSelection: Equatable {
  var key: String
  var location: CGPoint
}

/// A clear surface that turns hovering with a pointer (react-ui's mouse move)
/// and tapping (its touch handlers) into a selection: `pick` maps the point to
/// a key. Tapping the same key again clears it, and so does opening another
/// chart's tooltip. A tap doesn't stop a scroll view around the chart from
/// scrolling, which a drag would.
struct PickSurface: View {
  @Binding var selection: ChartSelection?
  let pick: (CGPoint) -> String?
  @State private var hovering = false
  @State private var id = UUID()
  @Environment(OpenUIContext.self) private var context

  var body: some View {
    Rectangle()
      .fill(.clear)
      .contentShape(Rectangle())
      .onContinuousHover { phase in
        switch phase {
        case .active(let location):
          hovering = true
          selection = choose(location)
        case .ended:
          hovering = false
          selection = nil
        }
      }
      .onTapGesture { location in
        let picked = choose(location)
        // Under a pointer, a click lands on what hovering already picked.
        selection = !hovering && picked?.key == selection?.key ? nil : picked
      }
      .accessibilityHidden(true)
      .onChange(of: selection) { _, selection in
        if selection != nil { context.chartWithTooltip = id }
      }
      .onChange(of: context.chartWithTooltip) { _, chart in
        if chart != id { selection = nil }
      }
  }

  private func choose(_ location: CGPoint) -> ChartSelection? {
    pick(location).map { ChartSelection(key: $0, location: location) }
  }
}

/// Picks what's under the pointer or a tap on a Swift Charts chart, then
/// draws `crosshair` for it (behind or over the marks) and a tooltip.
struct ChartPicker<Crosshair: View>: ViewModifier {
  var crosshairBehind = false
  let pick: (CGPoint, ChartProxy, CGRect) -> String?
  let tooltip: (String) -> ChartTooltipContent?
  @Binding var selection: ChartSelection?
  @ViewBuilder let crosshair: (ChartProxy, CGRect, String) -> Crosshair

  func body(content: Content) -> some View {
    content
      .chartBackground { proxy in
        GeometryReader { geometry in
          if crosshairBehind, let key = selection?.key, let frame = proxy.plotFrame {
            crosshair(proxy, geometry[frame], key)
          }
        }
      }
      .chartOverlay { proxy in
        GeometryReader { geometry in
          let plot = proxy.plotFrame.map { geometry[$0] } ?? .zero
          ZStack(alignment: .topLeading) {
            if !crosshairBehind, let key = selection?.key {
              crosshair(proxy, plot, key)
            }
            PickSurface(selection: $selection) { location in
              plot.contains(location) ? pick(location, proxy, plot) : nil
            }
            if let selection, let content = tooltip(selection.key) {
              TooltipPlacement(anchor: selection.location) { ChartTooltip(content: content) }
                .allowsHitTesting(false)
            }
          }
        }
      }
  }
}

extension View {
  /// Picks the category under the pointer or a tap on a chart with
  /// categories along `axis`.
  func categoryPicker<Crosshair: View>(
    _ selection: Binding<ChartSelection?>, axis: Axis = .horizontal, crosshairBehind: Bool = false,
    tooltip: @escaping (String) -> ChartTooltipContent?,
    @ViewBuilder crosshair: @escaping (ChartProxy, CGRect, String) -> Crosshair
  ) -> some View {
    modifier(
      ChartPicker(
        crosshairBehind: crosshairBehind,
        pick: { location, proxy, plot in
          axis == .horizontal
            ? proxy.value(atX: location.x - plot.minX, as: String.self)
            : proxy.value(atY: location.y - plot.minY, as: String.self)
        },
        tooltip: tooltip, selection: selection, crosshair: crosshair))
  }
}

/// react-ui's bar crosshair: a faint rounded band behind the picked category,
/// as wide as its bars' band.
struct BandHighlight: View {
  let center: CGFloat
  let slot: CGFloat
  let plot: CGRect
  var axis: Axis = .horizontal

  var body: some View {
    let band = RoundedRectangle(cornerRadius: 4).fill(Color.primary.opacity(0.04))
    if axis == .horizontal {
      band.frame(width: slot * 0.8, height: plot.height).position(
        x: plot.minX + center, y: plot.midY)
    } else {
      band.frame(width: plot.width, height: slot * 0.8).position(
        x: plot.midX, y: plot.minY + center)
    }
  }
}

/// react-ui's line and area crosshair: a dashed line down the picked category
/// and a dot on each series there.
struct LineCrosshair: View {
  let x: CGFloat
  let plot: CGRect
  let dots: [(y: CGFloat, color: Color)]
  @Environment(\.openUITheme) private var theme

  var body: some View {
    ZStack(alignment: .topLeading) {
      Path { path in
        path.move(to: CGPoint(x: plot.minX + x, y: plot.minY))
        path.addLine(to: CGPoint(x: plot.minX + x, y: plot.maxY))
      }
      .stroke(theme.interactiveBorder, style: StrokeStyle(lineWidth: 1, dash: [4, 4]))
      ForEach(Array(dots.enumerated()), id: \.offset) { _, dot in
        Circle()
          .fill(theme.surface)
          .overlay(Circle().strokeBorder(theme.interactiveBorder))
          .overlay(Circle().fill(dot.color).padding(2))
          .frame(width: 8, height: 8)
          .position(x: plot.minX + x, y: plot.minY + dot.y)
      }
    }
  }
}
