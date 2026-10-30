import OpenUILang
import SwiftUI
import XCTest

@testable import OpenUISwiftUI

final class ChartInspectionTests: XCTestCase {
  func testStreamingChartsKeepOnlyCommittedNumbers() {
    var current = NativeChartData()
    current.labels = ["Food", "Transport", "Activities", "Buffer"]
    current.slices = [80, 20, 100, 4]
    let pending = NativeChartStreamingPresentation.data(current: current, stable: nil, partial: true)
    XCTAssertFalse(pending.hasContent(for: "PieChart"))

    var stable = current
    stable.slices[3] = 40
    let retained = NativeChartStreamingPresentation.data(current: current, stable: stable, partial: true)
    XCTAssertEqual(retained.slices, [80, 20, 100, 40])
    let finished = NativeChartStreamingPresentation.data(current: current, stable: stable, partial: false)
    XCTAssertEqual(finished.slices, [80, 20, 100, 4],
      "Complete input keeps the upstream data values even when they differ from an older snapshot")
  }

  @MainActor func testRealSdkStreamDoesNotPresentAnIncompletePieAsZero() throws {
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.push("root=PieChart([\"Food\",\"Transport\",\"Activities\",\"Flexibility\"],[80,20,100")
    let incomplete = try XCTUnwrap(state.root)
    XCTAssertTrue(incomplete.partial)
    let incompleteData = NativeChartData(context: .init(element: incomplete,
      registry: library.registry, state: state))
    XCTAssertFalse(NativeChartStreamingPresentation.data(current: incompleteData,
      stable: nil, partial: incomplete.partial).hasContent(for: "PieChart"))
    state.push(",40],\"donut\")")
    let ready = try XCTUnwrap(state.root)
    XCTAssertFalse(ready.partial)
    let stable = NativeChartData(context: .init(element: ready,
      registry: library.registry, state: state))
    XCTAssertEqual(stable.slices, [80, 20, 100, 40])
    state.complete()
    XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")

    state.reset()
    state.push("root=PieChart([\"Only\"],[4")
    let unfinishedNumber = try XCTUnwrap(state.root)
    let tokenData = NativeChartData(context: .init(element: unfinishedNumber,
      registry: library.registry, state: state))
    XCTAssertEqual(tokenData.slices, [4], "The parser has a provisional numeric value")
    XCTAssertFalse(NativeChartStreamingPresentation.data(current: tokenData,
      stable: nil, partial: unfinishedNumber.partial).hasContent(for: "PieChart"),
      "The renderer must not turn the provisional number into a chart")
  }

  func testYAxisTitleDoesNotOverlapTheHighestTick() {
    let measurements = NativeChartAxisMeasurements(lineHeight: 18)
    let layout = NativeChartLayout(size: CGSize(width: 318, height: 220), measurements: measurements, hasYAxisTitle: true)
    XCTAssertTrue(layout.showsYAxisTitle)
    let titleBottom = 2 + layout.lineHeight
    let tickTop = layout.rect.minY - layout.lineHeight / 2
    XCTAssertGreaterThanOrEqual(tickTop - titleBottom, 8)
    let untitled = NativeChartLayout(size: CGSize(width: 318, height: 220), measurements: measurements)
    XCTAssertLessThan(untitled.rect.minY, layout.rect.minY)
  }

  @MainActor func testPieChartPlucksSlicePropsIntoRealValues() throws {
    let drawing = try chart(
      "slices=[Slice(\"阅读\",9.5),Slice(\"创作\",9.5),Slice(\"整理\",3)]\nroot=PieChart(slices.props.category,slices.props.value,\"donut\")",
      name: "PieChart")
    XCTAssertEqual(drawing.data.labels, ["阅读", "创作", "整理"])
    XCTAssertEqual(drawing.data.slices, [9.5, 9.5, 3])
    XCTAssertEqual(drawing.data.slices.reduce(0, +), 22)
    XCTAssertEqual(drawing.data.accessibilityRows.count, 3)
  }

  @MainActor private func chart(_ source: String, name: String) throws -> NativeChartDrawing {
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource(source)
    XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    let data = NativeChartData(context: OpenUIComponentContext(
      element: try XCTUnwrap(state.root), registry: library.registry, state: state))
    return NativeChartDrawing(
      data: data, name: name, variant: nil, semi: false,
      palette: [.blue, .orange], secondary: .secondary, border: .gray)
  }

  @MainActor func testScatterInspectionUsesCoordinatesWithoutCategoricalLabels() throws {
    let drawing = try chart(
      "root=ScatterChart([ScatterSeries(\"Alpha\",[Point(-2,3,2),Point(4,-1,6)]),ScatterSeries(\"Beta\",[Point(1,2),Point(3,5)])],\"Distance\",\"Value\")",
      name: "ScatterChart")
    XCTAssertTrue(drawing.data.labels.isEmpty, "Scatter has datasets, not categorical labels")
    let size = CGSize(width: 300, height: 250)
    // Domain x = -2...4, y = -1...5; plot x = 44...288, y = 18...210.
    XCTAssertEqual(drawing.inspectionIndex(at: CGPoint(x: 44, y: 82), size: size), 0)
    XCTAssertEqual(drawing.inspectionIndex(at: CGPoint(x: 288, y: 210), size: size), 1)
    XCTAssertEqual(drawing.inspectionIndex(at: CGPoint(x: 166, y: 114), size: size), 2)
    XCTAssertEqual(drawing.inspectionIndex(at: CGPoint(x: 247.33, y: 18), size: size), 3)
    XCTAssertTrue(drawing.data.accessibilityRows[2].contains("Beta: x 1.0, y 2.0"))
    XCTAssertTrue(drawing.data.accessibilityRows[0].contains("z 2.0"))
    XCTAssertNil(drawing.inspectionIndex(at: CGPoint(x: 150, y: 180), size: size),
      "Empty chart space must not select the nearest distant observation")
    XCTAssertNil(drawing.inspectionIndex(at: CGPoint(x: 0, y: 82), size: size),
      "The axis label area must not select a point")
  }

  @MainActor func testScatterInspectionAllowsNearbyTouchesAndDegenerateData() throws {
    let drawing = try chart(
      "root=ScatterChart([ScatterSeries(\"Origin\",[Point(0,0)])])", name: "ScatterChart")
    let size = CGSize(width: 240, height: 200)
    XCTAssertEqual(drawing.inspectionIndex(at: CGPoint(x: 44, y: 160), size: size), 0)
    XCTAssertEqual(drawing.inspectionIndex(at: CGPoint(x: 59, y: 160), size: size), 0)
    XCTAssertNil(drawing.inspectionIndex(at: CGPoint(x: 68, y: 160), size: size))
    let empty = try chart("root=ScatterChart([])", name: "ScatterChart")
    XCTAssertNil(empty.inspectionIndex(at: CGPoint(x: 44, y: 160), size: size))
  }

  @MainActor func testHorizontalBarInspectionFollowsRowsInsteadOfXPosition() throws {
    let drawing = try chart(
      "root=HorizontalBarChart([\"First\",\"Second\"],[Series(\"Count\",[2,5])])",
      name: "HorizontalBarChart")
    let size = CGSize(width: 300, height: 250)
    XCTAssertEqual(drawing.inspectionIndex(at: CGPoint(x: 200, y: 66), size: size), 0)
    XCTAssertEqual(drawing.inspectionIndex(at: CGPoint(x: 200, y: 162), size: size), 1)
    XCTAssertNil(drawing.inspectionIndex(at: CGPoint(x: 200, y: 235), size: size))
  }

  func testCompactChartsRequireACompleteAxisGutterBeforeDrawingLabels() {
    let measurements = NativeChartAxisMeasurements(leftWidth: 32, bottomWidth: 12, lineHeight: 16)
    let compact = NativeChartLayout(size: CGSize(width: 100, height: 180), measurements: measurements)
    XCTAssertFalse(compact.showsLeftLabels, "A table preview must not display partial axis digits")
    XCTAssertGreaterThanOrEqual(compact.rect.width, 80, "Keep the data plot usable in the compact preview")
    let expanded = NativeChartLayout(size: CGSize(width: 240, height: 180), measurements: measurements)
    XCTAssertTrue(expanded.showsLeftLabels)
    let longLabels = NativeChartAxisMeasurements(leftWidth: 88, bottomWidth: 12, lineHeight: 16)
    XCTAssertFalse(NativeChartLayout(size: CGSize(width: 170, height: 180), measurements: longLabels).showsLeftLabels)
    XCTAssertTrue(NativeChartLayout(size: CGSize(width: 240, height: 180), measurements: longLabels).showsLeftLabels)
  }

  func testChartLayoutPreservesRegularProjectionAndSeparatesLargeTypeAxes() {
    let regular = NativeChartLayout(size: CGSize(width: 300, height: 250))
    XCTAssertEqual(regular.rect, CGRect(x: 44, y: 18, width: 244, height: 192))
    let size = CGSize(width: 320, height: 250)
    let large = NativeChartLayout(size: size, scale: 2,
      measurements: .init(leftWidth: 110, bottomWidth: 90, lineHeight: 34))
    XCTAssertGreaterThanOrEqual(large.rect.minX, 110 + 16,
      "A measured negative/scientific tick needs room in addition to the axis gap")
    let tickBottom = large.rect.maxY + large.tickOffset + large.lineHeight / 2
    let titleTop = size.height - 2 * large.scale - large.lineHeight
    XCTAssertLessThanOrEqual(tickBottom + 4, titleTop,
      "Category ticks and the axis title occupy separate bands at larger text sizes")
    XCTAssertTrue(large.showsBottomLabels)
    let short = NativeChartLayout(size: CGSize(width: 240, height: 100), scale: 3,
      measurements: .init(leftWidth: 110, bottomWidth: 90, lineHeight: 48))
    XCTAssertFalse(short.showsBottomLabels,
      "Explicitly short charts omit crowded axis labels instead of overlapping; VoiceOver retains the data")
    XCTAssertGreaterThan(short.rect.width, 0)
    XCTAssertGreaterThan(short.rect.height, 0)
  }

  @MainActor func testScatterUsesMeasuredLargeTypePlotForDrawingAndInspection() throws {
    var drawing = try chart(
      "root=ScatterChart([ScatterSeries(\"Alpha\",[Point(-2,3),Point(4,-1)]),ScatterSeries(\"Beta\",[Point(1,2),Point(3,5)])])",
      name: "ScatterChart")
    drawing.axisScale = 2
    drawing.axisMeasurements = .init(leftWidth: 110, bottomWidth: 90, lineHeight: 34)
    let size = CGSize(width: 320, height: 250)
    let projection = NativeScatterProjection(data: drawing.data, layout: drawing.layout(size))
    XCTAssertEqual(projection.points[0].position.x, 126)
    for point in projection.points {
      XCTAssertEqual(drawing.inspectionIndex(at: point.position, size: size), point.rowIndex)
    }
    XCTAssertNil(drawing.inspectionIndex(at: CGPoint(x: 44, y: 82), size: size),
      "The regular-size coordinate must not remain an invisible touch target")
    let abbreviated = try chart(
      "root=BarChart([\"A\"],[Series(\"Count\",[-100000])])", name: "BarChart")
    XCTAssertTrue(abbreviated.axisLabels.left.contains("-100K"),
      "Upstream numberTickFormatter abbreviates thousands with K, including negative values")
  }


  func testSparseCategoryLabelsUseSkippedTickSpaceAndKeepEndpoints() throws {
    let layout = NativeChartLayout(size: CGSize(width: 300, height: 250), scale: 2,
      measurements: .init(leftWidth: 50, bottomWidth: 72, lineHeight: 32))
    let labels = layout.categoryLabels(count: 5)
    XCTAssertEqual(labels.map(\.index), [0, 4])
    let first = try XCTUnwrap(labels.first)
    let last = try XCTUnwrap(labels.last)
    XCTAssertEqual(first.anchor, .leading)
    XCTAssertEqual(last.anchor, .trailing)
    XCTAssertEqual(first.x, layout.rect.minX)
    XCTAssertEqual(last.x, layout.rect.maxX)
    XCTAssertGreaterThanOrEqual(first.width, 72,
      "The first label can use space freed by skipped ticks instead of being limited to one bar group")
    XCTAssertGreaterThanOrEqual(last.width, 72)
    XCTAssertLessThanOrEqual(first.x + first.width, last.x - last.width,
      "Allocated label regions never overlap")
  }

  func testNarrowCategoryAxisKeepsACompleteLabelWithoutMovingData() throws {
    let layout = NativeChartLayout(size: CGSize(width: 240, height: 250), scale: 2,
      measurements: .init(leftWidth: 50, bottomWidth: 72, lineHeight: 32))
    let labels = layout.categoryLabels(count: 5)
    XCTAssertEqual(labels.map(\.index), [0])
    XCTAssertEqual(try XCTUnwrap(labels.first).anchor, .leading)
    XCTAssertGreaterThanOrEqual(try XCTUnwrap(labels.first).width, 72)
    XCTAssertEqual(layout.rect, CGRect(x: 88, y: 36, width: 128, height: 134),
      "Only label placement changes; the plotted geometry and hit coordinates remain the same")
  }




}
