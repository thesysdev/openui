import XCTest
@testable import OpenUISwiftUI

final class CardGridGeometryTests: XCTestCase {
  func testAdaptiveColumnsUseTheContainerAndPreserveSingleCards() {
    let grid = NativeCardGrid(minimumWidth: 240, spacing: 12)
    XCTAssertEqual(grid.columnCount(width: 390, count: 3), 1)
    XCTAssertEqual(grid.columnCount(width: 1040, count: 3), 3)
    XCTAssertEqual(grid.columnCount(width: 1040, count: 1), 1)
    XCTAssertEqual(grid.columnWidth(width: 1040, columns: 3), 1016 / 3, accuracy: 0.01)
  }
  func testFixedColumnsAndCompleteRowHeightRemainExplicit() {
    let grid = NativeCardGrid(fixedColumns: 2, minimumWidth: 240, spacing: 12)
    XCTAssertEqual(grid.columnCount(width: 390, count: 1), 2)
    XCTAssertEqual(grid.columnWidth(width: 390, columns: 2), 189)
    XCTAssertEqual(grid.height([100, 200, 50], columns: 2), 262)
    XCTAssertEqual(grid.height([], columns: 2), 0)
  }
}
