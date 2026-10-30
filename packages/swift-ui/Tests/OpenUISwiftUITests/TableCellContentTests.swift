import OpenUILang
import SwiftUI
import XCTest

@testable import OpenUISwiftUI

#if os(macOS)
import AppKit
#endif

final class TableCellContentTests: XCTestCase {
    func testDefaultTablePolicyKeepsTheUpstreamRegisteredCapabilities() throws {
        let library = try OpenUIStandardComponents.library()
        let cells = NativeTableCellContent.registry(from: library.registry, policy: .unrestricted)
        for name in ["Input", "Form", "FormControl", "Button", "Select", "Table", "Card", "Image"] {
            XCTAssertNotNil(cells[name], name)
        }
    }
    func testReadOnlyRegistryKeepsPresentationAndExcludesInputActionAndHeavyContainers() throws {
        let library = try installingPresentation(into: OpenUIMapComponents.library())
        let cells = NativeTableCellContent.registry(from: library.registry, policy: .readOnly)
        for name in ["TextContent", "Icon", "Tag", "Image", "MetricIndicatorInline",
                     "MetricIndicatorWithStrikethrough", "BarChart", "LineChart", "SVG", "Stack", "Popover"] {
            XCTAssertNotNil(cells[name], name)
        }
        for name in ["Input", "TextArea", "Form", "FormControl", "EditableTable", "Select", "DatePicker",
                     "Slider", "CheckBoxGroup", "RadioGroup", "SwitchGroup", "Chips", "OptionCards",
                     "Button", "Buttons", "IconButton", "Table", "Card", "Tabs", "Carousel",
                     "Map", "WebView", "ImageGallery", "MarkDownRenderer", "CompositeCardBlock"] {
            XCTAssertNotNil(library.registry[name], "Original registration must remain available: \(name)")
            XCTAssertNil(cells[name], "Cannot mount inside a table cell: \(name)")
        }
    }

    @MainActor func testComposedCellsKeepTheirChartDataAndOriginalLanguageContract() throws {
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("""
            root=Table([
              Col("Summary",[Stack([Icon("clock"),TextContent("45 minutes"),Tag("Ready")],"row")]),
              Col("Trend",[BarChart(["A","B"],[Series("Visits",[2,3])])])
            ])
            """)
        XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
        let columns = PropValue.children(try XCTUnwrap(state.root), "columns")
        let chart = try XCTUnwrap(PropValue.children(columns[1], "data").first)
        let series = try XCTUnwrap(PropValue.children(chart, "series").first)
        XCTAssertEqual(series.typeName, "Series")
        XCTAssertEqual(PropValue.string(series, "category"), "Visits")
        XCTAssertEqual(PropValue.value(series, "values"), .array([.number(2), .number(3)]))
        let upstream = try XCTUnwrap(OpenUIReference.definitions.first { $0.name == "Col" })
        let actual = try XCTUnwrap(library.library.components.first { $0.name == "Col" })
        XCTAssertEqual(actual.params.map(\.schema), upstream.params.map(\.schema))
    }

    #if os(macOS)
    @MainActor func testNestedTableFieldsNeverMountWhileOutsideFieldStillInitializes() throws {
        _ = NSApplication.shared
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("""
            root=Stack([
              Table([Col("Cells",[
                Input("direct",null,"text",null,"blocked"),
                [Input("array",null,"text",null,"blocked")],
                Stack([TextContent("Visible"),Input("nested",null,"text",null,"blocked")]),
                Form("blockedForm",Buttons([Button("Submit",@ToAssistant("blocked"))]),[
                  FormControl("Blocked",Input("formField",null,"text",null,"blocked"))])
              ])]),
              Input("outside",null,"text",null,"ready")
            ])
            """)
        XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
        let hosting = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry).openUITableCellPolicy(.readOnly))
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 360, height: 600),
                              styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = hosting
        window.setFrameOrigin(NSPoint(x: -10000, y: -10000))
        window.orderFront(nil)
        defer { window.close() }
        hosting.layoutSubtreeIfNeeded()
        RunLoop.main.run(until: Date().addingTimeInterval(0.2))
        XCTAssertEqual(state.fieldValue(form: nil, name: "outside"), .string("ready"))
        for name in ["direct", "array", "nested"] {
            XCTAssertEqual(state.fieldValue(form: nil, name: name, fallback: .undefined), .undefined, name)
        }
        XCTAssertEqual(state.fieldValue(form: "blockedForm", name: "formField", fallback: .undefined), .undefined)
    }
    #endif
}
