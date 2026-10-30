import XCTest
@testable import OpenUISwiftUI

final class ActivationIntentTests: XCTestCase {
  func testDragReleaseCannotAlsoActivateAndDoesNotStayBlocked() {
    var time = 1.0
    let intent = NativeActivationIntent(now: { time })
    XCTAssertTrue(intent.permitsActivation)
    intent.moved()
    time += 10
    XCTAssertFalse(intent.permitsActivation, "Pausing while holding a drag is still a drag")
    intent.ended()
    XCTAssertFalse(intent.permitsActivation)
    time += 0.3
    XCTAssertTrue(intent.permitsActivation, "A subsequent deliberate activation is available")
  }
  func testRepeatedEndDoesNotExtendTheReleaseLatch() {
    var time = 1.0
    let intent = NativeActivationIntent(now: { time })
    intent.moved(); intent.ended()
    time += 0.2; intent.ended()
    time += 0.1
    XCTAssertTrue(intent.permitsActivation)
  }
}
