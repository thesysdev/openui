import SwiftUI
import XCTest
@testable import OpenUISwiftUI

final class NativeLayoutSemanticsTests: XCTestCase {
  func testAroundAndEvenlyHaveDifferentEdgeSpaceWithoutChangingContentSize() {
    let sizes = [CGSize(width: 40, height: 20), CGSize(width: 40, height: 20)]
    let around = OpenUIFlowPlacement.frames(sizes: sizes, width: 200, gap: 8, align: "start", justify: "around", wrap: false)
    let evenly = OpenUIFlowPlacement.frames(sizes: sizes, width: 200, gap: 8, align: "start", justify: "evenly", wrap: false)
    XCTAssertNotEqual(around[0].minX, evenly[0].minX)
    XCTAssertEqual(around[0].minX * 2, around[1].minX - around[0].maxX - 8, accuracy: 0.001)
    XCTAssertEqual(evenly[0].minX, evenly[1].minX - evenly[0].maxX - 8, accuracy: 0.001)
    for row in [around, evenly] {
      XCTAssertEqual(row[0].minX, 200 - row[1].maxX, accuracy: 0.001)
      XCTAssertEqual(row.map(\.size), sizes)
    }
  }
  func testMixedFontBaselinesAlignWithinEachWrappedLine() {
    let sizes = [CGSize(width: 80, height: 28), CGSize(width: 80, height: 50), CGSize(width: 100, height: 32)]
    let baselines: [CGFloat] = [21, 37, 24]
    for width in [CGFloat(180), CGFloat(500)] {
      let frames = OpenUIFlowPlacement.frames(sizes: sizes, width: width, gap: 12, align: "baseline", justify: "start", baselines: baselines)
      XCTAssertEqual(frames[0].minY + baselines[0], frames[1].minY + baselines[1], accuracy: 0.001)
      if width == 180 { XCTAssertGreaterThanOrEqual(frames[2].minY, max(frames[0].maxY, frames[1].maxY) + 12) }
      else { XCTAssertEqual(frames[2].minY + baselines[2], frames[0].minY + baselines[0], accuracy: 0.001) }
    }
  }
  func testStretchFollowsMeasuredLineHeightAndParentCrossExtent() {
    let sizes = [CGSize(width: 60, height: 20), CGSize(width: 90, height: 70)]
    let row = OpenUIFlowPlacement.frames(sizes: sizes, width: 300, gap: 12, align: "stretch", justify: "start", wrap: false, crossExtent: 100)
    XCTAssertEqual(row.map(\.height), [100, 100])
    let narrow = OpenUIFlowPlacement.frames(sizes: sizes, width: 100, gap: 12, align: "stretch", justify: "start")
    XCTAssertEqual(narrow.map(\.height), [20, 70])
    XCTAssertEqual(narrow[1].minY, 32)
  }
  func testPinnedLucideNamesAndCategoryFallbacksHaveDrawablePaths() {
    XCTAssertEqual(NativeIconCatalog.catalog.version, "0.562.0")
    XCTAssertEqual(NativeIconCatalog.catalog.icons.count, 1912)
    for name in ["utensils-crossed", "soup", "wheat"] {
      XCTAssertEqual(NativeIconCatalog.resolvedName(name, category: nil), name)
    }
    XCTAssertEqual(NativeIconCatalog.resolvedName("not-an-icon", category: " FOOD-BEVERAGE "), "cooking-pot")
    XCTAssertEqual(NativeIconCatalog.resolvedName("not-an-icon", category: nil), "circle-dot")
    for (name, primitives) in NativeIconCatalog.catalog.icons {
      XCTAssertFalse(primitives.isEmpty, name)
      XCTAssertTrue(primitives.allSatisfy { !$0.path.isEmpty && !$0.path.boundingRect.isInfinite }, name)
    }
  }
}

extension NativeLayoutSemanticsTests {
    func testLastPeekingPageStaysWithinTheViewportWithoutADeadTrailingArea() {
        let first = NativePagerGeometry(
            width: 350, count: 3, selected: 0,
            maximumPageWidth: 320, minimumPageWidth: 240, peek: 32, spacing: 16)
        let last = NativePagerGeometry(
            width: 350, count: 3, selected: 2,
            maximumPageWidth: 320, minimumPageWidth: 240, peek: 32, spacing: 16)
        XCTAssertEqual(first.offset, 0)
        XCTAssertLessThan(first.pageWidth, first.width)
        XCTAssertEqual(2 * last.stride - last.offset + last.pageWidth, last.width, accuracy: 0.01)
        XCTAssertGreaterThan(2 * last.stride - last.offset, 0, "The previous page remains visible beside the last card")
        let single = NativePagerGeometry(
            width: 300, count: 1, selected: 0,
            maximumPageWidth: 320, minimumPageWidth: 240, peek: 32, spacing: 16)
        XCTAssertEqual(single.pageWidth, 300)
    }
}

extension NativeLayoutSemanticsTests {
  func testWrappedRowsSeparateHorizontalAndVerticalSpacing() {
    let sizes = [CGSize(width: 70, height: 44), CGSize(width: 70, height: 60),
                 CGSize(width: 70, height: 44), CGSize(width: 70, height: 44)]
    let original = OpenUIFlowPlacement.frames(sizes: sizes, width: 160, gap: 16, align: "start", justify: "start")
    let dense = OpenUIFlowPlacement.frames(sizes: sizes, width: 160, gap: 16, align: "start", justify: "start", rowGap: 0)
    let spaced = OpenUIFlowPlacement.frames(sizes: sizes, width: 160, gap: 16, align: "start", justify: "start", rowGap: 4)
    XCTAssertEqual(dense.map(\.minX), original.map(\.minX), "Changing row spacing must not change horizontal wrapping")
    XCTAssertEqual(dense.map(\.size), sizes, "Control targets keep their measured sizes")
    XCTAssertEqual(dense[1].minX - dense[0].maxX, 16)
    XCTAssertEqual(original[2].minY, 76, "Existing callers retain gap on both axes")
    XCTAssertEqual(dense[2].minY, 60, "The next row follows the tallest item, without an extra row gap")
    XCTAssertEqual(spaced[2].minY, 64)
    let oneRow = Array(sizes.prefix(2))
    XCTAssertEqual(
      OpenUIFlowPlacement.frames(sizes: oneRow, width: 320, gap: 16, align: "start", justify: "start"),
      OpenUIFlowPlacement.frames(sizes: oneRow, width: 320, gap: 16, align: "start", justify: "start", rowGap: 0))
  }

  func testDenseRowsKeepMeasuredControlsOrderedAndNonoverlappingAtPhoneWidths() {
    let measured = [CGSize(width: 140, height: 44), CGSize(width: 80, height: 70),
                    CGSize(width: 170, height: 44), CGSize(width: 100, height: 56),
                    CGSize(width: 150, height: 44), CGSize(width: 200, height: 68)]
    for width in [CGFloat(280), CGFloat(320), CGFloat(350)] {
      for count in [2, 4, 6] {
        let sizes = Array(measured.prefix(count))
        let frames = OpenUIFlowPlacement.frames(sizes: sizes, width: width, gap: 16,
                                                align: "start", justify: "start", rowGap: 0)
        XCTAssertEqual(frames.map(\.size), sizes)
        XCTAssertTrue(frames.allSatisfy { $0.minX >= 0 && $0.maxX <= width })
        for index in frames.indices.dropFirst() {
          let prior = frames[index - 1], current = frames[index]
          XCTAssertGreaterThanOrEqual(current.minY, prior.minY, "Wrapping preserves source order")
          if current.minY == prior.minY { XCTAssertEqual(current.minX - prior.maxX, 16) }
        }
        for first in frames.indices {
          for second in frames.indices where second > first {
            XCTAssertTrue(frames[first].intersection(frames[second]).isEmpty, "Distinct touch targets never overlap")
          }
        }
        let rowTops = Array(Set(frames.map(\.minY))).sorted()
        for index in rowTops.indices.dropFirst() {
          let previousBottom = frames.filter { $0.minY == rowTops[index - 1] }.map(\.maxY).max()!
          XCTAssertEqual(rowTops[index], previousBottom, "Row height comes from real measured item heights")
        }
      }
    }
  }
}
