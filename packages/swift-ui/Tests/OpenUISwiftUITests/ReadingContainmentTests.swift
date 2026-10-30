import OpenUILang
import SwiftUI
import XCTest
@testable import OpenUISwiftUI
#if os(macOS)
import AppKit
#endif

final class ReadingContainmentTests: XCTestCase {
  func testRadarInspectionUsesThePaintedProjectionAtDifferentReadingScales() {
    for size in [CGSize(width: 240, height: 540), CGSize(width: 744, height: 250)] {
      for scale in [CGFloat(1), 2.35] {
        for count in [3, 5, 8, 20] {
          let geometry = NativeRadarGeometry(size: size, scale: scale)
          var data = NativeChartData()
          data.labels = (0..<count).map { "Full category \($0 + 1)" }
          data.series = [.init(name: "A", values: Array(repeating: 10, count: count))]
          let drawing = NativeChartDrawing(data: data, name: "RadarChart", variant: nil,
            semi: false, palette: [.blue], secondary: .gray, border: .gray, axisScale: scale)
          for index in 0..<count {
            let point = geometry.point(index: index, count: count, fraction: 0.8)
            XCTAssertEqual(drawing.inspectionIndex(at: point, size: size), index)
          }
          let labels = geometry.labelIndices(count: count)
          XCTAssertFalse(labels.isEmpty)
          let bounds = CGRect(origin: .zero, size: size)
          let points = labels.map { geometry.point(index: $0, count: count, fraction: 1.12) }
          XCTAssertTrue(points.allSatisfy(bounds.contains))
          for i in points.indices {
            for j in points.indices where j > i {
              XCTAssertGreaterThan(hypot(points[i].x - points[j].x, points[i].y - points[j].y), 16 * scale,
                "Numbered radial labels must not compete for the same drawing slot")
            }
          }
        }
      }
    }
  }

  #if os(macOS)
  @MainActor func testIconButtonsKeepEqualVisibleAxesAtEveryDeclaredDensity() throws {
    _ = NSApplication.shared
    let library = try OpenUIStandardComponents.library()
    for size in ["extra-small", "small", "medium", "large"] {
      for shape in ["circle", "square"] {
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("root=IconButton(\"Info\",Icon(\"info\"),@OpenUrl(\"https://example.invalid/info\"),\"secondary\",\"\(size)\",\"\(shape)\")")
        XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
        let measured = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry).fixedSize()).fittingSize
        XCTAssertGreaterThanOrEqual(measured.height, OpenUITheme().minimumControlTargetSize)
        XCTAssertEqual(measured.width, measured.height, accuracy: 1,
          "An icon-only \(shape) control must not inherit a text button's wide horizontal inset")
      }
    }
  }

  @MainActor func testBoundedTabLabelReportsItsWrappedHeightBeforeScrollerPlacement() {
    _ = NSApplication.shared
    func measured(_ text: String) -> CGSize {
      NSHostingView(rootView: NativeBoundedLabelLayout(maximumWidth: 232) {
        Text(text).font(.system(size: 40)).lineSpacing(8)
          .fixedSize(horizontal: false, vertical: true)
      }).fittingSize
    }
    let short = measured("Day 1"), long = measured("Practical information")
    XCTAssertLessThanOrEqual(long.width, 232)
    XCTAssertGreaterThan(long.height, short.height + 30,
      "The row must reserve the second line before a horizontal scroller places it")
    XCTAssertLessThan(short.width, long.width, "Short tabs retain their natural reading width")
    func scrollerHeight(_ text: String) -> CGFloat {
      NSHostingView(rootView: VStack {
        ScrollView(.horizontal) {
          HStack {
            NativeBoundedLabelLayout(maximumWidth: 232) {
              Text(text).font(.system(size: 40)).lineSpacing(8)
                .fixedSize(horizontal: false, vertical: true)
            }.padding(.vertical, 8)
          }
        }
        Text("Body").font(.system(size: 40))
      }.frame(width: 240)).fittingSize.height
    }
    XCTAssertGreaterThan(scrollerHeight("Practical information"), scrollerHeight("Day 1") + 30,
      "The complete reading height must propagate through the real horizontal scroller")
  }

  @MainActor func testSnippetMovesAnUncompressedAmountBelowCopyWhenTheRowCannotFit() throws {
    _ = NSApplication.shared
    let standard = try OpenUIStandardComponents.library()
    let copyDef = try XCTUnwrap(standard.library.components.first { $0.name == "Text" })
    let amountDef = try XCTUnwrap(standard.library.components.first { $0.name == "BoldText" })
    let frames = ReadingFrames()
    let library = try standard.extending(overriding: [
      OpenUIComponent(copyDef) { _ in
        Color.clear.frame(width: 160, height: 40).background(GeometryReader { g in
          Color.clear.onAppear { frames.copy = g.frame(in: .named("reading")) }
            .onChange(of: g.frame(in: .named("reading"))) { frames.copy = $0 }
        })
      },
      OpenUIComponent(amountDef) { _ in
        Color.clear.frame(width: 120, height: 40).background(GeometryReader { g in
          Color.clear.onAppear { frames.amount = g.frame(in: .named("reading")) }
            .onChange(of: g.frame(in: .named("reading"))) { frames.amount = $0 }
        })
      }
    ])
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("root=SnippetCardItem(\"a\",Text(\"text\",\"A fact\"),BoldText(\"number\",\"¥12345\"))")
    XCTAssertTrue(state.errors.isEmpty)
    let host = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
      .frame(width: 240).coordinateSpace(name: "reading"))
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 300, height: 300), styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false; window.contentView = host
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
    defer { window.close() }
    host.layoutSubtreeIfNeeded(); RunLoop.main.run(until: Date().addingTimeInterval(0.2))
    XCTAssertGreaterThanOrEqual(frames.amount.minY, frames.copy.maxY,
      "Do not force a number into a remaining sliver of the original row")
    XCTAssertEqual(frames.amount.width, 120, accuracy: 1)
    XCTAssertLessThanOrEqual(frames.amount.maxX, 240)
  }

  @MainActor func testLongMetricUsesOneReadingLineWithoutChangingItsValue() {
    _ = NSApplication.shared
    let theme = OpenUITheme()
    func height(_ text: String) -> CGFloat {
      NSHostingView(rootView: NativeMetricValue(text: text, font: theme.typography.metric, theme: theme)
        .openUITheme(theme).frame(width: 120)).fittingSize.height
    }
    let short = height("¥528"), long = height("¥123,456,789,012.00")
    XCTAssertGreaterThan(short, 0)
    XCTAssertLessThanOrEqual(long, short * 1.5,
      "A long amount must scroll as one intact reading value, not grow decimal fragments on new lines")
  }
  #endif
}
#if os(macOS)
@MainActor private final class ReadingFrames {
  var copy = CGRect.zero
  var amount = CGRect.zero
}
#endif
