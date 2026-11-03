#if os(macOS)
import AppKit
import OpenUILang
import SwiftUI
import XCTest
@testable import OpenUISwiftUI

final class ReadingRhythmTests: XCTestCase {
  @MainActor func testCompositeSideMediaKeepsBodyAndFooterInTheCopyColumn() throws {
    _ = NSApplication.shared
    let standard = try OpenUIStandardComponents.library()
    let frames = OverviewSlotFrames()
    func tracked<Content: View>(_ name: String, @ViewBuilder _ content: () -> Content) -> some View {
      content().background(GeometryReader { geometry in
        Color.clear.onAppear { frames.values[name] = geometry.frame(in: .named("composite")) }
          .onChange(of: geometry.frame(in: .named("composite"))) { frames.values[name] = $0 }
      })
    }
    let image = try XCTUnwrap(standard.library.components.first { $0.name == "ImageText" })
    let text = try XCTUnwrap(standard.library.components.first { $0.name == "Text" })
    let bold = try XCTUnwrap(standard.library.components.first { $0.name == "BoldText" })
    let button = try XCTUnwrap(standard.library.components.first { $0.name == "Button" })
    for overriddenHeader in [false, true] {
      let library = try standard.extending(overriding: [
        OpenUIComponent(image) { context in
          tracked("header") {
            if overriddenHeader { SwiftUI.Text("Custom heading") }
            else { NativeMediaText(context: context, media: .thumbnail) }
          }
        },
        OpenUIComponent(text) { context in tracked("body") { NativeInlineText(context: context, bold: false) } },
        OpenUIComponent(bold) { context in tracked("price") { NativeInlineText(context: context, bold: true) } },
        OpenUIComponent(button) { context in tracked("button") { OpenUINativeButton(context: context) } }
      ])
      for width in [CGFloat(300), 344] {
        frames.values = [:]
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("root=CompositeCardBlock([CompositeCardItem(\"a\",ImageText(\"photo.jpg\",\"Photo\",\"Title\",\"Subtitle\",true),[Text(\"text\",\"Description\")],{price:BoldText(\"number\",\"¥238\"),button:Button(\"View\",@ToAssistant(\"View\"),\"secondary\")}),CompositeCardItem(\"b\",null,[])])")
        XCTAssertTrue(state.errors.isEmpty)
        let element = try XCTUnwrap(PropValue.children(try XCTUnwrap(state.root), "items").first)
        let context = OpenUIComponentContext(element: element, registry: library.registry, state: state)
        let host = NSHostingView(rootView: NativeCardItem(context: context, kind: "Composite")
          .environmentObject(state).frame(width: width, height: 240).coordinateSpace(name: "composite"))
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: width, height: 240),
          styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false; window.contentView = host
        window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
        defer { window.close() }
        host.layoutSubtreeIfNeeded(); RunLoop.main.run(until: Date().addingTimeInterval(0.08))
        let header = try XCTUnwrap(frames.values["header"])
        let body = try XCTUnwrap(frames.values["body"])
        let price = try XCTUnwrap(frames.values["price"])
        let action = try XCTUnwrap(frames.values["button"])
        let expected = OpenUIThemeValues().spaceM + (overriddenHeader ? 0 : OpenUIPresentation().compactThumbnailSize + OpenUIThemeValues().spaceM)
        XCTAssertEqual(body.minX, expected, accuracy: 1)
        XCTAssertEqual(price.minX, expected, accuracy: 1)
        XCTAssertGreaterThanOrEqual(action.minX, expected - 1)
        XCTAssertEqual(max(price.maxY, action.maxY), 240 - OpenUIThemeValues().spaceM, accuracy: 1)
        if !overriddenHeader {
          XCTAssertEqual(header.height, OpenUIPresentation().compactThumbnailSize, accuracy: 1)
          XCTAssertLessThan(body.minY, header.maxY, "Copy should continue beside the photo, not below its full height")
        }
      }
    }
  }
  @MainActor func testOverviewMediaAndMetricShareTheContentLeadingEdge() throws {
    _ = NSApplication.shared
    let standard = try OpenUIStandardComponents.library()
    let frames = OverviewSlotFrames()
    let names = ["IconText", "ImageText", "Text", "MetricIndicatorInline"]
    let replacements = try names.map { name -> OpenUIComponent in
      let component = try XCTUnwrap(OpenUIStandardComponents.components.first { $0.definition.name == name })
      return OpenUIComponent(component.definition) { context in
        Group {
          switch name {
          case "IconText": NativeMediaText(context: context, media: .icon)
          case "ImageText": NativeMediaText(context: context, media: .thumbnail)
          case "Text": NativeInlineText(context: context, bold: false)
          default: NativeMetric(context: context, inline: true)
          }
        }.background(GeometryReader { geometry in
          Color.clear.onAppear { frames.values[name] = geometry.frame(in: .named("overview")) }
            .onChange(of: geometry.frame(in: .named("overview"))) { frames.values[name] = $0 }
        })
      }
    }
    let library = try standard.extending(overriding: replacements)
    for (name, header) in [
      ("IconText", "IconText(Icon(\"wallet\"),\"neutral\",\"m\",\"预算\",\"两人合计\")"),
      ("ImageText", "ImageText(\"photo.jpg\",\"Room\",\"住宿\",\"一晚\")"),
      ("Text", "Text(\"text\",\"预算\",\"两人合计\")")
    ] {
      for width in [CGFloat(166), 300] {
        frames.values = [:]
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("root=OverviewCardBlock([OverviewCardItem(\"a\",\(header),MetricIndicatorInline(\"¥1200\",\"含餐饮\")),OverviewCardItem(\"b\",Text(\"text\",\"Other\"))])")
        XCTAssertTrue(state.errors.isEmpty)
        let element = try XCTUnwrap(PropValue.children(try XCTUnwrap(state.root), "items").first)
        let context = OpenUIComponentContext(element: element, registry: library.registry, state: state)
        let host = NSHostingView(rootView: NativeCardItem(context: context, kind: "Overview")
          .environmentObject(state).frame(width: width).coordinateSpace(name: "overview"))
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: width, height: 240),
          styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false; window.contentView = host
        window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
        defer { window.close() }
        host.layoutSubtreeIfNeeded()
        RunLoop.main.run(until: Date().addingTimeInterval(0.08))
        let top = try XCTUnwrap(frames.values[name])
        let bottom = try XCTUnwrap(frames.values["MetricIndicatorInline"])
        XCTAssertEqual(top.minX, OpenUIThemeValues().spaceSM, accuracy: 1)
        XCTAssertEqual(bottom.minX, top.minX, accuracy: 1,
          "An intrinsic-width metric must align with the top slot at \(width)pt")
        XCTAssertLessThanOrEqual(bottom.maxX, width - OpenUIThemeValues().spaceSM + 1)
      }
    }
  }
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

@MainActor private final class OverviewSlotFrames { var values: [String: CGRect] = [:] }
#endif
