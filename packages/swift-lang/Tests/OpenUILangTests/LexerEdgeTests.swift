import XCTest
@testable import OpenUILang

final class LexerEdgeTests: XCTestCase {
    func testFenceExtraction() {
        let text = """
        Here's your UI:
        ```openui-lang
        root = Stack([])
        ```
        Done.
        """
        XCTAssertEqual(stripFences(text).trimmingCharacters(in: .whitespacesAndNewlines),
                       "root = Stack([])")
    }

    func testFenceInStringDoesNotClose() {
        // ``` inside a double-quoted string does not close the fence.
        let text = "```\nroot = Text(\"a ``` b\")\n```"
        let out = stripFences(text)
        XCTAssertTrue(out.contains("a ``` b"))
    }

    func testCommentStripping() {
        XCTAssertEqual(preprocess("root = Stack([]) // comment").trimmingCharacters(in: .whitespacesAndNewlines),
                       "root = Stack([])")
        XCTAssertEqual(preprocess("# full line\nroot = Stack([])").trimmingCharacters(in: .whitespacesAndNewlines),
                       "root = Stack([])")
        // Inside strings, not comments.
        XCTAssertTrue(preprocess("root = Text(\"a // b\")").contains("a // b"))
    }

    func testNumberEdgeCases() {
        let toks = tokenize("a = 1. b = 1e c = 1.5e-3")
        // 1. → num(1) dot ; 1e → num(0-ish); 1.5e-3 → num
        XCTAssertTrue(toks.contains(.num(1)))
        XCTAssertTrue(toks.contains(.dot))
    }

    func testMinusRules() {
        // [1 -2] is one element (negative number).
        let toks = tokenize("a = [1 -2]")
        let nums = toks.filter {
            if case .num = $0 { return true }; return false
        }
        XCTAssertEqual(nums.count, 2)
        // 1 - 2 is subtraction.
        let toks2 = tokenize("a = 1 - 2")
        XCTAssertTrue(toks2.contains(.minus))
    }

    func testBuiltinWithoutAtIsReference() {
        // Builtins require @-prefix: `Count(x)` parses as the reference Count
        // (args dropped), which is unresolved → root is null.
        // An @-prefixed unknown like @Foo(x) reports unknown-function.
        let parser = createParser(schema: LibrarySchema())
        let r1 = parser.parse("root = Count(x)")
        XCTAssertFalse(r1.meta.errors.map { $0.code }.contains(.unknownFunction))
        let r2 = parser.parse("root = @Foo(x)")
        XCTAssertTrue(r2.meta.errors.map { $0.code }.contains(.unknownFunction))
    }

    func testMultilineTernary() {
        let text = "root = Stack([])\nstatus = $count > 0\n  ? \"Has items\"\n  : \"Empty\""
        let stmts = splitStatements(tokenize(preprocess(text)))
        XCTAssertEqual(stmts.count, 2)
        XCTAssertEqual(stmts[1].id, "status")
    }

    func testAutoClose() {
        let (text, incomplete) = autoClose("root = Stack([Text(\"hi\")")
        XCTAssertTrue(incomplete)
        XCTAssertTrue(text.hasSuffix("])"))
        let (text2, incomplete2) = autoClose("a = \"abc")
        XCTAssertTrue(incomplete2)
        XCTAssertTrue(text2.hasSuffix("\""))
    }

    func testSkipInvalidLines() {
        let stmts = splitStatements(tokenize(preprocess("not a statement\nroot = Stack([])")))
        XCTAssertEqual(stmts.count, 1)
        XCTAssertEqual(stmts[0].id, "root")
    }
}
