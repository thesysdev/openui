import OpenUILang
import SwiftUI
import XCTest
@testable import OpenUISwiftUI

final class FullLibraryParityTests: XCTestCase {
  func testTickAndTooltipNumbersFollowUpstreamFormatting() {
    for (value, expected) in [(0.0, "0"), (950, "950"), (1000, "1.0K"), (9500, "9.5K"),
      (12000, "12K"), (1_000_000, "1.0M"), (2_500_000_000, "2.5B"), (-1500, "-1.5K"),
      (1.234, "1.23"), (12_500, "13K")] {
      XCTAssertEqual(NativeChartNumber.tick(value), expected)
    }
    XCTAssertEqual(NativeChartNumber.tooltip(12345.5, locale: Locale(identifier: "en_US")), "12,345.5")
    XCTAssertEqual(NativeChartNumber.tooltip(123456, locale: Locale(identifier: "en_US")), "123.4K")
    XCTAssertEqual(NativeChartNumber.tooltip(-2_555_555, locale: Locale(identifier: "en_US")), "-2.5M")
  }

  func testChartScaleUsesReadableTicksWithoutChangingObservedValues() {
    let positive = NativeChartScale(low: 0, high: 25)
    XCTAssertEqual(positive.ticks, [0, 10, 20, 30])
    XCTAssertEqual(positive.high, 30)
    XCTAssertEqual(NativeChartScale(low: -3, high: 25).ticks, [-10, 0, 10, 20, 30])
    XCTAssertEqual(NativeChartScale(low: 0, high: 1).ticks, [0, 0.25, 0.5, 0.75, 1])
    let extreme = NativeChartScale(low: 0, high: Double.greatestFiniteMagnitude)
    XCTAssertTrue(extreme.low.isFinite)
    XCTAssertTrue(extreme.high.isFinite)
  }

  func testLegendKeepsOneCurrentSeriesAndRetainsHiddenKeysAcrossDataChanges() {
    var visibility = NativeChartVisibility()
    visibility.toggle("a", current: ["a", "b", "c"])
    visibility.toggle("b", current: ["a", "b", "c"])
    visibility.toggle("c", current: ["a", "b", "c"])
    XCTAssertEqual(visibility.hidden, Set(["a", "b"]))
    visibility.toggle("c", current: ["c", "d"])
    XCTAssertTrue(visibility.hidden.contains("c"), "Old hidden keys must not block hiding a current series")
    visibility.toggle("a", current: ["a", "d"])
    XCTAssertFalse(visibility.hidden.contains("a"))
  }

  @MainActor func testPolarSortingFilteringColorsAndTabularQueryData() throws {
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("root=PieChart([\"Small\",\"Large\",\"Mid\"],[1,10,5],\"donut\")")
    let context = OpenUIComponentContext(element: try XCTUnwrap(state.root), registry: library.registry, state: state)
    let prepared = NativeChartData(context: context).prepared(for: "PieChart")
    XCTAssertEqual(prepared.labels, ["Large", "Mid", "Small"])
    let visible = prepared.excluding(Set(["Large"]), for: "PieChart")
    XCTAssertEqual(visible.labels, ["Mid", "Small"])
    XCTAssertEqual(visible.slices, [5, 1])
    XCTAssertEqual(visible.colorIndices, [2, 0], "Mid and Small retain their input category colors after sorting and toggling")
    let table = EvaluatedElement(typeName: "BarChart", props: [
      ("labels", .array([.string("day"), .string("2026"), .string("2025")])),
      ("series", .array([.array([.string("Mon"), .string("12.5"), .number(8)]),
        .array([.string("Tue"), .number(20), .number(10)])])),
    ])
    let data = NativeChartData(context: .init(element: table, registry: library.registry, state: state))
    XCTAssertEqual(data.labels, ["Mon", "Tue"])
    XCTAssertEqual(data.series.map(\.name), ["2025", "2026"])
    XCTAssertEqual(data.series[1].values, [12.5, 20])
  }

  func testPolarInspectionSelectsPaintedSegmentsAndIgnoresDonutHoles() {
    let size = CGSize(width: 300, height: 250)
    XCTAssertEqual(NativePolarInspection.index(at: CGPoint(x: 230, y: 125), size: size,
      values: [90, 10], name: "PieChart", donut: false, semi: false), 0)
    XCTAssertEqual(NativePolarInspection.index(at: CGPoint(x: 123, y: 50), size: size,
      values: [90, 10], name: "PieChart", donut: false, semi: false), 1)
    XCTAssertNil(NativePolarInspection.index(at: CGPoint(x: 150, y: 125), size: size,
      values: [90, 10], name: "PieChart", donut: true, semi: false))
    XCTAssertEqual(NativePolarInspection.index(at: CGPoint(x: 200, y: 125), size: size,
      values: [9, 1], name: "SingleStackedBarChart", donut: false, semi: false), 0)
    XCTAssertEqual(NativePolarInspection.index(at: CGPoint(x: 290, y: 125), size: size,
      values: [9, 1], name: "SingleStackedBarChart", donut: false, semi: false), 1)
  }

  @MainActor func testModalPresentationWritesDuringStreamingButRejectsReplacedSources() throws {
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    let source = "$open=true\nroot=Modal(\"Details\",$open,[TextContent(\"Body\")])"
    state.setSource(source, streaming: true)
    let context = OpenUIComponentContext(element: try XCTUnwrap(state.root), registry: library.registry, state: state)
    XCTAssertFalse(context.canInteract)
    let binding = try XCTUnwrap(context.presentationBinding("open"))
    binding.wrappedValue = .boolean(false)
    XCTAssertEqual(state.stateValue("$open"), .boolean(false))
    state.reset(); state.setSource(source)
    binding.wrappedValue = .boolean(false)
    XCTAssertEqual(state.stateValue("$open"), .boolean(true), "Old presentations must not write into a replacement")
    context.setPresentationFieldValue("open", value: .boolean(false))
    XCTAssertNil(state.snapshotState()["open"])
  }

  @MainActor func testQueryLoadingIncludesQueriesWaitingForStreamCompletion() throws {
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("data=Query(\"fixture\",{},[])\nroot=Table([Col(\"Data\",data)])", streaming: true)
    XCTAssertTrue(state.isQueryLoading)
    let context = OpenUIComponentContext(element: try XCTUnwrap(state.root), registry: library.registry, state: state)
    XCTAssertTrue(context.isQueryLoading)
    state.reset()
    XCTAssertFalse(state.isQueryLoading)
  }

  func testSliderStepPrecisionAndValidationFollowItsDeclaredContract() {
    let continuous = NativeSliderConfiguration(minimum: 0, maximum: 100, step: 5, discrete: false)
    XCTAssertEqual(continuous.snapped(12), 10)
    let fractional = NativeSliderConfiguration(minimum: -1, maximum: 2, step: 0.25, discrete: true)
    XCTAssertEqual(fractional.snapped(0.37), 0.25)
    XCTAssertEqual(fractional.snapped(99), 2)
    XCTAssertEqual(continuous.error(for: [80, 20], index: 0), "Min must be less than max")
    XCTAssertNotNil(continuous.error(for: [-1], index: 0))
    let tiny = NativeSliderConfiguration(minimum: 0, maximum: 100, step: .leastNonzeroMagnitude, discrete: true)
    XCTAssertTrue(tiny.lastIndex.isFinite)
    XCTAssertTrue(tiny.snapped(50).isFinite)
  }

  @MainActor func testSliderCoalescesEditsAndFlushesTheLastPendingValue() {
    let done = expectation(description: "Debounced slider writes")
    Task { @MainActor in
      defer { done.fulfill() }
      let draft = NativeSliderDraft()
      var writes: [[Double]] = []
      draft.commit = { writes.append($0) }
      draft.receive([10, 50])
      draft.edit("12", at: 0); draft.edit("18", at: 0); draft.edit("20", at: 0)
      XCTAssertTrue(writes.isEmpty)
      try? await Task.sleep(nanoseconds: 350_000_000)
      XCTAssertEqual(writes, [[20, 50]])
      draft.select(60, at: 0)
      draft.flush()
      XCTAssertEqual(writes.last, [50, 60])
      try? await Task.sleep(nanoseconds: 250_000_000)
      XCTAssertEqual(writes.count, 2)
    }
    waitForExpectations(timeout: 3)
  }

  func testRichTextUsesUpstreamCitationRulesAndKeepsCodeLiteral() throws {
    let sources = [CardSource(url: "https://example.com", title: "One", sourceName: "Publisher"),
      CardSource(title: "Missing source name", sourceName: " ")]
    let output = try NativeRichTextEngine.shared.prepare("A claim [1][2] and unknown [99]. Code `[1]`.", mode: .textContent, sources: sources)
    XCTAssertTrue(output.contains("openui-citation://sources/1"))
    XCTAssertFalse(output.contains("sources/1,2"))
    XCTAssertFalse(output.contains("99"))
    XCTAssertTrue(output.contains("`[1]`"))
    let noSources = try NativeRichTextEngine.shared.prepare("Claim [1].", mode: .textContent, sources: [])
    XCTAssertFalse(noSources.contains("[1]"))
    let inline = try NativeRichTextEngine.shared.prepare("# Heading\n\n- First\n- Second", mode: .inline, sources: [])
    XCTAssertTrue(inline.contains("Heading")); XCTAssertFalse(inline.contains("# Heading"))
  }

  func testRichTextMathUsesDoubleDollarAndOfflineKaTeXWithoutEvaluatingInput() throws {
    let output = try NativeRichTextEngine.shared.prepare("Price $25. Formula $$x^2$$.\n\n$$\\frac{a}{b}$$", mode: .textContent, sources: [])
    XCTAssertTrue(output.contains("$25"))
    XCTAssertTrue(output.contains("openui-math://equation"))
    let html = try NativeRichTextEngine.shared.mathHTML(.init(tex: "\\frac{a}{b}", display: true))
    XCTAssertTrue(html.contains("katex")); XCTAssertTrue(html.contains("mfrac")); XCTAssertFalse(html.contains("katex-error"))
    let unsafe = try NativeRichTextEngine.shared.mathHTML(.init(tex: "\\href{javascript:alert(1)}{x}", display: false))
    XCTAssertFalse(unsafe.contains("href=\"javascript:"))
    XCTAssertNil(NativeRichTextEngine.shared.sourceURL("java\tscript:alert(1)"))
    XCTAssertEqual(NativeRichTextEngine.shared.sourceURL(" https://example.com/path "), "https://example.com/path")
  }
}
