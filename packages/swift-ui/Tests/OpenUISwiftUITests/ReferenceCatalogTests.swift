import OpenUILang
import SwiftUI
import XCTest

@testable import OpenUISwiftUI

final class ReferenceCatalogTests: XCTestCase {
  // Zod's official JSON importer represents singleton enums as const. This is
  // JSON Schema equivalence, not an extra native rule or a wire-format patch.
  private static func canonicalSchema(_ value: JSONValue) -> JSONValue {
    switch value {
    case .array(let items): return .array(items.map(canonicalSchema))
    case .object(let fields):
      let one = fields.first { $0.key == "enum" }?.value.arrayItems
      var result = fields.filter { !(one?.count == 1 && $0.key == "enum") }
        .map { JSONField(key: $0.key, value: canonicalSchema($0.value)) }
      if let one, one.count == 1 { result.append(JSONField(key: "const", value: one[0])) }
      return .object(result)
    default: return value
    }
  }

  func testModelCatalogCanExcludeEditingWithoutRemovingInstalledRendering() throws {
    let installed = try OpenUIStandardComponents.library()
    var generation = try installed.library.extend(
      LibraryExtension(removeComponents: ["EditableTable"]))
    // Full-catalog prose is not executable schema. A host using a subset
    // supplies matching notes/examples; this minimal policy omits notes.
    generation.componentGroups = generation.componentGroups?.map { group in
      var group = group
      group.notes = nil
      return group
    }
    XCTAssertNotNil(installed.registry["EditableTable"])
    XCTAssertEqual(installed.library.components.count, 82)
    XCTAssertEqual(generation.components.count, 81)
    XCTAssertFalse(generation.toSpec().components.contains { $0.name == "EditableTable" })
    XCTAssertFalse(
      generation.componentGroups?.contains { $0.components.contains("EditableTable") } ?? true)
    XCTAssertNil(generation.toSchema().components["EditableTable"])
    XCTAssertFalse(generation.prompt().contains("EditableTable"))
  }

  func testEditableTableDraftResetAndSaveUsePositionalUpstreamData() throws {
    let initial = jsonToValue(
      try parseJSONPreservingOrder(
        "[{\"id\":\"row-a\",\"values\":[\"Alpha\",2,\"2026-10-22\",\"draft\",\"https://example.com\"]}]"
      ))
    var draft = NativeTableDraft()
    draft.load(initial)
    draft.write(.number(4), row: 0, column: 1)
    draft.write(.string("ready"), row: 0, column: 3)
    XCTAssertEqual(draft.changes(columns: 5), 2)
    draft.reset()
    XCTAssertEqual(draft.value, initial)
    XCTAssertEqual(draft.changes(columns: 5), 0)
    draft.write(.string("Beta"), row: 0, column: 0)
    let saved = draft.value
    draft.commit()
    XCTAssertEqual(draft.changes(columns: 5), 0)
    var restored = NativeTableDraft()
    restored.load(saved)
    XCTAssertEqual(restored.value(row: 0, column: 0), .string("Beta"))
    XCTAssertEqual(restored.rows.first?.id, "row-a")
  }

  func testAll82RenderersUseThePinnedUpstreamDefinitions() throws {
    let library = try OpenUIStandardComponents.library()
    XCTAssertEqual(library.library.components.count, 82)
    XCTAssertEqual(library.library.components.map(\.name), OpenUIReference.definitions.map(\.name))
    for expected in OpenUIReference.definitions {
      let actual = try XCTUnwrap(library.library.components.first { $0.name == expected.name })
      XCTAssertNotNil(library.registry[expected.name])
      XCTAssertEqual(actual.description, expected.description, expected.name)
      XCTAssertEqual(actual.params.map(\.name), expected.params.map(\.name), expected.name)
      for (a, b) in zip(actual.params, expected.params) {
        XCTAssertEqual(
          a.schema.map(Self.canonicalSchema), b.schema.map(Self.canonicalSchema),
          "\(expected.name).\(a.name)")
        XCTAssertEqual(a.required && !a.hasDefault, b.required && !b.hasDefault,
                       "\(expected.name).\(a.name): requiredness includes defaults")
        XCTAssertEqual(a.defaultValue, b.defaultValue, "\(expected.name).\(a.name)")
        XCTAssertEqual(a.isBindable, b.isBindable, "\(expected.name).\(a.name)")
      }
    }
  }

  @MainActor func testNewSelectionFieldsValidateSubmitAndRestore() async throws {
    let library = try OpenUIStandardComponents.library()
    let source = """
      root=Form("preferences",Buttons([Button("Submit",@ToAssistant("saved"))]),[
        FormControl("Tags",Chips("tags","multiple",[ChipItem("a","Alpha"),ChipItem("b","Beta",null,true),ChipItem("c","Gamma")],{required:true},["a"])),
        FormControl("Plan",OptionCards("plan","single",[OptionCard("rail","Rail","Fast",Icon("train")),OptionCard("air","Air")],{required:true},"rail"))
      ])
      """
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource(source)
    XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    let form = try XCTUnwrap(state.root)
    let controls = OpenUIRenderChild.children(of: PropValue.value(form, "fields")!)
    let fields = try controls.map { control -> NativeFieldState in
      guard case .element(let c) = control.value,
        case .element(let input) = PropValue.value(c, "input")
      else { throw NSError(domain: "fixture", code: 1) }
      return NativeFieldState(
        context: OpenUIComponentContext(
          element: input, registry: library.registry, state: state, formName: "preferences"))
    }
    fields.forEach { $0.initialize() }
    XCTAssertEqual(fields[0].value, .array([.string("a")]))
    XCTAssertEqual(fields[1].value, .string("rail"))
    fields[0].write(NativeChoiceSelection.toggle("a", value: fields[0].value, single: false))
    XCTAssertNotNil(OpenUILang.validate(fields[0].validationValue, rules: fields[0].rules))
    fields[0].write(NativeChoiceSelection.toggle("c", value: fields[0].value, single: false))
    fields[1].write(NativeChoiceSelection.toggle("air", value: fields[1].value, single: true))
    XCTAssertNil(OpenUILang.validate(fields[0].validationValue, rules: fields[0].rules))
    let events = await state.perform(
      OpenUIActions.continueConversation("saved"), formName: "preferences")
    let payload = events.first?.formState?.first { $0.0 == "preferences" }?.1
    XCTAssertEqual(
      NativeValue.prop(NativeValue.prop(payload, "tags"), "value"), .array([.string("c")]))
    XCTAssertEqual(NativeValue.prop(NativeValue.prop(payload, "plan"), "value"), .string("air"))
    let restored = OpenUIState(
      schema: library.library.toSchema(), persistedState: state.snapshotState())
    restored.setSource(source)
    XCTAssertEqual(restored.snapshotState(), state.snapshotState())
    state.reset()
    fields[1].write(.string("rail"))
    XCTAssertTrue(state.snapshotState().isEmpty, "Stale controls cannot write into a new source")
  }

  @MainActor func testChartDataSupportsReferencesAndNegativeValues() throws {
    let library = try OpenUIStandardComponents.library()
    let programs = [
      "root=BarChart([\"A\",\"B\"],[Series(\"First\",[-2,4]),Series(\"Second\",[3])],\"stacked\")",
      "root=ScatterChart([ScatterSeries(\"Points\",[Point(-2,3,4),Point(5,-6)])],\"X\",\"Y\")",
      "root=PieChart([\"A\",\"B\"],[2,3],\"donut\",\"semiCircular\")",
    ]
    for source in programs {
      let state = OpenUIState(schema: library.library.toSchema())
      state.setSource(source)
      XCTAssertTrue(state.errors.isEmpty, "\(source): \(state.errors)")
      let data = NativeChartData(
        context: OpenUIComponentContext(
          element: try XCTUnwrap(state.root), registry: library.registry, state: state))
      XCTAssertFalse(data.accessibilityRows.isEmpty)
      if source.contains("BarChart") {
        XCTAssertEqual(data.value(0, 0), -2)
        XCTAssertEqual(data.value(1, 1), 0)
      }
      if source.contains("ScatterChart") { XCTAssertEqual(data.scatter.first?.points.last?.y, -6) }
    }
  }

  @MainActor func testChartReferenceSlotsKeepUpstreamObjectRejection() throws {
    let library = try OpenUIStandardComponents.library()
    for source in [
      "root=BarChart([\"A\"],[{category:\"S\",values:[1]}])",
      "root=ScatterChart([ScatterSeries(\"S\",[{x:1,y:2}])])",
    ] {
      let state = OpenUIState(schema: library.library.toSchema())
      state.setSource(source)
      XCTAssertTrue(
        state.errors.contains { $0.code == .typeMismatch },
        "Match the pinned TypeScript parser; do not accept a native-only object spelling")
    }
  }

  @MainActor func testModalAndCalloutBindingsUseSharedStateAndRespectStaleSources() throws {
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource(
      "$open=true\n$visible=true\nroot=Stack([Modal(\"Details\",$open,[TextContent(\"Content\")]),Callout(\"success\",\"Saved\",\"Done\",$visible)])"
    )
    XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    let children = PropValue.children(state.root!)
    let modal = OpenUIComponentContext(
      element: children[0], registry: library.registry, state: state)
    let callout = OpenUIComponentContext(
      element: children[1], registry: library.registry, state: state)
    try XCTUnwrap(modal.binding("open")).wrappedValue = .boolean(false)
    try XCTUnwrap(callout.binding("visible")).wrappedValue = .boolean(false)
    XCTAssertEqual(state.stateValue("$open"), .boolean(false))
    XCTAssertEqual(state.stateValue("$visible"), .boolean(false))
    state.setSource("$open=true\nroot=Modal(\"Other\",$open,[])")
    state.setState("$open", value: .boolean(true))
    modal.binding("open")?.wrappedValue = .boolean(false)
    XCTAssertEqual(state.stateValue("$open"), .boolean(true))
  }

  @MainActor func testCardActionsPreserveStepsAndAttachTheClickedItem() async throws {
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource(
      "$selected=false\nroot=ContextCardBlock([ContextCardItem(\"a\",\"Alpha\",\"First\"),ContextCardItem(\"b\",\"Beta\",\"Second\")],\"grid\",true,Action([@Set($selected,true),@ToAssistant(\"inspect\",\"base\")]))"
    )
    XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    let root = try XCTUnwrap(state.root)
    let items = NativeValue.array(PropValue.value(root, "items"))
    let action = NativeCardAction.action(
      PropValue.value(root, "action")!, item: items[1], kind: "Context", index: 1)
    let events = await state.triggerAction("Beta", action: action)
    XCTAssertEqual(state.stateValue("$selected"), .boolean(true))
    guard case .string(let context) = events.first?.params.first(where: { $0.0 == "context" })?.1
    else { return XCTFail("Missing item context") }
    XCTAssertTrue(context.displayString.hasPrefix("base\nSelected item: "))
    XCTAssertTrue(context.displayString.contains("\"itemId\":\"b\""))
    XCTAssertTrue(context.displayString.contains("\"itemTitle\":\"Beta\""))
  }

  @MainActor func testCardActionPreservesStructuredContextAsJSON() async throws {
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource(
      "root=ContextCardBlock([ContextCardItem(\"a\",\"Alpha\"),ContextCardItem(\"b\",\"Beta\")],\"grid\",true,@ToAssistant(\"inspect\",{source:\"catalog\",count:2}))"
    )
    XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    let root = try XCTUnwrap(state.root)
    let item = try XCTUnwrap(NativeValue.array(PropValue.value(root, "items")).first)
    let action = NativeCardAction.action(
      try XCTUnwrap(PropValue.value(root, "action")), item: item, kind: "Context", index: 0)
    let events = await state.triggerAction("Alpha", action: action)
    guard case .string(let context) = events.first?.params.first(where: { $0.0 == "context" })?.1
    else { return XCTFail("Missing context") }
    XCTAssertTrue(
      context.displayString.hasPrefix("{\"source\":\"catalog\",\"count\":2}\nSelected item: "))
  }
}
