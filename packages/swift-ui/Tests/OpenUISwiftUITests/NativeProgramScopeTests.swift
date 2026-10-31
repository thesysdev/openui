#if os(macOS)
import AppKit
import OpenUILang
import SwiftUI
import XCTest
import WebKit
@testable import OpenUISwiftUI

final class NativeProgramScopeTests: XCTestCase {
    @MainActor func testReplacingTheStateOwnerDoesNotReuseItsNativeLocalState() throws {
        _ = NSApplication.shared
        let standard = try OpenUIStandardComponents.library()
        let definition = try XCTUnwrap(standard.library.components.first { $0.name == "TextContent" })
        let library = try standard.extending(overriding: [OpenUIComponent(definition) { context in
            ProgramScopeMarker(text: context.string("text") ?? "")
        }])
        let a = OpenUIState(schema: library.library.toSchema()), b = OpenUIState(schema: library.library.toSchema())
        a.setSource("root=TextContent(\"Same text\")"); b.setSource("root=TextContent(\"Same text\")")
        let hosting = NSHostingView(rootView: OpenUIRenderer(state: a, registry: library.registry).frame(width: 350, height: 100))
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 350, height: 100), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false; window.contentView = hosting
        hosting.frame = NSRect(x: 0, y: 0, width: 350, height: 100)
        window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
        defer { window.close() }
        func marker(_ view: NSView) -> NSTextField? {
            if let label = view as? NSTextField, label.identifier?.rawValue == "program-scope-marker" { return label }
            return view.subviews.lazy.compactMap(marker).first
        }
        hosting.layoutSubtreeIfNeeded(); RunLoop.main.run(until: Date().addingTimeInterval(0.15))
        let original = try XCTUnwrap(marker(hosting))
        hosting.rootView = OpenUIRenderer(state: b, registry: library.registry).frame(width: 350, height: 100)
        hosting.layoutSubtreeIfNeeded(); RunLoop.main.run(until: Date().addingTimeInterval(0.15))
        let replacement = try XCTUnwrap(marker(hosting))
        XCTAssertFalse(original === replacement, "A new state owner is a new presentation even when source and revision match")
    }

    @MainActor func testLazyCustomContainerKeepsTwoIndependentSVGSurfaces() throws {
        _ = NSApplication.shared
        let grid = OpenUIComponent(name: "NativeGrid", description: "Test container", params: [
            OpenUIParameter.slot("children", required: true),
        ]) { context in
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())]) { context.slot() }
        }
        let library = try OpenUIWebComponents.install(into: OpenUIStandardComponents.library().extending(adding: [grid]))
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("""
            root=NativeGrid([
              SVG("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 50'><text x='8' y='30'>A</text></svg>",null,"A",64),
              SVG("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 50'><text x='8' y='30'>B</text></svg>",null,"B",64)
            ])
            """)
        XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
        let hosting = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry))
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 380, height: 180),
            styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = hosting
        window.setFrameOrigin(NSPoint(x: -10000, y: -10000))
        window.orderFront(nil)
        defer { window.close() }
        hosting.layoutSubtreeIfNeeded()
        RunLoop.main.run(until: Date().addingTimeInterval(0.2))
        func count(_ view: NSView) -> Int {
            view is WKWebView ? 1 : view.subviews.reduce(0) { $0 + count($1) }
        }
        XCTAssertEqual(count(hosting), 2, "Embedded configuration identities must be per instance")
    }
    @MainActor func testLazyContainersKeepSiblingsAndIndependentProgramRoots() throws {
        _ = NSApplication.shared
        let markers = OpenUIStandardComponents.components.filter {
            ["IconText", "TextContent"].contains($0.definition.name)
        }.map { component in
            OpenUIComponent(component.definition) { context in
                ProgramScopeMarker(text: context.string(component.definition.name == "IconText" ? "title" : "text") ?? "")
            }
        }
        let library = try OpenUIStandardComponents.library().extending(overriding: markers)
        let first = OpenUIState(schema: library.library.toSchema())
        let second = OpenUIState(schema: library.library.toSchema())
        func source(_ title: String) -> String {
            "root=Stack([OverviewCardBlock([OverviewCardItem(\"first\",IconText(Icon(\"file\"),\"neutral\",\"m\",\"\(title)\")),OverviewCardItem(\"second\",IconText(Icon(\"image\"),\"neutral\",\"m\",\"Second\"))])])"
        }
        first.setSource(source("First"))
        second.setSource("root=TextContent(\"Independent\")")
        XCTAssertTrue(first.errors.isEmpty)
        XCTAssertTrue(second.errors.isEmpty)
        let hosting = NSHostingView(rootView: ScrollView {
            LazyVStack {
                OpenUIRenderer(state: first, registry: library.registry)
                OpenUIRenderer(state: second, registry: library.registry)
            }
        })
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 380, height: 400),
            styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = hosting
        window.setFrameOrigin(NSPoint(x: -10000, y: -10000))
        window.orderFront(nil)
        defer { window.close() }
        func labels(_ view: NSView) -> [NSTextField] {
            if let label = view as? NSTextField, label.identifier?.rawValue == "program-scope-marker" { return [label] }
            return view.subviews.flatMap(labels)
        }
        func settle() {
            hosting.layoutSubtreeIfNeeded()
            RunLoop.main.run(until: Date().addingTimeInterval(0.15))
        }
        settle()
        let initial = labels(hosting)
        XCTAssertEqual(Set(initial.map(\.stringValue)), ["First", "Second", "Independent"])
        let independent = try XCTUnwrap(initial.first { $0.stringValue == "Independent" })
        first.setSource(source("Replacement"))
        settle()
        let updated = labels(hosting)
        XCTAssertEqual(Set(updated.map(\.stringValue)), ["Replacement", "Second", "Independent"])
        XCTAssertTrue(updated.first { $0.stringValue == "Independent" } === independent,
                      "Replacing one program must not reset another renderer's native views")
    }
}

private struct ProgramScopeMarker: NSViewRepresentable {
    let text: String
    func makeNSView(context: Context) -> NSTextField {
        let field = NSTextField(labelWithString: text)
        field.identifier = NSUserInterfaceItemIdentifier("program-scope-marker")
        return field
    }
    func updateNSView(_ field: NSTextField, context: Context) { field.stringValue = text }
}
#endif
