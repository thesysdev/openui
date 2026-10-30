#if os(macOS)
  import AppKit
  import OpenUILang
  import SwiftUI
  import XCTest
  @testable import OpenUISwiftUI

  final class ReferenceRenderingTests: XCTestCase {
    @MainActor func testMountedChoiceButtonsAndCalloutDriveTheSharedStore() throws {
      _ = NSApplication.shared
      let library = try OpenUIStandardComponents.library()
      let state = OpenUIState(schema: library.library.toSchema())
      state.setSource("root=Chips(\"tags\",\"multiple\",[ChipItem(\"a\",\"Alpha\")])")
      // A single intrinsic-size control sits at the known center. Dispatch
      // public AppKit events only to this offscreen window, never the user's
      // app or global pointer. SwiftUI does not publish a complete AX tree
      // for an inactive offscreen XCTest host.
      let hosting = NSHostingView(
        rootView: OpenUIRenderer(state: state, registry: library.registry)
          .fixedSize().frame(width: 240, height: 140))
      let window = NSWindow(
        contentRect: NSRect(x: 0, y: 0, width: 240, height: 140),
        styleMask: [.borderless], backing: .buffered, defer: false)
      window.isReleasedWhenClosed = false
      window.contentView = hosting
      window.setFrameOrigin(NSPoint(x: -10000, y: -10000))
      window.orderFront(nil)
      defer { window.close() }
      func settle(_ seconds: Double = 0.15) {
        hosting.layoutSubtreeIfNeeded()
        RunLoop.main.run(until: Date().addingTimeInterval(seconds))
      }
      func clickCenter() throws {
        let point = hosting.convert(
          NSPoint(x: hosting.bounds.midX, y: hosting.bounds.midY), to: nil)
        let down = try XCTUnwrap(
          NSEvent.mouseEvent(
            with: .leftMouseDown, location: point,
            modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
            windowNumber: window.windowNumber,
            context: nil, eventNumber: 1, clickCount: 1, pressure: 1))
        let up = try XCTUnwrap(
          NSEvent.mouseEvent(
            with: .leftMouseUp, location: point,
            modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime + 0.01,
            windowNumber: window.windowNumber,
            context: nil, eventNumber: 2, clickCount: 1, pressure: 0))
        NSApplication.shared.postEvent(up, atStart: false)
        window.sendEvent(down)
        window.sendEvent(up)
        settle()
      }
      settle()
      try clickCenter()
      XCTAssertEqual(state.fieldValue(form: nil, name: "tags"), .array([.string("a")]))
      state.setSource("root=Chips(\"tags\",\"multiple\",[ChipItem(\"b\",\"Disabled\",null,true)])")
      settle()
      try clickCenter()
      XCTAssertEqual(
        state.fieldValue(form: nil, name: "tags"), .array([.string("a")]),
        "Disabled choices cannot write")
      state.setSource("root=OptionCards(\"plan\",\"single\",[OptionCard(\"air\",\"Air\")])")
      settle()
      try clickCenter()
      XCTAssertEqual(state.fieldValue(form: nil, name: "plan"), .string("air"))
      state.setSource("$visible=true\nroot=Callout(\"success\",\"Saved\",\"Done\",$visible)")
      settle()
      XCTAssertEqual(state.stateValue("$visible"), .boolean(true))
      settle(3.2)
      XCTAssertEqual(
        state.stateValue("$visible"), .boolean(false),
        "Mounted Callout must dismiss through its binding")
    }

    @MainActor private func render(
      _ source: String, name: String, width: CGFloat = 620, height: CGFloat = 620
    ) throws -> Data {
      _ = NSApplication.shared
      let library = try OpenUIStandardComponents.library()
      let state = OpenUIState(schema: try OpenUIStandardComponents.library().library.toSchema())
      state.setSource(source)
      XCTAssertTrue(state.errors.isEmpty, "\(name): \(state.errors)")
      let hosting = NSHostingView(
        rootView: ScrollView {
          OpenUIRenderer(state: state, registry: library.registry).fixedSize(
            horizontal: false, vertical: true
          ).padding(20)
        }.frame(width: width, height: height).preferredColorScheme(.light).background(Color.white))
      let window = NSWindow(
        contentRect: NSRect(x: 0, y: 0, width: width, height: height), styleMask: [.borderless],
        backing: .buffered, defer: false)
      window.isReleasedWhenClosed = false
      window.contentView = hosting
      window.setFrameOrigin(NSPoint(x: -10000, y: -10000))
      window.orderFront(nil)
      defer { window.close() }
      hosting.layoutSubtreeIfNeeded()
      RunLoop.main.run(until: Date().addingTimeInterval(0.12))
      hosting.layoutSubtreeIfNeeded()
      let bitmap = try XCTUnwrap(hosting.bitmapImageRepForCachingDisplay(in: hosting.bounds))
      hosting.cacheDisplay(in: hosting.bounds, to: bitmap)
      let image = try XCTUnwrap(bitmap.representation(using: .png, properties: [:]))
      XCTAssertGreaterThan(image.count, 2000, "\(name) must contain plotted/native content")
      if let directory = ProcessInfo.processInfo.environment["OPENUI_SNAPSHOT_DIR"] {
        try FileManager.default.createDirectory(
          atPath: directory, withIntermediateDirectories: true)
        try image.write(to: URL(fileURLWithPath: directory).appendingPathComponent(name + ".png"))
      }
      return image
    }
    @MainActor func testNineNativeChartFamiliesAndVariantsRenderDistinctData() throws {
      var images = Set<Data>()
      for name in OpenUIChartComponents.chartNames {
        let source: String
        if name == "ScatterChart" {
          source =
            "root=ScatterChart([ScatterSeries(\"Alpha\",[Point(-2,3,2),Point(4,-1,6)]),ScatterSeries(\"Beta\",[Point(1,2),Point(3,5)])],\"Distance\",\"Value\")"
        } else if ["PieChart", "RadialChart", "SingleStackedBarChart"].contains(name) {
          source = "root=\(name)([\"Alpha\",\"Beta\",\"Gamma\"],[4,3,2])"
        } else {
          source =
            "root=\(name)([\"A\",\"B\",\"C\"],[Series(\"Alpha\",[-2,4,1]),Series(\"Beta\",[3,2,5])])"
        }
        images.insert(try render(source, name: "catalog-" + name, height: 380))
      }
      XCTAssertEqual(images.count, 9, "Every chart family needs its own actual geometry")
      let grouped = try render(
        "root=BarChart([\"A\",\"B\"],[Series(\"One\",[2,3]),Series(\"Two\",[4,1])],\"grouped\")",
        name: "catalog-grouped", height: 380)
      let stacked = try render(
        "root=BarChart([\"A\",\"B\"],[Series(\"One\",[2,3]),Series(\"Two\",[4,1])],\"stacked\")",
        name: "catalog-stacked", height: 380)
      XCTAssertNotEqual(grouped, stacked)
      let pie = try render(
        "root=PieChart([\"A\",\"B\"],[2,3],\"pie\")", name: "catalog-pie", height: 380)
      let donut = try render(
        "root=PieChart([\"A\",\"B\"],[2,3],\"donut\",\"semiCircular\")", name: "catalog-semi-donut",
        height: 380)
      XCTAssertNotEqual(pie, donut)
    }

    @MainActor func testNativeContentCardsAndChoiceControlsRender() throws {
      let content = """
        root=Stack([
          CardHeader("Reference content","Native presentation"),InlineHeader("Details","Compact heading"),
          MarkDownRenderer("# Markdown\\nA **bold** label with [a link](https://example.com).\\n- First\\n```swift\\nlet n = 1\\n```"),
          TextCallout("info","Notice","Description"),Callout("success","Saved","Complete"),
          IconText(Icon("train","travel"),"info","m","Rail","Fast",true),
          Tag("Ready",Icon("circle-check"),"md","success"),TagBlock(["One","Two"]),
          EntityList([{left:"Name",right:"Value"}]),ListBlock([ListItem("First","Description",null,"Inspect",@ToAssistant("Inspect"))]),
          Steps([StepsItem("Choose","Select a plan"),StepsItem("Continue","Confirm **details**")])
        ])
        """
      _ = try render(content, name: "catalog-content", height: 1100)
      let cards = """
        root=Stack([
          SnippetCardBlock([SnippetCardItem("s1",IconText(Icon("plane"),"neutral","m","Flight"),Text("number","42")),SnippetCardItem("s2",ImageText("","","Hotel"),BoldText("number","84"))]),
          OverviewCardBlock([OverviewCardItem("o1",Text("text","Overview"),MetricIndicatorInline("12")),OverviewCardItem("o2",IconText(Icon("clock"),"neutral","m","Time"))]),
          ContextCardBlock([ContextCardItem("c1","Alpha","First","gray"),ContextCardItem("c2",Tag("Beta"),"Second")]),
          CompositeCardBlock([CompositeCardItem("p1",Text("text","Product"),[BoldText("number","100"),TagBlock(["Tag"])],{price:BoldText("number","99"),button:Button("Book")}),CompositeCardItem("p2",ImageTextLarge("","","Item"),[Text("text","Description")])]),
          VisualCardBlock([VisualCardItem(BoldText("text","Visual"),"v1",null,Tag("New")),VisualCardItem(BoldText("text","Other"),"v2")])
        ])
        """
      _ = try render(cards, name: "catalog-cards", height: 1100)
      _ = try render(
        "root=Stack([Form(\"choices\",Buttons([Button(\"Submit\")]),[FormControl(\"Tags\",Chips(\"tags\",\"multiple\",[ChipItem(\"a\",\"Alpha\",Icon(\"check\")),ChipItem(\"b\",\"Beta\",null,true)],null,[\"a\"])),FormControl(\"Plan\",OptionCards(\"plan\",\"single\",[OptionCard(\"rail\",\"Rail\",\"Fast\",Icon(\"train\")),OptionCard(\"air\",\"Air\")],null,\"rail\"))]),IconButton(\"Info\",Icon(\"info\")),Carousel([[TextContent(\"Page 1\")],[TextContent(\"Page 2\")]])])",
        name: "catalog-choices", height: 680)
      _ = try render(
        "root=Form(\"preferences\",Buttons([Button(\"继续\")]),[FormControl(\"选择感兴趣的内容，可多选\",Chips(\"topics\",\"multiple\",[ChipItem(\"design\",\"设计与创作\"),ChipItem(\"technology\",\"科学与技术\"),ChipItem(\"culture\",\"历史与文化\")],null,[\"design\"])),FormControl(\"选择信息呈现方式\",OptionCards(\"detail\",\"single\",[OptionCard(\"brief\",\"先看简要概览\",\"保留重要信息，方便快速阅读\",Icon(\"file\")),OptionCard(\"full\",\"展开完整细节\",\"显示更多说明与相关资料\",Icon(\"search\"))],null,\"brief\"))])",
        name: "catalog-narrow-choices", width: 390, height: 700)
    }
  }
#endif
