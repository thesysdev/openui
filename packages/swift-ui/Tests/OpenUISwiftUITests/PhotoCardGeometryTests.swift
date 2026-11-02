#if os(macOS)
import AppKit
import OpenUILang
import SwiftUI
import XCTest
@testable import OpenUISwiftUI

final class PhotoCardGeometryTests: XCTestCase {
  @MainActor private func withStreamingImage(
    _ inspect: (OpenUIState, () -> Void, PhotoCardWidth) throws -> Void
  ) throws {
    _ = NSApplication.shared
    let measured = PhotoCardWidth()
    let standard = try OpenUIStandardComponents.library()
    let image = try XCTUnwrap(standard.library.components.first { $0.name == "Image" })
    let library = try standard.extending(overriding: [OpenUIComponent(image) { context in
      NativeContentImage(context: context).background(GeometryReader { geometry in
        Color.clear.onAppear { measured.width = geometry.size.width }
          .onChange(of: geometry.size.width) { measured.width = $0 }
      })
    }])
    let state = OpenUIState(schema: library.library.toSchema())
    let host = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry).frame(width: 300))
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 300, height: 500),
      styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false; window.contentView = host
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
    defer { window.close() }
    func settle() {
      host.layoutSubtreeIfNeeded()
      RunLoop.main.run(until: Date().addingTimeInterval(0.06))
      host.layoutSubtreeIfNeeded()
    }
    try inspect(state, settle, measured)
  }

  @MainActor func testDefaultAndExplicitColumnsReserveTheSameImageWidthBeforeCompletion() throws {
    try withStreamingImage { state, settle, measured in
      let variants = [
        ("Stack([picture,tail])", CGFloat(300)),
        ("Stack([picture,tail],\"column\")", CGFloat(300)),
        ("Card([picture,tail])", 300 - OpenUIThemeValues().spaceML * 2)
      ]
      for (container, expected) in variants {
        state.setSource("root=\(container)\npicture=Image(\"photo\")\ntail=TextContent(\"still", streaming: true)
        settle()
        XCTAssertTrue(state.errors.isEmpty)
        XCTAssertFalse(state.isComplete)
        XCTAssertEqual(measured.width, expected, accuracy: 1,
          "A column's width must not wait for its unrelated trailing text")
        state.push(" arriving\")")
        settle()
        XCTAssertFalse(state.isComplete)
        XCTAssertEqual(measured.width, expected, accuracy: 1)
        state.complete()
        settle()
        XCTAssertEqual(measured.width, expected, accuracy: 1,
          "Completing unchanged layout cannot resize the image")
      }
    }
  }

  @MainActor func testLateRowChangesLayoutOnlyWhenItsDirectionArrives() throws {
    try withStreamingImage { state, settle, measured in
      state.push("root=Stack([Image(\"photo\"),TextContent(\"Caption\")]")
      settle()
      XCTAssertEqual(measured.width, 300, accuracy: 1, "An omitted direction uses the standard column default")
      state.push(",\"row\")\nother=TextContent(\"still")
      settle()
      XCTAssertTrue(state.errors.isEmpty)
      XCTAssertFalse(state.isComplete)
      let rowWidth = measured.width
      XCTAssertGreaterThan(rowWidth, 0)
      XCTAssertLessThan(rowWidth, 300, "The actual row argument changes the parent's width proposal")
      state.push(" arriving\")")
      state.complete()
      settle()
      XCTAssertEqual(measured.width, rowWidth, accuracy: 1)
    }
  }
  @MainActor private func card(_ source: String, kind: String, width: CGFloat) throws -> CGFloat {
    _ = NSApplication.shared
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource(source)
    XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    let element = try XCTUnwrap(PropValue.children(try XCTUnwrap(state.root), "items").first)
    let view = NativeCardItem(context: .init(element: element, registry: library.registry, state: state), kind: kind)
      .environmentObject(state).dynamicTypeSize(.large).frame(width: width)
    return NSHostingView(rootView: view).fittingSize.height
  }

  @MainActor func testPictureCardsUseTheirAvailableWidthInsteadOfAnUnrelatedMinimumHeight() throws {
    let cases = [
      ("Visual", "root=VisualCardBlock([VisualCardItem(BoldText(\"text\",\"Short\",null,\"text\",\"sm\"),\"a\",\"photo.jpg\",null,\"alt\")],\"grid\",true)"),
      ("Context", "root=ContextCardBlock([ContextCardItem(\"a\",\"Short\",\"One fact\",null,\"photo.jpg\",\"alt\")],\"grid\",true)")
    ]
    for (kind, source) in cases {
      for width in [CGFloat(240), 320, 600] {
        XCTAssertEqual(try card(source, kind: kind, width: width), width / 1.5, accuracy: 1,
          "\(kind) at \(width): the container width defines the photo card")
      }
    }
  }

  @MainActor func testNativePresentationCoverRatioAppliesInEveryResourceState() {
    _ = NSApplication.shared
    var presentation = OpenUIPresentation(); presentation.coverAspectRatio = 2
    for mode in 0..<3 {
      let view = NativeRemoteImage(src: mode == 0 ? nil : "photo.jpg",
        cachedImage: mode == 2 ? Image(systemName: "photo") : nil)
        .openUIPresentation(presentation).frame(width: 300)
      XCTAssertEqual(NSHostingView(rootView: view).fittingSize.height, 150, accuracy: 1,
        "The default, failure and retained-image paths use the same existing theme ratio")
    }
  }

  @MainActor func testStandardImageUsesThePinnedReferenceDefaultBeforeItsFileArrives() throws {
    _ = NSApplication.shared
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.push("root=Image(\"photo\",\"photo.jpg\")\nother=TextContent(\"still arriving")
    let view = OpenUIRenderer(state: state, registry: library.registry).frame(width: 300)
    XCTAssertFalse(state.isComplete)
    XCTAssertEqual(NSHostingView(rootView: view).fittingSize.height, 200, accuracy: 1,
      "The public Image default reserves its 3:2 frame without waiting for original pixels or unrelated text")
  }

  @MainActor func testSingleResponsiveCardUsesTheFullAvailableColumn() throws {
    _ = NSApplication.shared
    let measured = PhotoCardWidth()
    let standard = try OpenUIStandardComponents.library()
    let definition = try XCTUnwrap(standard.library.components.first { $0.name == "VisualCardItem" })
    let library = try standard.extending(overriding: [OpenUIComponent(definition) { _ in
      Color.clear.frame(height: 40).background(GeometryReader { geometry in
        Color.clear.onAppear { measured.width = geometry.size.width }
          .onChange(of: geometry.size.width) { measured.width = $0 }
      })
    }])
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("root=VisualCardBlock([VisualCardItem(BoldText(\"text\",\"One\"),\"a\")],\"grid\",true)")
    let hosting = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry).frame(width: 600, height: 80))
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 600, height: 80), styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false; window.contentView = hosting
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
    defer { window.close() }
    let deadline = Date().addingTimeInterval(1)
    repeat {
      hosting.layoutSubtreeIfNeeded(); RunLoop.main.run(until: Date().addingTimeInterval(0.01))
    } while measured.width == 0 && Date() < deadline
    XCTAssertEqual(measured.width, 600, accuracy: 1, "A lone recommendation cannot reserve an empty second column")
  }

  @MainActor func testStandaloneCardHeadersKeepTheirNaturalTextHeight() throws {
    func source(_ title: String) -> String {
      "root=CompositeCardBlock([CompositeCardItem(\"a\",ImageTextLarge(\"photo.jpg\",\"alt\",\"\(title)\",null,false),[],{price:BoldText(\"number\",\"€95\"),button:Button(\"Book\",@OpenUrl(\"https://example.com/ready\"))})],\"grid\",true)"
    }
    let short = try card(source("A room"), kind: "Composite", width: 320)
    let twoLines = try card(source("A room with enough space to rest comfortably"), kind: "Composite", width: 320)
    XCTAssertGreaterThan(twoLines, short + 8,
      "A short standalone name must not reserve an invisible second line; grid peers align in their row layout")
  }
}
@MainActor private final class PhotoCardWidth { var width: CGFloat = 0 }
#endif
