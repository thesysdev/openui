#if os(macOS)
import AppKit
import OpenUILang
import SwiftUI
import XCTest
@testable import OpenUISwiftUI

final class CardCollectionContinuityTests: XCTestCase {
  @MainActor func testLateCarouselModeDoesNotExpandATemporaryVerticalListOrRemountCards() throws {
    try checkLateMode("carousel")
  }
  @MainActor func testLateGridModeReflowsTheSameMountedCards() throws {
    try checkLateMode("grid")
  }
  @MainActor private func checkLateMode(_ mode: String) throws {
    _ = NSApplication.shared
    let log = CardCollectionMounts()
    let standard = try OpenUIStandardComponents.library()
    let definition = try XCTUnwrap(standard.library.components.first { $0.name == "ImageText" })
    let library = try standard.extending(overriding: [OpenUIComponent(definition) { context in
      CardCollectionMarker(name: context.string("alt") ?? "", log: log).frame(height: 180)
    }])
    let state = OpenUIState(schema: library.library.toSchema())
    state.push("root=CompositeCardBlock([CompositeCardItem(\"a\",ImageText(\"a\",\"A\",\"First\"),[])")
    let hosting = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry).frame(width: 390))
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 390, height: 1000),
      styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false; window.contentView = hosting
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
    defer { window.close() }
    func settle() {
      let deadline = Date().addingTimeInterval(0.15)
      repeat {
        hosting.layoutSubtreeIfNeeded()
        RunLoop.main.run(until: Date().addingTimeInterval(0.01))
      } while Date() < deadline
    }
    settle()
    let first = try XCTUnwrap(log.views["A"])
    let oneCardHeight = hosting.fittingSize.height
    state.push(",CompositeCardItem(\"b\",ImageText(\"b\",\"B\",\"Second\"),[])")
    settle()
    XCTAssertLessThanOrEqual(hosting.fittingSize.height, oneCardHeight + 1,
      "An unresolved positional layout must not temporarily stack every arriving card")
    XCTAssertTrue(log.views["A"] === first)
    state.push("],\"\(mode)\",true)")
    state.complete(); settle()
    XCTAssertTrue(log.views["A"] === first, "Changing collection placement must retain the first mounted native card")
    XCTAssertEqual(log.created["A"], 1)
    XCTAssertEqual(log.removed["A", default: 0], 0)
    if mode == "grid" {
      XCTAssertGreaterThan(hosting.fittingSize.height, oneCardHeight * 1.5,
        "A resolved narrow grid still presents all cards vertically")
    } else {
      XCTAssertLessThanOrEqual(hosting.fittingSize.height, oneCardHeight + 1)
    }
    XCTAssertTrue(state.errors.isEmpty)
  }
}

@MainActor private final class CardCollectionMounts {
  var views: [String: NSView] = [:]
  var created: [String: Int] = [:]
  var removed: [String: Int] = [:]
}
private struct CardCollectionMarker: NSViewRepresentable {
  let name: String
  let log: CardCollectionMounts
  func makeCoordinator() -> (String, CardCollectionMounts) { (name, log) }
  func makeNSView(context: Context) -> NSView {
    let view = NSView()
    log.views[name] = view; log.created[name, default: 0] += 1
    return view
  }
  func updateNSView(_ view: NSView, context: Context) {}
  static func dismantleNSView(_ view: NSView, coordinator: (String, CardCollectionMounts)) {
    coordinator.1.removed[coordinator.0, default: 0] += 1
  }
}
#endif
