import Foundation
import XCTest
@testable import OpenUILang

final class SemanticValueTests: XCTestCase {
    private func evaluator(_ store: Store, functions: [String: CustomFunction] = [:], actions: [String: CallDef] = [:]) -> Evaluator {
        Evaluator(context: EvaluationContext(getState: { store.get($0) ?? .null }, resolveRef: { _ in .null }, functions: functions, actions: actions), store: store, schema: LibrarySchema())
    }
    private func units(_ value: Value) -> [UInt16]? { if case .string(let text) = value { return text.codeUnits }; return nil }

    func testReferenceIdentityIsSeparateFromViewEquality() {
        let array = Value.array([.number(1)]), equalArray = Value.array([.number(1)])
        XCTAssertEqual(array, equalArray)
        XCTAssertTrue(isLooselyEqual(array, array))
        XCTAssertFalse(isLooselyEqual(array, equalArray))
        let object = Value.object([ObjectField(key: "n", value: .number(1))])
        XCTAssertFalse(isLooselyEqual(object, .object([ObjectField(key: "n", value: .number(1))])))
        XCTAssertTrue(isLooselyEqual(object, object))
        let element = Value.element(EvaluatedElement(typeName: "Text"))
        XCTAssertTrue(isLooselyEqual(element, element))
        let plan = Value.actionPlan(ActionPlan())
        XCTAssertTrue(isLooselyEqual(plan, plan))
        XCTAssertFalse(isLooselyEqual(plan, .actionPlan(ActionPlan())))
        let binding = Value.reactiveBinding(target: "$x", expression: .stateRef("$value"))
        XCTAssertTrue(isLooselyEqual(binding, binding))
        XCTAssertFalse(isLooselyEqual(binding, .reactiveBinding(target: "$x", expression: .stateRef("$value"))))
    }
    func testSameValueDistinguishesSignedZeroAndStabilizesNaN() {
        XCTAssertTrue(Value.number(.nan).isSameValue(as: .number(.nan)))
        XCTAssertFalse(isLooselyEqual(.number(.nan), .number(.nan)))
        XCTAssertFalse(Value.number(0).isSameValue(as: .number(-0.0)))
        XCTAssertTrue(isLooselyEqual(.number(0), .number(-0.0)))
    }
    func testStateUsesUpstreamShallowObjectComparison() {
        let state = createStore(), a = Value.object([ObjectField(key: "n", value: .number(1))])
        let b = Value.object([ObjectField(key: "n", value: .number(1))])
        state.set("$a", value: a, pristine: false); state.set("$b", value: b, pristine: false)
        XCTAssertFalse(isLooselyEqual(state.get("$a")!, state.get("$b")!))
        state.set("$b", value: a, pristine: false)
        XCTAssertFalse(isLooselyEqual(state.get("$a")!, state.get("$b")!))
        XCTAssertTrue(state.get("$b")!.isSameValue(as: b), "A shallow-equal write keeps the existing reference, as upstream does")
        state.set("$b", value: b, pristine: false)
        XCTAssertFalse(isLooselyEqual(state.get("$a")!, state.get("$b")!))
    }
    func testDeclarationDefaultGraphIsStableAndPersistedGraphWins() {
        let schema = LibrarySchema(components: ["Text": [ParamDef(name: "text", required: true)]], callDefs: builtinCallDefs)
        let parsed = createParser(schema: schema).parse("$a = [{n:1}]\nroot = Text($a)")
        let state = createStore(); state.initialize(defaults: parsed.stateDeclarations, persisted: [:])
        let first = state.get("$a")!
        state.initialize(defaults: parsed.stateDeclarations, persisted: [:])
        XCTAssertTrue(isLooselyEqual(first, state.get("$a")!))
        let restored = Value.array([])
        state.initialize(defaults: parsed.stateDeclarations, persisted: ["$a": restored])
        state.initialize(defaults: parsed.stateDeclarations, persisted: [:])
        XCTAssertTrue(isLooselyEqual(restored, state.get("$a")!))
    }
    func testBuiltinsAndNativeFunctionsRetainOrAllocateTheCorrectContainer() {
        let state = createStore(), item = Value.object([ObjectField(key: "n", value: .number(1))])
        state.set("$item", value: item, pristine: false); state.set("$rows", value: .array([item]), pristine: false)
        let any = ParamDef(name: "value", required: true)
        let runtime = evaluator(state, functions: ["Identity": CustomFunction(params: [any], fn: { $0["value"]! }),
            "Clone": CustomFunction(params: [any], fn: { args in if case .array(let values) = args["value"] { return .array(values.values) }; return .null })])
        func result(_ source: String) -> Value { runtime.evaluate(parseExpression(tokenize(source))) }
        for expression in ["$rows == $rows", "@First($rows) == $item", "$rows[0] == $item", "@Identity($rows) == $rows"] {
            XCTAssertEqual(result(expression), .boolean(true), expression)
        }
        for expression in ["[] == []", "{} == {}", "@Clone($rows) == $rows", "@Sort($rows, \"n\") == $rows", "$rows.n == $rows.n"] {
            XCTAssertEqual(result(expression), .boolean(false), expression)
        }
        XCTAssertEqual(result("@Count(@Filter($rows, \"\", \"==\", $item))"), .number(1))
    }
    func testStringIndexAndConcatenationNeverRepairSurrogates() {
        let runtime = evaluator(createStore())
        func result(_ source: String) -> Value { runtime.evaluate(parseExpression(tokenize(source))) }
        XCTAssertEqual(result(#""😀".length"#), .number(2))
        XCTAssertEqual(units(result(#""😀"[0]"#)), [0xD83D])
        XCTAssertEqual(units(result(#""😀".1"#)), [0xDE00])
        XCTAssertEqual(units(result(#""\uD83D" + "\uDE00""#)), [0xD83D,0xDE00])
        XCTAssertEqual(result(#""é" == "e\u0301""#), .boolean(false))
        XCTAssertEqual(result(#""\uD800".length"#), .number(1))
        XCTAssertEqual(result(#""12\uD800" - 0"#), .number(0))
        XCTAssertNil(validate(.string(OpenUIString(codeUnits: [49,50,0xD800])), rules: [ParsedRule(type: "numeric")]))
    }
    func testJSONAndObjectKeysRoundTripWithoutSwiftNormalization() throws {
        let json = try parseJSONPreservingOrder(#"{"\uD800":"\uDC00","é":1,"e\u0301":2}"#)
        XCTAssertEqual(json.rawObjectFields?.count, 3)
        XCTAssertEqual(json.rawObjectFields?.first?.0.codeUnits, [0xD800])
        let value = jsonToValue(json)
        guard case .object(let object) = value else { return XCTFail("Object expected") }
        XCTAssertEqual(units(object[OpenUIString(codeUnits: [0xD800])]!), [0xDC00])
        XCTAssertEqual(object[OpenUIString("é")], .number(1))
        XCTAssertEqual(object[OpenUIString("e\u{301}")], .number(2))
        let encoded = try value.jsonString()
        XCTAssertTrue(encoded.contains("\\ud800")); XCTAssertTrue(encoded.contains("\\udc00"))
        XCTAssertEqual(try parseJSONPreservingOrder(encoded), json)
        XCTAssertThrowsError(try JSONEncoder().encode(JSONValue.string(OpenUIString(codeUnits: [0xD800]))))
    }
    func testRawJSONTextMCPAndInterpolationKeepIsolatedUnits() throws {
        let high = OpenUIString(codeUnits: [0xD800]), low = OpenUIString(codeUnits: [0xDC00])
        let parsed = try parseJSONPreservingOrder(OpenUIString(codeUnits: [34,0xD800,34]))
        XCTAssertEqual(parsed.codeUnitString, high)
        let content = JSONValue.object([JSONField(key: "content", value: .array([
            .object([JSONField(key: "type", value: .string("text")), JSONField(key: "text", value: .string(high))])
        ]))])
        XCTAssertEqual(units(try extractToolResult(content)), high.codeUnits)
        let interpolated: OpenUIString = "prefix\(high)\(low)"
        XCTAssertEqual(interpolated.codeUnits, Array("prefix".utf16) + [0xD800,0xDC00])
        XCTAssertEqual(units(Value.string("\(high)\(low)")), [0xD800,0xDC00])
        XCTAssertEqual(ObjectField(key: "\(high)", value: .null).key, high)
        XCTAssertEqual(JSONField(key: "\(high)", value: .null).key, high)
        let object = OpenUIObject([ObjectField(key: high, value: .string(low))])
        XCTAssertEqual(object["\(high)"], .string(low))
        let state = createStore(); state.set("\(high)",value:.string(low),pristine:false)
        XCTAssertEqual(state.get(high),.string(low))
        if case .member(_,let key) = ASTNode.member(.null,"\(high)") { XCTAssertEqual(key,high) }
        let duplicate = JSONValue.object([JSONField(key: "é", value: .number(1)), JSONField(key: "e\u{301}", value: .number(2))])
        XCTAssertThrowsError(try JSONEncoder().encode(duplicate))
    }
    func testLosslessStateKeysRemainDistinct() {
        let state = createStore(), raw = OpenUIString(codeUnits: [0xD800])
        state.set(raw, value: .string(OpenUIString(codeUnits: [0xDC00])), pristine: false)
        state.set(OpenUIString("é"), value: .number(1), pristine: false)
        state.set(OpenUIString("e\u{301}"), value: .number(2), pristine: false)
        XCTAssertEqual(state.getSnapshot().count, 3)
        XCTAssertEqual(units(state.get(raw)!), [0xDC00])
    }
    func testSourceSerializationAndStreamingKeepCodeUnits() {
        let schema = LibrarySchema(components: ["Text": [ParamDef(name: "text", required: true)]], callDefs: builtinCallDefs)
        let source = #"$x = "\uD800"\nroot = Text($x + "\uDC00")"#.replacingOccurrences(of: "\\n", with: "\n")
        let batch = createParser(schema: schema).parse(source)
        let stream = createStreamingParser(schema: schema)
        for unit in source.unicodeScalars { stream.push(String(unit)) }
        let final = stream.getResult(complete: true)
        XCTAssertEqual(final.root, batch.root)
        let node = ElementNode(typeName: "Text", props: [.init(key: "text", value: .value(.string(OpenUIString(codeUnits: [0xD800]))))])
        let encoded = jsonToOpenUI(node, params: schema.components)
        XCTAssertTrue(encoded.contains("\\ud800"))
        let reparsed = createParser(schema: schema).parse(encoded)
        XCTAssertEqual(evaluator(createStore()).evaluateRoot(reparsed)?.props.first?.1, .string(OpenUIString(codeUnits: [0xD800])))
    }
    func testRegExpUsesECMAScriptCodeUnitModeAndExplicitErrorOutcomes() {
        let emoji = OpenUIString("😀"), high = OpenUIString(codeUnits: [0xD83D])
        XCTAssertEqual(testRegExp("^.$", value: emoji), .noMatch)
        XCTAssertEqual(testRegExp("^..$", value: emoji), .matches)
        XCTAssertEqual(testRegExp("^.$", value: high), .matches)
        XCTAssertEqual(testRegExp("^[😀]$", value: high), .matches)
        XCTAssertEqual(testRegExp("^[😀]$", value: emoji), .noMatch)
        XCTAssertEqual(testRegExp("^😀+$", value: OpenUIString(codeUnits: [0xD83D,0xDE00,0xDE00])), .matches)
        XCTAssertEqual(testRegExp("[", value: "x"), .invalidPattern)
        XCTAssertEqual(testRegExp("^(a+)+$", value: OpenUIString(String(repeating: "a", count: 100) + "!")), .resourceError)
        XCTAssertNil(validate(.string("x"), rules: [ParsedRule(type: "pattern", arg: .string("["))]))
        XCTAssertEqual(testRegExp(OpenUIString(codeUnits: [94,0,36]), value: OpenUIString(codeUnits: [0])), .matches)
        XCTAssertEqual(testRegExp(OpenUIString(String(repeating: "a", count: 65537)), value: "a"), .resourceError)
        XCTAssertNotNil(validate(.string("a"), rules: [ParsedRule(type: "pattern", arg: .string(String(repeating: "a", count: 65537)))]))
    }
    func testCapturedActionArgumentsKeepIdentityWhileFormPayloadIsReadPerStep() {
        let finished = expectation(description: "Action identity")
        Task { @MainActor in
            defer { finished.fulfill() }
            let state = createStore(), original = Value.array([.number(1)])
            state.set("$a", value: original, pristine: false)
            let runtime = self.evaluator(state, actions: ["Copy": CallDef(kind: .action, params: [ParamDef(name: "value", required: true)])])
            let planValue = runtime.evaluate(parseExpression(tokenize(#"Action([@Set($a, []), @Copy($a), @ToAssistant("send", $a)])"#)))
            guard case .actionPlan(let plan) = planValue else { return XCTFail("Action plan expected") }
            let context = ActionRuntimeContext(store: state, evaluate: runtime.evaluate, runQuery: { _ in }, runMutation: { _ in .failure }, formState: { state.getSnapshot().map { ($0.key,$0.value) } })
            let events = await runActionPlan(plan, context: context)
            XCTAssertEqual(events.count, 2)
            XCTAssertTrue(isLooselyEqual(events[0].params.first!.1, original))
            XCTAssertTrue(isLooselyEqual(events[1].params.first!.1, original))
            XCTAssertFalse(isLooselyEqual(events[1].formState!.first!.1, original))
        }
        wait(for: [finished], timeout: 3)
    }
    func testToolArgumentsAndResultKeepLosslessKeysAndReferenceIdentity() {
        let finished = expectation(description: "Tool wire and identity")
        Task {
            defer { finished.fulfill() }
            let name = OpenUIString(codeUnits: [0xD800]), key = OpenUIString(codeUnits: [0xDC00])
            let input = OpenUIObject([ObjectField(key: key, value: .string(name))])
            let manager = QueryManager(toolEntries: [(name, { @Sendable arguments in .object(arguments) })])
            manager.runQuery(statementId: "q", tool: name, args: .object(input), defaults: .null)
            for _ in 0..<300 { if manager.queryState(for: "q")?.status == .success { break }; try? await Task.sleep(nanoseconds: 1_000_000) }
            let result = manager.queryState(for: "q")?.data
            XCTAssertTrue(result?.isSameValue(as: .object(input)) == true)
            XCTAssertEqual(try? result?.jsonString(), #"{"\udc00":"\ud800"}"#)
            manager.dispose()
        }
        wait(for: [finished], timeout: 3)
    }
    func testMutationErrorValueRetainsMCPCodeUnitsAndLifecycleIdentity() {
        let done = expectation(description: "Mutation error wire")
        Task {
            defer { done.fulfill() }
            let message = OpenUIString(codeUnits: [0xD800])
            let manager = QueryManager(tools: ["save": { _ in throw MCPToolError(message) }])
            manager.registerMutations(["m":"save"])
            let idle = manager.mutationState(for:"m")!.value
            let outcome = await manager.runMutation(statementId:"m",tool:"save",args:.object([]))
            XCTAssertEqual(outcome.status,.error)
            XCTAssertFalse(outcome.value.isSameValue(as:idle))
            XCTAssertTrue(manager.mutationState(for:"m")!.value.isSameValue(as:outcome.value))
            if case .object(let object) = outcome.value {
                XCTAssertEqual(self.units(object["error"]!), Array("MCP tool error: ".utf16) + message.codeUnits)
            } else { XCTFail("Mutation result object expected") }
            manager.dispose()
        }
        wait(for:[done],timeout:3)
    }

}
