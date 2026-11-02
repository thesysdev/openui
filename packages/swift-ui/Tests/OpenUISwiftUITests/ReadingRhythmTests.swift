#if os(macOS)
import AppKit
import OpenUILang
import SwiftUI
import XCTest
@testable import OpenUISwiftUI

final class ReadingRhythmTests: XCTestCase {
  @MainActor private func height(_ source: String, theme: OpenUIThemeValues = OpenUIThemeValues(),
    presentation: OpenUIPresentation = OpenUIPresentation()) throws -> CGFloat {
    _ = NSApplication.shared
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource(source)
    XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    return NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
      .openUITheme(theme).environment(\.openUIPresentation, presentation)
      .frame(width: 350)).fittingSize.height
  }

  @MainActor func testPlainEntityValuesDoNotInheritNumericEmphasisOverrides() throws {
    let plain = "root=EntityList([{left:\"Scope\",right:\"A readable sentence\",rightVariant:\"text\"}])"
    let numeric = "root=EntityList([{left:\"Total\",right:\"1234.50\",rightVariant:\"number\"}])"
    var theme = OpenUIThemeValues()
    theme.textBodyDefaultHeavy = OpenUIFont(size: 40, weight: .bold)
    XCTAssertEqual(try height(plain, theme: theme), try height(plain), accuracy: 1,
      "A theme's numeric emphasis must not turn ordinary explanations into display text")
    XCTAssertGreaterThan(try height(numeric, theme: theme), try height(numeric) + 15)
  }

  @MainActor func testReadOnlyRowsUseTheirCompactSpacingRole() throws {
    let source = "root=EntityList([{left:\"One\",right:\"First\"},{left:\"Two\",right:\"Second\"}])"
    var theme = OpenUIThemeValues()
    theme.spaceS = 26
    XCTAssertGreaterThan(try height(source, theme: theme), try height(source) + 50,
      "Read-only row spacing uses spaceS; spaceM remains the column and group gap")
  }

  @MainActor func testWrappedTextValuesReadFromTheLeadingEdge() throws {
    _ = NSApplication.shared
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    let value = "这是一段较长的范围说明，用于让字段值在手机宽度下自然换行。\nEND"
    let literal = try XCTUnwrap(String(data: JSONEncoder().encode(value), encoding: .utf8))
    state.setSource("root=EntityList([{left:\"范围\",right:\(literal)}])")
    XCTAssertTrue(state.errors.isEmpty)
    var theme = OpenUIThemeValues()
    theme.textNeutralPrimary = .black
    let host = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
      .openUITheme(theme)
      .frame(width: 300).padding(10).background(Color.white))
    host.frame = CGRect(origin: .zero, size: host.fittingSize)
    host.layoutSubtreeIfNeeded()
    let bitmap = try XCTUnwrap(host.bitmapImageRepForCachingDisplay(in: host.bounds))
    host.cacheDisplay(in: host.bounds, to: bitmap)
    let scale = CGFloat(bitmap.pixelsWide) / host.bounds.width
    var bands: [(first: Int, last: Int, left: Int)] = []
    for y in 0..<bitmap.pixelsHigh {
      let ink = (0..<bitmap.pixelsWide).filter { x in
        guard let c = bitmap.colorAt(x: x, y: y)?.usingColorSpace(.deviceRGB) else { return false }
        return c.alphaComponent > 0.8 && max(c.redComponent, c.greenComponent, c.blueComponent) < 0.4
      }
      guard ink.count >= 2, let left = ink.first else { continue }
      if let last = bands.last, y - last.last <= 2 {
        bands[bands.count - 1] = (last.first, y, min(last.left, left))
      } else { bands.append((y, y, left)) }
    }
    let lines = bands.filter { CGFloat($0.last - $0.first + 1) >= 6 * scale }
    XCTAssertGreaterThanOrEqual(lines.count, 3, "The rendered fixture must contain wrapped text and a short final line")
    for line in lines {
      XCTAssertLessThan(CGFloat(line.left) / scale, 18,
        "A stacked text value, including its short last line, must start at the leading edge")
    }
  }

  @MainActor func testSingleStackedBarUsesAnIntrinsicCompactPlot() throws {
    let source = "root=SingleStackedBarChart([\"Morning\",\"Afternoon\"],[30,70])"
    XCTAssertLessThan(try height(source), 110,
      "A single distribution strip plus one legend line should not reserve a full plot")
    XCTAssertGreaterThan(try height("root=BarChart([\"A\",\"B\"],[Series(\"Visitors\",[30,70])])"), 200,
      "Charts with axes retain their ordinary plotting area")
  }

  @MainActor func testCodeCopyHonorsTheExistingPlatformHitTargetPolicy() throws {
    let source = "root=CodeBlock(\"let city = 1\",\"swift\")"
    var presentation = OpenUIPresentation()
    presentation.minimumControlTargetSize = 80
    XCTAssertGreaterThan(try height(source, presentation: presentation), try height(source) + 25,
      "The copy control must use the same platform policy as other native controls")
  }
}
#endif

