import XCTest
@testable import OpenUISwiftUI

final class CardGridGeometryTests: XCTestCase {
  func testContainerQueriesApplyToSmallAndMediumCardFamilies() {
    for maximum in [2, 3] {
      let grid = NativeCardGrid(maxPerRow: maximum, spacing: 12)
      XCTAssertEqual(grid.rows(width: 344, count: 4), [1, 1, 1, 1])
      XCTAssertEqual(grid.rows(width: 480, count: 3), [1, 1, 1])
      XCTAssertEqual(grid.rows(width: 481, count: 3), [2, 1])
      XCTAssertEqual(grid.rows(width: 768, count: 3), [2, 1])
      XCTAssertEqual(grid.rows(width: 1040, count: 1), [1])
      XCTAssertEqual(grid.rows(width: 1040, count: 0), [])
    }
    let small = NativeCardGrid(maxPerRow: 3, spacing: 12)
    XCTAssertEqual(small.rows(width: 1040, count: 4), [2, 2])
    XCTAssertEqual(small.rows(width: 1040, count: 8), [3, 2, 3])
    XCTAssertEqual(small.rows(width: 1040, count: 10), [3, 3, 2, 2])
  }

  func testExplicitNonresponsiveLayoutKeepsReferenceRows() {
    let grid = NativeCardGrid(maxPerRow: 2, responsive: false, spacing: 12)
    XCTAssertEqual(grid.rows(width: 344, count: 3), [2, 1])
    XCTAssertEqual(grid.rows(width: 344, count: 1), [1])
    let three = NativeCardGrid(maxPerRow: 3, responsive: false, spacing: 12)
    XCTAssertEqual(three.rows(width: 344, count: 3), [3])
    let accessible = NativeCardGrid(maxPerRow: 3, singleColumn: true, spacing: 12)
    XCTAssertEqual(accessible.rows(width: 1040, count: 3), [1, 1, 1])
    let explicit = NativeCardGrid(maxPerRow: 3, responsive: false, singleColumn: true, spacing: 12)
    XCTAssertEqual(explicit.rows(width: 344, count: 3), [3],
      "An explicit responsive=false must retain the declared layout")
  }

  func testRowsMeasureTheirContentAndStretchAnOddTrailingItem() {
    let grid = NativeCardGrid(maxPerRow: 3, spacing: 12)
    let frames = grid.frames(width: 600, count: 3) { index, _ in [100.0, 200.0, 50.0][index] }
    XCTAssertEqual(frames[0].width, 294)
    XCTAssertEqual(frames[0].height, 200)
    XCTAssertEqual(frames[1].height, 200)
    XCTAssertEqual(frames[2].minY, 212)
    XCTAssertEqual(frames[2].width, 600)
    XCTAssertEqual(frames[2].maxY, 262)
    XCTAssertEqual(grid.frames(width: 600, count: 0) { _, _ in 0 }, [])
  }
}
