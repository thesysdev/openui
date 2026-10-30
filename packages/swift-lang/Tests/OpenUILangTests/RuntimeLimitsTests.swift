import XCTest
@testable import OpenUILang

final class RuntimeLimitsTests: XCTestCase {
    func testSourceBudgetPreservesOperatorAndDepthBoundaries() {
        XCTAssertFalse(sourceExceedsLimits("root=" + Array(repeating: "1", count: 257).joined(separator: "+")))
        XCTAssertTrue(sourceExceedsLimits("root=" + Array(repeating: "1", count: 258).joined(separator: "+")))
        XCTAssertFalse(sourceExceedsLimits("root=" + String(repeating: "[", count: 128) + "1" + String(repeating: "]", count: 128)))
        XCTAssertTrue(sourceExceedsLimits("root=" + String(repeating: "[", count: 129) + "1"))
    }

    func testSourceBudgetMatchesTheExistingTokenGuard() {
        let expressions = [
            "root=Text(\"++++[[[ punctuation is text\")",
            "$value=1\nroot=Text(\"value\")",
            "root=Stack([Text(\"unfinished",
            "root=1?2:3\nnext=" + Array(repeating: "1", count: 258).joined(separator: "+"),
        ]
        for source in expressions {
            let reference = splitStatements(tokenize(source)).contains { expressionExceedsLimits($0.tokens) }
            XCTAssertEqual(sourceExceedsLimits(source), reference, source)
        }
    }
    func testGuardIgnoresCommentsAndFencesLikeTheSharedParser() {
        let schema = ParserSmokeTests().makeSchema()
        let source = "root=Stack([Text(\"https://example.test/#place\")])"
        let symbols = String(repeating: "+", count: 260)
        for marker in ["#", "//"] {
            let text = source + " " + marker + symbols
            XCTAssertFalse(sourceExceedsLimits(text), "Comment content is not an expression")
            let batch = createParser(schema: schema).parse(text)
            XCTAssertNotNil(batch.root)
            XCTAssertTrue(batch.meta.errors.isEmpty, "\(batch.meta.errors)")
            let stream = createStreamingParser(schema: schema)
            _ = stream.push(source + " " + marker)
            let partial = stream.push(symbols)
            XCTAssertTrue(partial.meta.errors.isEmpty, "Comments arriving in a stream must stay comments")
            let final = stream.push("\n", complete: true)
            XCTAssertNotNil(final.root)
            XCTAssertTrue(final.meta.errors.isEmpty, "\(final.meta.errors)")
        }
        let fenced = "```openui-lang\n" + source + " #" + symbols + "\n```"
        XCTAssertFalse(sourceExceedsLimits(fenced))
        XCTAssertTrue(createParser(schema: schema).parse(fenced).meta.errors.isEmpty)
        XCTAssertTrue(sourceExceedsLimits("root=" + Array(repeating: "1", count: 258).joined(separator: "+")))
    }

    func testGuardUsesTheSameSelectedMessageContentAsBatchAndStreamSet() {
        let schema = ParserSmokeTests().makeSchema()
        let prior = "root=" + Array(repeating: "1", count: 258).joined(separator: "+")
        let current = "root=Stack([Text(\"Latest\")])"
        let wire = "]]>openui:content\n" + prior + "\n]]>openui:content\n" + current + "\n]]>openui:end"
        XCTAssertEqual(parseMessage(wire).content.trimmingCharacters(in: .whitespacesAndNewlines), current)
        let batch = createParser(schema: schema).parse(wire)
        XCTAssertNotNil(batch.root)
        XCTAssertTrue(batch.meta.errors.isEmpty, "\(batch.meta.errors)")
        let stream = createStreamingParser(schema: schema)
        let snapshot = stream.set(wire, complete: false)
        XCTAssertNotNil(snapshot.root)
        XCTAssertTrue(snapshot.meta.errors.isEmpty, "\(snapshot.meta.errors)")
        let appended = stream.push("\n", complete: true)
        XCTAssertNotNil(appended.root)
        XCTAssertTrue(appended.meta.errors.isEmpty, "\(appended.meta.errors)")
    }

}
