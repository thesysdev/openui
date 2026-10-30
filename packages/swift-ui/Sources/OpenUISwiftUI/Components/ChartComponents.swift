import OpenUILang
import SwiftUI


/// Accept both evaluated component references and inline schema objects, just
/// as the upstream chart data helpers do. No schema coercion happens here.
struct NativeChartData {
  struct Series {
    let name: String
    let values: [Double]
  }
  struct Point {
    let x: Double
    let y: Double
    let z: Double?
  }
  struct Scatter {
    let name: String
    let points: [Point]
  }
  var labels: [String]
  var series: [Series]
  var slices: [Double]
  var scatter: [Scatter]
  var colorIndices: [Int] = []
  init() { labels = []; series = []; slices = []; scatter = [] }
  init(context: OpenUIComponentContext) {
    labels = NativeValue.array(context.value("labels")).map { value in
      if case .string(let s) = value { return s.displayString }
      return NativeValue.string(value, "category") ?? ""
    }
    series = NativeValue.array(context.value("series")).map { value in
      Series(
        name: NativeValue.string(value, "category") ?? "",
        values: Self.numbers(NativeValue.prop(value, "values")))
    }
    let rawRows = NativeValue.array(context.value("series"))
    if case .array = rawRows.first {
      let names = Array(labels.dropFirst())
      let rows = rawRows.map { NativeValue.array($0) }
      labels = rows.map { row in
        guard let value = row.first, !value.isNullish else { return "" }
        return toString(value).displayString
      }
      series = names.enumerated().map { index, name in
        Series(name: name, values: rows.map { row in
          let value = row.indices.contains(index + 1) ? toNumber(row[index + 1]) : 0
          return value.isFinite ? value : 0
        })
      }
    }
    // buildChartData creates JavaScript object properties: duplicate series
    // replace values, and integer property names keep ECMAScript key ordering.
    let keyed = OpenUIObject(series.map { ObjectField(key: $0.name, value: .array($0.values.map(Value.number))) })
    series = keyed.map { Series(name: $0.key.displayString, values: Self.numbers($0.value)) }
    let values = Self.numbers(context.value("values"))
    slices =
      values.isEmpty
      ? NativeValue.array(context.value("labels")).compactMap { NativeValue.number($0, "value") }
      : values
    if values.isEmpty, ["PieChart", "RadialChart", "SingleStackedBarChart"].contains(context.element.typeName) {
      let valid = NativeValue.array(context.value("labels")).compactMap { value -> (String, Double)? in
        guard let number = NativeValue.number(value, "value") else { return nil }
        return (NativeValue.string(value, "category") ?? "", number)
      }
      labels = valid.map(\.0)
      slices = valid.map(\.1)
    }
    scatter = NativeValue.array(context.value("datasets")).map { value in
      Scatter(
        name: NativeValue.string(value, "name") ?? "",
        points: NativeValue.array(NativeValue.prop(value, "points")).compactMap { point in
          guard let x = NativeValue.number(point, "x"), let y = NativeValue.number(point, "y")
          else { return nil }
          return Point(x: x, y: y, z: NativeValue.number(point, "z"))
        })
    }
  }
  static func numbers(_ value: Value?) -> [Double] {
    NativeValue.array(value).map {
      if case .number(let value) = $0 { return value.isFinite ? value : 0 }
      let number = toNumber($0)
      return number.isFinite ? number : 0
    }
  }
  func value(_ seriesIndex: Int, _ labelIndex: Int) -> Double {
    guard series.indices.contains(seriesIndex),
      series[seriesIndex].values.indices.contains(labelIndex)
    else { return 0 }
    return series[seriesIndex].values[labelIndex]
  }
  var accessibilityRows: [String] {
    if !scatter.isEmpty {
      return scatter.flatMap { s in
        s.points.map { "\(s.name): x \($0.x), y \($0.y)" + ($0.z.map { ", z \($0)" } ?? "") }
      }
    }
    if !series.isEmpty {
      return labels.indices.map { i in
        labels[i] + ": "
          + series.indices.map { "\(series[$0].name) \(value($0, i))" }.joined(separator: ", ")
      }
    }
    return labels.indices.map { "\(labels[$0]): \(slices.indices.contains($0) ? slices[$0] : 0)" }
  }
}

/// The parser can auto-close a partial numeric token. Keep the last completed
/// chart during a stream instead of presenting that provisional number as fact.
/// Complete inputs still use the upstream chart data rules unchanged.
enum NativeChartStreamingPresentation {
  static func data(current: NativeChartData, stable: NativeChartData?, partial: Bool) -> NativeChartData {
    partial ? stable ?? NativeChartData() : current
  }
}

/// Canvas renders chart families on the package's supported platforms. All chart families
/// use actual plotted geometry, with axes, legends, pointer inspection and
/// complete VoiceOver data, including negative and degenerate domains.
struct NativeChart: View {
  let context: OpenUIComponentContext
  @Environment(\.locale) private var locale
  @Environment(\.layoutDirection) private var direction
  @State private var visibility = NativeChartVisibility()
  @State private var inspected: Int?
  @State private var inspectionLocation = CGPoint.zero
  @State private var pinnedInspection = false
  @State private var stableData: NativeChartData?
  @State private var axisMeasurements = NativeChartAxisMeasurements()
  @ScaledMetric(relativeTo: .body) private var axisScale: CGFloat = 1
  @ScaledMetric(relativeTo: .body) private var legendMarkerSize: CGFloat = 10
  @Namespace private var measurementScope
  private var name: String { context.element.typeName }
  private var currentData: NativeChartData { NativeChartData(context: context).prepared(for: name) }
  private var allData: NativeChartData {
    NativeChartStreamingPresentation.data(current: currentData, stable: stableData,
      partial: !context.element.isSourceComplete)
  }
  private var data: NativeChartData { allData.excluding(visibility.hidden, for: name) }
  private var palette: [Color] {
    context.theme.chartColors(forSeriesCount: legend.count)
  }
  private var legend: [String] { allData.legendNames(for: name) }
  private var showsLegend: Bool {
    legend.count > 1 || ["PieChart", "RadialChart", "SingleStackedBarChart"].contains(name)
  }
  private var drawing: NativeChartDrawing {
    NativeChartDrawing(
      data: data, name: name, variant: context.string("variant"),
      semi: context.string("appearance") == "semiCircular", palette: palette,
      secondary: context.theme.secondary, border: context.theme.border,
      gridColor: context.theme.chartGrid, axisColor: context.theme.chartAxis,
      canvasColor: context.theme.canvas, labelFont: context.theme.typography.resolve(context.theme.typography.caption).nativeFont(scale: axisScale),
      inspected: inspected, axisScale: axisScale, axisMeasurements: axisMeasurements,
      hasYAxisTitle: context.string("yLabel")?.isEmpty == false)
  }
  private var measuredAxisLabels: some View {
    let labels = drawing.axisLabels
    return HStack(spacing: 0) {
      ForEach(Array((labels.left + labels.bottom).enumerated()), id: \.offset) { index, label in
        Text(label).openUIFont(context.theme.typography.caption).monospacedDigit()
          .lineLimit(1).fixedSize()
          .background(GeometryReader { geometry in
            Color.clear.preference(key: NativeChartAxisMeasurementKey.self, value: [measurementScope:
              NativeChartAxisMeasurements(
                leftWidth: index < labels.left.count ? geometry.size.width : 0,
                bottomWidth: index >= labels.left.count ? geometry.size.width : 0,
                lineHeight: geometry.size.height)])
          })
      }
    }.fixedSize().hidden().allowsHitTesting(false).accessibilityHidden(true)
  }
  /// Touch scrolling remains native until a deliberate press activates
  /// inspection. Desktop pointer dragging has no competing touch-scroll intent.
  @ViewBuilder var body: some View {
    Group {
      if allData.hasContent(for: name) {
        chartBody
      } else if name == "PieChart", context.isQueryLoading {
        NativePieSkeleton(donut: context.string("variant") == "donut", semi: context.string("appearance") == "semiCircular")
      }
    }
    .onAppear(perform: rememberStableData)
    .onChange(of: context.element.isSourceComplete) { _ in rememberStableData() }
    .onChange(of: currentData.accessibilityRows) { _ in rememberStableData() }
  }

  private func rememberStableData() {
    if context.element.isSourceComplete { stableData = currentData }
  }

  private var chartBody: some View {
    VStack(alignment: .leading, spacing: context.theme.contentSpacing) {
      GeometryReader { geometry in
        Canvas { canvas, size in
          drawing.draw(
            in: &canvas, size: size, xLabel: context.string("xLabel"),
            yLabel: context.string("yLabel"))
        }
        .lineLimit(1).truncationMode(.middle)
        .contentShape(Rectangle())
        .modifier(NativeChartInteraction { point, pinned in
          let next = point.flatMap { drawing.inspectionIndex(at: $0, size: geometry.size) }
          if pinned && pinnedInspection && next == inspected { inspected = nil; pinnedInspection = false }
          else {
            inspected = next; pinnedInspection = pinned
            if let point { inspectionLocation = point }
          }
        })
        .accessibilityIdentifier("openui-chart-" + name)
        .accessibilityLabel([name, context.string("xLabel"), context.string("yLabel")]
          .compactMap { $0 }.joined(separator: ", "))
        .accessibilityChildren {
          ForEach(Array(data.accessibilityRows.enumerated()), id: \.offset) { _, row in Text(row) }
        }
        .overlay(alignment: .topLeading) {
          if ["BarChart", "LineChart", "AreaChart"].contains(name) {
            NativeChartCategoryAxis(labels: data.labels, layout: drawing.layout(geometry.size), theme: context.theme)
              .frame(width: geometry.size.width, height: geometry.size.height, alignment: .topLeading)
              .allowsHitTesting(false).accessibilityHidden(true)
          }
        }
        .overlay(alignment: .topLeading) {
          if let inspected, let details = data.inspection(at: inspected, locale: locale) {
            NativeChartTooltip(details: details, palette: palette,
              anchor: inspectionLocation, bounds: geometry.size, theme: context.theme)
          }
        }
      }.frame(height: NativeChartHeight.value(explicit: context.number("height"),
        defaultHeight: defaultHeight, scale: axisScale))
      if name == "RadarChart" {
        // Numbered axes keep complete category names out of competing radial
        // slots. The key uses native wrapping and the same reading role.
        VStack(alignment: .leading, spacing: context.theme.spacing("2xs")) {
          ForEach(Array(data.labels.enumerated()), id: \.offset) { index, label in
            HStack(alignment: .top, spacing: context.theme.spacing("xs")) {
              Text("\(index + 1)").monospacedDigit()
              Text(label).fixedSize(horizontal: false, vertical: true)
            }
          }
        }.openUIFont(context.theme.typography.caption).foregroundStyle(context.theme.chartAxis)
      }
      if showsLegend {
        // Legend items already own vertical padding and their full control target.
        NativeChartLegendLayout(rightToLeft: direction == .rightToLeft) {
          ForEach(Array(legend.enumerated()), id: \.offset) { index, title in
            if name == "SingleStackedBarChart" {
              legendLabel(index: index, title: title).accessibilityElement(children: .combine)
            } else {
              Button { visibility.toggle(title, current: legend) } label: {
                legendLabel(index: index, title: title).openUIControlTarget(alignment: .leading)
              }
                .buttonStyle(.plain)
                .opacity(visibility.hidden.contains(OpenUIString(title)) ? 0.3 : 1)
                .accessibilityLabel(title)
                .accessibilityValue(visibility.hidden.contains(OpenUIString(title))
                  ? Text("Hidden", bundle: NativeControlResources.bundle) : Text("Visible", bundle: NativeControlResources.bundle))
                .accessibilityIdentifier("openui.chart.legend." + title)
            }
          }
        }
      }
    }.frame(maxWidth: .infinity, alignment: .leading)
      .background(alignment: .topLeading) { measuredAxisLabels }
      .onPreferenceChange(NativeChartAxisMeasurementKey.self) { measurements in
        let next = measurements[measurementScope] ?? NativeChartAxisMeasurements()
        if next != axisMeasurements { axisMeasurements = next }
      }
      .onChange(of: data.accessibilityRows) { _ in inspected = nil; pinnedInspection = false }
  }
  private var defaultHeight: Double {
    if name == "SingleStackedBarChart" { return 100 }
    if ["PieChart", "RadialChart"].contains(name) { return 210 }
    return 250
  }
  private func legendLabel(index: Int, title: String) -> some View {
    HStack(spacing: context.theme.spacing("xs")) {
      RoundedRectangle(cornerRadius: 2, style: .continuous)
        .fill(palette[allData.colorIndex(at: index) % palette.count])
        .frame(width: legendMarkerSize, height: legendMarkerSize).accessibilityHidden(true)
      Text(title).openUIFont(context.theme.typography.label).foregroundStyle(context.theme.secondary)
        .fixedSize(horizontal: false, vertical: true)
      if ["PieChart", "RadialChart"].contains(name), allData.slices.indices.contains(index) {
        Text(NativeChartNumber.tooltip(allData.slices[index], locale: locale))
          .openUIFont(context.theme.typography.label.weight(.semibold)).monospacedDigit().layoutPriority(1)
      } else if name == "SingleStackedBarChart", allData.slices.indices.contains(index) {
        Text(NativeChartNumber.percentage(allData.slices[index], total: allData.slices.reduce(0, +)))
          .openUIFont(context.theme.typography.label).monospacedDigit()
      }
    }.padding(.vertical, 6).frame(maxWidth: .infinity, alignment: .leading).contentShape(Rectangle())
  }

}

enum NativeChartHeight {
  static func value(explicit: Double?, defaultHeight: Double, scale: CGFloat) -> CGFloat {
    CGFloat(min(1200, max(100, explicit ?? defaultHeight * Double(max(1, scale)))))
  }
}

/// Category text uses native text layout rather than Canvas's inherited
/// one-line environment. The plot and inspection share the same geometry.
struct NativeChartCategoryAxis: View {
  let labels: [String]
  let layout: NativeChartLayout
  let theme: OpenUITheme
  var body: some View {
    ZStack(alignment: .topLeading) {
      ForEach(layout.categoryLabels(count: labels.count), id: \.index) { label in
        Text(labels[label.index]).openUIFont(theme.typography.caption).monospacedDigit()
          .foregroundStyle(theme.chartAxis).lineLimit(layout.categoryLabelLines).truncationMode(.tail)
          .multilineTextAlignment(label.anchor.x == 0 ? .leading : label.anchor.x == 1 ? .trailing : .center)
          .frame(width: label.width, alignment: Alignment(horizontal:
            label.anchor.x == 0 ? .leading : label.anchor.x == 1 ? .trailing : .center, vertical: .top))
          .fixedSize(horizontal: false, vertical: true)
          .offset(x: label.x - label.width * label.anchor.x,
            y: layout.rect.maxY + (layout.categoryLabelLines > 1 ? 6 * layout.scale : layout.tickOffset - layout.lineHeight / 2))
      }
    }.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

private struct NativeChartTooltip: View {
  let details: NativeChartInspection
  let palette: [Color]
  let anchor: CGPoint
  let bounds: CGSize
  let theme: OpenUITheme
  @Environment(\.displayScale) private var displayScale
  @ScaledMetric(relativeTo: .body) private var markerSize: CGFloat = 9
  var body: some View {
    NativeChartTooltipLayout(anchor: anchor, bounds: bounds) { label }
      .allowsHitTesting(false)
  }
  private var label: some View {
    VStack(alignment: .leading, spacing: theme.spacing("sm")) {
      if !details.title.isEmpty {
        HStack(spacing: theme.spacing("s")) {
          if let index = details.colorIndex { marker(index) }
          Text(details.title).openUIFont(theme.typography.detail.weight(.semibold))
            .foregroundStyle(theme.foreground).fixedSize(horizontal: false, vertical: true)
        }
        Rectangle().fill(theme.border).frame(height: 1 / displayScale)
      }
      VStack(alignment: .leading, spacing: theme.spacing("s")) {
        ForEach(details.rows) { row in
          HStack(alignment: .firstTextBaseline, spacing: theme.spacing("s")) {
            if let index = row.colorIndex { marker(index) }
            Group {
              if let label = row.label { Text(label) }
              else { Text("Value", bundle: NativeControlResources.bundle) }
            }.foregroundStyle(theme.secondary)
              .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 8)
            Text(row.value).monospacedDigit().foregroundStyle(theme.foreground)
              .multilineTextAlignment(.trailing).layoutPriority(1)
          }.accessibilityElement(children: .combine)
        }
      }.openUIFont(theme.typography.detail)
    }
      .padding(theme.contentSpacing)
      .modifier(NativeOverlaySurface(theme: theme, compact: true))
      .accessibilityElement(children: .contain)
      .accessibilityIdentifier("openui-chart-inspection")
  }
  private func marker(_ index: Int) -> some View {
    RoundedRectangle(cornerRadius: 2)
      .fill(palette.isEmpty ? theme.accent : palette[max(0, index) % palette.count])
      .frame(width: markerSize, height: markerSize)
      .accessibilityHidden(true)
  }
}

enum NativeChartTooltipPlacement {
  static func frame(size: CGSize, anchor: CGPoint, bounds: CGSize) -> CGRect {
    let margin: CGFloat = 8
    let width = min(size.width, max(1, bounds.width - 2 * margin))
    let height = min(size.height, max(1, bounds.height - 2 * margin))
    let x = max(margin, min(anchor.x - width / 2, bounds.width - width - margin))
    let above = anchor.y - height - margin
    let y = max(margin, min(above >= margin ? above : anchor.y + margin, bounds.height - height - margin))
    return CGRect(x: x, y: y, width: width, height: height)
  }
}

private struct NativeChartTooltipLayout: Layout {
  let anchor: CGPoint
  let bounds: CGSize
  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize { bounds }
  func placeSubviews(in rect: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    guard let view = subviews.first else { return }
    let size = view.sizeThatFits(ProposedViewSize(width: min(240, max(1, bounds.width - 16)), height: nil))
    let frame = NativeChartTooltipPlacement.frame(size: size, anchor: anchor, bounds: bounds)
    view.place(at: CGPoint(x: rect.minX + frame.minX, y: rect.minY + frame.minY), anchor: .topLeading,
      proposal: ProposedViewSize(frame.size))
  }
}

struct NativeChartAxisMeasurements: Equatable {
  var leftWidth: CGFloat = 0
  var bottomWidth: CGFloat = 0
  var lineHeight: CGFloat = 0
  func merging(_ other: Self) -> Self {
    Self(leftWidth: max(leftWidth, other.leftWidth), bottomWidth: max(bottomWidth, other.bottomWidth),
      lineHeight: max(lineHeight, other.lineHeight))
  }
}

private struct NativeChartAxisMeasurementKey: PreferenceKey {
  static let defaultValue: [Namespace.ID: NativeChartAxisMeasurements] = [:]
  static func reduce(value: inout [Namespace.ID: NativeChartAxisMeasurements], nextValue: () -> [Namespace.ID: NativeChartAxisMeasurements]) {
    value.merge(nextValue(), uniquingKeysWith: { $0.merging($1) })
  }
}

/// One layout for drawing and hit testing. Text measurement can expand the
/// axis gutters, while bounded text drawing keeps very long labels contained.
struct NativeChartLayout {
  let rect: CGRect
  let scale: CGFloat
  let lineHeight: CGFloat
  let tickOffset: CGFloat
  let bottomLabelWidth: CGFloat
  let measuredBottomLabelWidth: CGFloat
  let showsBottomLabels: Bool
  let showsLeftLabels: Bool
  let showsXAxisTitle: Bool
  let showsYAxisTitle: Bool
  let categoryLabelLines: Int

  init(size: CGSize, scale: CGFloat = 1, measurements: NativeChartAxisMeasurements = .init(), hasYAxisTitle: Bool = false,
       categoryLabelLines: Int = 1) {
    let scale = max(1, scale)
    let lineHeight = max(16 * scale, measurements.lineHeight)
    let tickOffset = max(12 * scale, lineHeight / 2 + 4 * scale)
    let right = min(12 * scale, size.width)
    let idealLeft = max(44 * scale, measurements.leftWidth + 8 * scale)
    let left = min(idealLeft,
      max(0, size.width - right - min(80, size.width)))
    let titleClearance = lineHeight * 1.5 + 10 * scale
    let top = min(hasYAxisTitle ? titleClearance : max(18 * scale, lineHeight + 2 * scale), max(0, size.height - 40))
    let lines = min(2, max(1, categoryLabelLines))
    let labelClearance = max(40 * scale, tickOffset + lineHeight * (CGFloat(lines) + 0.5) + 4 * scale,
      lines > 1 ? lineHeight * 3 + 14 * scale : 0)
    let bottom = min(labelClearance,
      max(0, size.height - top - 40))
    rect = CGRect(x: left, y: top, width: max(1, size.width - left - right),
      height: max(1, size.height - top - bottom))
    self.scale = scale
    self.lineHeight = lineHeight
    self.tickOffset = tickOffset
    self.categoryLabelLines = lines
    // A compact preview can reserve a useful plot while lacking a complete
    // axis gutter. Omit those ticks instead of drawing clipped digit fragments;
    // values remain available through inspection and accessibility rows.
    showsLeftLabels = left >= idealLeft
    bottomLabelWidth = max(56 * scale, measurements.bottomWidth + 12 * scale)
    measuredBottomLabelWidth = measurements.bottomWidth > 0 ? measurements.bottomWidth : 44 * scale
    showsXAxisTitle = bottom >= lineHeight + 2 * scale
    showsYAxisTitle = hasYAxisTitle && top >= titleClearance
    showsBottomLabels = bottom >= labelClearance
  }

  struct CategoryLabel {
    let index: Int
    let x: CGFloat
    let anchor: UnitPoint
    let width: CGFloat
  }

  func categoryLabels(count: Int) -> [CategoryLabel] {
    guard count > 0, showsBottomLabels else { return [] }
    let capacity = max(1, Int(rect.width / max(1, measuredBottomLabelWidth / CGFloat(categoryLabelLines) + 8 * scale)))
    let visibleCount = min(count, capacity)
    let indices = visibleCount == 1 ? [0] : (0..<visibleCount).map {
      Int((Double($0) * Double(count - 1) / Double(visibleCount - 1)).rounded())
    }
    let pitch = rect.width / CGFloat(count)
    let centers = indices.map { rect.minX + pitch * (CGFloat($0) + 0.5) }
    return indices.enumerated().map { offset, index in
      let center = centers[offset]
      let left = offset == 0 ? rect.minX : (centers[offset - 1] + center) / 2 + 2 * scale
      let right = offset == centers.count - 1 ? rect.maxX : (center + centers[offset + 1]) / 2 - 2 * scale
      if offset == 0, measuredBottomLabelWidth / 2 > center - left {
        return CategoryLabel(index: index, x: left, anchor: .leading, width: max(1, right - left))
      }
      if offset == centers.count - 1, measuredBottomLabelWidth / 2 > right - center {
        return CategoryLabel(index: index, x: right, anchor: .trailing, width: max(1, right - left))
      }
      return CategoryLabel(index: index, x: center, anchor: .center,
        width: max(1, min(center - left, right - center) * 2))
    }
  }

}

struct NativeChartDrawing {
  let data: NativeChartData
  let name: String
  let variant: String?
  let semi: Bool
  let palette: [Color]
  let secondary: Color
  let border: Color
  var gridColor: Color? = nil
  var axisColor: Color? = nil
  var canvasColor: Color = .white
  var labelFont: Font = OpenUITypography().caption.nativeFont()
  var inspected: Int? = nil
  var axisScale: CGFloat = 1
  var axisMeasurements = NativeChartAxisMeasurements()
  var hasYAxisTitle = false
  private var gridColorValue: Color { gridColor ?? border }
  private var axisColorValue: Color { axisColor ?? secondary }
  private func color(_ index: Int) -> Color {
    let slot = data.colorIndex(at: index)
    return palette.isEmpty ? secondary : palette[slot % palette.count]
  }
  /// Inspection and drawing share the projection, including negative domains
  /// and bubble sizes. A scatter chart does not have categorical labels.
  func inspectionIndex(at location: CGPoint, size: CGSize) -> Int? {
    if name == "ScatterChart" {
      return NativeScatterProjection(data: data, layout: layout(size)).nearestIndex(to: location)
    }
    guard !data.labels.isEmpty else { return nil }
    if ["PieChart", "RadialChart", "SingleStackedBarChart"].contains(name) {
      return NativePolarInspection.index(at: location, size: size, values: data.slices, name: name,
        donut: variant == "donut", semi: semi)
    }
    if name == "RadarChart" {
      let geometry = NativeRadarGeometry(size: size, scale: axisScale)
      guard hypot(location.x - geometry.center.x, location.y - geometry.center.y) <= geometry.radius else { return nil }
      let angle = (atan2(location.y - geometry.center.y, location.x - geometry.center.x) + .pi / 2 + 2 * .pi)
        .truncatingRemainder(dividingBy: 2 * .pi)
      return Int((angle / (2 * .pi) * Double(data.labels.count)).rounded()) % data.labels.count
    }
    let rect = layout(size).rect
    if ["BarChart", "HorizontalBarChart", "LineChart", "AreaChart"].contains(name),
      !rect.contains(location) { return nil }
    let fraction = name == "HorizontalBarChart"
      ? (location.y - rect.minY) / rect.height
      : (location.x - rect.minX) / rect.width
    return min(data.labels.count - 1, max(0, Int(fraction * CGFloat(data.labels.count))))
  }
  func draw(in canvas: inout GraphicsContext, size: CGSize, xLabel: String?, yLabel: String?) {
    guard size.width > 0, size.height > 0 else { return }
    switch name {
    case "PieChart", "RadialChart", "SingleStackedBarChart": circular(&canvas, size)
    case "RadarChart": radar(&canvas, size)
    case "ScatterChart": scatter(&canvas, size)
    default: cartesian(&canvas, size)
    }
    let chartLayout = layout(size)
    if let xLabel, chartLayout.showsXAxisTitle {
      text(
        xLabel, at: CGPoint(x: size.width / 2, y: size.height - 2 * axisScale), canvas: &canvas,
        anchor: .bottom, maxWidth: size.width
      )
    }
    if let yLabel, chartLayout.showsYAxisTitle {
      text(yLabel, at: CGPoint(x: 4, y: 2), canvas: &canvas, anchor: .topLeading,
        maxWidth: max(1, size.width - 8))
    }
  }
  private func text(
    _ value: String, at point: CGPoint, canvas: inout GraphicsContext, anchor: UnitPoint = .center,
    maxWidth: CGFloat? = nil
  ) {
    let label = Text(value).font(labelFont).monospacedDigit().foregroundColor(axisColorValue)
    if let maxWidth {
      let resolved = canvas.resolve(label)
      let available = max(1, maxWidth)
      let measured = resolved.measure(in: CGSize(width: available, height: .greatestFiniteMagnitude))
      let width = min(available, measured.width)
      canvas.draw(resolved, in: CGRect(
        x: point.x - width * anchor.x, y: point.y - measured.height * anchor.y,
        width: width, height: measured.height))
    } else {
      canvas.draw(label, at: point, anchor: anchor)
    }
  }
  private func number(_ value: Double) -> String { NativeChartNumber.tick(value) }
  func layout(_ size: CGSize) -> NativeChartLayout {
    // A small categorical comparison benefits from wrapping before dropping
    // whole categories. Dense axes and numeric domains retain sparse ticks.
    let categorical = ["BarChart", "LineChart", "AreaChart"].contains(name)
    let regular = NativeChartLayout(size: size, scale: axisScale,
      measurements: axisMeasurements, hasYAxisTitle: hasYAxisTitle)
    let pitch = regular.rect.width / CGFloat(max(1, data.labels.count))
    let needsWrapping = axisMeasurements.bottomWidth > max(1, pitch - 8 * axisScale)
    let lines = categorical && (1...4).contains(data.labels.count) && needsWrapping ? 2 : 1
    return NativeChartLayout(size: size, scale: axisScale, measurements: axisMeasurements,
      hasYAxisTitle: hasYAxisTitle, categoryLabelLines: lines)
  }
  private var domain: (low: Double, high: Double) {
    let stacked = ["BarChart", "HorizontalBarChart"].contains(name) && variant == "stacked"
    var low = 0.0
    var high = 0.0
    for i in data.labels.indices {
      let values = data.series.indices.map { data.value($0, i) }
      low = min(low, stacked ? values.filter { $0 < 0 }.reduce(0, +) : values.min() ?? 0)
      high = max(high, stacked ? values.filter { $0 > 0 }.reduce(0, +) : values.max() ?? 0)
    }
    return (low, high == low ? low + 1 : high)
  }
  var axisLabels: (left: [String], bottom: [String]) {
    func ticks(_ low: Double, _ high: Double) -> [String] {
      // Scatter plots retain their numeric domain, so measure every interval
      // count the grid might show as the available space changes.
      var labels: [String] = []
      for count in 1...4 {
        for index in 0...count {
          let label = number(low + (high - low) * Double(index) / Double(count))
          if !labels.contains(label) { labels.append(label) }
        }
      }
      return labels
    }
    if name == "ScatterChart" {
      let projection = NativeScatterProjection(data: data, size: .zero)
      return (ticks(projection.yMin, projection.yMax), ticks(projection.xMin, projection.xMax))
    }
    guard ["BarChart", "HorizontalBarChart", "LineChart", "AreaChart"].contains(name)
      else { return ([], []) }
    let bounds = domain
    let numeric = NativeChartScale(low: bounds.low, high: bounds.high).ticks.map(number)
    return name == "HorizontalBarChart" ? (data.labels, numeric) : (numeric, data.labels)
  }
  private func grid(
    _ canvas: inout GraphicsContext, rect: CGRect, low: Double, high: Double,
    horizontal: Bool = false, layout: NativeChartLayout, tickValues: [Double]? = nil
  ) {
    let available = horizontal ? rect.width : rect.height
    let spacing = horizontal ? layout.bottomLabelWidth : layout.lineHeight + 10 * layout.scale
    let count = max(1, min(4, Int(available / max(1, spacing))))
    let values = tickValues ?? (0...count).map { low + (high - low) * Double($0) / Double(count) }
    let stride = max(1, Int(ceil(Double(max(1, values.count - 1)) / Double(count))))
    for i in values.indices where i % stride == 0 || i == values.count - 1 {
      let value = values[i]
      let fraction = (value - low) / (high - low)
      guard fraction.isFinite else { continue }
      var line = Path()
      if horizontal {
        let x = rect.minX + rect.width * fraction
        line.move(to: CGPoint(x: x, y: rect.minY))
        line.addLine(to: CGPoint(x: x, y: rect.maxY))
        if layout.showsBottomLabels {
          text(
            number(value), at: CGPoint(x: x, y: rect.maxY + layout.tickOffset),
            canvas: &canvas, anchor: i == 0 ? .leading : i == values.count - 1 ? .trailing : .center,
            maxWidth: rect.width / CGFloat(count))
        }
      } else {
        let y = rect.maxY - rect.height * fraction
        line.move(to: CGPoint(x: rect.minX, y: y))
        line.addLine(to: CGPoint(x: rect.maxX, y: y))
        if layout.showsLeftLabels {
          text(
            number(value), at: CGPoint(x: rect.minX - 6, y: y),
            canvas: &canvas, anchor: .trailing, maxWidth: max(1, rect.minX - 6))
        }
      }
      let isZero = abs(value) < 0.000_001
      canvas.stroke(
        line, with: .color(isZero ? axisColorValue.opacity(0.35) : gridColorValue),
        lineWidth: isZero ? 0.75 : 0.5)
    }
  }
  private func cartesian(_ canvas: inout GraphicsContext, _ size: CGSize) {
    guard !data.labels.isEmpty, !data.series.isEmpty else { return }
    let layout = self.layout(size)
    let rect = layout.rect
    let count = data.labels.count
    let seriesCount = data.series.count
    let horizontal = name == "HorizontalBarChart"
    let bars = name == "BarChart" || horizontal
    let stacked = bars && variant == "stacked"
    let bounds = domain
    let scale = NativeChartScale(low: bounds.low, high: bounds.high)
    let low = scale.low, high = scale.high
    grid(&canvas, rect: rect, low: low, high: high, horizontal: horizontal,
      layout: layout, tickValues: scale.ticks)
    let numeric = { (v: Double) -> CGFloat in
      let f = CGFloat((v - low) / (high - low))
      return horizontal ? rect.minX + rect.width * f : rect.maxY - rect.height * f
    }
    let pitch = (horizontal ? rect.height : rect.width) / CGFloat(count)
    if horizontal {
      let labelStride = max(1, Int(ceil(CGFloat(count) / max(1,
        rect.height / (layout.lineHeight + 12 * layout.scale)))))
      for i in 0..<count where layout.showsLeftLabels && i % labelStride == 0 {
        text(
          data.labels[i], at: CGPoint(x: rect.minX - 6, y: rect.minY + pitch * (CGFloat(i) + 0.5)),
          canvas: &canvas, anchor: .trailing, maxWidth: max(1, rect.minX - 6))
      }
    }
    if let inspected, (0..<count).contains(inspected) {
      let band = horizontal
        ? CGRect(x: rect.minX, y: rect.minY + pitch * CGFloat(inspected), width: rect.width, height: pitch)
        : CGRect(x: rect.minX + pitch * CGFloat(inspected), y: rect.minY, width: pitch, height: rect.height)
      canvas.fill(Path(roundedRect: band, cornerRadius: 4), with: .color(axisColorValue.opacity(0.06)))
    }
    if bars {
      for i in 0..<count {
        var positive = 0.0
        var negative = 0.0
        for s in 0..<seriesCount {
          let value = data.value(s, i)
          let base = stacked ? (value >= 0 ? positive : negative) : 0
          let a = numeric(base)
          let b = numeric(base + value)
          let breadth = pitch * 0.75 / CGFloat(stacked ? 1 : seriesCount)
          let category =
            (horizontal ? rect.minY : rect.minX) + pitch * (CGFloat(i) + 0.125)
            + (stacked ? 0 : CGFloat(s) * breadth)
          let bar =
            horizontal
            ? CGRect(x: min(a, b), y: category, width: abs(b - a), height: breadth)
            : CGRect(x: category, y: min(a, b), width: breadth, height: abs(b - a))
          let gap: CGFloat = stacked ? 0 : min(2, breadth * 0.12)
          let insetBar = bar.insetBy(dx: horizontal ? 0 : gap, dy: horizontal ? gap : 0)
          let radius = stacked ? 0 : min(4, breadth * 0.2)
          canvas.fill(
            Path(roundedRect: insetBar, cornerRadius: radius),
            with: .color(color(s).opacity(inspected == nil || inspected == i ? 1 : 0.4)))
          if value >= 0 { positive += value } else { negative += value }
        }
      }
    } else {
      for s in 0..<seriesCount {
        let points = (0..<count).map {
          CGPoint(x: rect.minX + pitch * (CGFloat($0) + 0.5), y: numeric(data.value(s, $0)))
        }
        let line = linePath(points)
        if name == "AreaChart", let first = points.first, let last = points.last {
          var area = line
          area.addLine(to: CGPoint(x: last.x, y: numeric(0)))
          area.addLine(to: CGPoint(x: first.x, y: numeric(0)))
          area.closeSubpath()
          canvas.fill(area, with: .color(color(s).opacity(0.12)))
        }
        canvas.stroke(
          line, with: .color(color(s)),
          style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
        if let inspected, points.indices.contains(inspected) {
          let point = points[inspected]
          let marker = Path(ellipseIn: CGRect(x: point.x - 4, y: point.y - 4, width: 8, height: 8))
          canvas.fill(marker, with: .color(canvasColor))
          canvas.stroke(marker, with: .color(color(s)), lineWidth: 2)
        } else if count == 1, let point = points.first {
          canvas.fill(
            Path(ellipseIn: CGRect(x: point.x - 3, y: point.y - 3, width: 6, height: 6)),
            with: .color(color(s)))
        }
      }
    }
  }
  private func linePath(_ points: [CGPoint]) -> Path {
    var line = Path()
    guard let first = points.first else { return line }
    line.move(to: first)
    for i in 1..<points.count {
      let previous = points[i - 1]
      let current = points[i]
      if variant == "step" {
        let middle = (previous.x + current.x) / 2
        line.addLine(to: CGPoint(x: middle, y: previous.y))
        line.addLine(to: CGPoint(x: middle, y: current.y))
        line.addLine(to: current)
      } else if variant == "natural" {
        let before = points[max(0, i - 2)]
        let after = points[min(points.count - 1, i + 1)]
        line.addCurve(
          to: current,
          control1: CGPoint(
            x: previous.x + (current.x - before.x) / 6, y: previous.y + (current.y - before.y) / 6),
          control2: CGPoint(
            x: current.x - (after.x - previous.x) / 6, y: current.y - (after.y - previous.y) / 6))
      } else {
        line.addLine(to: current)
      }
    }
    return line
  }
  private func circular(_ canvas: inout GraphicsContext, _ size: CGSize) {
    let values = data.labels.indices.map {
      max(0, data.slices.indices.contains($0) ? data.slices[$0] : 0)
    }
    let total = values.reduce(0, +)
    guard total > 0 else { return }
    if name == "SingleStackedBarChart" {
      var barCanvas = canvas
      barCanvas.clip(to: Path(roundedRect:
        CGRect(x: 4, y: size.height / 2 - 14, width: max(0, size.width - 8), height: 28),
        cornerRadius: 6))
      var x: CGFloat = 4
      for i in values.indices {
        let width = (size.width - 8) * values[i] / total
        barCanvas.fill(
          Path(CGRect(x: x, y: size.height / 2 - 14, width: width, height: 28)),
          with: .color(color(i)))
        x += width
      }
      return
    }
    let center = CGPoint(x: size.width / 2, y: semi ? size.height * 0.82 : size.height / 2)
    let radius = max(1, min(size.width / 2 - 12, semi ? size.height * 0.78 : size.height / 2 - 12))
    var start = semi ? -180.0 : -90.0
    let sweep = semi ? 180.0 : 360.0
    for i in values.indices {
      if name == "RadialChart" {
        let thickness = radius / CGFloat(max(1, values.count)) * 0.75
        let r = radius - CGFloat(i) * radius / CGFloat(max(1, values.count)) - thickness / 2
        var track = Path()
        track.addArc(
          center: center, radius: r, startAngle: .degrees(-90), endAngle: .degrees(270),
          clockwise: false)
        canvas.stroke(track, with: .color(gridColorValue), lineWidth: thickness)
        var arc = Path()
        arc.addArc(
          center: center, radius: r, startAngle: .degrees(-90),
          endAngle: .degrees(-90 + 360 * values[i] / (values.max() ?? 1)), clockwise: false)
        canvas.stroke(
          arc, with: .color(color(i)), style: StrokeStyle(lineWidth: thickness, lineCap: .round))
      } else {
        let end = start + sweep * values[i] / total
        var sector = Path()
        if variant == "donut" {
          let inner = radius * 0.6
          sector.addArc(
            center: center, radius: radius, startAngle: .degrees(start), endAngle: .degrees(end),
            clockwise: false)
          sector.addArc(
            center: center, radius: inner, startAngle: .degrees(end), endAngle: .degrees(start),
            clockwise: true)
        } else {
          sector.move(to: center)
          sector.addArc(
            center: center, radius: radius, startAngle: .degrees(start), endAngle: .degrees(end),
            clockwise: false)
        }
        sector.closeSubpath()
        canvas.fill(sector, with: .color(color(i)))
        canvas.stroke(sector, with: .color(canvasColor), lineWidth: 1.5)
        start = end
      }
    }
  }
  private func radar(_ canvas: inout GraphicsContext, _ size: CGSize) {
    guard !data.labels.isEmpty, !data.series.isEmpty else { return }
    let geometry = NativeRadarGeometry(size: size, scale: axisScale)
    let high = max(1, data.series.flatMap(\.values).max() ?? 1)
    let count = data.labels.count
    let point = { (i: Int, value: Double) -> CGPoint in
      geometry.point(index: i, count: count, fraction: max(0, value) / high)
    }
    for step in 1...4 {
      var polygon = Path()
      for i in 0..<count {
        let p = point(i, high * Double(step) / 4)
        if i == 0 { polygon.move(to: p) } else { polygon.addLine(to: p) }
      }
      polygon.closeSubpath()
      canvas.stroke(polygon, with: .color(gridColorValue), lineWidth: 0.5)
    }
    let labeledAxes = Set(geometry.labelIndices(count: count))
    for i in 0..<count {
      var axis = Path()
      axis.move(to: geometry.center)
      axis.addLine(to: point(i, high))
      canvas.stroke(axis, with: .color(gridColorValue), lineWidth: 0.5)
      if labeledAxes.contains(i) { text("\(i + 1)", at: point(i, high * 1.12), canvas: &canvas) }
    }
    for s in data.series.indices {
      var polygon = Path()
      for i in 0..<count {
        let p = point(i, data.value(s, i))
        if i == 0 { polygon.move(to: p) } else { polygon.addLine(to: p) }
      }
      polygon.closeSubpath()
      canvas.fill(polygon, with: .color(color(s).opacity(0.15)))
      canvas.stroke(polygon, with: .color(color(s)), lineWidth: 2)
    }
  }
  private func scatter(_ canvas: inout GraphicsContext, _ size: CGSize) {
    let layout = self.layout(size)
    let projection = NativeScatterProjection(data: data, layout: layout)
    guard !projection.points.isEmpty else { return }
    let rect = projection.rect
    grid(&canvas, rect: rect, low: projection.yMin, high: projection.yMax, layout: layout)
    let count = max(1, min(4, Int(rect.width / layout.bottomLabelWidth)))
    for i in 0...count where layout.showsBottomLabels {
      let fraction = Double(i) / Double(count)
      text(
        number(projection.xMin + (projection.xMax - projection.xMin) * fraction),
        at: CGPoint(x: rect.minX + rect.width * fraction, y: rect.maxY + layout.tickOffset),
        canvas: &canvas, anchor: i == 0 ? .leading : i == count ? .trailing : .center,
        maxWidth: rect.width / CGFloat(count))
    }
    for point in projection.points {
      let selected = inspected == point.rowIndex
      let opacity = inspected == nil || selected ? 0.85 : 0.35
      let circle = Path(ellipseIn: CGRect(
        x: point.position.x - point.radius, y: point.position.y - point.radius,
        width: point.radius * 2, height: point.radius * 2))
      canvas.fill(circle, with: .color(color(point.seriesIndex).opacity(opacity)))
      if selected {
        let ring = Path(ellipseIn: CGRect(
          x: point.position.x - point.radius - 3, y: point.position.y - point.radius - 3,
          width: point.radius * 2 + 6, height: point.radius * 2 + 6))
        canvas.stroke(ring, with: .color(color(point.seriesIndex)), lineWidth: 1.5)
      }
    }
  }
}

/// A single geometry source for scatter rendering and pointer inspection.
/// Row indices intentionally match accessibilityRows, independent of labels.
struct NativeScatterProjection {
  struct Point {
    let rowIndex: Int
    let seriesIndex: Int
    let position: CGPoint
    let radius: CGFloat
  }
  let rect: CGRect
  let xMin: Double
  let xMax: Double
  let yMin: Double
  let yMax: Double
  let points: [Point]

  init(data: NativeChartData, size: CGSize) {
    self.init(data: data, layout: NativeChartLayout(size: size))
  }

  init(data: NativeChartData, layout: NativeChartLayout) {
    let rawPoints = data.scatter.flatMap(\.points)
    let rect = layout.rect
    let xMin = min(0, rawPoints.map(\.x).min() ?? 0)
    let yMin = min(0, rawPoints.map(\.y).min() ?? 0)
    let xMax = max(xMin + 1, rawPoints.map(\.x).max() ?? 1)
    let yMax = max(yMin + 1, rawPoints.map(\.y).max() ?? 1)
    let maxZ = max(1, rawPoints.compactMap(\.z).max() ?? 1)
    self.rect = rect
    self.xMin = xMin; self.xMax = xMax
    self.yMin = yMin; self.yMax = yMax
    var projected: [Point] = []
    for (seriesIndex, series) in data.scatter.enumerated() {
      for point in series.points {
        projected.append(Point(
          rowIndex: projected.count, seriesIndex: seriesIndex,
          position: CGPoint(
            x: rect.minX + (point.x - xMin) / (xMax - xMin) * rect.width,
            y: rect.maxY - (point.y - yMin) / (yMax - yMin) * rect.height),
          radius: point.z.map { 3 + 9 * sqrt(max(0, $0) / maxZ) } ?? 4))
      }
    }
    points = projected
  }

  func nearestIndex(to location: CGPoint) -> Int? {
    // Edge points remain reachable, while axes and empty plot space do not
    // report a distant observation as if it had been touched.
    guard rect.insetBy(dx: -16, dy: -16).contains(location) else { return nil }
    var result: (index: Int, distance: CGFloat)?
    for point in points {
      let distance = hypot(location.x - point.position.x, location.y - point.position.y)
      guard distance <= max(22, point.radius + 8) else { continue }
      if let result, distance >= result.distance { continue }
      result = (point.rowIndex, distance)
    }
    return result?.index
  }
}
