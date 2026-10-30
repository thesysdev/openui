#if os(macOS)
import AppKit
import OpenUILang
import SwiftUI
import XCTest
@testable import OpenUISwiftUI

final class SDKVisualContractTests: XCTestCase {
  @MainActor private func height(_ source: String, width: CGFloat = 320) throws -> CGFloat {
    _ = NSApplication.shared
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema()); state.setSource(source)
    XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    return NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
      .frame(width: width)).fittingSize.height
  }

  @MainActor func testDeclaredIconTextSizesChangeTheBadgeExtentInBothOrientations() throws {
    for layout in ["horizontal", "vertical"] {
      func source(_ size: String) -> String {
        "root=IconText(Icon(\"train\"),\"info\",\"\(size)\",\"Rail\",null,true,\"\(layout)\")"
      }
      let small = try height(source("xs")), large = try height(source("xl"))
      XCTAssertGreaterThan(large, small + 8, "Declared glyph sizes must affect the actual containing row")
      XCTAssertEqual(try height(source("s")), try height(source("sm")), accuracy: 0.5)
      XCTAssertEqual(try height(source("m")), try height(source("md")), accuracy: 0.5)
      XCTAssertEqual(try height(source("l")), try height(source("lg")), accuracy: 0.5)
    }
  }

  @MainActor func testOffscreenLongCardCannotStretchTheSelectedShortCard() throws {
    let text = String(repeating: "A complete longer explanation remains readable. ", count: 16)
    let literal = String(decoding: try JSONEncoder().encode(text), as: UTF8.self)
    func source(_ copy: String) -> String {
      "root=CompositeCardBlock([CompositeCardItem(\"a\",Text(\"text\",\"Short\"),[Text(\"text\",\"One line\")],{price:BoldText(\"number\",\"€95\")}),CompositeCardItem(\"b\",Text(\"text\",\"Other\"),[Text(\"text\",\(copy))])],\"carousel\",true)"
    }
    let shortPeer = try height(source("\"One line\""))
    let longPeer = try height(source(literal))
    XCTAssertEqual(shortPeer, longPeer, accuracy: 1,
      "Appending content to a different page must not increase this page's whitespace or move subsequent document content")
  }

  @MainActor func testGroupActionIsPartOfTheNativeItemSurface() throws {
    _ = NSApplication.shared
    let standard = try OpenUIStandardComponents.library()
    let definition = try XCTUnwrap(standard.library.components.first { $0.name == "ContextCardItem" })
    let bounds = VisualContractBounds()
    let library = try standard.extending(overriding: [OpenUIComponent(definition) { context in
      NativeCardItem(context: context, kind: "Context").background(GeometryReader { geometry in
        Color.clear.onAppear { bounds.frame = geometry.frame(in: .named("contract")) }
          .onChange(of: geometry.frame(in: .named("contract"))) { bounds.frame = $0 }
      })
    }])
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("root=ContextCardBlock([ContextCardItem(\"a\",\"Context\",\"One fact\")],\"grid\",true,@OpenUrl(\"https://example.com/details\"))")
    let hosting = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
      .frame(width: 320).coordinateSpace(name: "contract"))
    try withWindow(hosting, width: 320, height: 240) {
      XCTAssertGreaterThan(bounds.frame.height, 80, "The surfaced item must contain its own action target")
      XCTAssertEqual(hosting.fittingSize.height, bounds.frame.height, accuracy: 1,
        "The collection must not add a second action row outside its only card")
    }
  }

  @MainActor func testDeclaredNumericColumnAlignsItsCellWithoutChangingItsValue() throws {
    _ = NSApplication.shared
    let standard = try OpenUIStandardComponents.library()
    let definition = try XCTUnwrap(standard.library.components.first { $0.name == "Text" })
    let bounds = VisualContractBounds()
    let library = try standard.extending(overriding: [OpenUIComponent(definition) { _ in
      Color.clear.frame(width: 40, height: 20).background(GeometryReader { geometry in
        Color.clear.onAppear { bounds.frame = geometry.frame(in: .named("contract")) }
          .onChange(of: geometry.frame(in: .named("contract"))) { bounds.frame = $0 }
      })
    }])
    let state = OpenUIState(schema: library.library.toSchema())
    func set(_ type: String) {
      state.setSource("root=Table([Col(\"A complete column heading\",[Text(\"text\",\"528\")],\"\(type)\")])")
      XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    }
    set("number")
    let hosting = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
      .frame(width: 300).coordinateSpace(name: "contract"))
    try withWindow(hosting, width: 300, height: 200) {
      let numericX = bounds.frame.minX
      XCTAssertGreaterThan(numericX, 100, "A declared numeric cell should sit at its column's trailing edge")
      set("string"); hosting.layoutSubtreeIfNeeded()
      RunLoop.main.run(until: Date().addingTimeInterval(0.2))
      XCTAssertLessThan(bounds.frame.minX, 2, "Text columns keep leading reading alignment")
      XCTAssertEqual(bounds.frame.width, 40, accuracy: 1, "Alignment must not resize or rewrite cell content")
    }
  }

  @MainActor private func withWindow<V: View>(_ hosting: NSHostingView<V>, width: CGFloat, height: CGFloat, check: () throws -> Void) throws {
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: width, height: height),
      styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false; window.contentView = hosting
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
    defer { window.close() }
    hosting.layoutSubtreeIfNeeded(); RunLoop.main.run(until: Date().addingTimeInterval(0.25))
    try check()
  }
}
@MainActor private final class VisualContractBounds { var frame = CGRect.zero }
#endif
