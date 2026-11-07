import XCTest
import SwiftUI
import OpenUILang
@testable import OpenUISwiftUI

final class ComponentLibraryTests: XCTestCase {
    @MainActor func testStandardSelectionsShareStateWithoutHostActions() throws {
        let library = try OpenUIStandardComponents.library()
        let source = """
        $choice = "notes"
        panels = [SelectItem("notes", "笔记"), SelectItem("files", "文件")]
        root = Stack([Select("inline",panels,null,null,$choice), Card([Select("detail",panels,null,null,$choice)])])
        """
        let runtime = OpenUIState(schema: compileLibrarySchema(library.toSpec()))
        var actions = 0, changes = 0
        runtime.onAction = { _ in actions += 1 }
        runtime.onStateUpdate = { _ in changes += 1 }
        runtime.setSource(source)
        XCTAssertTrue(runtime.errors.isEmpty, "\(runtime.errors)")
        let children = PropValue.children(try XCTUnwrap(runtime.root))
        let inline = try XCTUnwrap(children.first)
        let detail = try XCTUnwrap(PropValue.children(children[1]).first)
        let first = try XCTUnwrap(runtime.binding(for: inline, prop: "value"))
        let second = try XCTUnwrap(runtime.binding(for: detail, prop: "value"))
        XCTAssertEqual(first.wrappedValue, .string("notes"))
        second.wrappedValue = .string("files")
        XCTAssertEqual(first.wrappedValue, .string("files"))
        XCTAssertEqual(actions, 0)
        XCTAssertEqual(changes, 1)
        let restored = OpenUIState(schema: library.library.toSchema(), persistedState: runtime.snapshotState())
        restored.setSource(source)
        XCTAssertEqual(restored.stateValue("$choice"), .string("files"))
        XCTAssertTrue(library.toSpec().components.first(where: { $0.name == "Select" })?.signature.contains("$binding<string>") == true)
    }

    func testRegistrationKeepsSchemaAndRendererTogether() throws {
        let component = OpenUIComponent(defineComponent(name: "Note", description: "A note", params: [
            OpenUIParameter.string("text")
        ])) { context in Text(context.string("text") ?? "") }
        let library = try OpenUIComponentLibrary(components: [component], root: "Note")
        XCTAssertNotNil(library.registry["Note"])
        XCTAssertEqual(library.library.toSchema().components["Note"]?.map(\.name), ["text"])
        XCTAssertTrue(library.prompt().contains("Note(text: string)"))
        let repeated = try OpenUIComponentLibrary(components: [component, component])
        XCTAssertEqual(repeated.library.components.count, 1, "The core's name-keyed catalog keeps the final definition")
        XCTAssertNotNil(repeated.registry["Note"])
        XCTAssertThrowsError(try OpenUIComponentLibrary(components: [component], root: "Missing"))
    }

    func testStandardPositionalContractsAndActionsAreExported() throws {
        let library = try OpenUIStandardComponents.library()
        let schema = library.library.toSchema()
        XCTAssertEqual(schema.components["Stack"]?.map(\.name), ["children", "direction", "gap", "align", "justify", "wrap"])
        XCTAssertEqual(schema.components["Card"]!.map(\.name), ["children", "variant", "direction", "gap", "align", "justify", "wrap"])
        XCTAssertEqual(schema.components["Image"]?.map(\.name), ["alt", "src"])
        XCTAssertTrue(library.prompt().contains("@OpenUrl"))
        for component in library.library.components { XCTAssertNotNil(library.registry[component.name], component.name) }
    }

    @MainActor func testBusinessComponentExtendsAnExistingNamedSlot() throws {
        let container = OpenUIComponent(defineComponent(name: "NoteContainer", description: "Host-defined typed slot", params: [
            OpenUIParameter.slot("children", required: true, accepting: ["TextContent"])
        ])) { $0.slot() }
        let base = try OpenUIStandardComponents.library().extending(adding: [container])
        let badge = OpenUIComponent(defineComponent(name: "Badge", description: "A badge", params: [
            OpenUIParameter.string("text")
        ])) { Text($0.string("text") ?? "") }
        let extended = try base.extending(adding: [badge], slots: ["Badge": ["NoteContainer.children"]])
        XCTAssertNil(base.registry["Badge"])
        XCTAssertNotNil(extended.registry["Badge"])
        let schema = compileLibrarySchema(extended.toSpec())
        let state = OpenUIState(schema: schema)
        state.setSource("root = NoteContainer([TextContent('Body'), Badge('New')])")
        XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
        XCTAssertEqual(PropValue.children(state.root!).map(\.typeName), ["TextContent", "Badge"])
        let removed = try extended.extending(removing: ["Badge"])
        XCTAssertNil(removed.registry["Badge"])
        XCTAssertNil(removed.library.toSchema().components["Badge"])
    }

    func testStableResourceIdentitySurvivesReorderingAndNestedArrays() {
        func card(_ id: String, title: String) -> Value {
            .element(EvaluatedElement(typeName: "HotelCard", props: [("resourceId", .string(id)), ("title", .string(title))], statementId: "itemTemplate"))
        }
        let a = card("a", title: "Original")
        let b = card("b", title: "Second")
        let before = OpenUIRenderChild.children(of: .array([a, .array([b])]))
        let after = OpenUIRenderChild.children(of: .array([b, card("a", title: "Changed")]))
        XCTAssertEqual(before[0].id, after[1].id)
        XCTAssertEqual(before[1].id, after[0].id)
        XCTAssertEqual(Set(before.map(\.id)).count, 2)
        XCTAssertEqual(OpenUIRenderChild.children(of: .array([.null, .undefined, .string("text")])).count, 1)
    }

    func testExplicitKeysSeparateRepeatedResourceInstances() {
        let values = ["first", "second"].map { key in
            Value.element(EvaluatedElement(typeName: "Card", props: [("key", .string(key)), ("resourceId", .string("same-resource"))]))
        }
        let before = OpenUIRenderChild.children(of: .array(values))
        let after = OpenUIRenderChild.children(of: .array(Array(values.reversed())))
        XCTAssertEqual(before[0].id, after[1].id)
        XCTAssertNotEqual(before[0].id, before[1].id)
    }

    func testSemanticKeysRetainExactUTF16Identity() {
        let keys = [OpenUIString("é"), OpenUIString("e\u{301}"), OpenUIString(codeUnits: [0xD800]), OpenUIString("\u{FFFD}")]
        let values = keys.map { Value.element(EvaluatedElement(typeName: "Card", props: [("key", .string($0))])) }
        let children = OpenUIRenderChild.children(of: .array(values))
        let reversed = OpenUIRenderChild.children(of: .array(Array(values.reversed())))
        XCTAssertEqual(Set(children.map(\.id)).count, keys.count)
        XCTAssertEqual(children.map(\.id), reversed.reversed().map(\.id))
    }

    func testTabValuesRetainIdentityAcrossReorderingAndUnicodeVariants() {
        let values = [OpenUIString("é"), OpenUIString("e\u{301}")].map { value in
            Value.element(EvaluatedElement(typeName: "TabItem", props: [("value", .string(value)), ("trigger", .string("Panel"))]))
        }
        let children = OpenUIRenderChild.children(of: .array(values))
        let reversed = OpenUIRenderChild.children(of: .array(Array(values.reversed())))
        XCTAssertNotEqual(children[0].id, children[1].id)
        XCTAssertEqual(children.map(\.id), reversed.reversed().map(\.id))
    }

    @MainActor func testContextSeparatesDisplayStringsAndSemanticData() throws {
        let library = try OpenUIStandardComponents.library()
        let half = OpenUIString(codeUnits: [0xD800])
        let element = EvaluatedElement(typeName: "TextContent", props: [("text", .string(half))])
        let context = OpenUIComponentContext(element: element, registry: library.registry,
            state: OpenUIState(schema: library.library.toSchema()), resources: ["é": .number(1)])
        XCTAssertEqual(context.codeUnitString("text"), half)
        XCTAssertEqual(context.string("text"), "\u{FFFD}")
        XCTAssertEqual(context.value("text"), .string(half))
        XCTAssertEqual(context.resource(OpenUIString("é")), .number(1))
        XCTAssertNil(context.resource(OpenUIString("e\u{301}")))
    }

    func testFlowWrapRespondsToContainerWidth() {
        let sizes = [CGSize(width: 140, height: 60), CGSize(width: 140, height: 80), CGSize(width: 140, height: 50)]
        let narrow = OpenUIFlowPlacement.frames(sizes: sizes, width: 280, gap: 16, align: "start", justify: "start")
        let wide = OpenUIFlowPlacement.frames(sizes: sizes, width: 600, gap: 16, align: "start", justify: "start")
        XCTAssertGreaterThan(narrow[1].minY, narrow[0].minY)
        XCTAssertEqual(wide[2].minY, 0)
        XCTAssertTrue(narrow.allSatisfy { $0.maxX <= 280 })
        XCTAssertTrue(wide.allSatisfy { $0.maxX <= 600 })
    }

    func testFlowJustificationAndAlignment() {
        let frames = OpenUIFlowPlacement.frames(sizes: [CGSize(width: 40, height: 20), CGSize(width: 40, height: 40)],
                                               width: 200, gap: 8, align: "center", justify: "between")
        XCTAssertEqual(frames[0].minX, 0)
        XCTAssertEqual(frames[1].maxX, 200)
        XCTAssertEqual(frames[0].minY, 10)
    }

    @MainActor func testContextUsesOneRuntimeForResourcesBindingsAndActions() throws {
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("$selected = 'a'\nroot = Button('Details', @OpenUrl('https://example.com/hotel/a'))")
        let resources: [String: Value] = ["hotel-a": .object([ObjectField(key: "title", value: .string("Hotel A"))])]
        let context = OpenUIComponentContext(element: state.root!, registry: library.registry, state: state, resources: resources)
        XCTAssertEqual(context.resource("hotel-a"), resources["hotel-a"])
        XCTAssertTrue(context.canInteract)
        var received: [ActionEvent] = []
        state.onAction = { received.append($0) }
        let finished = expectation(description: "One host action")
        Task { @MainActor in
            await context.perform(context.action()!)
            XCTAssertEqual(received.count, 1)
            XCTAssertEqual(received.first?.type, "open_url")
            XCTAssertEqual(received.first?.params.first(where: { $0.0 == "url" })?.1, .string("https://example.com/hotel/a"))
            let snapshot = state.snapshotState()
            state.setState("$selected", value: .string("b"))
            state.restoreState(snapshot)
            XCTAssertEqual(state.stateValue("$selected"), .string("a"))
            finished.fulfill()
        }
        wait(for: [finished], timeout: 3)
    }

    @MainActor func testStreamingCannotDispatchHostActions() throws {
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("root = TextContent('Loading')", streaming: true)
        let context = OpenUIComponentContext(element: state.root!, registry: library.registry, state: state)
        XCTAssertFalse(context.canInteract)
        let finished = expectation(description: "Streaming action stays inactive")
        Task { @MainActor in
            let events = await context.perform(OpenUIActions.openURL("https://example.com"))
            XCTAssertTrue(events.isEmpty)
            finished.fulfill()
        }
        wait(for: [finished], timeout: 3)
    }

    @MainActor func testContextPreservesFormScopeAndLegacyActionDispatch() throws {
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("root = Button('Details', {type: 'open_url', url: 'https://example.com/ticket'})")
        let context = OpenUIComponentContext(element: state.root!, registry: library.registry, state: state, formName: "trip")
        context.initializeField("date", value: .string("original"))
        context.fieldBinding("date").wrappedValue = .string("edited")
        context.initializeField("date", value: .string("replacement"))
        XCTAssertEqual(context.fieldValue("date"), .string("edited"))
        var received: [ActionEvent] = []
        state.onAction = { received.append($0) }
        let finished = expectation(description: "Scoped legacy action")
        Task { @MainActor in
            await context.triggerAction("Details", action: context.value("action"))
            XCTAssertEqual(received.count, 1)
            XCTAssertEqual(received[0].type, "open_url")
            XCTAssertEqual(received[0].formName, "trip")
            finished.fulfill()
        }
        wait(for: [finished], timeout: 3)
    }
}
