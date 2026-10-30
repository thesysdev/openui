#if os(macOS)
import AppKit
import OpenUILang
import SwiftUI
import XCTest
@testable import OpenUISwiftUI

final class AdaptivePresentationTests: XCTestCase {
  @MainActor func testButtonsKeepTheirNativeControlsAcrossRowAndColumnPlacement() throws {
    _ = NSApplication.shared
    let standard = try OpenUIStandardComponents.library()
    let button = try XCTUnwrap(standard.library.components.first { $0.name == "Button" })
    let library = try standard.extending(overriding: [OpenUIComponent(button) { _ in
      AdaptiveControlProbe().frame(width: 130, height: 44)
    }])
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("root=Buttons([Button(\"First\"),Button(\"Second\")])")
    let width = AdaptiveWidth()
    let hosting = NSHostingView(rootView: AdaptiveFixture(width: width) {
      OpenUIRenderer(state: state, registry: library.registry)
    })
    try inWindow(hosting) {
      let original = controls(hosting)
      XCTAssertEqual(original.count, 2, "Only the real controls may mount, not an alternate layout copy")
      for value in [180, 600, 220, 600] as [CGFloat] {
        width.value = value; settle(hosting)
        let current = controls(hosting)
        XCTAssertEqual(current.count, 2)
        XCTAssertEqual(Set(current.map(ObjectIdentifier.init)), Set(original.map(ObjectIdentifier.init)),
          "A responsive placement change must keep the same native controls")
        let points = current.map { $0.convert(CGPoint.zero, to: hosting) }
        if points.count == 2 {
          XCTAssertEqual(abs(points[0].y - points[1].y) < 1, value > 272,
            "The two complete 130pt actions fit in one row only when there is sufficient room")
        }
      }
    }
  }

  @MainActor func testLongOptionCopyGetsAReadingColumnWithoutDuplicatingItsMedia() throws {
    _ = NSApplication.shared
    let standard = try OpenUIStandardComponents.library()
    let icon = try XCTUnwrap(standard.library.components.first { $0.name == "Icon" })
    let library = try standard.extending(overriding: [OpenUIComponent(icon) { _ in
      AdaptiveControlProbe().frame(width: 20, height: 20)
    }])
    let state = OpenUIState(schema: library.library.toSchema())
    let long = String(repeating: "A complete recommendation with a useful reason. ", count: 4)
    let literal = String(decoding: try JSONEncoder().encode(long), as: UTF8.self)
    state.setSource("root=OptionCards(\"choice\",\"single\",[OptionCard(\"a\",\"First\",\(literal),Icon(\"train\")),OptionCard(\"b\",\"Second\",null,Icon(\"train\")),OptionCard(\"c\",\"Third\",null,Icon(\"train\"))])")
    XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    let width = AdaptiveWidth(); width.value = 320
    let hosting = NSHostingView(rootView: AdaptiveFixture(width: width) {
      OpenUIRenderer(state: state, registry: library.registry)
    })
    try inWindow(hosting) {
      let original = controls(hosting)
      XCTAssertEqual(original.count, 3, "Density probes must never load topContent again")
      let points = original.map { $0.convert(CGPoint.zero, to: hosting) }
      XCTAssertEqual(Set(points.map { Int($0.x.rounded()) }).count, 1,
        "A long explanation needs a full reading column instead of two narrow cards with a stretched empty peer")
      XCTAssertEqual(Set(points.map { Int($0.y.rounded()) }).count, 3)
      for value in [800, 280, 600, 320] as [CGFloat] {
        width.value = value; settle(hosting)
        XCTAssertEqual(Set(controls(hosting).map(ObjectIdentifier.init)), Set(original.map(ObjectIdentifier.init)))
      }
    }
  }

  #if !SDK_DENSITY_BASELINE
  #if !SDK_CHART_NO_HEIGHT_TEST
  func testDefaultChartHeightKeepsTheDataPlotReadableAtLargerTextSizes() {
    let regularHeight = NativeChartHeight.value(explicit: nil, defaultHeight: 250, scale: 1)
    let largerHeight = NativeChartHeight.value(explicit: nil, defaultHeight: 250, scale: 2)
    let regular = NativeChartLayout(size: CGSize(width: 400, height: regularHeight),
      measurements: .init(leftWidth: 20, bottomWidth: 25, lineHeight: 18))
    let larger = NativeChartLayout(size: CGSize(width: 400, height: largerHeight), scale: 2,
      measurements: .init(leftWidth: 40, bottomWidth: 50, lineHeight: 36))
    XCTAssertGreaterThanOrEqual(larger.rect.height, regular.rect.height,
      "Larger labels must not consume the space required to read the data")
    XCTAssertEqual(NativeChartHeight.value(explicit: 180, defaultHeight: 250, scale: 2), 180,
      "An authored height remains authoritative")
  }

  #endif

  @MainActor func testShortCategoryLabelsDoNotReserveAnUnneededSecondLine() throws {
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("root=BarChart([\"Aug\",\"Sep\",\"Oct\"],[Series(\"Count\",[4,7,5])])")
    var drawing = NativeChartDrawing(data: NativeChartData(context: .init(element: try XCTUnwrap(state.root),
      registry: library.registry, state: state)), name: "BarChart", variant: nil, semi: false,
      palette: [.blue], secondary: .gray, border: .gray)
    drawing.axisMeasurements = .init(leftWidth: 20, bottomWidth: 25, lineHeight: 18)
    let layout = drawing.layout(CGSize(width: 320, height: 250))
    XCTAssertEqual(layout.categoryLabelLines, 1,
      "Short month names need no extra blank band between the axis and legend")
    XCTAssertEqual(layout.categoryLabels(count: 3).map(\.index), [0,1,2])
  }

  @MainActor func testBalancedLegendKeepsTwoRowsAndCompleteTouchTargetsInBothDirections() throws {
    _ = NSApplication.shared
    for rtl in [false, true] {
      let hosting = NSHostingView(rootView: NativeChartLegendLayout(rightToLeft: rtl) {
        ForEach(0..<4) { _ in AdaptiveControlProbe().frame(minWidth: 80, minHeight: 44) }
      }.frame(width: 300))
      try inWindow(hosting) {
        let current = controls(hosting)
        XCTAssertEqual(current.count, 4)
        let frames = current.map { $0.convert($0.bounds, to: hosting) }
        let rows = Dictionary(grouping: frames, by: { Int($0.minY.rounded()) })
        XCTAssertEqual(rows.count, 2)
        XCTAssertTrue(rows.values.allSatisfy { $0.count == 2 }, "Four legend entries should balance as 2 + 2")
        XCTAssertTrue(frames.allSatisfy { $0.height >= 44 && $0.width >= 80 })
        for row in rows.values {
          let sorted = row.sorted { $0.minX < $1.minX }
          XCTAssertGreaterThanOrEqual(sorted[1].minX - sorted[0].maxX, 15.5)
        }
        if frames.count == 4 { XCTAssertEqual(frames[0].minX > frames[1].minX, rtl) }
      }
    }
  }

  @MainActor func testFewLongChartCategoriesWrapBeforeOmittingTheMiddleCategory() throws {
    _ = NSApplication.shared
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("root=BarChart([\"A complete first category\",\"A useful middle category\",\"The final category\"],[Series(\"Count\",[4,7,5])])")
    var drawing = NativeChartDrawing(data: NativeChartData(context: .init(element: try XCTUnwrap(state.root),
      registry: library.registry, state: state)), name: "BarChart", variant: nil, semi: false,
      palette: [.blue], secondary: .gray, border: .gray)
    drawing.axisMeasurements = .init(leftWidth: 20, bottomWidth: 140, lineHeight: 18)
    let layout = drawing.layout(CGSize(width: 320, height: 250))
    XCTAssertEqual(layout.categoryLabelLines, 2)
    XCTAssertEqual(layout.categoryLabels(count: 3).map(\.index), [0,1,2])
    let textBottom = layout.rect.maxY + 6 * layout.scale + 2 * layout.lineHeight
    let titleTop = CGFloat(250) - 2 * layout.scale - layout.lineHeight
    XCTAssertLessThanOrEqual(textBottom + 4, titleTop, "Two label lines must not collide with the axis title")
    let frames = layout.categoryLabels(count: 3).map {
      CGRect(x: $0.x - $0.width * $0.anchor.x, y: 0, width: $0.width, height: 1)
    }
    XCTAssertTrue(zip(frames, frames.dropFirst()).allSatisfy { $0.maxX <= $1.minX + 0.5 })
    drawing.axisScale = 3
    drawing.axisMeasurements = .init(leftWidth: 80, bottomWidth: 220, lineHeight: 54)
    XCTAssertFalse(drawing.layout(CGSize(width: 240, height: 100)).showsBottomLabels,
      "Explicitly short large-type previews must still avoid overlapping labels")
  }
  #endif

  @MainActor private func controls(_ view: NSView) -> [AdaptiveControlView] {
    (view as? AdaptiveControlView).map { [$0] } ?? view.subviews.flatMap(controls)
  }
  @MainActor private func settle<V: View>(_ hosting: NSHostingView<V>) {
    hosting.layoutSubtreeIfNeeded(); RunLoop.main.run(until: Date().addingTimeInterval(0.2))
  }
  @MainActor private func inWindow<V: View>(_ hosting: NSHostingView<V>, check: () throws -> Void) throws {
    _ = NSApplication.shared
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 900, height: 1100),
      styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false; window.contentView = hosting
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
    defer { window.close() }
    settle(hosting); try check()
  }
}
@MainActor private final class AdaptiveWidth: ObservableObject { @Published var value: CGFloat = 600 }
private struct AdaptiveFixture<Content: View>: View {
  @ObservedObject var width: AdaptiveWidth
  @ViewBuilder let content: Content
  var body: some View { content.frame(width: width.value) }
}
private final class AdaptiveControlView: NSView {}
private struct AdaptiveControlProbe: NSViewRepresentable {
  func makeNSView(context: Context) -> AdaptiveControlView { AdaptiveControlView() }
  func updateNSView(_ view: AdaptiveControlView, context: Context) {}
}
#endif
