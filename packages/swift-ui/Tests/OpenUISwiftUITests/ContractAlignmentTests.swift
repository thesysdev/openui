import OpenUILang
import SwiftUI
import XCTest

@testable import OpenUISwiftUI

final class ContractAlignmentTests: XCTestCase {
    func testReferenceNamesAndCardArityAreCanonical() throws {
        let library = try OpenUIStandardComponents.library()
        let schema = library.library.toSchema()
        XCTAssertEqual(schema.components["TabItem"]?.map(\.name), ["value", "trigger", "content"])
        XCTAssertEqual(schema.components["Tabs"]?.map(\.name), ["items"])
        XCTAssertEqual(schema.components["Card"]?.map(\.name), ["children", "variant", "direction", "gap", "align", "justify", "wrap"])
        let upstream = LibrarySpec(json: OpenUIReference.catalog.field("spec")!)
        for expected in upstream.components {
            XCTAssertEqual(library.toSpec().components.first { $0.name == expected.name }?.signature, expected.signature, expected.name)
        }
    }

    @MainActor func testUpstreamTableCellsRetainNestedComponentValues() throws {
        let library = try OpenUIStandardComponents.library()
        let runtime = OpenUIState(schema: library.library.toSchema())
        runtime.setSource("""
            root=Table([
              Col("Category",[Stack([Icon("chart"),TextContent("Charts")],"row"),TextContent("Media")]),
              Col("Preview",[BarChart(["A","B"],[Series("Visits",[2,3])]),Image("Photo","https://example.invalid/photo.jpg")])
            ])
            """)
        XCTAssertTrue(runtime.errors.isEmpty, "\(runtime.errors)")
        let table = try XCTUnwrap(runtime.root)
        let columns = PropValue.children(table, "columns")
        XCTAssertEqual(columns.map(\.typeName), ["Col", "Col"])
        let first = try XCTUnwrap(PropValue.value(columns[0], "data"))
        let second = try XCTUnwrap(PropValue.value(columns[1], "data"))
        XCTAssertEqual(OpenUIRenderChild.children(of: first).compactMap { child in
            if case .element(let element) = child.value { return element.typeName }
            return nil
        }, ["Stack", "TextContent"])
        XCTAssertEqual(OpenUIRenderChild.children(of: second).compactMap { child in
            if case .element(let element) = child.value { return element.typeName }
            return nil
        }, ["BarChart", "Image"])
    }

    @MainActor func testUpstreamTabsNeedNoBindingAndCardComposesChildren() throws {
        let library = try OpenUIStandardComponents.library()
        let runtime = OpenUIState(schema: library.library.toSchema())
        runtime.setSource(
            "root=Stack([Tabs([TabItem(\"a\",\"Alpha\",[TextContent(\"A\")]),TabItem(\"b\",\"Beta\",[TextContent(\"B\")])]),Card([TextContent(\"Heading\"),Image(\"Photo\"),Buttons([Button(\"Continue\")])])])"
        )
        XCTAssertTrue(runtime.errors.isEmpty, "\(runtime.errors)")
        let tabs = try XCTUnwrap(PropValue.children(runtime.root!).first)
        XCTAssertNil(runtime.binding(for: tabs, prop: "value"))
        let panels = NativeTabPanel.read(OpenUIRenderChild.children(of: PropValue.value(tabs, "items")!))
        var local = NativeTabsSelection()
        local.reconcile(panels)
        XCTAssertEqual(local.selected, "b", "The complete snapshot follows the last growing item, as upstream does")
        local.choose("a")
        local.reconcile([
            panels[0], NativeTabPanel(id: "b", label: "Beta", content: .string("Longer streamed content")),
        ])
        XCTAssertEqual(local.selected, "a", "A user's choice must survive streaming updates")
        XCTAssertTrue(
            runtime.snapshotState().isEmpty, "Uncontrolled Tabs must not allocate a shared variable")
    }

    @MainActor func testMapAndStandardSelectShareStateWithoutExtraTabsParameters() throws {
        let library = try OpenUIMapComponents.library()
        let runtime = OpenUIState(schema: library.library.toSchema())
        let source = """
            $place="first"
            root=Stack([
              Map([{id:"first",title:"First",lat:30,lng:120},{id:"second",title:"Second",lat:31,lng:121}],[],$place),
              Select("place",[SelectItem("first","First"),SelectItem("second","Second")],null,null,$place)
            ])
            """
        runtime.setSource(source)
        XCTAssertTrue(runtime.errors.isEmpty, "\(runtime.errors)")
        var events = 0
        runtime.onAction = { _ in events += 1 }
        let children = PropValue.children(try XCTUnwrap(runtime.root))
        let map = try XCTUnwrap(runtime.binding(for: children[0], prop: "value"))
        let field = try XCTUnwrap(runtime.binding(for: children[1], prop: "value"))
        field.wrappedValue = .string("second")
        XCTAssertEqual(map.wrappedValue, .string("second"))
        map.wrappedValue = .string("first")
        XCTAssertEqual(field.wrappedValue, .string("first"))
        XCTAssertEqual(events, 0)
    }

    @MainActor func testNativeOnlyRegistrationsAreRemoved() throws {
        let library = try OpenUIStandardComponents.library()
        for name in ["Tab", "Section", "AdaptiveGroup", "NavigationLink"] {
            XCTAssertNil(library.registry[name], name)
            XCTAssertFalse(library.library.components.contains { $0.name == name })
        }
        let runtime = OpenUIState(schema: library.library.toSchema())
        runtime.setSource("root=Tab(\"a\",\"Old\",[])")
        XCTAssertFalse(runtime.errors.isEmpty)
    }

    @MainActor func testTypedAuthoringUsesPinnedCoreParameterOrder() throws {
        let bad = defineComponent(
            name: "Bad", description: "",
            params: [OpenUIParameter.string("optional", required: false), OpenUIParameter.string("required")])
        let ordered = try createLibrary(components: [bad])
        XCTAssertEqual(ordered.components.first?.params.map(\.name), ["optional", "required"])
        let library = try OpenUIStandardComponents.library()
        let invalid = OpenUIComponent(bad) { _ in EmptyView() }
        let extended = try library.extending(adding: [invalid])
        XCTAssertNotNil(extended.registry["Bad"], "Do not add native-only required-first validation")
        let runtime = OpenUIState(
            schema: compileLibrarySchema(try LibrarySpec(jsonString: library.toSpec().jsonString())))
        runtime.setSource(
            "root=Stack([SwitchGroup(\"preferences\",[SwitchItem(null,null,\"updates\",true)])])")
        XCTAssertTrue(runtime.errors.isEmpty, "\(runtime.errors)")
        let group = PropValue.children(runtime.root!)[0]
        let field = NativeFieldState(
            context: OpenUIComponentContext(element: group, registry: library.registry, state: runtime))
        field.initialize()
        XCTAssertTrue(field.toggle("updates").wrappedValue)
    }
}
