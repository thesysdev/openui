import XCTest
import SwiftUI
import Combine
import OpenUILang
@testable import OpenUISwiftUI

final class OpenUIStateTests: XCTestCase {
    private func schema() -> LibrarySchema {
        LibrarySchema(components: ["Text": [ParamDef(name: "text", required: true)]],
                      callDefs: builtinCallDefs, rootComponent: "Text")
    }

    @MainActor func testResetStartsIndependentStream() {
        let state = OpenUIState(schema: schema())
        state.push("root = Text(\"first\")")
        state.complete()
        XCTAssertEqual(PropValue.string(state.root!, "text"), "first")
        state.reset()
        XCTAssertNil(state.root)
        XCTAssertFalse(state.isComplete)
        XCTAssertTrue(state.errors.isEmpty)
        XCTAssertTrue(state.queryStates.isEmpty)
        state.push("root = Text(\"second\")")
        state.complete()
        XCTAssertEqual(PropValue.string(state.root!, "text"), "second")
    }

    @MainActor func testRegistryKeepsDictionaryLiteralAndLookup() {
        var registry: ComponentRegistry = ["Text": { el, _ in AnyView(Text(PropValue.string(el, "text") ?? "")) }]
        XCTAssertNotNil(registry["Text"])
        registry["Text"] = nil
        XCTAssertNil(registry["Text"])
    }

    struct Provider: ToolProvider {
        func callTool(name: OpenUIString, arguments: OpenUIObject) async throws -> Value {
            .object([ObjectField(key: "label", value: .string("loaded"))])
        }
    }

    @MainActor func testExplicitQueryPublishesAndReevaluatesRoot() {
        let state = OpenUIState(schema: schema(), toolProvider: Provider())
        state.push("data = Query(\"load\", {}, {label: \"default\"})\nroot = Text(data.label)")
        state.runQuery(statementId: "data", tool: "load", args: .object([]))
        XCTAssertEqual(state.queryStates["data"]?.status, .idle)
        let settled = expectation(description: "Query result rendered")
        let subscription = state.$root.filter { root in
            root.flatMap { PropValue.string($0, "text") } == "loaded"
        }.prefix(1).sink { _ in settled.fulfill() }
        state.complete()
        wait(for: [settled], timeout: 3)
        XCTAssertEqual(state.queryStates["data"]?.status, .success)
        XCTAssertEqual(PropValue.string(state.root!, "text"), "loaded")
        withExtendedLifetime(subscription) {}
    }
}

extension OpenUIStateTests {
    @MainActor func testStateChangesReevaluateAndRestore() {
        let first = OpenUIState(schema: schema())
        first.push("$name = \"default\"\nroot = Text($name)")
        first.complete()
        first.setState("$name", value: .string("edited"))
        XCTAssertEqual(PropValue.string(first.root!, "text"), "edited")
        let restored = OpenUIState(schema: schema(), persistedState: first.snapshotState())
        restored.push("$name = \"default\"\nroot = Text($name)")
        restored.complete()
        XCTAssertEqual(PropValue.string(restored.root!, "text"), "edited")
    }

    private func actionSchema() -> LibrarySchema {
        LibrarySchema(components: ["Button": [ParamDef(name: "action", required: true)]],
                      callDefs: builtinCallDefs, rootComponent: "Button")
    }

    actor DelayedProvider: ToolProvider {
        var calls = 0
        let fails: Bool
        init(fails: Bool = false) { self.fails = fails }
        func callTool(name: OpenUIString, arguments: OpenUIObject) async throws -> Value {
            calls += 1
            try await Task.sleep(nanoseconds: 30_000_000)
            if fails { throw NSError(domain: "test", code: 1) }
            return .string("saved")
        }
    }

    @MainActor func testMutationAwaitsSuccessBeforeContinuation() {
        let finished = expectation(description: "testMutationAwaitsSuccessBeforeContinuation")
        Task { @MainActor in
            defer { finished.fulfill() }
            let provider = DelayedProvider()
            let state = OpenUIState(schema: actionSchema(), toolProvider: provider)
            state.push("save = Mutation(\"save\", {})\nroot = Button(Action([@Run(save), @ToAssistant(\"continue\", save.status)]))")
            state.complete()
            XCTAssertTrue(state.errors.isEmpty)
            let plan = PropValue.actionPlan(state.root!, "action")!
            let events = await state.perform(plan)
            XCTAssertEqual(events.count, 1)
            XCTAssertEqual(events[0].type, "continue_conversation")
            let status = events[0].params.first(where: { $0.0 == "context" })?.1
            XCTAssertEqual(status, .string("idle"), "ToAssistant captures its context when the plan is created")
            XCTAssertEqual(state.mutationStates["save"]?.status, .success)
            let count = await provider.calls
            XCTAssertEqual(count, 1)
        }
        wait(for: [finished], timeout: 3)
    }

    @MainActor func testFailedMutationDoesNotContinue() {
        let finished = expectation(description: "testFailedMutationDoesNotContinue")
        Task { @MainActor in
            defer { finished.fulfill() }
            let state = OpenUIState(schema: actionSchema(), toolProvider: DelayedProvider(fails: true))
            state.push("save = Mutation(\"save\", {})\nroot = Button(Action([@Run(save), @ToAssistant(\"must not run\")]))")
            state.complete()
            let events = await state.perform(PropValue.actionPlan(state.root!, "action")!)
            XCTAssertTrue(events.isEmpty)
            XCTAssertEqual(state.mutationStates["save"]?.status, .error)
        }
        wait(for: [finished], timeout: 3)
    }

    @MainActor func testResetDiscardsLateMutationAndHostEvents() {
        let finished = expectation(description: "testResetDiscardsLateMutationAndHostEvents")
        Task { @MainActor in
            defer { finished.fulfill() }
            let state = OpenUIState(schema: actionSchema(), toolProvider: DelayedProvider())
            state.push("save = Mutation(\"save\", {})\nroot = Button(Action([@Run(save), @ToAssistant(\"stale\")]))")
            state.complete()
            let plan = PropValue.actionPlan(state.root!, "action")!
            let pending = Task { await state.perform(plan) }
            try? await Task.sleep(nanoseconds: 5_000_000)
            state.reset()
            let events = await pending.value
            XCTAssertTrue(events.isEmpty)
            XCTAssertNil(state.root)
            XCTAssertTrue(state.mutationStates.isEmpty)
        }
        wait(for: [finished], timeout: 3)
    }
}

extension OpenUIStateTests {
    @MainActor func testWriteTransformAndNonReactiveAssignmentRead() {
        let schema = LibrarySchema(components: ["Input": [ParamDef(name: "value", required: false, isBindable: true)], "Text": [ParamDef(name: "text", required: true)]], callDefs: builtinCallDefs)
        let state = OpenUIState(schema: schema)
        state.setSource("$count = 1\nroot = Input($count = $value + 2)")
        let binding = state.binding(for: state.root!, prop: "value")
        XCTAssertEqual(binding?.wrappedValue, .number(1))
        binding?.wrappedValue = .number(5)
        XCTAssertEqual(state.stateValue("$count"), .number(7))
        state.setSource("$count = 1\nroot = Text($count = $value + 2)")
        XCTAssertEqual(PropValue.value(state.root!, "text"), .number(7))
        XCTAssertNil(state.binding(for: state.root!, prop: "text"))
    }
    @MainActor func testRestoreFormFieldAndPerActionEventState() {
        let state = OpenUIState(schema: actionSchema(), persistedState: ["contact": .object([
            .init(key: "email", value: .object([.init(key: "value", value: .string("restored@example.com")), .init(key: "componentType", value: .string("input"))]))
        ])])
        state.setSource("$note = \"old\"\nroot = Button(Action([@Set($note, \"new\"), @ToAssistant(\"send\"), @Reset($note)]))")
        state.initializeField(form: "contact", name: "email", value: .string("default"))
        XCTAssertEqual(state.fieldValue(form: "contact", name: "email", fallback: .string("default")), .string("restored@example.com"))
        let finished = expectation(description: "Form timing")
        Task { @MainActor in
            defer { finished.fulfill() }
            let events = await state.perform(PropValue.actionPlan(state.root!, "action")!)
            XCTAssertEqual(events.first?.formState?.first(where: { $0.0 == "$note" })?.1, .string("new"))
            XCTAssertEqual(state.stateValue("$note"), .string("old"))
        }
        wait(for: [finished], timeout: 2)
    }
    @MainActor func testReplacingSourceStopsOldPlanWithoutDroppingUserState() {
        let state = OpenUIState(schema: actionSchema(), toolProvider: DelayedProvider())
        state.setSource("$note = \"old\"\nsave = Mutation(\"save\", {})\nroot = Button(Action([@Run(save), @Set($note, \"stale\"), @ToAssistant(\"stale\")]))")
        state.setState("$note", value: .string("edited"))
        let finished = expectation(description: "Source replacement")
        Task { @MainActor in
            defer { finished.fulfill() }
            let plan = PropValue.actionPlan(state.root!, "action")!
            let pending = Task { await state.perform(plan) }
            try? await Task.sleep(nanoseconds: 2_000_000)
            state.setSource("$note = \"default\"\nroot = Button(@ToAssistant(\"current\"))")
            let events = await pending.value
            XCTAssertTrue(events.isEmpty)
            XCTAssertEqual(state.stateValue("$note"), .string("edited"))
            XCTAssertTrue(state.mutationStates.isEmpty)
        }
        wait(for: [finished], timeout: 2)
    }
}

extension OpenUIStateTests {
    @MainActor func testDefaultAndLegacyActionsCannotSpoofCustomCalls() {
        var schema = actionSchema()
        schema.callDefs["Copy"] = CallDef(kind: .action, params: [ParamDef(name: "text", required: true)])
        let state = OpenUIState(schema: schema)
        state.setSource("root = Button(@ToAssistant(\"send\"))")
        let finished = expectation(description: "Legacy dispatch")
        Task { @MainActor in
            defer { finished.fulfill() }
            let fallback = await state.triggerAction("Default label")
            XCTAssertEqual(fallback.first?.humanFriendlyMessage, "Default label")
            let legacy = await state.triggerAction("Docs", action: .object([.init(key: "type", value: .string("open_url")), .init(key: "url", value: .string("https://example.com"))]))
            XCTAssertEqual(legacy.first?.type, "open_url")
            let spoof = await state.triggerAction("Copy", action: .object([.init(key: "type", value: .string("Copy")), .init(key: "params", value: .object([]))]))
            XCTAssertTrue(spoof.isEmpty)
        }
        wait(for: [finished], timeout: 2)
    }
}

extension OpenUIStateTests {
    @MainActor func testDynamicFunctionErrorsWaitForStreamCompletion() {
        let text = ParamDef(name: "text", required: true, schema: .object([.init(key: "type", value: .string("string"))]))
        var schema = schema(); schema.callDefs["Upper"] = CallDef(kind: .function, params: [text])
        let state = OpenUIState(schema: schema, functions: ["Upper": CustomFunction(params: [text], fn: { args in args["text"] ?? .null })])
        state.push("$value = 3\nroot = Text(@Upper($value))")
        XCTAssertFalse(state.errors.contains { $0.code == .runtimeError })
        state.complete()
        XCTAssertTrue(state.errors.contains { $0.code == .runtimeError })
    }
}

extension OpenUIStateTests {
    actor ArgumentProvider: ToolProvider {
        var values: [Value] = []
        func callTool(name: OpenUIString, arguments: OpenUIObject) async throws -> Value {
            values.append(arguments["status"] ?? .null)
            return .string("loaded")
        }
    }
    @MainActor func testDirectQueryArgumentsTrackStoreAndRunInvalidatesOnce() {
        let provider = ArgumentProvider()
        let ui = OpenUIState(schema: schema(), toolProvider: provider)
        ui.setSource("$status = \"open\"\ndata = Query(\"load\", {status:$status}, \"default\")\nroot = Text(data)")
        let finished = expectation(description: "Statement args and dependencies")
        Task { @MainActor in
            defer { finished.fulfill() }
            for _ in 0..<100 { if ui.queryStates["data"]?.status == .success { break }; try? await Task.sleep(nanoseconds: 1_000_000) }
            let first = await provider.values
            XCTAssertEqual(first, [.string("open")])
            ui.setState("$status", value: .string("closed"))
            try? await Task.sleep(nanoseconds: 5_000_000)
            let unchanged = await provider.values
            XCTAssertEqual(unchanged, [.string("open"), .string("closed")], "Direct state arguments follow Store changes")
            let explicit = ActionPlan(steps: [.run(statementId: "data", refType: .query)])
            _ = await ui.perform(explicit)
            for _ in 0..<100 { if ui.queryStates["data"]?.status == .success { break }; try? await Task.sleep(nanoseconds: 1_000_000) }
            try? await Task.sleep(nanoseconds: 5_000_000)
            let refreshed = await provider.values
            XCTAssertEqual(refreshed, [.string("open"), .string("closed"), .string("closed")], "Run starts one additional request")
        }
        wait(for: [finished], timeout: 2)
    }

    @MainActor func testQueryFailureNotificationsDoNotResubmitDeclarations() {
        let provider = DelayedProvider(fails: true)
        let ui = OpenUIState(schema: schema(), toolProvider: provider)
        ui.setSource("data=Query(\"fail\",{},\"fallback\")\nroot=Text(data)")
        let finished = expectation(description: "Failure callbacks only redraw")
        Task { @MainActor in
            defer { finished.fulfill() }
            for _ in 0..<200 {
                if ui.queryStates["data"]?.status == .error { break }
                try? await Task.sleep(nanoseconds: 1_000_000)
            }
            XCTAssertEqual(ui.queryStates["data"]?.status, .error)
            try? await Task.sleep(nanoseconds: 65_000_000)
            let first = await provider.calls
            XCTAssertEqual(first, 1, "Query results must not drive a synchronization loop")
            _ = await ui.perform(ActionPlan(steps: [.run(statementId: "data", refType: .query)]))
            for _ in 0..<200 {
                if ui.queryStates["data"]?.status == .error { break }
                try? await Task.sleep(nanoseconds: 1_000_000)
            }
            try? await Task.sleep(nanoseconds: 35_000_000)
            let retried = await provider.calls
            XCTAssertEqual(retried, 2, "Explicit Run must retry exactly once")
        }
        wait(for: [finished], timeout: 2)
    }
}
