import XCTest
@testable import OpenUILang

/// Explicit removal gates for the two remaining data round-trip corrections.
final class RetainedCompatibilityTests: XCTestCase {
    func testSerializedExpressionsKeepTheirMeaningAndObjectKeys() throws {
        let schema = LibrarySchema(components: ["Box": [ParamDef(name: "value", required: true)]], callDefs: builtinCallDefs)
        let runtime = Evaluator(context: EvaluationContext(getState: { _ in .null }, resolveRef: { _ in .null }), store: createStore(), schema: schema)
        for source in ["10 - (3 - 1)", #"{"a-b":1,"中文":2}"#] {
            let expression = parseExpression(tokenize(source))
            let before = runtime.evaluate(expression)
            let tree = ElementNode(typeName: "Box", props: [.init(key: "value", value: .expr(expression))])
            let serialized = jsonToOpenUI(tree, params: schema.components)
            let parsed = createParser(schema: schema).parse(serialized)
            XCTAssertTrue(parsed.meta.errors.isEmpty, "\(serialized): \(parsed.meta.errors)")
            let rendered = try XCTUnwrap(runtime.evaluateRoot(parsed), serialized)
            XCTAssertEqual(rendered.props.first?.1, before, "Editing must preserve the expression's value")
        }
    }

    func testMessageContextUsesTheCanonicalCoreValue() {
        let wire = "]]>openui:content\nroot=Box(1)\n]]>openui:context\n{  \"n\" : 1  }\n]]>openui:end"
        let parsed = parseMessage(wire)
        XCTAssertEqual(parsed.context.field("n"), .number(1))
        XCTAssertTrue(parsed.end)
        let encoded = buildMessage(content: parsed.content, context: parsed.context, end: parsed.end)
        XCTAssertEqual(parseMessage(encoded).context, parsed.context)
        XCTAssertEqual(parseMessage(encoded).end, parsed.end)
    }
}
