import XCTest
import SwiftUI
import OpenUILang
@testable import OpenUISwiftUI

final class SemanticLifecycleTests: XCTestCase {
    private func schema() -> LibrarySchema {
        LibrarySchema(components:["Text":[ParamDef(name:"text",required:true)],"Button":[ParamDef(name:"action",required:true)]],callDefs:builtinCallDefs)
    }
    actor Gate: ToolProvider {
        private var continuation: CheckedContinuation<Value,Never>?
        private var waiters: [CheckedContinuation<Void,Never>] = []
        private var called = false
        func callTool(name: OpenUIString,arguments: OpenUIObject) async throws -> Value {
            called = true
            waiters.forEach { $0.resume() }; waiters.removeAll()
            return await withCheckedContinuation { continuation = $0 }
        }
        func waitForCall() async {
            if called { return }
            await withCheckedContinuation { waiters.append($0) }
        }
        func finish(_ value: Value) { continuation?.resume(returning:value); continuation = nil }
    }
    @MainActor func testQueryAndMutationReadsRetainIdentityAcrossNotifications() {
        let done = expectation(description:"Query identity")
        Task { @MainActor in
            defer { done.fulfill() }
            let provider = Gate(), state = OpenUIState(schema:schema(),toolProvider:provider)
            state.setSource("$rows = [{n:1}]\ndata = Query(\"load\",{},[{n:1}])\nsave = Mutation(\"save\",{})\nroot = Text([$rows == $rows, data == data, save == save])")
            let original = state.stateValue("$rows")
            let defaultData = state.queryStates["data"]!.data!
            let idle = state.mutationStates["save"]!.value
            XCTAssertEqual(PropValue.value(state.root!,"text"),.array([.boolean(true),.boolean(true),.boolean(true)]))
            await provider.waitForCall()
            // An unrelated native field update must keep the declaration-owned graph.
            state.setFieldValue(form:nil as String?,name:"search",value:.string("native"))
            XCTAssertTrue(state.stateValue("$rows").isSameValue(as:original))
            XCTAssertTrue(state.mutationStates["save"]!.value.isSameValue(as:idle))
            let result = Value.array([.object([ObjectField(key:"n",value:.number(2))])])
            await provider.finish(result)
            for _ in 0..<100 { if state.queryStates["data"]?.status == .success { break }; try? await Task.sleep(nanoseconds:1_000_000) }
            XCTAssertTrue(state.queryStates["data"]!.data!.isSameValue(as:result))
            XCTAssertFalse(defaultData.isSameValue(as:result))
            XCTAssertTrue(state.stateValue("$rows").isSameValue(as:original))
            XCTAssertEqual(PropValue.value(state.root!,"text"),.array([.boolean(true),.boolean(true),.boolean(true)]))
            state.reset()
        }
        wait(for:[done],timeout:3)
    }
    @MainActor func testStreamingDefaultReferenceIsSharedWithinRender() {
        let state = OpenUIState(schema:schema())
        state.push("data = Query(\"load\",{},[{n:1}])\nsave = Mutation(\"save\",{})\nroot = Text(data == data && save == save)")
        XCTAssertEqual(PropValue.value(state.root!,"text"),.boolean(true))
        state.complete()
        XCTAssertEqual(PropValue.value(state.root!,"text"),.boolean(true))
    }
    @MainActor func testStableQueryDefaultWithoutStateOrLifecycleChanges() {
        let state = OpenUIState(schema:schema())
        state.setSource("data = Query(\"load\",{},[{n:1}])\nsave = Mutation(\"save\",{})\nroot = Text(data == data && save == save)")
        let original = state.queryStates["data"]!.data!, idle = state.mutationStates["save"]!.value
        state.runQuery(statementId:"data",tool:"load",args:.object([]),defaults:original)
        XCTAssertTrue(state.queryStates["data"]!.data!.isSameValue(as:original))
        XCTAssertTrue(state.mutationStates["save"]!.value.isSameValue(as:idle))
        XCTAssertEqual(PropValue.value(state.root!,"text"),.boolean(true))
    }
    @MainActor func testReplacingSameToolMutationDiscardsOldResultAndEvents() {
        let done = expectation(description:"Same-tool replacement")
        Task { @MainActor in
            defer { done.fulfill() }
            let provider = Gate(), state = OpenUIState(schema:schema(),toolProvider:provider)
            state.setSource("save = Mutation(\"save\",{n:1})\nroot = Button(Action([@Run(save),@ToAssistant(\"old\")]))")
            let initial = state.mutationStates["save"]!.value
            let oldPlan = PropValue.actionPlan(state.root!,"action")!
            let pending = Task { await state.perform(oldPlan) }
            await provider.waitForCall()
            XCTAssertFalse(state.mutationStates["save"]!.value.isSameValue(as:initial))
            state.setSource("save = Mutation(\"save\",{n:2})\nroot = Button(@ToAssistant(\"current\"))")
            let replacement = state.mutationStates["save"]!.value
            await provider.finish(.string("stale"))
            let events = await pending.value
            XCTAssertTrue(events.isEmpty)
            XCTAssertEqual(state.mutationStates["save"]?.status,.idle)
            XCTAssertTrue(state.mutationStates["save"]!.value.isSameValue(as:replacement))
            state.reset()
        }
        wait(for:[done],timeout:3)
    }
    @MainActor func testNativeDisplayAndFieldRoundTripKeepRawUnits() throws {
        let state = OpenUIState(schema:schema())
        state.setSource(#"root = Text("\uD800")"#)
        let raw = OpenUIString(codeUnits:[0xD800]), field = OpenUIString(codeUnits:[0xDC00])
        XCTAssertEqual(PropValue.codeUnitString(state.root!,"text"),raw)
        XCTAssertEqual(PropValue.string(state.root!,"text"),"�")
        state.setState("\(raw)", value:.string(raw))
        XCTAssertEqual(state.stateValue(raw), .string(raw))
        state.initializeField(form:raw,name:field,value:.string(raw))
        state.initializeField(form:raw,name:field,value:.string("default"))
        XCTAssertEqual(state.fieldValue(form:raw,name:field),.string(raw))
        let encoded = try Value.object(state.snapshotState().map { ObjectField(key:$0.key,value:$0.value) }).jsonString()
        let restored = jsonToValue(try parseJSONPreservingOrder(encoded))
        guard case .object(let fields) = restored else { return XCTFail("Object expected") }
        let second = OpenUIState(schema:schema(),persistedState:Dictionary(fields.map { ($0.key,$0.value) },uniquingKeysWith:{ _,b in b }))
        second.setSource("root = Text(\"restored\")")
        XCTAssertEqual(second.fieldValue(form:raw,name:field),.string(raw))
        state.setFieldValue(form:nil as OpenUIString?,name:"é",value:.number(1))
        state.setFieldValue(form:nil as OpenUIString?,name:"e\u{301}",value:.number(2))
        XCTAssertEqual(state.fieldValue(form:nil as OpenUIString?,name:"é"),.number(1))
        XCTAssertEqual(state.fieldValue(form:nil as OpenUIString?,name:"e\u{301}"),.number(2))
    }
}
