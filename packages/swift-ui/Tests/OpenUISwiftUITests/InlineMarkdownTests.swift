import Foundation
import XCTest
@testable import OpenUISwiftUI

final class InlineMarkdownTests: XCTestCase {
  func testTextBlockInlineMarkupPreservesContentAndSemantics() {
    let value = NativeInlineMarkdown.attributed("**重点**、*说明*与 `code`：[来源](https://example.com)")
    XCTAssertEqual(String(value.characters), "重点、说明与 code：来源")
    XCTAssertTrue(value.runs.contains { $0.inlinePresentationIntent?.contains(.stronglyEmphasized) == true })
    XCTAssertTrue(value.runs.contains { $0.inlinePresentationIntent?.contains(.emphasized) == true })
    XCTAssertTrue(value.runs.contains { $0.inlinePresentationIntent?.contains(.code) == true })
    XCTAssertTrue(value.runs.contains { $0.link == URL(string: "https://example.com") })
  }

  func testPlainDynamicTextKeepsWhitespaceAndUnicode() {
    let source = "第一行\n第二行  ¥99 / 晚"
    XCTAssertEqual(String(NativeInlineMarkdown.attributed(source).characters), source)
  }
}
