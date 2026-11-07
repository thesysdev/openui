import XCTest
@testable import OpenUILang

final class ParseSnapshotTests: XCTestCase {
    private let schema = LibrarySchema(components: ["Text": [ParamDef(name: "text", required: true)]])
    private func evaluate(_ result: ParseResult) -> EvaluatedElement? {
        let store = createStore()
        let evaluator = Evaluator(context: EvaluationContext(getState: { store.get($0) ?? .null },
            resolveRef: { _ in .null }), store: store, schema: schema)
        return evaluator.evaluateRoot(result)
    }
    func testRenderingUsesCoreSnapshotWithoutMaterializingTheNativeRoot() throws {
        let result = createParser(schema: schema).parse("root=Text(\"Original\")")
        let snapshot = try XCTUnwrap(result.coreSnapshot)
        XCTAssertFalse(snapshot.didReadRoot)
        XCTAssertEqual(evaluate(result)?.typeName, "Text")
        XCTAssertFalse(snapshot.didReadRoot, "Rendering should not copy the unused materialized parse tree")
        XCTAssertEqual(result.root?.typeName, "Text")
        XCTAssertTrue(snapshot.didReadRoot, "Explicit native inspection still returns the typed tree")
        XCTAssertEqual(result.root, result.root)
    }
    func testNativeRootOverridesPreserveValueSemanticsAndEvaluation() throws {
        let result = createParser(schema: schema).parse("root=Text(\"Original\")")
        var changed = result
        changed.root = ElementNode(typeName: "Text", props: [PropEntry(key: "text", value: .value(.string("Changed")))])
        XCTAssertEqual(evaluate(changed)?.props.first?.1, .string("Changed"))
        XCTAssertEqual(evaluate(result)?.props.first?.1, .string("Original"))
        changed.root = nil
        XCTAssertNil(evaluate(changed))
        XCTAssertNotNil(evaluate(result))
    }
    func testLazySnapshotsRetainTheirOwnStreamPrefixAfterSourceReplacement() {
        let parser = createStreamingParser(schema: schema)
        let first = parser.push("root=Text(\"First\")\n", complete: true)
        let second = parser.set("root=Text(\"Second\")", complete: true)
        XCTAssertEqual(evaluate(first)?.props.first?.1, .string("First"))
        XCTAssertEqual(evaluate(second)?.props.first?.1, .string("Second"))
        XCTAssertNotEqual(first.root, second.root)
    }
}
