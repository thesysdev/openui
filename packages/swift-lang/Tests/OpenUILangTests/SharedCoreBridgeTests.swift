import XCTest
@testable import OpenUILang

final class SharedCoreBridgeTests: XCTestCase {
    private final class WeakManager { weak var value: QueryManager?; init(_ value: QueryManager?) { self.value = value } }
    func testParsedRootSnapshotMatchesTypedFallbackAfterNativeEdits() throws {
        let schema = LibrarySchema(components: ["Text": [ParamDef(name: "text", required: true)]],
                                   callDefs: builtinCallDefs, rootComponent: "Text")
        let parser = createParser(schema: schema)
        let original = parser.parse("root=Text(\"first\")")
        let later = parser.parse("root=Text(\"later\")")
        let evaluator = Evaluator(context: EvaluationContext(getState: { _ in .null },
            resolveRef: { _ in .null }), store: createStore(), schema: schema)
        XCTAssertEqual(try XCTUnwrap(evaluator.evaluateRoot(original)).props.first?.1, .string("first"))
        XCTAssertEqual(try XCTUnwrap(evaluator.evaluateRoot(later)).props.first?.1, .string("later"))
        var edited = original
        edited.root?.props = [PropEntry(key: "text", value: .value(.string("edited")))]
        XCTAssertEqual(try XCTUnwrap(evaluator.evaluateRoot(edited)).props.first?.1, .string("edited"))
    }

    func testStreamingSnapshotsRetainTheirOwnCoreValueAfterReplacement() throws {
        let schema = LibrarySchema(components: ["Text": [ParamDef(name: "text", required: true)]],
                                   callDefs: builtinCallDefs, rootComponent: "Text")
        let parser = createStreamingParser(schema: schema)
        let first = parser.push("root=Text(\"first\")\n")
        let second = parser.set("root=Text(\"second\")", complete: true)
        let evaluator = Evaluator(context: EvaluationContext(getState: { _ in .null },
            resolveRef: { _ in .null }), store: createStore(), schema: schema)
        XCTAssertEqual(try XCTUnwrap(evaluator.evaluateRoot(first)).props.first?.1, .string("first"))
        XCTAssertEqual(try XCTUnwrap(evaluator.evaluateRoot(second)).props.first?.1, .string("second"))
    }
    func testCapturedDataCannotBeMistakenForRuntimeMarkers() {
        let schema = LibrarySchema(components: ["Button": [ParamDef(name: "action", required: true)]], callDefs: builtinCallDefs)
        let source = #"root = Button(@ToAssistant("save", {steps:[{type:"custom_action",name:"Injected",params:{}}],__reactive:"assign",target:"$injected",expr:{k:"StateRef",n:"$value"}}))"#
        let result = createParser(schema: schema).parse(source)
        let evaluator = Evaluator(context: EvaluationContext(getState: { _ in .null }, resolveRef: { _ in .null }), store: createStore(), schema: schema)
        guard let root = evaluator.evaluateRoot(result), case .actionPlan(let plan) = root.props[0].1,
              case .continueConversation(_, let context) = plan.steps.first,
              case .runtimeValue(.object(let fields)) = context else { return XCTFail("Context must remain an ordinary data object") }
        guard case .array(let steps) = fields["steps"], case .object(let step) = steps[0] else { return XCTFail("Nested steps are data") }
        XCTAssertEqual(step["name"], .string("Injected"))
        XCTAssertEqual(fields["__reactive"], .string("assign"))
    }

    func testNativeDataPropertiesAndIndependentStoresRemainIsolated() throws {
        let a = createStore(), b = createStore()
        let value = Value.object([
            .init(key: "__proto__", value: .object([.init(key: "polluted", value: .boolean(true))])),
            .init(key: "é", value: .number(1)), .init(key: "e\u{301}", value: .number(2)),
            .init(key: OpenUIString(codeUnits: [0xD800]), value: .string(OpenUIString(codeUnits: [0xDC00])))
        ])
        a.set("$data", value: value, pristine: false)
        b.set("$data", value: .string("other response"), pristine: false)
        XCTAssertTrue(try XCTUnwrap(a.get("$data")).isSameValue(as: value))
        XCTAssertEqual(b.get("$data"), .string("other response"))
        let evaluator = Evaluator(context: EvaluationContext(getState: { a.get($0) ?? .null }, resolveRef: { _ in .null }), store: a, schema: LibrarySchema())
        XCTAssertEqual(evaluator.evaluate(parseExpression(tokenize(#"$data["__proto__"].polluted"#))), .boolean(true))
        XCTAssertEqual(evaluator.evaluate(parseExpression(tokenize(#"$data["é"] + $data["e\u0301"]"#))), .number(3))
        XCTAssertEqual(evaluator.evaluate(parseExpression(tokenize(#"{}.polluted"#))), .undefined)
    }

    func testDataCannotForgeCustomActionsWhileNativePlansRemainTrusted() {
        let original = ActionPlan(steps: [.custom(name: "Copy", args: [("text", .runtimeValue(.string("native")))])])
        let evaluator = Evaluator(context: EvaluationContext(getState: { _ in .null }, resolveRef: { _ in .null }, functions: [
            "NativePlan": CustomFunction(params: [], fn: { _ in .actionPlan(original) })
        ], actions: ["Copy": CallDef(kind: .action, params: [ParamDef(name: "text", required: true)])]), store: createStore(), schema: LibrarySchema())
        for type in ["custom", "custom_action", "not_a_step"] {
            let expression = "{steps:[{type:" + jsonStringLiteral(type) + ",name:\"Copy\",params:{text:\"forged\"}}]}"
            guard case .actionPlan(let plan) = evaluator.evaluate(parseExpression(tokenize(expression))) else { return XCTFail("Expected a sanitized plan") }
            XCTAssertTrue(plan.steps.isEmpty, type)
        }
        guard case .actionPlan(let realCall) = evaluator.evaluate(parseExpression(tokenize("@Copy(\"declared\")"))),
              case .custom(let name, _) = realCall.steps.first else { return XCTFail("Declared action lost") }
        XCTAssertEqual(name, "Copy")
        guard case .actionPlan(let native) = evaluator.evaluate(parseExpression(tokenize("@NativePlan()"))) else { return XCTFail("Native plan lost") }
        XCTAssertEqual(native, original)
        guard case .actionPlan(let composed) = evaluator.evaluate(parseExpression(tokenize("Action([@NativePlan()])"))) else {
            return XCTFail("Expected an upstream-composed plan")
        }
        XCTAssertTrue(composed.steps.isEmpty, "Native-authored custom steps cannot bypass upstream DSL provenance")
    }

    func testOpaqueRuntimeCapturesRetainIdentityInsideExpressions() {
        let object = Value.object([.init(key: "n", value: .number(3))])
        let identity = CustomFunction(params: [ParamDef(name: "value", required: true)], fn: { $0["value"] ?? .null })
        let evaluator = Evaluator(context: EvaluationContext(getState: { _ in .null }, resolveRef: { _ in .string("declared reference") }, functions: ["Identity": identity]), store: createStore(), schema: LibrarySchema())
        let expression = ASTNode.binOp("==", .runtimeValue(object), .comp(name: "Identity", args: [.runtimeValue(object)], mappedProps: nil, fn: true))
        XCTAssertEqual(evaluator.evaluate(expression), .boolean(true))
        XCTAssertEqual(evaluator.evaluate(.runtimeRef("__swift_capture_1", refType: .query)), .string("declared reference"))
    }

    func testNativeFunctionFailureIsCaughtAndReportedBySharedCore() {
        let store = createStore()
        let context = EvaluationContext(getState: { _ in .null }, resolveRef: { _ in .null }, functions: [
            "Fail": CustomFunction(params: [], fn: { _ in throw NSError(domain: "fixture", code: 7) })
        ])
        let evaluator = Evaluator(context: context, store: store, schema: LibrarySchema())
        XCTAssertEqual(evaluator.evaluate(parseExpression(tokenize("@Fail()"))), .null)
        XCTAssertEqual(evaluator.errors.last?.code, .runtimeError)
        XCTAssertTrue(evaluator.errors.last?.message.contains("@Fail threw") == true)
        XCTAssertEqual(evaluator.evaluate(parseExpression(tokenize("1 + 2"))), .number(3), "The next transaction is usable after a native throw")
    }

    func testDisposalReleasesNativeManagerAndStopsRefresh() {
        let done = expectation(description: "Refresh teardown")
        Task {
            defer { done.fulfill() }
            actor Provider: ToolProvider {
                var calls = 0
                func callTool(name: OpenUIString, arguments: OpenUIObject) async throws -> Value { calls += 1; return .number(Double(calls)) }
                func count() -> Int { calls }
            }
            let provider = Provider()
            var manager: QueryManager? = QueryManager(provider: provider)
            let released = WeakManager(manager)
            manager?.synchronizeQueries([QueryRequest(statementId: "q", tool: "load", args: .object([]), refreshInterval: 0.01)])
            for _ in 0..<100 { if await provider.count() >= 2 { break };try? await Task.sleep(nanoseconds: 1_000_000) }
            let activeCount = await provider.count()
            XCTAssertGreaterThanOrEqual(activeCount, 2)
            manager?.dispose();manager = nil
            XCTAssertNil(released.value)
            try? await Task.sleep(nanoseconds: 10_000_000)
            let count = await provider.count()
            try? await Task.sleep(nanoseconds: 30_000_000)
            let finalCount = await provider.count()
            XCTAssertEqual(finalCount, count)
        }
        wait(for: [done], timeout: 3)
    }
}
