#if os(macOS)
import AppKit
import OpenUILang
import SwiftUI
import XCTest
@testable import OpenUISwiftUI

final class ComponentPolishTests: XCTestCase {
  @MainActor func testFormKeepsOneInputAndItsDraftAcrossWidthAndTypeChanges() throws {
    _ = NSApplication.shared
    let standard = try OpenUIStandardComponents.library()
    let definition = try XCTUnwrap(standard.library.components.first { $0.name == "Input" })
    let library = try standard.extending(overriding: [OpenUIComponent(definition) { _ in
      DraftInputProbe().frame(minWidth: 120, minHeight: 32)
    }])
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("root=Form(\"booking\",Buttons([Button(\"Continue\")]),[FormControl(\"A complete traveller name\",Input(\"name\",\"Name\"),\"Use the name on your passport\")])")
    XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    let size = FormPresentation()
    let hosting = NSHostingView(rootView: FormFixture(state: state, registry: library.registry, size: size))
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 700, height: 500), styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false; window.contentView = hosting
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
    defer { window.close() }
    func settle() { hosting.layoutSubtreeIfNeeded(); RunLoop.main.run(until: Date().addingTimeInterval(0.15)) }
    func fields(_ view: NSView) -> [NSTextField] {
      (view as? NSTextField).map { [$0] } ?? view.subviews.flatMap(fields)
    }
    settle()
    let first = try XCTUnwrap(fields(hosting).first)
    first.stringValue = "Traveller draft"
    window.makeFirstResponder(first)
    for (width, type) in [(CGFloat(200), DynamicTypeSize.large), (600, .accessibility2), (240, .large), (600, .large)] {
      size.width = width; size.type = type; settle()
      let mounted = fields(hosting)
      XCTAssertEqual(mounted.count, 1, "A FormControl must not create measurement copies of its input")
      XCTAssertTrue(mounted.first === first, "Resizing must not replace the editing field")
      XCTAssertEqual(mounted.first?.stringValue, "Traveller draft")
      XCTAssertTrue(window.firstResponder === first || first.currentEditor() === window.firstResponder,
        "Presentation changes must not discard an active editing session")
    }
  }

  @MainActor func testFooterKeepsOneMountedActionWhenItsWidthChanges() throws {
    _ = NSApplication.shared
    let standard = try OpenUIStandardComponents.library()
    let definition = try XCTUnwrap(standard.library.components.first { $0.name == "Button" })
    let library = try standard.extending(overriding: [OpenUIComponent(definition) { _ in
      FooterControlProbe().frame(width: 140, height: 44)
    }])
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("root=CompositeCardItem(\"stay\",Text(\"text\",\"Stay\"),[],{price:BoldText(\"number\",\"€12345\"),button:Button(\"Book\",@OpenUrl(\"https://example.com/stay\"))})")
    XCTAssertTrue(state.errors.isEmpty)
    let size = FooterWidth()
    let hosting = NSHostingView(rootView: FooterFixture(state: state, registry: library.registry, size: size))
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 600, height: 500), styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false; window.contentView = hosting
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
    defer { window.close() }
    func settle() { hosting.layoutSubtreeIfNeeded(); RunLoop.main.run(until: Date().addingTimeInterval(0.15)) }
    func controls(_ view: NSView) -> [FooterControlView] {
      (view as? FooterControlView).map { [$0] } ?? view.subviews.flatMap(controls)
    }
    settle()
    let first = try XCTUnwrap(controls(hosting).first)
    XCTAssertEqual(controls(hosting).count, 1)
    for width in [CGFloat(200), 500, 180, 500] {
      size.width = width; settle()
      let mounted = controls(hosting)
      XCTAssertEqual(mounted.count, 1, "Responsive placement must not create an alternate action subtree")
      XCTAssertTrue(mounted.first === first, "The action must keep native identity across row/column placement")
    }
  }

  #if !SDK_POLISH_BASELINE
  @MainActor func testMissingFooterSlotsDoNotAddSpaceToTheRemainingContent() throws {
    _ = NSApplication.shared
    let standard = try OpenUIStandardComponents.library()
    let definition = try XCTUnwrap(standard.library.components.first { $0.name == "Button" })
    let library = try standard.extending(overriding: [OpenUIComponent(definition) { _ in
      FooterControlProbe().frame(width: 140, height: 44)
    }])
    func measured(_ footer: String) throws -> CGFloat {
      let state = OpenUIState(schema: library.library.toSchema())
      state.setSource("root=CompositeCardItem(\"stay\",null,[],\(footer))")
      let element = try XCTUnwrap(state.root)
      let context = OpenUIComponentContext(element: element, registry: library.registry, state: state)
      return NSHostingView(rootView: NativeCompositeFooter(context: context, footer: try XCTUnwrap(context.value("footer")))
        .environmentObject(state).frame(width: 160)).fittingSize.height
    }
    XCTAssertEqual(try measured("{button:Button(\"Book\")}"), 44, accuracy: 1)
    XCTAssertEqual(try measured("{}"), 0, accuracy: 1)
    XCTAssertGreaterThan(try measured("{price:BoldText(\"number\",\"€12345\"),button:Button(\"Book\")}"), 56)
  }

  @MainActor func testStepMarkerRespectsItsCompleteMeasuredNumeral() {
    _ = NSApplication.shared
    var theme = OpenUITheme(); theme.typography.detail.size = 42
    let marker = NSHostingView(rootView: NativeStepMarker(number: 12, theme: theme, diameter: 28))
    let text = NSHostingView(rootView: Text("12").openUIFont(theme.typography.detail.weight(.semibold)).fixedSize())
    XCTAssertGreaterThan(marker.fittingSize.height, 28)
    XCTAssertGreaterThanOrEqual(marker.fittingSize.height, text.fittingSize.height)
    XCTAssertGreaterThanOrEqual(marker.fittingSize.width, text.fittingSize.width)
  }
  #endif
}

@MainActor private final class FooterWidth: ObservableObject { @Published var width: CGFloat = 500 }
private struct FooterFixture: View {
  let state: OpenUIState
  let registry: ComponentRegistry
  @ObservedObject var size: FooterWidth
  var body: some View { OpenUIRenderer(state: state, registry: registry).frame(width: size.width) }
}
private final class FooterControlView: NSView {}
private struct FooterControlProbe: NSViewRepresentable {
  func makeNSView(context: Context) -> FooterControlView { FooterControlView() }
  func updateNSView(_ view: FooterControlView, context: Context) {}
}

@MainActor private final class FormPresentation: ObservableObject {
  @Published var width: CGFloat = 600
  @Published var type = DynamicTypeSize.large
}
private struct FormFixture: View {
  let state: OpenUIState
  let registry: ComponentRegistry
  @ObservedObject var size: FormPresentation
  var body: some View {
    OpenUIRenderer(state: state, registry: registry).dynamicTypeSize(size.type).frame(width: size.width)
  }
}
private struct DraftInputProbe: NSViewRepresentable {
  func makeNSView(context: Context) -> NSTextField { NSTextField(string: "") }
  func updateNSView(_ view: NSTextField, context: Context) {}
}
#endif
