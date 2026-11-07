import OpenUILang
import XCTest
@testable import OpenUISwiftUI

final class TableDispatchBoundaryTests: XCTestCase {
  @MainActor private func fixture(streaming: Bool = false) throws -> (OpenUIState, OpenUIComponentContext) {
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    if streaming { state.push("root=Stack([EditableTable(\"orders\",[],[]),TextContent(\"unfinished") }
    else { state.setSource("root=EditableTable(\"orders\",[],[])") }
    let root = try XCTUnwrap(state.root)
    let element = streaming ? try XCTUnwrap(PropValue.children(root).first) : root
    return (state, OpenUIComponentContext(element: element, registry: library.registry, state: state))
  }

  private var rows: Value {
    .array([.object([.init(key: "id", value: .string("r1")),
      .init(key: "values", value: .array([.string("updated")]))])])
  }

  @MainActor func testCommitPreservesTheExistingTableFormPayload() async throws {
    let (state, context) = try fixture()
    let events = await context.commitFieldAndTrigger("Save Changes", form: "orders",
      name: "orders", value: rows, componentType: "EditableTable")
    XCTAssertEqual(events.count, 1)
    let event = try XCTUnwrap(events.first)
    XCTAssertEqual(event.type, "continue_conversation")
    XCTAssertEqual(event.humanFriendlyMessage, "Save Changes")
    XCTAssertEqual(event.formName, "orders")
    XCTAssertEqual(event.formState?.count, 1)
    XCTAssertEqual(event.formState?.first?.0, "orders")
    XCTAssertEqual(try state.fieldValue(form: "orders", name: "orders").jsonValue(), try rows.jsonValue())
    XCTAssertEqual(try event.formState?.first?.1.jsonValue(), try state.stateValue("orders").jsonValue())
  }

  @MainActor func testCommittedTableUsesPerComponentReadinessWhileTheRestStreams() async throws {
    let (state, context) = try fixture(streaming: true)
    XCTAssertFalse(state.isComplete)
    XCTAssertTrue(context.canInteract)
    let events = await context.commitFieldAndTrigger("Save Changes", form: "orders",
      name: "orders", value: rows, componentType: "EditableTable")
    XCTAssertEqual(events.count, 1, "A ready table must use the same readiness policy as a ready button")
    XCTAssertFalse(state.isComplete)
  }

  @MainActor func testOldPresentationCannotCommitIntoTheReplacementAnswer() async throws {
    let (state, context) = try fixture()
    state.setSource("root=TextContent(\"Replacement\")")
    var received = 0
    state.onAction = { _ in received += 1 }
    let events = await context.commitFieldAndTrigger("Save Changes", form: "orders",
      name: "orders", value: rows, componentType: "EditableTable")
    XCTAssertTrue(events.isEmpty)
    XCTAssertEqual(state.stateValue("orders"), .null)
    XCTAssertEqual(received, 0)
  }

  @MainActor func testReadingDragCannotCommitOrDispatch() async throws {
    let (state, original) = try fixture()
    let intent = NativeActivationIntent()
    intent.moved()
    var context = original
    context.activationIntent = intent
    XCTAssertTrue(context.canInteract)
    XCTAssertFalse(context.canActivate)
    let events = await context.commitFieldAndTrigger("Save Changes", form: "orders",
      name: "orders", value: rows, componentType: "EditableTable")
    XCTAssertTrue(events.isEmpty)
    XCTAssertEqual(state.stateValue("orders"), .null)
  }

  @MainActor func testReentrantHostReplacementBetweenWriteAndDispatchDropsTheOldEvent() async throws {
    let (state, context) = try fixture()
    var replaced = false
    var received = 0
    state.onAction = { _ in received += 1 }
    state.onStateUpdate = { _ in
      guard !replaced else { return }
      replaced = true
      // A new answer starts a new state lifetime; source editing alone may
      // intentionally preserve already committed values in this same Store.
      state.reset()
      state.setSource("root=TextContent(\"New answer\")")
    }
    let events = await context.commitFieldAndTrigger("Save Changes", form: "orders",
      name: "orders", value: rows, componentType: "EditableTable")
    XCTAssertTrue(replaced)
    XCTAssertTrue(events.isEmpty)
    XCTAssertEqual(received, 0)
    XCTAssertEqual(state.stateValue("orders"), .null)
    XCTAssertEqual(state.root?.typeName, "TextContent")
  }
}
