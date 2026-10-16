import Charts
import OpenUILang
import SwiftUI

/// One value of one series at one category label. The id is the series and
/// label (not the position), so a value that changes while streaming moves to
/// its new place instead of being redrawn.
private struct SeriesPoint: Identifiable, Equatable {
  let id: String
  let label: String
  let series: String
  let value: Double
}

/// Flattens `labels` + `[Series(category, values)]` into chart points.
/// Missing values (still streaming) are skipped.
private func seriesPoints(_ props: ComponentProps) -> [SeriesPoint] {
  let labels = props.array("labels").map(displayText)
  var points: [SeriesPoint] = []
  for series in props.children("series") {
    let name = series.text("category")
    for (index, value) in series.array("values").enumerated() where index < labels.count {
      guard let number = value.numberValue, number.isFinite else { continue }
      points.append(
        SeriesPoint(
          id: "\(name)\u{1}\(labels[index])\u{1}\(index)", label: labels[index], series: name,
          value: number))
    }
  }
  return points
}

/// Category labels in their given order (charts otherwise sort them).
private func labelOrder(_ props: ComponentProps) -> [String] {
  var seen: Set<String> = []
  return props.array("labels").map(displayText).filter { seen.insert($0).inserted }
}

/// react-ui's `seriesCurve`: "linear", "step", and anything else (including a
/// value still streaming in) is the default "natural", a monotone curve.
private func interpolation(_ variant: String?) -> InterpolationMethod {
  switch variant {
  case "linear": return .linear
  case "step": return .stepCenter
  default: return .monotone
  }
}

/// Chart colors picked like react-ui's `getDistributedColors`: from the middle
/// of the ramp outwards. The ramp is the theme's `chartPalette`, or react-ui's
/// default (OCEAN_DEFAULT) when the theme has none.
enum ChartPalette {
  static let ocean: [Color] = [
    0x0D47A1, 0x1565C0, 0x1976D2, 0x1E88E5, 0x2196F3, 0x42A5F5, 0x64B5F6, 0x90CAF9, 0xBBDEFB,
    0xE3F2FD, 0xEFF8FF,
  ].map(color)

  private static func color(_ hex: Int) -> Color {
    let red = Double((hex >> 16) & 0xFF) / 255
    let green = Double((hex >> 8) & 0xFF) / 255
    let blue = Double(hex & 0xFF) / 255
    return Color(red: red, green: green, blue: blue)
  }

  static func colors(_ count: Int, _ palette: [Color]? = nil) -> [Color] {
    // An empty palette can't color anything, so it falls back like react-ui's.
    let ramp = palette.flatMap { $0.isEmpty ? nil : $0 } ?? ocean
    let n = ramp.count
    let mid = n / 2
    switch count {
    case ...0: return []
    case 1: return [ramp[mid]]
    case 2: return [ramp[max(mid - 1, 0)], ramp[min(mid + 1, n - 1)]]
    default:
      let offset = (count - 1) / 2
      return (0..<count).map { ramp[(((mid + $0 - offset) % n) + n) % n] }
    }
  }
}

/// Series names in order.
private func seriesNames(_ props: ComponentProps) -> [String] {
  var seen: Set<String> = []
  return props.children("series").map { $0.text("category") }.filter { seen.insert($0).inserted }
}

/// A chart's series and their colors. Colors are assigned over every series,
/// so hiding one from the legend doesn't recolor the rest.
private struct SeriesColors {
  let names: [String]
  let colors: [Color]

  init(_ names: [String], _ palette: [Color]?) {
    self.names = names
    colors = ChartPalette.colors(names.count, palette)
  }

  func color(_ name: String) -> Color {
    names.firstIndex(of: name).map { colors[$0] } ?? .gray
  }

  var legend: [LegendEntry] {
    zip(names, colors).map { LegendEntry(id: $0, label: $0, color: $1) }
  }
}

/// The tooltip for one category: each visible series' value there.
private func seriesTooltip(
  _ label: String, _ points: [SeriesPoint], _ series: SeriesColors
) -> ChartTooltipContent? {
  let items = points.filter { $0.label == label }.map {
    ChartTooltipContent.Item(
      name: $0.series, value: ChartFormat.tooltip($0.value), color: series.color($0.series))
  }
  return items.isEmpty ? nil : ChartTooltipContent(label: label, items: items)
}

extension View {
  /// Horizontal grid lines only, as react-ui's cartesian charts draw them.
  /// The category axis: ticks, no grid lines, and react-ui's condensed
  /// labels (see `CategoryLabels`).
  fileprivate func categoryAxisWithoutGrid(_ labels: [String]) -> some View {
    modifier(CategoryAxis(labels: labels))
  }

  /// react-ui's value axis: on the leading side, with grid lines and its tick
  /// format (1.3K, 2.5M).
  fileprivate func valueAxis(_ axis: Axis = .vertical) -> some View {
    let marks = AxisMarks(position: axis == .vertical ? .leading : .bottom) { value in
      AxisGridLine()
      AxisValueLabel {
        if let number = value.as(Double.self) { Text(ChartFormat.tick(number)) }
      }
    }
    return Group {
      if axis == .vertical { chartYAxis { marks } } else { chartXAxis { marks } }
    }
  }
}

/// react-ui's condensed x-axis labels (`layoutXAxisLabels`): every category
/// shares the width, so when one is narrower than its label (counting at most
/// 40pt of it) plus an 8pt gap, only every n-th label is drawn, each truncated
/// to the room it then has. Without this, every label truncates to a letter or
/// two ("Mum…", "Kolk…") and similar ones ("Sprint 1", "Sprint 2") all read
/// the same.
enum CategoryLabels {
  static let gap: CGFloat = 8
  static let minWidth: CGFloat = 40

  /// Draw every `interval`-th label, each up to `width` wide. Past react-ui's
  /// rule, it thins further while labels would still be cut off, as long as
  /// at least three stay: "Month 0, Month 2, Month 4" reads better than seven
  /// "Month…".
  static func layout(widest: CGFloat, slot: CGFloat, count: Int) -> (interval: Int, width: CGFloat)
  {
    guard slot > 0, count > 0 else { return (1, slot) }
    let needed = min(widest, minWidth) + gap
    var interval = min(count, max(1, Int((needed / slot).rounded(.up))))
    let sparsest = max(interval, (count + 2) / 3)
    while slot * CGFloat(interval) - gap < widest, interval < sparsest { interval += 1 }
    return (interval, slot * CGFloat(interval) - gap)
  }

  /// Where a label goes, as react-ui's CondensedXAxis draws it: in a box
  /// `width` wide centered on its category, cut at the ends of the plot, with
  /// the text truncated to the box and moved inside it. Returns the text's
  /// width and its offset from the category's center.
  static func place(
    text: CGFloat, center: CGFloat, width: CGFloat, plot: CGFloat
  ) -> (width: CGFloat, offset: CGFloat) {
    let left = max(0, center - width / 2)
    let right = min(plot, center + width / 2)
    let shown = min(text, max(right - left, 0))
    let x = min(max(center, left + shown / 2), right - shown / 2)
    return (shown, x - center)
  }
}

private struct CategoryAxis: ViewModifier {
  let labels: [String]
  @State private var width: CGFloat = 0
  @State private var plotWidth: CGFloat = 0

  func body(content: Content) -> some View {
    // Until the plot is measured, it's the chart less its value axis, about
    // 36pt of labels.
    let plot = plotWidth > 0 ? plotWidth : max(width - 36, 0)
    let slot = labels.isEmpty ? 0 : plot / CGFloat(labels.count)
    let widest = labels.map { ChartLegend.textWidth($0, style: .caption2) }.max() ?? 0
    let (interval, labelWidth) = CategoryLabels.layout(
      widest: widest, slot: slot, count: labels.count)
    let shown = labels.enumerated().filter { $0.offset % interval == 0 }.map(\.element)
    content
      .chartXAxis {
        AxisMarks(values: width > 0 ? shown : labels) { value in
          AxisTick()
          // Swift Charts would fit each label to one category's width and
          // center it there even past the ends of the chart. Each label gets
          // the room left by the labels skipped instead, kept inside the plot.
          AxisValueLabel(collisionResolution: .disabled) {
            if let label = value.as(String.self) {
              let text = ChartLegend.textWidth(label, style: .caption2) + 2
              let center = slot * (CGFloat(labels.firstIndex(of: label) ?? 0) + 0.5)
              let (size, offset) =
                width > 0
                ? CategoryLabels.place(text: text, center: center, width: labelWidth, plot: plot)
                : (text, 0)
              Text(label)
                .font(.caption2)
                .lineLimit(1)
                .frame(width: size)
                .fixedSize()
                .offset(x: offset)
            }
          }
        }
      }
      .chartPlotStyle { area in
        area.onGeometryChange(for: CGFloat.self) {
          $0.size.width
        } action: {
          plotWidth = $0
        }
      }
      .onGeometryChange(for: CGFloat.self) {
        $0.size.width
      } action: {
        width = $0
      }
  }
}

/// Sizes a chart and puts react-ui's legend under it, or shows a pulsing
/// placeholder while the response streams in before any of its values have.
private struct ChartFrame<Content: View>: View {
  let props: ComponentProps
  let isEmpty: Bool
  let legend: [LegendEntry]
  let hidden: Binding<Set<String>>?
  /// The least height the chart needs, e.g. a row per bar.
  let minHeight: CGFloat
  let content: Content
  @Environment(OpenUIContext.self) private var context
  @Environment(\.openUITheme) private var theme

  init(
    _ props: ComponentProps, isEmpty: Bool, legend: [LegendEntry],
    hidden: Binding<Set<String>>? = nil, minHeight: CGFloat = 0,
    @ViewBuilder content: () -> Content
  ) {
    self.props = props
    self.isEmpty = isEmpty
    self.legend = legend
    self.hidden = hidden
    self.minHeight = minHeight
    self.content = content()
  }

  var body: some View {
    let height = max(
      props.number("height").flatMap(\.finite).map { CGFloat($0) } ?? theme.chartHeight, minHeight)
    if isEmpty && (context.isStreaming || context.isQueryLoading) {
      SkeletonBlock(height: height, cornerRadius: 8)
    } else {
      VStack(spacing: 12) {
        AxisTitles(props) {
          content
            .frame(height: height)
            .chartLegend(.hidden)
        }
        if !legend.isEmpty { ChartLegend(entries: legend, hidden: hidden) }
      }
    }
  }
}

/// react-ui's condensed charts put the axis titles outside the plot: the y
/// title above it, the x title centered below. Outside the chart, a missing
/// title takes no room (Swift Charts keeps room for an empty one), and one
/// that streams in after the data doesn't rebuild the chart.
private struct AxisTitles<Content: View>: View {
  let x: String
  let y: String
  let content: Content

  init(_ props: ComponentProps, @ViewBuilder content: () -> Content) {
    x = props.text("xLabel")
    y = props.text("yLabel")
    self.content = content()
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      if !y.isEmpty {
        Text(y).font(.caption).foregroundStyle(.secondary).padding(.bottom, 8)
      }
      content
      if !x.isEmpty {
        Text(x).font(.caption).foregroundStyle(.secondary).frame(maxWidth: .infinity)
      }
    }
  }
}

struct BarChartView: View {
  let props: ComponentProps
  @State private var hidden: Set<String> = []
  @State private var selection: ChartSelection?
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let all = seriesPoints(props)
    let points = all.filter { !hidden.contains($0.series) }
    let series = SeriesColors(seriesNames(props), theme.chartRamp(theme.barChartPalette))
    let labels = labelOrder(props)
    let stacked = props.string("variant") == "stacked"
    ChartFrame(props, isEmpty: all.isEmpty, legend: series.legend, hidden: $hidden) {
      Chart(points) { point in
        if stacked {
          BarMark(x: .value("Label", point.label), y: .value("Value", point.value))
            .foregroundStyle(by: .value("Series", point.series))
        } else {
          BarMark(x: .value("Label", point.label), y: .value("Value", point.value))
            .foregroundStyle(by: .value("Series", point.series))
            .position(by: .value("Series", point.series))
            .cornerRadius(4)
        }
      }
      .chartXScale(domain: labels)
      .chartForegroundStyleScale(domain: series.names, range: series.colors)
      .categoryAxisWithoutGrid(labelOrder(props))
      .valueAxis()
      .categoryPicker(
        $selection, crosshairBehind: true, tooltip: { seriesTooltip($0, points, series) }
      ) { proxy, plot, label in
        if let x = proxy.position(forX: label) {
          BandHighlight(center: x, slot: plot.width / CGFloat(max(labels.count, 1)), plot: plot)
        }
      }
      .chartEntrance(.grow)
      .openUIAnimation(Motion.dataMorph, value: points)
    }
  }
}

struct HorizontalBarChartView: View {
  let props: ComponentProps
  @State private var hidden: Set<String> = []
  @State private var selection: ChartSelection?
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let all = seriesPoints(props)
    let points = all.filter { !hidden.contains($0.series) }
    let series = SeriesColors(seriesNames(props), theme.chartRamp(theme.horizontalBarChartPalette))
    let stacked = props.string("variant") == "stacked"
    let labels = labelOrder(props)
    // A row per bar, at least 28pt each: past that the frame grows instead of
    // the bars spilling over the axis titles.
    ChartFrame(
      props, isEmpty: all.isEmpty, legend: series.legend, hidden: $hidden,
      minHeight: CGFloat(labels.count) * 28
    ) {
      Chart(points) { point in
        if stacked {
          BarMark(
            x: .value("Value", point.value), y: .value("Label", point.label), height: .ratio(0.7)
          )
          .foregroundStyle(by: .value("Series", point.series))
        } else {
          BarMark(
            x: .value("Value", point.value), y: .value("Label", point.label), height: .ratio(0.7)
          )
          .foregroundStyle(by: .value("Series", point.series))
          .position(by: .value("Series", point.series))
          .cornerRadius(4)
        }
      }
      .chartYScale(domain: labels)
      .chartForegroundStyleScale(domain: series.names, range: series.colors)
      .chartYAxis {
        AxisMarks(preset: .aligned, position: .leading) { _ in
          AxisValueLabel(horizontalSpacing: 8)
        }
      }
      .valueAxis(.horizontal)
      .categoryPicker(
        $selection, axis: .vertical, crosshairBehind: true,
        tooltip: { seriesTooltip($0, points, series) }
      ) { proxy, plot, label in
        if let y = proxy.position(forY: label) {
          BandHighlight(
            center: y, slot: plot.height / CGFloat(max(labels.count, 1)), plot: plot,
            axis: .vertical)
        }
      }
      .chartEntrance(.growSideways)
      .openUIAnimation(Motion.dataMorph, value: points)
    }
  }
}

struct LineChartView: View {
  let props: ComponentProps
  @State private var hidden: Set<String> = []
  @State private var selection: ChartSelection?
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let method = interpolation(props.string("variant"))
    let all = seriesPoints(props)
    let points = all.filter { !hidden.contains($0.series) }
    let series = SeriesColors(seriesNames(props), theme.chartRamp(theme.lineChartPalette))
    ChartFrame(props, isEmpty: all.isEmpty, legend: series.legend, hidden: $hidden) {
      Chart(points) { point in
        LineMark(x: .value("Label", point.label), y: .value("Value", point.value))
          .foregroundStyle(by: .value("Series", point.series))
          .interpolationMethod(method)
          .lineStyle(StrokeStyle(lineWidth: 2))
      }
      .chartXScale(domain: labelOrder(props))
      .chartForegroundStyleScale(domain: series.names, range: series.colors)
      .categoryAxisWithoutGrid(labelOrder(props))
      .valueAxis()
      .categoryPicker($selection, tooltip: { seriesTooltip($0, points, series) }) {
        proxy, plot, label in
        lineCrosshair(proxy, plot, label, points, series)
      }
      .chartEntrance(.draw)
      .openUIAnimation(Motion.dataMorph, value: points)
    }
  }
}

@ViewBuilder
private func lineCrosshair(
  _ proxy: ChartProxy, _ plot: CGRect, _ label: String, _ points: [SeriesPoint],
  _ series: SeriesColors
) -> some View {
  if let x = proxy.position(forX: label) {
    LineCrosshair(
      x: x, plot: plot,
      dots: points.filter { $0.label == label }.compactMap { point in
        proxy.position(forY: point.value).map { (y: $0, color: series.color(point.series)) }
      })
  }
}

struct AreaChartView: View {
  let props: ComponentProps
  @State private var hidden: Set<String> = []
  @State private var selection: ChartSelection?
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let method = interpolation(props.string("variant"))
    let series = SeriesColors(seriesNames(props), theme.chartRamp(theme.areaChartPalette))
    let all = seriesPoints(props)
    let points = all.filter { !hidden.contains($0.series) }
    ChartFrame(props, isEmpty: all.isEmpty, legend: series.legend, hidden: $hidden) {
      Chart(points) { point in
        let color = series.color(point.series)
        // react-ui fills areas with a gradient from 60% opacity to clear.
        AreaMark(
          x: .value("Label", point.label), y: .value("Value", point.value),
          series: .value("Series", point.series), stacking: .unstacked
        )
        .foregroundStyle(
          LinearGradient(
            colors: [color.opacity(0.6), color.opacity(0)], startPoint: .top, endPoint: .bottom)
        )
        .interpolationMethod(method)
        LineMark(x: .value("Label", point.label), y: .value("Value", point.value))
          .foregroundStyle(by: .value("Series", point.series))
          .interpolationMethod(method)
          .lineStyle(StrokeStyle(lineWidth: 2))
      }
      .chartXScale(domain: labelOrder(props))
      .chartForegroundStyleScale(domain: series.names, range: series.colors)
      .categoryAxisWithoutGrid(labelOrder(props))
      .valueAxis()
      .categoryPicker($selection, tooltip: { seriesTooltip($0, points, series) }) {
        proxy, plot, label in
        lineCrosshair(proxy, plot, label, points, series)
      }
      .chartEntrance(.draw)
      .openUIAnimation(Motion.dataMorph, value: points)
    }
  }
}

/// One labelled value of a 1D chart.
struct Slice: Identifiable, Equatable {
  let id: Int
  let label: String
  let value: Double
}

private func slices(_ props: ComponentProps) -> [Slice] {
  let labels = props.array("labels").map(displayText)
  return props.array("values").enumerated().compactMap { index, value in
    guard index < labels.count, let number = value.numberValue, number.isFinite, number >= 0 else {
      return nil
    }
    return Slice(id: index, label: labels[index], value: number)
  }
}

/// Pie and radial slices as react-ui orders them: largest first (a stable
/// sort, like JavaScript's), each with its color from the middle of the ramp
/// outwards in that order.
func sortedSlices(_ slices: [Slice], _ palette: [Color]?) -> [(slice: Slice, color: Color)] {
  let sorted = slices.enumerated().sorted {
    $0.element.value != $1.element.value
      ? $0.element.value > $1.element.value : $0.offset < $1.offset
  }.map(\.element)
  return Array(zip(sorted, ChartPalette.colors(sorted.count, palette)))
}

/// Where pie slices are: Swift Charts starts at 12 o'clock and goes clockwise,
/// with the radius half the shorter side.
enum PieGeometry {
  /// The index of the slice under `point`, or nil outside the ring. A
  /// semicircle is drawn turned a quarter to the left, so its angles are too.
  static func slice(
    at point: CGPoint, in size: CGSize, values: [Double], innerRatio: CGFloat, semicircle: Bool
  ) -> Int? {
    let dx = point.x - size.width / 2
    let dy = point.y - size.height / 2
    let radius = min(size.width, size.height) / 2
    let distance = (dx * dx + dy * dy).squareRoot()
    guard distance <= radius, distance >= radius * innerRatio else { return nil }
    var angle = atan2(Double(dx), Double(-dy)) + (semicircle ? Double.pi / 2 : 0)
    angle = angle.truncatingRemainder(dividingBy: 2 * .pi)
    if angle < 0 { angle += 2 * .pi }
    let total = values.reduce(0, +) * (semicircle ? 2 : 1)
    guard total > 0 else { return nil }
    var end = 0.0
    for (index, value) in values.enumerated() {
      end += value / total * 2 * .pi
      if angle < end { return index }
    }
    return nil
  }
}

struct PieChartView: View {
  let props: ComponentProps
  @State private var hidden: Set<String> = []
  @State private var selection: ChartSelection?
  @State private var legendHover: String?
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let all = sortedSlices(slices(props), theme.chartRamp(theme.pieChartPalette))
    let visible = all.filter { !hidden.contains(String($0.slice.id)) }
    let donut = props.string("variant") == "donut"
    let semi = props.string("appearance") == "semiCircular"
    let total = visible.reduce(0) { $0 + $1.slice.value }
    let active = selection?.key ?? legendHover
    VStack(spacing: 12) {
      Chart {
        ForEach(visible, id: \.slice.id) { slice, color in
          SectorMark(
            angle: .value("Value", slice.value), innerRadius: .ratio(donut ? 0.6 : 0),
            angularInset: 1
          )
          .foregroundStyle(color)
          .opacity(active == nil || active == String(slice.id) ? 1 : 0.4)
          .accessibilityLabel(slice.label)
          .accessibilityValue(ChartFormat.tooltip(slice.value))
        }
        if semi, total > 0 {
          // A transparent half that keeps the visible slices on the top half.
          SectorMark(angle: .value("Value", total), innerRadius: .ratio(donut ? 0.6 : 0))
            .foregroundStyle(.clear)
        }
      }
      .rotationEffect(semi ? .degrees(-90) : .zero)
      .overlay {
        GeometryReader { geometry in
          ZStack(alignment: .topLeading) {
            PickSurface(selection: $selection) { point in
              PieGeometry.slice(
                at: point, in: geometry.size, values: visible.map(\.slice.value),
                innerRatio: donut ? 0.6 : 0, semicircle: semi
              ).map { String(visible[$0].slice.id) }
            }
            if let key = selection?.key, let anchor = selection?.location,
              let (slice, color) = visible.first(where: { String($0.slice.id) == key })
            {
              TooltipPlacement(anchor: anchor) {
                ChartTooltip(
                  content: ChartTooltipContent(
                    label: slice.label,
                    items: [
                      .init(
                        name: slice.label, value: ChartFormat.tooltip(slice.value), color: color)
                    ]
                  ))
              }
              .allowsHitTesting(false)
            }
          }
        }
      }
      .frame(height: theme.chartHeight)
      .openUIAnimation(Motion.dataMorph, value: visible.map(\.slice))
      .fadeAppear()
      ChartLegend(
        entries: all.map {
          LegendEntry(id: String($0.slice.id), label: $0.slice.label, color: $0.color)
        },
        hidden: $hidden, highlighted: $legendHover)
    }
  }
}

struct RadialChartView: View {
  let props: ComponentProps
  @State private var hidden: Set<String> = []
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let all = sortedSlices(slices(props), theme.chartRamp(theme.radialChartPalette))
    let visible = all.filter { !hidden.contains(String($0.slice.id)) }
    let maximum = max(visible.map(\.slice.value).max() ?? 1, 1)
    VStack(spacing: 12) {
      ZStack {
        ForEach(Array(visible.enumerated()), id: \.element.slice.id) { ring, entry in
          let inset = CGFloat(ring) * 14
          Circle()
            .stroke(.secondary.opacity(0.15), lineWidth: 10)
            .padding(inset)
          Circle()
            .trim(from: 0, to: entry.slice.value / maximum * 0.75)
            .stroke(entry.color, style: StrokeStyle(lineWidth: 10, lineCap: .round))
            .rotationEffect(.degrees(-90))
            .padding(inset)
            .accessibilityElement()
            .accessibilityLabel(entry.slice.label)
            .accessibilityValue(jsNumberToString(entry.slice.value))
        }
      }
      .frame(width: theme.chartHeight * 0.8, height: theme.chartHeight * 0.8)
      .frame(maxWidth: .infinity)
      ChartLegend(
        entries: all.map {
          LegendEntry(id: String($0.slice.id), label: $0.slice.label, color: $0.color)
        },
        hidden: $hidden)
    }
    .openUIAnimation(Motion.dataMorph, value: visible.map(\.slice))
    .fadeAppear()
  }
}

/// react-ui's SingleStackedBar (its SegmentedBar): one rounded track split by
/// share, colored down the ramp in the given order, with each segment's share
/// in the legend. Hovering or tapping a segment (or its key) dims the rest
/// and shows its value and share.
struct SingleStackedBarChartView: View {
  let props: ComponentProps
  @State private var selection: ChartSelection?
  @State private var legendHover: String?
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let data = slices(props)
    let ramp = theme.chartRamp(theme.barChartPalette) ?? ChartPalette.ocean
    let total = data.reduce(0) { $0 + $1.value }
    let share = { (slice: Slice) in total > 0 ? slice.value / total : 0 }
    let color = { (slice: Slice) in ramp[slice.id % ramp.count] }
    let active = selection?.key ?? legendHover
    VStack(spacing: 12) {
      SegmentRow(shares: data.map(share)) {
        ForEach(data) { slice in
          Rectangle()
            .fill(color(slice))
            .opacity(active == nil || active == String(slice.id) ? 1 : 0.4)
            .accessibilityElement()
            .accessibilityLabel(slice.label)
            .accessibilityValue(ChartFormat.toFixed(share(slice) * 100, 1) + "%")
        }
      }
      .frame(height: 20)
      .clipShape(RoundedRectangle(cornerRadius: 6))
      .overlay {
        GeometryReader { geometry in
          ZStack(alignment: .topLeading) {
            PickSurface(selection: $selection) { point in
              SegmentRow.index(at: point.x, width: geometry.size.width, shares: data.map(share))
                .map { String(data[$0].id) }
            }
            if let key = selection?.key, let anchor = selection?.location,
              let slice = data.first(where: { String($0.id) == key })
            {
              TooltipPlacement(anchor: anchor, placement: .above) {
                ChartTooltip(
                  content: ChartTooltipContent(
                    label: slice.label,
                    items: [
                      .init(
                        name: "Value", value: ChartFormat.tick(slice.value), color: color(slice)),
                      .init(
                        name: "Percentage", value: ChartFormat.toFixed(share(slice) * 100, 1) + "%",
                        color: color(slice)),
                    ]))
              }
              .allowsHitTesting(false)
            }
          }
        }
      }
      .openUIAnimation(Motion.dataMorph, value: data)
      .chartEntrance(.growSideways)
      ChartLegend(
        entries: data.map {
          LegendEntry(
            id: String($0.id), label: $0.label, color: color($0), percentage: share($0) * 100)
        },
        highlighted: $legendHover)
    }
  }
}

/// Lays segments out side by side, each as wide as its share of the row,
/// with react-ui's 2pt gaps.
struct SegmentRow: Layout {
  let shares: [Double]
  static let gap: CGFloat = 2

  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    proposal.replacingUnspecifiedDimensions()
  }

  func placeSubviews(
    in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()
  ) {
    var x = bounds.minX
    for (subview, width) in zip(subviews, Self.widths(bounds.width, shares)) {
      subview.place(
        at: CGPoint(x: x, y: bounds.minY),
        proposal: ProposedViewSize(width: width, height: bounds.height))
      x += width + Self.gap
    }
  }

  static func widths(_ width: CGFloat, _ shares: [Double]) -> [CGFloat] {
    let room = max(width - gap * CGFloat(max(shares.count - 1, 0)), 0)
    return shares.map { room * CGFloat($0) }
  }

  /// The segment at `x`, counting each gap with the segment before it.
  static func index(at x: CGFloat, width: CGFloat, shares: [Double]) -> Int? {
    var end: CGFloat = 0
    for (index, segment) in widths(width, shares).enumerated() {
      end += segment + gap
      if x < end, segment > 0 { return index }
    }
    return nil
  }
}

struct ScatterChartView: View {
  let props: ComponentProps
  @State private var hidden: Set<String> = []
  @Environment(\.openUITheme) private var theme

  private struct Dot: Identifiable, Equatable {
    let id: Int
    let series: String
    let x: Double
    let y: Double
    let z: Double?
  }

  var body: some View {
    var dots: [Dot] = []
    for dataset in props.children("datasets") {
      for point in dataset.children("points") {
        // Like the other charts, a point that isn't a finite number is skipped.
        guard let x = point.number("x").flatMap(\.finite),
          let y = point.number("y").flatMap(\.finite)
        else { continue }
        dots.append(
          Dot(id: dots.count, series: dataset.text("name"), x: x, y: y, z: point.number("z")))
      }
    }
    let series = SeriesColors(
      props.children("datasets").map { $0.text("name") }, theme.chartPalette)
    let visible = dots.filter { !hidden.contains($0.series) }
    return VStack(spacing: 12) {
      AxisTitles(props) {
        scatter(visible, all: dots, series: series)
      }
      ChartLegend(entries: series.legend, hidden: $hidden)
    }
  }

  private func scatter(_ visible: [Dot], all dots: [Dot], series: SeriesColors) -> some View {
    Chart(visible) { dot in
      PointMark(x: .value(props.text("xLabel"), dot.x), y: .value(props.text("yLabel"), dot.y))
        .foregroundStyle(by: .value("Series", dot.series))
        .symbolSize(dot.z.map { max(20, min($0, 400)) } ?? 40)
    }
    .chartXScale(domain: Self.domain(dots.map(\.x)))
    .chartYScale(domain: Self.domain(dots.map(\.y)))
    .chartForegroundStyleScale(domain: series.names, range: series.colors)
    .chartLegend(.hidden)
    .frame(height: theme.chartHeight)
    .openUIAnimation(Motion.dataMorph, value: visible)
    .fadeAppear()
  }

  /// react-ui's `calculateScatterDomain`: the data range padded by 10% on each
  /// side, never below zero.
  static func domain(_ values: [Double]) -> ClosedRange<Double> {
    guard let low = values.min(), let high = values.max() else { return 0...100 }
    let padding = (high - low) * 0.1
    let start = max(0, low - padding)
    let end = high + padding
    return end > start ? start...end : start...(start + 1)
  }
}

/// Spider chart: one axis per label, one filled polygon per series. Swift
/// Charts has no radar mark, so it is drawn directly.
struct RadarChartView: View {
  let props: ComponentProps
  @State private var hidden: Set<String> = []
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let labels = props.array("labels").map(displayText)
    // A value that isn't a finite number draws at the center, so it can't
    // become the maximum that scales every other value to nothing.
    let all = props.children("series").map { series in
      (
        name: series.text("category"),
        values: series.array("values").map { $0.numberValue.flatMap(\.finite) ?? 0 }
      )
    }
    let colors = SeriesColors(all.map(\.name), theme.chartRamp(theme.radarChartPalette))
    let series = all.filter { !hidden.contains($0.name) }
    let maximum = max(series.flatMap(\.values).max() ?? 1, 1)
    VStack(spacing: 12) {
      Canvas { context, size in
        guard labels.count >= 3 else { return }
        let center = CGPoint(x: size.width / 2, y: size.height / 2)
        let radius = min(size.width, size.height) / 2 - 28
        func point(_ index: Int, _ fraction: Double) -> CGPoint {
          let angle = -Double.pi / 2 + 2 * Double.pi * Double(index) / Double(labels.count)
          return CGPoint(
            x: center.x + CGFloat(cos(angle) * fraction) * radius,
            y: center.y + CGFloat(sin(angle) * fraction) * radius)
        }
        func polygon(_ fractions: [Double]) -> Path {
          Path { path in
            for (index, fraction) in fractions.enumerated() {
              index == 0
                ? path.move(to: point(index, fraction)) : path.addLine(to: point(index, fraction))
            }
            path.closeSubpath()
          }
        }
        for ring in 1...4 {
          context.stroke(
            polygon(Array(repeating: Double(ring) / 4, count: labels.count)),
            with: .color(.secondary.opacity(0.25)))
        }
        for index in labels.indices {
          var axis = Path()
          axis.move(to: center)
          axis.addLine(to: point(index, 1))
          context.stroke(axis, with: .color(.secondary.opacity(0.25)))
          context.draw(
            Text(labels[index]).font(.caption2).foregroundStyle(.secondary), at: point(index, 1.16))
        }
        for entry in series {
          let fractions = labels.indices.map {
            $0 < entry.values.count ? entry.values[$0] / maximum : 0
          }
          let shape = polygon(fractions)
          let color = colors.color(entry.name)
          context.fill(shape, with: .color(color.opacity(0.18)))
          context.stroke(shape, with: .color(color), lineWidth: 2)
        }
      }
      .frame(height: theme.chartHeight + 40)
      .fadeAppear()
      ChartLegend(entries: colors.legend, hidden: $hidden)
    }
  }
}
