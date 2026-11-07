import XCTest
@testable import OpenUILang

final class ProtocolRegressionTests: XCTestCase {
    private var schema: LibrarySchema {
        LibrarySchema(components: ["Text": [ParamDef(name: "text", required: true)]], callDefs: builtinCallDefs, rootComponent: "Text")
    }
    private func directCoreStream(_ source: String) -> ParseResult {
        let core = SharedCore.shared
        return core.sync {
            let parser = core.core("createStreamingParser", [core.json(core.schemaJSON(schema)), schema.rootComponent as Any])
            for scalar in source.unicodeScalars {
                _ = parser.invokeMethod("push", withArguments: [String(scalar), false])
            }
            return core.parseResult(parser.invokeMethod("getResult", withArguments: [true]))
        }
    }
    func testFinalizationMatchesCoreAndSetExplicitlyReplacesTheProgram() {
        let source = "root = Text(\"old\")\nroot = Text(\"new"
        let parser = createStreamingParser(schema: schema)
        parser.push(source)
        let final = parser.getResult(complete: true)
        let expected = directCoreStream(source)
        XCTAssertEqual(final.root, expected.root)
        XCTAssertEqual(final.meta.statementCount, expected.meta.statementCount)
        XCTAssertEqual(parser.getResult().root, final.root)
        let next = parser.set("root = Text(\"next\")", complete: true)
        XCTAssertEqual(next.meta.statementCount, 1)
        XCTAssertEqual(next.root, createParser(schema: schema).parse("root = Text(\"next\")").root)
    }
    func testPossibleTernaryContinuationIsNotPrematurelyCommitted() {
        let parser = createStreamingParser(schema: schema)
        parser.push("$x = true\nroot = $x\n")
        let last = parser.push(" ? Text(\"yes\") : Text(\"no\")", complete: true)
        let batch = createParser(schema: schema).parse("$x = true\nroot = $x\n ? Text(\"yes\") : Text(\"no\")")
        XCTAssertEqual(last.rootExpression, batch.rootExpression)
        XCTAssertEqual(last.meta.errors.map(\.code), batch.meta.errors.map(\.code))
    }
    func testObjectDuplicateKeyAndSurrogatePair() throws {
        let value = try parseJSONPreservingOrder(#"{"a":1,"a":2,"emoji":"\uD83D\uDE00"}"#)
        XCTAssertEqual(value.field("a")?.numberValue, 2)
        XCTAssertEqual(value.field("emoji")?.stringValue, "😀")
        XCTAssertThrowsError(try parseJSONPreservingOrder("{} trailing"))
        XCTAssertThrowsError(try parseJSONPreservingOrder("01"))
    }
    func testLargeIntegralNumberFormattingDoesNotTrap() {
        XCTAssertEqual(jsNumberString(1e20), "100000000000000000000")
        XCTAssertEqual(jsNumberString(0.000001), "0.000001")
    }
    func testActionAndMaterializedEqualityAreReflexive() {
        let step = ActionStep.set(target: "$x", valueAST: .num(1))
        XCTAssertEqual(step, step)
        XCTAssertEqual(Value.number(.nan), Value.number(.nan), "Structural equality must stabilize UI snapshots")
        XCTAssertFalse(isLooselyEqual(.number(.nan), .number(.nan)), "The DSL equality operator retains JS semantics")
        XCTAssertEqual(Materialized.expr(.str("x")), Materialized.expr(.str("x")))
    }
    func testLibrarySpecWireMapsAndDefaults() throws {
        let component = defineComponent(name: "Text", description: "Text", params: [
            ParamDef(name: "text", required: true, schema: .object([.init(key: "type", value: .string("string"))])),
            ParamDef(name: "size", required: false, hasDefault: true, defaultValue: .string("small"), schema: .object([.init(key: "type", value: .string("string"))]))
        ])
        let library = try createLibrary(components: [component], root: "Text", id: "test")
        let spec = library.toSpec()
        let json = try parseJSONPreservingOrder(spec.jsonString())
        XCTAssertNotNil(json.field("components")?.field("Text"))
        XCTAssertNil(json.field("version"))
        XCTAssertEqual(json.field("schema")?.field("$defs")?.field("Text")?.field("properties")?.field("size")?.field("default")?.stringValue, "small")
    }
}

extension ProtocolRegressionTests {
    private func ref(_ name: String) -> JSONValue { .object([.init(key: "$ref", value: .string("#/$defs/" + name))]) }
    func testLibraryNamespacesGroupsAndSlotEdits() throws {
        let text = defineComponent(name: "Text", description: "", params: [])
        let card = defineComponent(name: "Card", description: "", params: [])
        let stack = defineComponent(name: "Stack", description: "", params: [ParamDef(name: "children", required: true, schema: .object([
            .init(key: "type", value: .string("array")), .init(key: "items", value: .object([.init(key: "anyOf", value: .array([ref("Text")]))]))
        ]))])
        let base = try createLibrary(components: [stack,text], root: "Stack", id: "base", componentGroups: [ComponentGroup(name: "Layout", components: ["Stack", "Text"])])
        let extended = try base.extend(LibraryExtension(addComponents: [card], addComponentSlots: ["Card": ["Stack.children"]]))
        let refs = extended.toJSONSchema().field("$defs")?.field("Stack")?.field("properties")?.field("children")?.field("items")?.field("anyOf")?.arrayItems
        XCTAssertEqual(refs?.count, 2)
        XCTAssertNil(extended.id); XCTAssertEqual(base.id, "base")
        let removed = try extended.extend(LibraryExtension(removeComponents: ["Text"]))
        XCTAssertEqual(removed.componentGroups?.first?.components, ["Stack"])
        XCTAssertThrowsError(try base.extend(LibraryExtension(removeComponents: ["Text"])))
        XCTAssertThrowsError(try base.extend(LibraryExtension(addComponents: [card], addComponentSlots: ["Card": ["Missing.children"]])))
        let function = defineFunction(name: "Format", description: "", params: [], fn: { _ in .null })
        let functions = try createLibrary(components: [text], functions: [function])
        XCTAssertEqual(functions.toSpec().functions.first?.signature, "Format()")
        XCTAssertThrowsError(try functions.extend(LibraryExtension(addComponents: [defineComponent(name: "Format", description: "", params: [])])))
        XCTAssertThrowsError(try createLibrary(components: [text], functions: [function], root: "Format"))
        let grouped = try createLibrary(components: [text], componentGroups: [ComponentGroup(name: "Bad", components: ["Missing"])])
        XCTAssertEqual(grouped.componentGroups?.first?.components, ["Missing"], "The pinned core retains group metadata without native-only validation")
        let unicode = try createLibrary(components: [defineComponent(name: "Éxample", description: "", params: [])])
        XCTAssertEqual(unicode.components.first?.name, "Éxample", "Authoring names follow the pinned core rather than native identifier rules")
    }
    func testActionRefsSurviveLibraryWireRoundTrip() throws {
        let action = defineAction(name: "Copy", description: "Copy", params: [ParamDef(name: "text", required: true, schema: .object([.init(key: "type", value: .string("string"))]))])
        let button = defineComponent(name: "Button", description: "Button", params: [
            ParamDef(name: "action", required: false, schema: ref("ActionExpression")),
            ParamDef(name: "share", required: false, schema: .object([.init(key: "anyOf", value: .array([ref("Copy"),ref("OpenUrl")]))]))
        ])
        let library = try createLibrary(components: [button], actions: [action], root: "Button")
        let spec = try LibrarySpec(jsonString: library.toSpec().jsonString())
        XCTAssertTrue(spec.components[0].signature.contains("@Copy | @OpenUrl"))
        XCTAssertNotNil(spec.schema.field("$defs")?.field("Copy"))
        XCTAssertNotNil(spec.schema.field("$defs")?.field("ActionExpression"))
        let parsed = createParser(schema: compileLibrarySchema(spec)).parse("root = Button(@Copy(\"hello\"), @OpenUrl(\"https://example.com\"))")
        XCTAssertNotNil(parsed.root); XCTAssertTrue(parsed.meta.errors.isEmpty)
    }
    func testRuntimeFunctionAndActionValidation() throws {
        let string = JSONValue.object([.init(key: "type", value: .string("string"))])
        let param = ParamDef(name: "text", required: true, schema: string)
        let function = CustomFunction(params: [param], returns: string, fn: { _ in .number(7) })
        let store = createStore(); store.set("$value", value: .number(3), pristine: false)
        let context = EvaluationContext(getState: { store.get($0) ?? .null }, resolveRef: { _ in .null }, functions: ["Format": function], actions: ["Copy": CallDef(kind: .action, params: [param])])
        let evaluator = Evaluator(context: context, store: store, schema: schema)
        XCTAssertEqual(evaluator.evaluate(parseExpression(tokenize("@Format($value)"))), .null)
        XCTAssertEqual(evaluator.errors.last?.code, .runtimeError)
        let invalidAction = evaluator.evaluate(parseExpression(tokenize("@Copy($value)")))
        XCTAssertEqual(invalidAction, .actionPlan(ActionPlan()))
        store.set("$value", value: .string("hello"), pristine: false)
        XCTAssertEqual(evaluator.evaluate(parseExpression(tokenize("@Format($value)"))), .null, "Invalid return types are checked too")
    }
    func testMCPExtractionAndErrors() throws {
        XCTAssertEqual(try extractToolResult(parseJSONPreservingOrder(#"{"content":[{"type":"text","text":"{\"a\":"},{"type":"text","text":"1}"}]}"#)), .object([.init(key: "a", value: .number(1))]))
        XCTAssertEqual(try extractToolResult(parseJSONPreservingOrder(#"{"content":[{"type":"text","text":"ignored"}],"structuredContent":0}"#)), .number(0))
        XCTAssertThrowsError(try extractToolResult(parseJSONPreservingOrder(#"{"content":[{"type":"text","text":"failed"}],"isError":true}"#))) { error in
            XCTAssertEqual((error as? MCPToolError)?.toolErrorText, "failed")
        }
    }
    func testLegacyValidationAndCustomOverrides() {
        XCTAssertEqual(parseRules(.array([.string("min:0x10"), .string("pattern:a:b"), .number(2)])).count, 2)
        XCTAssertNotNil(validate(.number(1), rules: [ParsedRule(type: "min")]))
        XCTAssertNil(validate(.string("bad"), rules: [ParsedRule(type: "email")], customValidators: ["email": { _, _ in nil }]))
    }
}

extension ProtocolRegressionTests {
    func testMergeKeepsPinnedUpstreamDuplicateBehavior() {
        let merged = mergeStatements("root = Text(item)\nitem = \"old\"\nitem = \"new\"", "item = \"patched\"")
        XCTAssertEqual(merged.components(separatedBy: "\n").filter { $0.hasPrefix("item =") }.count, 2)
        XCTAssertTrue(merged.contains("patched"))
    }
    func testStreamingAtEveryScalarBoundaryAndSetReconciliation() throws {
        let programs = [
            "root = Text(\"😀 é\")",
            "$x = true\nroot = $x\n ? Text(\"yes\") : Text(\"no\")",
            "root = Text(\"old\")\nroot = Text(\"new",
            "```openui-lang\nroot = Text(\"hello\")\n```",
            "root = Text(label)\nlabel = \"hello\""
        ]
        for program in programs {
            let expected = directCoreStream(program)
            let stream = createStreamingParser(schema: schema)
            for scalar in program.unicodeScalars { stream.push(String(scalar)) }
            let final = stream.getResult(complete: true)
            XCTAssertEqual(final.root, expected.root, program)
            XCTAssertEqual(final.rootExpression, expected.rootExpression, program)
            XCTAssertEqual(final.meta.errors.map(\.code), expected.meta.errors.map(\.code), program)
            let replacement = stream.set("root = Text(\"replacement\")", complete: true)
            XCTAssertEqual(replacement.root, createParser(schema: schema).parse("root = Text(\"replacement\")").root)
        }
    }
    func testRuntimeSerializationKeepsBindingResetAndUnicodeKeys() {
        let props = [ParamDef(name: "value", required: false), ParamDef(name: "action", required: false), ParamDef(name: "data", required: false)]
        let tree = ElementNode(typeName: "Text", props: [
            .init(key: "value", value: .value(.binding("$name"))),
            .init(key: "action", value: .value(.actionPlan(ActionPlan(steps: [.reset(targets: ["$name"])])))),
            .init(key: "data", value: .value(.object([.init(key: "中文", value: .number(1))])))
        ])
        let source = jsonToOpenUI(tree, params: ["Text": props])
        XCTAssertTrue(source.contains("@Reset($name)")); XCTAssertTrue(source.contains("\"中文\""))
        XCTAssertFalse(source.contains("$binding"))
        let evaluator = Evaluator(context: EvaluationContext(getState: { _ in .null }, resolveRef: { _ in .null }), store: createStore(), schema: schema)
        XCTAssertEqual(evaluator.evaluate(parseExpression(tokenize(#"{"é":1,"é":2}["é"]"#))), .number(1))
    }
}

extension ProtocolRegressionTests {
    func testDeepModelInputReportsLimitsInsteadOfOverflowing() {
        let text = "root = Text(" + String(repeating: "(", count: 2000) + "1" + String(repeating: ")", count: 2000) + ")"
        XCTAssertEqual(createParser(schema: schema).parse(text).meta.errors.first?.code, .parseException)
        XCTAssertEqual(createStreamingParser(schema: schema).push(text, complete: true).meta.errors.first?.code, .parseException)
        XCTAssertThrowsError(try parseJSONPreservingOrder(String(repeating: "[", count: 2000) + "0" + String(repeating: "]", count: 2000)))
        let chain = "root = a0\n" + (0..<1000).map { "a\($0) = a\($0 + 1)" }.joined(separator: "\n") + "\na1000 = Text(\"end\")"
        XCTAssertTrue(createParser(schema: schema).parse(chain).meta.errors.contains { $0.code == .parseException })
    }
}
