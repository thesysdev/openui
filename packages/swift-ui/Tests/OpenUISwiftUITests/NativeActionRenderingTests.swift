#if os(macOS)
import AppKit
import OpenUILang
import SwiftUI
import XCTest

@testable import OpenUISwiftUI

final class NativeActionRenderingTests: XCTestCase {
    @MainActor func testComponentContextRefreshesAtEndOfUnchangedStream() throws {
        _ = NSApplication.shared
        let probe = OpenUIComponent(name: "EligibilityProbe", description: "Test render boundary", params: []) {
            EligibilityProbe(context: $0)
        }
        let library = try OpenUIComponentLibrary(components: [probe])
        let state = OpenUIState(schema: library.library.toSchema())
        state.push("root=EligibilityProbe()")
        // Hold the element fixed, as a streaming completion need not change
        // component props. The registered host must propagate render state.
        let element = try XCTUnwrap(state.root)
        let hosting = NSHostingView(rootView: RenderNode(element: element, registry: library.registry)
            .environmentObject(state))
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 240, height: 100),
            styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = hosting
        window.setFrameOrigin(NSPoint(x: -10000, y: -10000))
        window.orderFront(nil)
        defer { window.close() }
        func settle() {
            hosting.layoutSubtreeIfNeeded()
            RunLoop.main.run(until: Date().addingTimeInterval(0.1))
        }
        func marker(in view: NSView) -> NSButton? {
            if let button = view as? NSButton,
               button.identifier?.rawValue == "openui.test.action-enabled" { return button }
            return view.subviews.lazy.compactMap { marker(in: $0) }.first
        }
        settle()
        let button = try XCTUnwrap(marker(in: hosting))
        XCTAssertFalse(button.isEnabled)
        state.complete()
        settle()
        XCTAssertTrue(button.isEnabled, "An indirect registered view must refresh without prop changes")
        XCTAssertTrue(marker(in: hosting) === button, "Completion must retain native view identity")
        state.reset()
        settle()
        XCTAssertFalse(try XCTUnwrap(marker(in: hosting)).isEnabled)
    }

    @MainActor func testMountedActionEnablesAfterStreamingCompletes() throws {
        _ = NSApplication.shared
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        state.push("root=Button(\"Save\")")
        let context = OpenUIComponentContext(
            element: try XCTUnwrap(state.root), registry: library.registry, state: state)
        // Keep the action and context constant: completion must invalidate the
        // action surface itself, not rely on a parent rebuilding its props.
        let hosting = NSHostingView(rootView: OpenUIActionSurface(
            context: context, action: OpenUIActions.continueConversation("Save"), useNativeStyle: true
        ) { ActionEnabledMarker() }.environmentObject(state))
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 240, height: 100), styleMask: [.borderless],
            backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = hosting
        window.setFrameOrigin(NSPoint(x: -10000, y: -10000))
        window.orderFront(nil)
        defer { window.close() }

        func settle() {
            hosting.layoutSubtreeIfNeeded()
            RunLoop.main.run(until: Date().addingTimeInterval(0.1))
        }
        func marker(in view: NSView) -> NSButton? {
            if let button = view as? NSButton,
               button.identifier?.rawValue == "openui.test.action-enabled" { return button }
            return view.subviews.lazy.compactMap { marker(in: $0) }.first
        }

        settle()
        let button = try XCTUnwrap(marker(in: hosting))
        XCTAssertFalse(button.isEnabled, "Actions stay disabled during streaming")
        state.complete()
        XCTAssertTrue(context.canInteract)
        settle()
        XCTAssertTrue(button.isEnabled, "A mounted action must enable after streaming completes")
        state.reset()
        settle()
        XCTAssertFalse(button.isEnabled, "Reset must disable an action from the old source")
    }
}

private struct EligibilityProbe: View {
    let context: OpenUIComponentContext
    var body: some View {
        ActionEnabledMarker().disabled(!context.canInteract)
    }
}

/// Exposes SwiftUI's effective enabled state on a native control inside the
/// action label, without depending on private SwiftUI button implementations.
private struct ActionEnabledMarker: NSViewRepresentable {
    @Environment(\.isEnabled) private var isEnabled
    func makeNSView(context: Context) -> NSButton {
        let button = NSButton(title: "Save", target: nil, action: nil)
        button.identifier = NSUserInterfaceItemIdentifier("openui.test.action-enabled")
        return button
    }
    func updateNSView(_ button: NSButton, context: Context) { button.isEnabled = isEnabled }
}
#endif
