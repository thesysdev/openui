#if os(macOS)
import AppKit
import OpenUILang
import SwiftUI
import XCTest

@testable import OpenUISwiftUI

final class NativeSelectionRenderingTests: XCTestCase {
    @MainActor func testArrivingDataChangesTheMountedTabsAndAccordion() throws {
        _ = NSApplication.shared
        let marker = OpenUIComponent(name: "LocationMarker", description: "Selection evidence",
            params: [OpenUIParameter.string("location")]) { TabLocationMarker(location: $0.string("location") ?? "") }
        let library = try OpenUIStandardComponents.library().extending(adding: [marker])
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("""
            $append=false
            root=Stack([Tabs($append?[a,b]:[a]),Accordion($append?[one,two]:[one])])
            a=TabItem("a","First",[LocationMarker("Tab A")])
            b=TabItem("b","Second",[LocationMarker("Tab B")])
            one=AccordionItem("one","First detail",[LocationMarker("Detail A")])
            two=AccordionItem("two","Second detail",[LocationMarker("Detail B")])
            """)
        XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
        let hosting = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry))
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 420, height: 360),
            styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = hosting
        window.setFrameOrigin(NSPoint(x: -10000, y: -10000))
        window.orderFront(nil)
        defer { window.close() }
        func markers(_ view: NSView) -> [String] {
            let own = (view as? NSTextField).flatMap {
                $0.identifier?.rawValue == "openui.test.tab-location" ? $0.stringValue : nil
            }
            return own.map { [$0] } ?? view.subviews.flatMap(markers)
        }
        func waitFor(_ expected: [String]) {
            let deadline = Date().addingTimeInterval(3)
            repeat {
                hosting.layoutSubtreeIfNeeded()
                if markers(hosting) == expected { return }
                RunLoop.main.run(until: Date().addingTimeInterval(0.02))
            } while Date() < deadline
            XCTAssertEqual(markers(hosting), expected)
        }
        waitFor(["Tab A", "Detail A"])
        let revision = state.presentationRevision
        state.setState("$append", value: .boolean(true))
        waitFor(["Tab B", "Detail B"])
        XCTAssertEqual(state.presentationRevision, revision, "Arrival must update the existing presentation")
    }

    @MainActor func testDefaultTabsContentRefreshesWithAStandardFieldBinding() throws {
        _ = NSApplication.shared
        let marker = OpenUIComponent(
            name: "LocationMarker", description: "A native marker for the visible tab content",
            params: [OpenUIParameter.string("location")]
        ) { TabLocationMarker(location: $0.string("location") ?? "") }
        let library = try OpenUIStandardComponents.library().extending(adding: [marker])
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("""
        $day="ferry"
        panels=[TabItem("day2","Day two",[LocationMarker("academy")]),TabItem("day1","Day one",[LocationMarker($day)])]
        root=Stack([Tabs(panels),Input("selection",null,null,null,$day)])
        """)
        XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")

        func mount() -> (NSWindow, NSView) {
            let hosting = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry))
            let window = NSWindow(
                contentRect: NSRect(x: 0, y: 0, width: 420, height: 180), styleMask: [.borderless],
                backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false
            window.contentView = hosting
            window.setFrameOrigin(NSPoint(x: -10000, y: -10000))
            window.orderFront(nil)
            return (window, hosting)
        }
        func locations(in view: NSView) -> [String] {
            let own = (view as? NSTextField).flatMap {
                $0.identifier?.rawValue == "openui.test.tab-location" ? $0.stringValue : nil
            }
            return own.map { [$0] } ?? view.subviews.flatMap { locations(in: $0) }
        }
        func settle(_ view: NSView) {
            view.layoutSubtreeIfNeeded()
            RunLoop.main.run(until: Date().addingTimeInterval(0.1))
            view.layoutSubtreeIfNeeded()
        }

        let (inlineWindow, inline) = mount()
        defer { inlineWindow.close() }
        settle(inline)
        XCTAssertEqual(locations(in: inline), ["ferry"])
        let selection = try XCTUnwrap(state.binding(for: try XCTUnwrap(PropValue.children(try XCTUnwrap(state.root)).last), prop: "value"))

        selection.wrappedValue = .string("academy")
        XCTAssertEqual(state.stateValue("$day"), .string("academy"))
        settle(inline)
        XCTAssertEqual(locations(in: inline), ["academy"], "The selected panel must refresh after a shared field Binding write")

        // An expanded presentation reads the same state, without reconstructing inline.
        let (expandedWindow, expanded) = mount()
        defer { expandedWindow.close() }
        settle(expanded)
        XCTAssertEqual(locations(in: expanded), ["academy"])
        selection.wrappedValue = .string("ferry")
        XCTAssertEqual(state.stateValue("$day"), .string("ferry"))
        settle(inline)
        settle(expanded)
        XCTAssertEqual(locations(in: inline), ["ferry"])
        XCTAssertEqual(locations(in: expanded), ["ferry"], "Existing presentations must follow subsequent shared writes")
    }
}

private struct TabLocationMarker: NSViewRepresentable {
    let location: String
    func makeNSView(context: Context) -> NSTextField {
        let label = NSTextField(labelWithString: location)
        label.identifier = NSUserInterfaceItemIdentifier("openui.test.tab-location")
        return label
    }
    func updateNSView(_ view: NSTextField, context: Context) { view.stringValue = location }
}
#endif
