#if os(macOS)
import AppKit
import OpenUILang
import SwiftUI
import XCTest
@testable import OpenUISwiftUI

final class ReadingRhythmTests: XCTestCase {
  @MainActor func testOverviewMetricStartsAlignWhenOnlyOneDescriptionWraps() throws {
    _ = NSApplication.shared
    let frames = OverviewSlotFrames()
    let standard = try OpenUIStandardComponents.library()
    let names = ["IconText", "MetricIndicatorInline"]
    let overrides = try names.map { name -> OpenUIComponent in
      let definition = try XCTUnwrap(standard.library.components.first { $0.name == name })
      return OpenUIComponent(definition) { context in
        Group {
          if name == "IconText" { NativeMediaText(context: context, media: .icon) }
          else { NativeMetric(context: context, inline: true) }
        }.background(GeometryReader { geometry in
          let key = context.string(name == "IconText" ? "title" : "value") ?? ""
          Color.clear.onAppear { frames.values[key] = geometry.frame(in: .named("metric-starts")) }
            .onChange(of: geometry.frame(in: .named("metric-starts"))) { frames.values[key] = $0 }
        })
      }
    }
    let library = try standard.extending(overriding: overrides)
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("""
      root=OverviewCardBlock([
        OverviewCardItem("a",IconText(Icon("footprints"),"soft","m","步行强度","长城线略高"),MetricIndicatorInline("18 km","每日")),
        OverviewCardItem("b",IconText(Icon("leaf"),"soft","m","当季看点","银杏、红叶、清透天"),MetricIndicatorInline("17:05","景山最佳拍照位置"))],"grid",true)
      """)
    XCTAssertTrue(state.errors.isEmpty)
    let host = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
      .frame(width: 350).coordinateSpace(name: "metric-starts"))
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 350, height: 500),
      styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false; window.contentView = host
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
    defer { window.close() }
    host.layoutSubtreeIfNeeded(); RunLoop.main.run(until: Date().addingTimeInterval(0.2))
    let short = try XCTUnwrap(frames.values["18 km"]), long = try XCTUnwrap(frames.values["17:05"])
    XCTAssertGreaterThan(long.height, short.height + 5, "Only the long description should use another line")
    XCTAssertEqual(short.minY, long.minY, accuracy: 1,
      "The propagated metric-top guide must align the value rows without adding a fake text line")
    XCTAssertEqual(try XCTUnwrap(frames.values["步行强度"]).minY,
      try XCTUnwrap(frames.values["当季看点"]).minY, accuracy: 1)
  }

  @MainActor func testVerticalSummaryCentersItsIcon() throws {
    _ = NSApplication.shared
    let frames = OverviewSlotFrames()
    let standard = try OpenUIStandardComponents.library()
    let icon = try XCTUnwrap(standard.library.components.first { $0.name == "Icon" })
    let library = try standard.extending(overriding: [OpenUIComponent(icon) { context in
      NativeIcon(context: context).background(GeometryReader { geometry in
        Color.clear.onAppear { frames.values["icon"] = geometry.frame(in: .named("summary")) }
          .onChange(of: geometry.frame(in: .named("summary"))) { frames.values["icon"] = $0 }
      })
    }])
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("""
      root=OverviewCardBlock([
        OverviewCardItem("a",IconText(Icon("calendar"),"neutral","m","2 天","行程",true,"vertical")),
        OverviewCardItem("b",IconText(Icon("map-pin"),"neutral","m","11 站","文化景点",true,"vertical"))],"grid",false)
      """)
    XCTAssertTrue(state.errors.isEmpty)
    let element = try XCTUnwrap(PropValue.children(try XCTUnwrap(state.root), "items").first)
    let host = NSHostingView(rootView: NativeCardItem(context: .init(element: element,
      registry: library.registry, state: state), kind: "Overview")
      .environmentObject(state).frame(width: 150).coordinateSpace(name: "summary"))
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 150, height: 180),
      styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false; window.contentView = host
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
    defer { window.close() }
    host.layoutSubtreeIfNeeded(); RunLoop.main.run(until: Date().addingTimeInterval(0.1))
    XCTAssertEqual(try XCTUnwrap(frames.values["icon"]).midX, 75, accuracy: 1)
  }

  @MainActor func testIconTextKeepsItsIconAtTheTopWhenTheDescriptionWraps() throws {
    _ = NSApplication.shared
    let frames = OverviewSlotFrames()
    let standard = try OpenUIStandardComponents.library()
    let definition = try XCTUnwrap(standard.library.components.first { $0.name == "Icon" })
    let library = try standard.extending(overriding: [OpenUIComponent(definition) { context in
      NativeIcon(context: context).background(GeometryReader { geometry in
        Color.clear.onAppear { frames.values["icon"] = geometry.frame(in: .named("icon-row")) }
          .onChange(of: geometry.frame(in: .named("icon-row"))) { frames.values["icon"] = $0 }
      })
    }])
    let state = OpenUIState(schema: library.library.toSchema())
    let host = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
      .frame(width: 200).coordinateSpace(name: "icon-row"))
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 200, height: 400),
      styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false; window.contentView = host
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
    defer { window.close() }
    func iconY(_ description: String) throws -> CGFloat {
      state.setSource("root=IconText(Icon(\"calendar\"),\"soft\",\"m\",\"Duration\",\(jsonStringLiteral(description)))")
      XCTAssertTrue(state.errors.isEmpty)
      host.layoutSubtreeIfNeeded(); RunLoop.main.run(until: Date().addingTimeInterval(0.1))
      return try XCTUnwrap(frames.values["icon"]).minY
    }
    let short = try iconY("One day")
    XCTAssertEqual(try iconY(String(repeating: "A longer description with natural wrapping. ", count: 5)),
      short, accuracy: 1, "An icon badge must not drift down beside a taller paragraph")
  }

  @MainActor func testOverviewMetricsUseTheBottomEdgeOfTheSameGridRow() throws {
    _ = NSApplication.shared
    let frames = OverviewSlotFrames()
    let standard = try OpenUIStandardComponents.library()
    let definition = try XCTUnwrap(standard.library.components.first { $0.name == "MetricIndicatorInline" })
    let library = try standard.extending(overriding: [OpenUIComponent(definition) { context in
      NativeMetric(context: context, inline: true).background(GeometryReader { geometry in
        Color.clear.onAppear { frames.values[context.string("value") ?? ""] = geometry.frame(in: .named("metrics")) }
          .onChange(of: geometry.frame(in: .named("metrics"))) { frames.values[context.string("value") ?? ""] = $0 }
      })
    }])
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("""
      root=OverviewCardBlock([
        OverviewCardItem("a",IconText(Icon("calendar-days"),"soft","md","2 天 1 晚","中轴线与郊野各一天，沿着老城慢慢散步。"),MetricIndicatorInline("48 h","含往返")),
        OverviewCardItem("b",IconText(Icon("footprints"),"soft","md","步行强度","长城线略高"),MetricIndicatorInline("18 km","每日"))],"grid",true)
      """)
    XCTAssertTrue(state.errors.isEmpty)
    let host = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
      .frame(width: 600).coordinateSpace(name: "metrics"))
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 600, height: 400),
      styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false; window.contentView = host
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
    defer { window.close() }
    host.layoutSubtreeIfNeeded(); RunLoop.main.run(until: Date().addingTimeInterval(0.15))
    let first = try XCTUnwrap(frames.values["48 h"]), second = try XCTUnwrap(frames.values["18 km"])
    XCTAssertEqual(first.maxY, second.maxY, accuracy: 1,
      "Different heading heights cannot leave a metric floating above its peer")
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
        XCTAssertEqual(top.minX, OpenUIThemeValues().spaceS, accuracy: 1)
        XCTAssertEqual(bottom.minX, top.minX, accuracy: 1,
          "An intrinsic-width metric must align with the top slot at \(width)pt")
        XCTAssertLessThanOrEqual(bottom.maxX, width - OpenUIThemeValues().spaceS + 1)
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
