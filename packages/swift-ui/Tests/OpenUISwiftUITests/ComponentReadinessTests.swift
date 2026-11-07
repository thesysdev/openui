import OpenUILang
import XCTest
@testable import OpenUISwiftUI

final class ComponentReadinessTests: XCTestCase {
  @MainActor func testHeldEachCardReceivesReadinessWithoutChangingItsPropsOrPresentation() throws {
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.push("root=CompositeCardBlock(@Each([{id:\"a\",name:\"A\",src:\"https://images.example/a.png\"}],\"item\",CompositeCardItem(item.id,ImageTextLarge(item.src,item.name,item.name),[],{button:Button(\"Open\",@OpenUrl(\"https://example.com\"))}")
    let card = try XCTUnwrap(PropValue.children(try XCTUnwrap(state.root), "items").first)
    let context = OpenUIComponentContext(element: card, registry: library.registry, state: state)
    XCTAssertFalse(context.canInteract)
    let revision = state.presentationRevision
    state.push(")),\"carousel\",true)\nunrelated=TextContent(\"still arriving")
    XCTAssertFalse(state.isComplete)
    XCTAssertTrue(context.canInteract, "A retained @Each card must observe its now-committed declaration")
    XCTAssertEqual(state.presentationRevision, revision)
  }

  @MainActor func testIdenticalNestedControlsDoNotBorrowAnUncommittedSiblingsReadiness() throws {
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.push("root=Stack([Button(\"Same\",@OpenUrl(\"https://example.com\")),Button(\"Same\",@OpenUrl(\"https://example.com\")")
    let buttons = PropValue.children(try XCTUnwrap(state.root))
    XCTAssertEqual(buttons.count, 2)
    let first = OpenUIComponentContext(element: buttons[0], registry: library.registry, state: state)
    let last = OpenUIComponentContext(element: buttons[1], registry: library.registry, state: state)
    XCTAssertTrue(first.canInteract)
    XCTAssertFalse(last.canInteract, "A matching label/action does not make an unfinished sibling ready")
    state.push("),TextContent(\"later")
    XCTAssertTrue(last.canInteract, "Once both matching controls are committed, the retained context can refresh")
    XCTAssertFalse(state.isComplete)
  }
  @MainActor func testHeldActionRefreshesWhenOnlyDependencyReadinessChanges() async throws {
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.push("root=Button(\"Open\",@OpenUrl(destination))\ndestination=\"https://example.com/ready\"")
    let context = OpenUIComponentContext(element: try XCTUnwrap(state.root), registry: library.registry, state: state)
    let action = try XCTUnwrap(context.action())
    XCTAssertFalse(context.canInteract)
    XCTAssertFalse(context.canDispatch(.actionPlan(action)))
    state.push("\nunrelated=TextContent(\"still arriving")
    XCTAssertTrue(context.canInteract)
    XCTAssertTrue(context.canDispatch(.actionPlan(action)), "The enabled state must use the same refreshed plan as dispatch")
    let events = await context.perform(action)
    XCTAssertEqual(events.count, 1, "An unchanged action uses its current committed dependency readiness")
    XCTAssertFalse(state.isComplete)
  }

  @MainActor func testHeldContextRefreshesAfterItsDeclarationCommitsWhileOtherTextStreams() throws {
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.push("root=Button(\"Open\",@OpenUrl(\"https://example.com/ready\"))")
    let context = OpenUIComponentContext(element: try XCTUnwrap(state.root), registry: library.registry, state: state)
    XCTAssertFalse(context.canInteract)
    state.push("\nunrelated=TextContent(\"still arriving")
    XCTAssertFalse(state.isComplete)
    XCTAssertTrue(context.canInteract, "Readiness refreshes without requiring callers to replace an unchanged element")
  }

  @MainActor func testClosedButtonExecutesWhileUnrelatedContentKeepsStreaming() async throws {
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.push("root=Stack([Button(\"Open\",@OpenUrl(\"https://example.com/ready\")),TextContent(\"still arriving")
    let button = try XCTUnwrap(PropValue.children(try XCTUnwrap(state.root)).first)
    let context = OpenUIComponentContext(element: button, registry: library.registry, state: state)
    XCTAssertFalse(state.isComplete)
    XCTAssertTrue(context.canInteract, "A closed control must not wait for an unrelated unfinished sibling")
    let events = await context.perform(try XCTUnwrap(context.action()))
    XCTAssertEqual(events.count, 1)
    XCTAssertEqual(events.first?.type, "open_url")
    state.setSource("root=TextContent(\"Replacement\")")
    XCTAssertFalse(context.canInteract, "A replaced presentation invalidates its old callbacks")
  }

  @MainActor func testReferencedUnfinishedUrlWaitsForItsOwnDeclaration() async throws {
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.push("root=Stack([Button(\"Open\",@OpenUrl(destination)),TextContent(\"Visible\")])\ndestination=\"https://example.com/rea")
    func context() throws -> OpenUIComponentContext {
      .init(element: try XCTUnwrap(PropValue.children(try XCTUnwrap(state.root)).first), registry: library.registry, state: state)
    }
    XCTAssertFalse(try context().canInteract)
    state.push("dy\"\nunrelated=TextContent(\"still arriving")
    let ready = try context()
    XCTAssertFalse(state.isComplete)
    XCTAssertTrue(ready.canInteract, "A finished URL must not wait for unrelated trailing text")
    let events = await ready.perform(try XCTUnwrap(ready.action()))
    XCTAssertEqual(events.count, 1)
    XCTAssertEqual(events.first?.params.first(where: { $0.0 == "url" })?.1,
      .string("https://example.com/ready"), "Never dispatch the earlier unfinished URL prefix")
  }

  @MainActor func testLocalSelectionDuringStreamingSurvivesLaterChunks() async throws {
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.push("$view=\"overview\"\nroot=Stack([Button(\"Choose\",@Set($view,\"detail\")),TextContent(\"still arriving")
    let button = try XCTUnwrap(PropValue.children(try XCTUnwrap(state.root)).first)
    let context = OpenUIComponentContext(element: button, registry: library.registry, state: state)
    XCTAssertTrue(context.canInteract)
    _ = await context.perform(try XCTUnwrap(context.action()))
    XCTAssertEqual(state.stateValue("$view"), .string("detail"))
    state.push(" after the choice\")])")
    state.complete()
    XCTAssertEqual(state.stateValue("$view"), .string("detail"), "Appending output cannot reset a user's committed choice")
  }
}
