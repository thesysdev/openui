import XCTest
import Foundation
import OpenUILang
@testable import OpenUISwiftUI

/// Executes the upstream interactions.json files against the native adapter.
/// The fixture registry is deliberately application-owned, as in react-lang's runner.
final class ProtocolInteractionTests: XCTestCase {
    @MainActor func testOfficialInteractions() throws {
        let directory = ProcessInfo.processInfo.environment["OPENUI_FIXTURES"].map(URL.init(fileURLWithPath:))
            ?? URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
                .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
                .appendingPathComponent("spec/fixtures/1.0")
        let library = try LibrarySpec(jsonString: String(contentsOf: directory.appendingPathComponent("library.json"), encoding: .utf8))
        let schema = compileLibrarySchema(library)
        let files = try FileManager.default.subpathsOfDirectory(atPath: directory.path)
            .filter { $0.hasSuffix("/interactions.json") }.sorted()
        XCTAssertEqual(files.count, 12, "Do not silently skip upstream interaction cases")
        let finished = expectation(description: "All upstream interactions")
        Task { @MainActor in
            defer { finished.fulfill() }
            do {
                for file in files {
                    let fixture = try parseJSONPreservingOrder(String(contentsOf: directory.appendingPathComponent(file), encoding: .utf8))
                    let folder = directory.appendingPathComponent(file).deletingLastPathComponent()
                    let input = try String(contentsOf: folder.appendingPathComponent("input.oui"), encoding: .utf8)
                    let interactions = fixture.field("interactions")?.arrayItems ?? []
                    let provider = FixtureProvider(interactions: interactions)
                    let state = OpenUIState(schema: schema, functions: ["Upper": CustomFunction(params: [ParamDef(name: "text", required: true)], fn: { args in
                        if case .string(let text) = args["text"] { return .string(text.uppercased()) }; return .null
                    })], toolProvider: provider)
                    state.setSource(input)
                    var events: [ActionEvent] = []
                    state.onAction = { events.append($0) }
                    await settle(state)
                    for interaction in interactions {
                        if let type = interaction.field("type")?.arrayItems, type.count == 2,
                           let id = type[0].stringValue, let match = locate(state.root, id: id) {
                            let value = jsonToValue(type[1])
                            if let binding = state.binding(for: match.element, prop: "value") { binding.wrappedValue = value }
                            else if let name = PropValue.string(match.element, "name") {
                                state.setFieldValue(form: match.form, name: name, value: value)
                            } else { XCTFail("\(file): type target has no field name") }
                        }
                        if let id = interaction.field("click")?.stringValue {
                            guard let match = locate(state.root, id: id) else { XCTFail("\(file): missing click target \(id)"); continue }
                            let plan = PropValue.actionPlan(match.element, "action")
                                ?? ActionPlan(steps: [.continueConversation(messageAST: .str(PropValue.string(match.element, "label") ?? ""), contextAST: nil)])
                            _ = await state.perform(plan, formName: match.form)
                        }
                        await settle(state)
                    }
                    let expected = fixture.field("expected") ?? .object([])
                    if let expectedEvents = expected.field("events")?.arrayItems {
                        XCTAssertEqual(events.count, expectedEvents.count, file)
                        for (event, expectedEvent) in zip(events, expectedEvents) {
                            XCTAssertTrue(matches(expectedEvent, eventJSON(event)), "\(file): unexpected event \(eventJSON(event))")
                        }
                    }
                    if let expectedState = expected.field("state") {
                        XCTAssertTrue(matches(expectedState, object(state.snapshotState())), "\(file): state differs")
                    }
                    if let calls = expected.field("toolCalls") {
                        XCTAssertTrue(matches(calls, .array(provider.calls)), "\(file): tool calls differ: \(provider.calls)")
                    }
                    state.reset()
                }
            } catch { XCTFail("Interaction runner: \(error)") }
        }
        wait(for: [finished], timeout: 10)
    }

    @MainActor private func settle(_ state: OpenUIState) async {
        // Yield even when no Query is active: state subscriptions are actor hops.
        for _ in 0..<100 {
            try? await Task.sleep(nanoseconds: 1_000_000)
            if !state.queryStates.values.contains(where: { $0.status == .loading }) { return }
        }
        XCTFail("Queries did not settle")
    }

    private func locate(_ root: EvaluatedElement?, id: String, form: String? = nil) -> (element: EvaluatedElement, form: String?)? {
        guard let root else { return nil }
        let scope = root.typeName == "Form" ? PropValue.string(root, "name") : form
        if root.statementId == id { return (root, scope) }
        func visit(_ value: Value) -> (element: EvaluatedElement, form: String?)? {
            switch value {
            case .element(let element): return locate(element, id: id, form: scope)
            case .array(let values): return values.lazy.compactMap(visit).first
            case .object(let fields): return fields.lazy.compactMap { visit($0.value) }.first
            default: return nil
            }
        }
        return root.props.lazy.compactMap { visit($0.1) }.first
    }

    private func object(_ fields: [OpenUIString: Value]) -> JSONValue { .object(fields.map { .init(key: $0.key, value: json($0.value)) }) }
    private func json(_ value: Value) -> JSONValue {
        switch value {
        case .string(let s): return .string(s)
        case .number(let n): return .number(n)
        case .boolean(let b): return .boolean(b)
        case .array(let values): return .array(values.map(json))
        case .object(let fields): return .object(fields.map { .init(key: $0.key, value: json($0.value)) })
        default: return .null
        }
    }
    private func eventJSON(_ event: ActionEvent) -> JSONValue {
        .object([
            .init(key: "type", value: .string(event.type)),
            .init(key: "humanFriendlyMessage", value: .string(event.humanFriendlyMessage)),
            .init(key: "params", value: object(Dictionary(event.params, uniquingKeysWith: { _, new in new }))),
            .init(key: "formName", value: event.formName.map(JSONValue.string) ?? .null),
            .init(key: "formState", value: event.formState.map { object(Dictionary($0, uniquingKeysWith: { _, new in new })) } ?? .null)
        ])
    }
    private func matches(_ expected: JSONValue, _ actual: JSONValue) -> Bool {
        switch (expected, actual) {
        case (.object(let a), .object): return a.allSatisfy { field in actual.field(field.key).map { matches(field.value, $0) } ?? false }
        case (.array(let a), .array(let b)): return a.count == b.count && zip(a,b).allSatisfy(matches)
        default: return expected == actual
        }
    }

    private final class FixtureProvider: ToolProvider {
        private let lock = NSLock()
        private var responses: [OpenUIString: Value] = [:]
        private var log: [JSONValue] = []
        init(interactions: [JSONValue]) {
            for interaction in interactions {
                if let name = interaction.field("tool")?.stringValue { responses[OpenUIString(name)] = jsonToValue(interaction.field("result") ?? .null) }
            }
        }
        var calls: [JSONValue] { lock.lock(); defer { lock.unlock() }; return log }
        private func response(_ name: OpenUIString, _ args: OpenUIObject) throws -> Value {
            lock.lock(); defer { lock.unlock() }
            guard let response = responses[name] else { throw ToolNotFoundError(toolName: name, availableTools: Array(responses.keys)) }
            func json(_ value: Value) -> JSONValue {
                switch value {
                case .string(let s): return .string(s)
                case .number(let n): return .number(n)
                case .boolean(let b): return .boolean(b)
                case .object(let f): return .object(f.map { .init(key: $0.key, value: json($0.value)) })
                case .array(let values): return .array(values.map(json))
                default: return .null
                }
            }
            let call = JSONValue.object([.init(key: "tool", value: .string(name)), .init(key: "args", value: .object(args.map { .init(key: $0.key, value: json($0.value)) }))])
            if log.last != call { log.append(call) }
            return response
        }
        func callTool(name: OpenUIString, arguments: OpenUIObject) async throws -> Value { try response(name, arguments) }
    }
}
