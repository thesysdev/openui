import OpenUILang
import XCTest

@testable import OpenUISwiftUI

final class ManualProgramExecutionTests: XCTestCase {
    @MainActor func testReplacementAndActionEvaluationStayExactUnderAllocationChurn() async throws {
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        var lastContext: OpenUIComponentContext?
        var trace: [OpenUIActionEvaluation] = []
        var writes: [Value] = []
        state.onActionEvaluation = { trace.append($0) }
        state.onStateUpdate = { writes.append($0["$count"] ?? .undefined) }
        for round in 0..<160 {
            let seed = round % 2 == 0 ? 10 : (round + 1) * 100
            let delta = round % 7 + 1
            state.reset()
            state.setSource("$count=\(seed)\nroot=Stack([TextContent(\"Run \"+$count),Button(\"Apply\",@Set($count,$count+\(delta)),\"secondary\")])")
            XCTAssertFalse(lastContext?.canInteract ?? false)
            let context = try buttonContext(in: state, library: library, label: "Apply")
            trace.removeAll(); writes.removeAll()
            _ = await context.triggerAction("Apply", action: context.value("action"))
            XCTAssertEqual(trace.count, 1, "round \(round): one dispatch evaluates once")
            XCTAssertEqual(trace.first?.expression, .binOp("+", .stateRef("$count"), .num(Double(delta))))
            XCTAssertEqual(trace.first?.state["$count"], .number(Double(seed)))
            XCTAssertEqual(trace.first?.result, .number(Double(seed + delta)))
            XCTAssertEqual(writes, [.number(Double(seed + delta))])
            XCTAssertEqual(state.stateValue("$count"), .number(Double(seed + delta)))
            lastContext = context
        }
    }
    // The exact two programs typed by ReviewEditorTests, without native views
    // or synthesized touches. Each action is obtained from the evaluated tree.
    private let firstSource = """
    $count=0
    root=Stack([TextContent("First "+$count),Button("Add one",@Set($count,$count+1),"secondary")])
    """
    private let secondSource = """
    $count=10
    root=Stack([TextContent("Second "+$count),Button("Add two",@Set($count,$count+2),"secondary")])
    """

    @MainActor func testManualReplacementExecutesOnceAcrossReusedState() async throws {
        let library = try OpenUIMapComponents.library(basemapCoordinateSystem: .gcj02)
        let state = OpenUIState(schema: library.library.toSchema())
        for iteration in 1...10 {
            if iteration > 1 { state.reset() }
            try await assertReplacementSequence(state: state, library: library,
                label: "reused state, iteration \(iteration)")
        }
    }

    @MainActor func testManualReplacementExecutesOnceAcrossFreshStates() async throws {
        let library = try OpenUIMapComponents.library(basemapCoordinateSystem: .gcj02)
        for iteration in 1...10 {
            let state = OpenUIState(schema: library.library.toSchema())
            try await assertReplacementSequence(state: state, library: library,
                label: "fresh state, iteration \(iteration)")
        }
    }

    @MainActor private func assertReplacementSequence(
        state: OpenUIState, library: OpenUIComponentLibrary, label: String
    ) async throws {
        var updates: [Value] = []
        var hostEvents = 0
        state.onStateUpdate = { values in updates.append(values["$count"] ?? .undefined) }
        state.onAction = { _ in hostEvents += 1 }

        state.setSource(firstSource)
        XCTAssertTrue(state.errors.isEmpty, "\(label): \(state.errors)")
        XCTAssertEqual(state.stateValue("$count"), .number(0), label)
        XCTAssertEqual(try heading(in: state), "First 0", label)
        let first = try buttonContext(in: state, library: library, label: "Add one")
        try assertSingleIncrement(first, by: 1, label: label + ", first action")
        XCTAssertTrue(first.canInteract, label)
        updates.removeAll()
        let firstEvents = await first.triggerAction("Add one", action: first.value("action"))
        XCTAssertTrue(firstEvents.isEmpty, label)
        XCTAssertEqual(updates, [.number(1)], "\(label): first action must write once")
        XCTAssertEqual(state.stateValue("$count"), .number(1), label)
        XCTAssertEqual(try heading(in: state), "First 1", label)

        state.reset()
        XCTAssertFalse(first.canInteract, "\(label): the old source context must be invalidated")
        state.setSource(secondSource)
        XCTAssertTrue(state.errors.isEmpty, "\(label): \(state.errors)")
        XCTAssertEqual(state.stateValue("$count"), .number(10), label)
        XCTAssertEqual(try heading(in: state), "Second 10", label)
        let second = try buttonContext(in: state, library: library, label: "Add two")
        try assertSingleIncrement(second, by: 2, label: label + ", second action")
        XCTAssertTrue(second.canInteract, label)
        XCTAssertFalse(first.canInteract, label)
        updates.removeAll()
        let secondEvents = await second.triggerAction("Add two", action: second.value("action"))
        XCTAssertTrue(secondEvents.isEmpty, label)
        XCTAssertEqual(updates, [.number(12)],
            "\(label): one dispatch must publish exactly one write to 12; observed \(updates)")
        XCTAssertEqual(state.stateValue("$count"), .number(12), label)
        XCTAssertEqual(try heading(in: state), "Second 12", label)
        XCTAssertEqual(hostEvents, 0, "\(label): local Set must not produce a host action")
        XCTAssertTrue(state.errors.isEmpty, "\(label): \(state.errors)")
    }

    @MainActor private func buttonContext(
        in state: OpenUIState, library: OpenUIComponentLibrary, label: String
    ) throws -> OpenUIComponentContext {
        let root = try XCTUnwrap(state.root)
        let button = try XCTUnwrap(PropValue.children(root).first {
            $0.typeName == "Button" && PropValue.string($0, "label") == label
        })
        return OpenUIComponentContext(element: button, registry: library.registry, state: state)
    }

    @MainActor private func assertSingleIncrement(
        _ context: OpenUIComponentContext, by increment: Double, label: String
    ) throws {
        let plan = try XCTUnwrap(context.action(), label)
        XCTAssertEqual(plan.steps.count, 1, "\(label): unexpected duplicated action steps")
        let step = try XCTUnwrap(plan.steps.first, label)
        guard case .set(let target, let rhs) = step else {
            return XCTFail("\(label): expected Set, got \(step)")
        }
        XCTAssertEqual(target, "$count", label)
        XCTAssertEqual(rhs, .binOp("+", .stateRef("$count"), .num(increment)),
            "\(label): the parsed value AST changed before dispatch: \(rhs)")
    }

    @MainActor private func heading(in state: OpenUIState) throws -> String {
        let root = try XCTUnwrap(state.root)
        let text = try XCTUnwrap(PropValue.children(root).first { $0.typeName == "TextContent" })
        return try XCTUnwrap(PropValue.string(text, "text"))
    }
}
