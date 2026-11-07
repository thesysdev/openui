import OpenUILang
import XCTest
@testable import OpenUISwiftUI

final class TableEditingStateTests: XCTestCase {
  private var source: Value { .array([.object([.init(key:"id",value:.string("r1")),.init(key:"values",value:.array([.string("before")]))])]) }
  @MainActor private func fixture() throws -> (OpenUIState,OpenUIComponentContext,NativeTableEditingState) {
    let lib = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: lib.library.toSchema())
    state.push("root=Stack([EditableTable(\"orders\",[],[]),TextContent(\"unfinished")
    let element = try XCTUnwrap(PropValue.children(try XCTUnwrap(state.root)).first)
    let context = OpenUIComponentContext(element:element,registry:lib.registry,state:state)
    let editing = NativeTableEditingState()
    editing.receive(source,revision:state.sourceRevision)
    editing.draft.write(.string("after"),row:0,column:0)
    return (state,context,editing)
  }
  @MainActor func testSameSaveCannotDispatchTwice() async throws {
    let (state,context,editing) = try fixture()
    var calls=0; state.onAction = { _ in calls += 1 }
    await editing.save(context:context,name:"orders",columns:1)
    await editing.save(context:context,name:"orders",columns:1)
    XCTAssertEqual(calls,1)
    XCTAssertFalse(editing.draft.hasChanges)
  }
  @MainActor func testRejectedSaveAndPublishedLocalWriteKeepRetryableDraft() async throws {
    let (state,original,editing) = try fixture()
    var context=original; context.interactionScopeReady=false
    await editing.save(context:context,name:"orders",columns:1)
    XCTAssertTrue(editing.draft.hasChanges)
    editing.receive(editing.draft.value,revision:state.sourceRevision)
    XCTAssertTrue(editing.draft.hasChanges,"Store publication alone is not a successful dispatch")
    var calls=0; state.onAction = { _ in calls += 1 }
    await editing.save(context:original,name:"orders",columns:1)
    XCTAssertEqual(calls,1); XCTAssertFalse(editing.draft.hasChanges)
  }
  @MainActor func testSourceReplacementResetsDraftAndRejectsOldSave() async throws {
    let (state,context,editing) = try fixture()
    state.setSource("root=TextContent(\"new\")")
    editing.receive(source,revision:state.sourceRevision)
    await editing.save(context:context,name:"orders",columns:1)
    XCTAssertFalse(editing.draft.hasChanges)
    XCTAssertEqual(editing.draft.value(row:0,column:0),.string("before"))
    XCTAssertEqual(state.stateValue("orders"),.null)
  }
  @MainActor func testLocalReceiptSurvivesReentrantHostReplacement() async throws {
    let (state,context,editing) = try fixture()
    var receipt=false;var calls=0
    state.onAction = { _ in calls += 1; state.reset();state.setSource("root=TextContent(\"next\")") }
    let events=await context.commitFieldAndTrigger("Save Changes",form:"orders",name:"orders",value:editing.draft.value,componentType:"EditableTable",onDispatch:{receipt=true})
    XCTAssertTrue(receipt);XCTAssertEqual(calls,1);XCTAssertTrue(events.isEmpty)
    XCTAssertFalse(context.isCurrentPresentation)
  }
  @MainActor func testSaveGateRejectsASecondReentrantAttempt() async throws {
    let (state,context,editing) = try fixture()
    var calls=0; var duplicate:Task<Void,Never>?
    state.onStateUpdate = { _ in
      XCTAssertTrue(editing.saving)
      duplicate=Task { @MainActor in await editing.save(context:context,name:"orders",columns:1) }
      editing.receive(editing.draft.value,revision:state.sourceRevision)
    }
    state.onAction = { _ in calls += 1 }
    await editing.save(context:context,name:"orders",columns:1)
    await duplicate?.value
    XCTAssertEqual(calls,1);XCTAssertFalse(editing.draft.hasChanges)
  }
}
