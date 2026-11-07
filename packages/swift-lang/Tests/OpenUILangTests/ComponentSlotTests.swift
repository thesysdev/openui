import Foundation
import XCTest
@testable import OpenUILang

/// These expectations come from the pinned, unmodified TypeScript core. Native
/// code must not add stricter slot or inactive-branch language rules.
final class ComponentSlotTests: XCTestCase {
    private func check(_ group: String) throws {
        let url = try XCTUnwrap(Bundle.module.url(forResource: "upstream-slot-behavior", withExtension: "json", subdirectory: "Fixtures"))
        let fixture = try parseJSONPreservingOrder(String(contentsOf: url, encoding: .utf8))
        XCTAssertEqual(fixture.field("upstream")?.stringValue, "9823ec05d4b29bc78d101676dc16b44fe17f1830")
        let allCases = try XCTUnwrap(fixture.field("cases")?.arrayItems)
        XCTAssertEqual(allCases.count, 13, "Do not silently omit pinned upstream slot cases")
        let cases = allCases.filter { $0.field("group")?.stringValue == group }
        XCTAssertFalse(cases.isEmpty)
        for item in cases {
            let source = try XCTUnwrap(item.field("source")?.stringValue)
            let schema = try XCTUnwrap(item.field("schema"))
            let result = createParser(schema: compileLibrarySchema(schema)).parse(source)
            let actual = JSONValue.array(result.meta.errors.map { error in .object([
                .init(key: "code", value: .string(error.code.rawValue)),
                .init(key: "component", value: error.component.map(JSONValue.string) ?? .null),
                .init(key: "path", value: error.path.map(JSONValue.string) ?? .null)
            ]) })
            XCTAssertEqual(actual, item.field("errors"), source)
        }
    }
    func testSlotIdentityMatchesPinnedCore() throws { try check("identity") }
    func testConditionalBranchesMatchPinnedCore() throws { try check("branches") }
    func testFunctionAndEachTemplatesMatchPinnedCore() throws { try check("templates") }
    func testArraysAndJSONMatchPinnedCore() throws { try check("data") }
    func testNestedUnionsMatchPinnedCore() throws { try check("unions") }
    func testRuntimeValuesAndOptionalNullMatchPinnedCore() throws { try check("runtime") }
}
