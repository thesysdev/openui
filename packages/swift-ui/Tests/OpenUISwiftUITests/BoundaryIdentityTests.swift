#if os(macOS)
import AppKit
import OpenUILang
import SwiftUI
import XCTest
@testable import OpenUISwiftUI

final class BoundaryIdentityTests: XCTestCase {
  @MainActor func testUnavailableUpdateKeepsTheMountedLastGoodView() throws {
    _ = NSApplication.shared
    let input = BoundaryInput()
    let hosting = NSHostingView(rootView: BoundaryTestSurface(input: input))
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 240, height: 100),
      styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false
    window.contentView = hosting
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
    defer { window.close() }
    func settle() {
      hosting.layoutSubtreeIfNeeded()
      RunLoop.main.run(until: Date().addingTimeInterval(0.05))
    }
    func marker(_ view: NSView) -> NSView? {
      if view.identifier?.rawValue == "boundary.mount" { return view }
      return view.subviews.lazy.compactMap(marker).first
    }
    settle()
    let first = try XCTUnwrap(marker(hosting))
    input.element = nil
    settle()
    XCTAssertTrue(marker(hosting) === first, "Fallback must keep the loaded native subtree, not create a second branch")
    input.element = EvaluatedElement(typeName: "TextContent", props: [("text", .string("Later"))])
    settle()
    XCTAssertTrue(marker(hosting) === first)
  }
}
@MainActor private final class BoundaryInput: ObservableObject {
  @Published var element: EvaluatedElement? = EvaluatedElement(typeName: "TextContent")
}
private struct BoundaryTestSurface: View {
  @ObservedObject var input: BoundaryInput
  var body: some View { ElementErrorBoundary(element: input.element) { _ in BoundaryMarker() } }
}
private struct BoundaryMarker: NSViewRepresentable {
  func makeNSView(context: Context) -> NSView {
    let view = NSView(); view.identifier = NSUserInterfaceItemIdentifier("boundary.mount"); return view
  }
  func updateNSView(_ view: NSView, context: Context) {}
}
#endif
