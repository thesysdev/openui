import XCTest
@testable import OpenUIWeb

final class EmbeddedPreparationTests: XCTestCase {
  func testValidInlineSvgWinsOverAnExtraneousResourceField() {
    let doc = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'><circle cx='20' cy='20' r='10'/></svg>"
    guard case .inline(let html, let ratio) = NativeEmbeddedPlan.resolve(svg: true, inline: doc,
      title: "A circle", sourceReady: true, hasResource: true) else { return XCTFail("Valid inline content must render despite the extra src field") }
    XCTAssertTrue(html.contains(doc))
    XCTAssertEqual(ratio, 2)
  }
  func testIncompleteSvgIsPendingRatherThanAnError() {
    XCTAssertEqual(NativeEmbeddedPlan.resolve(svg: true, inline: "<svg><circle", title: "A circle",
      sourceReady: false, hasResource: true), .pending)
  }
  func testInvalidCompletedMarkupDoesNotOfferAResourceRetry() {
    XCTAssertEqual(NativeEmbeddedPlan.resolve(svg: true, inline: "<svg><broken></svg>", title: "A circle",
      sourceReady: true, hasResource: true), .unavailable)
    XCTAssertEqual(NativeEmbeddedPlan.resolve(svg: true, inline: nil, title: "A circle",
      sourceReady: true, hasResource: true), .remote)
  }
}
