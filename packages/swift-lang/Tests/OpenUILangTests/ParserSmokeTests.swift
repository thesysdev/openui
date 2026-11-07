import XCTest
@testable import OpenUILang

final class ParserSmokeTests: XCTestCase {
    func makeSchema() -> LibrarySchema {
        let stack = ParamDef(name: "children", required: true,
                             schema: .object([JSONField(key: "type", value: .string("array"))]))
        let text = ParamDef(name: "text", required: true,
                            schema: .object([JSONField(key: "type", value: .string("string"))]))
        return LibrarySchema(
            components: ["Stack": [stack], "Text": [text]],
            callDefs: builtinCallDefs,
            rootComponent: "Stack"
        )
    }

    func testSimpleParse() {
        let parser = createParser(schema: makeSchema())
        let result = parser.parse("root = Stack([Text(\"hi\")])")
        XCTAssertNotNil(result.root)
        XCTAssertEqual(result.root?.typeName, "Stack")
        XCTAssertEqual(result.meta.errors.count, 0)
        XCTAssertEqual(result.meta.statementCount, 1)
        XCTAssertFalse(result.meta.incomplete)
    }

    func testUnknownComponent() {
        let parser = createParser(schema: makeSchema())
        let result = parser.parse("root = Nope(\"x\")")
        // Unknown component dropped → root is nil.
        // Upstream: resolvesToComponentCall is syntactic, so no no-root here.
        XCTAssertNil(result.root)
        let codes = result.meta.errors.map { $0.code }
        XCTAssertTrue(codes.contains(.unknownComponent))
    }

    func testStreaming() {
        let parser = createStreamingParser(schema: makeSchema())
        var r = parser.push("root = Stack([Text(\"hi")
        XCTAssertNotNil(r.root)
        r = parser.push("\")])", complete: true)
        XCTAssertNotNil(r.root)
        XCTAssertEqual(r.root?.typeName, "Stack")
        // Stream end must equal batch parse.
        let batch = createParser(schema: makeSchema()).parse("root = Stack([Text(\"hi\")])")
        XCTAssertEqual(r.root, batch.root)
    }

    func testStateDeclaration() {
        let parser = createParser(schema: makeSchema())
        let result = parser.parse("$x = \"a\"\nroot = Stack([Text($x)])")
        XCTAssertEqual(result.stateDeclarations.count, 1)
        XCTAssertEqual(result.stateDeclarations[0].0, "$x")
    }
}
