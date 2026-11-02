import OpenUILang
import XCTest
@testable import OpenUISwiftUI

final class ResourceValidationTests:XCTestCase {
    @MainActor func testExhaustedPatternBlocksSubmissionWithADistinctReason() throws {
        let validation = NativeFormValidation()
        let rules = parseStructuredRules(try parseJSONPreservingOrder(#"{"pattern":"^a+$"}"#))
        validation.register("value",rules:rules,value:{.string(OpenUIString(String(repeating:"a",count:1_048_577)))})
        XCTAssertFalse(validation.validateAll())
        XCTAssertTrue(validation.errors["value"]?.contains("resource limit exceeded") == true)
        validation.register("value",rules:rules,value:{.string("b")})
        XCTAssertFalse(validation.validateAll())
        XCTAssertEqual(validation.errors["value"],"Invalid format")
    }
}
