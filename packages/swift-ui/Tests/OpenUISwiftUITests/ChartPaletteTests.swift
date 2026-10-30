import SwiftUI
import XCTest
@testable import OpenUISwiftUI

final class ChartPaletteTests: XCTestCase {
  func testRankedPolarChartsKeepCategoryColorsAcrossChartTypesAndValueChanges() {
    let categories = ["Home", "Food", "Transport", "Other"]
    let expected = ["Home": 0, "Food": 1, "Transport": 2, "Other": 3]
    for values in [[3000.0, 1800, 600, 1200], [300.0, 10, 500, 400]] {
      var input = NativeChartData()
      input.labels = categories
      input.slices = values
      for name in ["PieChart", "RadialChart", "SingleStackedBarChart"] {
        let prepared = input.prepared(for: name)
        let colors = Dictionary(uniqueKeysWithValues: zip(prepared.legendNames(for: name), prepared.colorIndices))
        XCTAssertEqual(colors, expected, "The category owns its color even when ranked polar order changes")
        let visible = prepared.excluding(["Food"], for: name)
        let remaining = Dictionary(uniqueKeysWithValues: zip(visible.legendNames(for: name), visible.colorIndices))
        XCTAssertEqual(remaining, expected.filter { $0.key != "Food" }, "Hiding a category cannot recolor the rest")
        if name != "SingleStackedBarChart" {
          XCTAssertEqual(prepared.slices, values.sorted(by: >), "Keep the existing ranked polar presentation")
        }
      }
      var bar = NativeChartData()
      bar.labels = ["Month"]
      bar.series = zip(categories, values).map { .init(name: $0.0, values: [$0.1]) }
      let prepared = bar.prepared(for: "BarChart")
      XCTAssertEqual(Dictionary(uniqueKeysWithValues: zip(prepared.legendNames(for: "BarChart"), prepared.colorIndices)), expected)
    }
  }

  func testIncreasingCountsPreservesExistingSeriesColors() {
    for count in 1...24 {
      let colors = NativeChartPalette.swatches(count: count)
      XCTAssertEqual(colors.count, count)
      XCTAssertEqual(Array(NativeChartPalette.swatches(count: count + 1).prefix(count)), colors)
      XCTAssertEqual(Set(colors.map(\.light)).count, count)
      XCTAssertEqual(Set(colors.map(\.dark)).count, count)
    }
    XCTAssertEqual(NativeChartPalette.swatches(count: 0).count, 1)
  }

  func testDefaultColorsRemainVisibleAgainstTheirChartBackgrounds() {
    func luminance(_ hex: UInt32) -> Double {
      let channels = [Double((hex >> 16) & 255), Double((hex >> 8) & 255), Double(hex & 255)].map { value -> Double in
        let c = value / 255
        return c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4)
      }
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
    }
    for swatch in NativeChartPalette.swatches(count: 24) {
      XCTAssertGreaterThanOrEqual(1.05 / (luminance(swatch.light) + 0.05), 3)
      XCTAssertGreaterThanOrEqual((luminance(swatch.dark) + 0.05) / (luminance(0x111214) + 0.05), 4.5)
    }
  }

  func testExplicitHostOverridesAndEmptyFallbackRemainSupported() {
    var theme = OpenUITheme()
    XCTAssertEqual(theme.chartColors(forSeriesCount: 12).count, 12)
    theme.dataColors = [.red, .blue]
    XCTAssertEqual(theme.chartColors(forSeriesCount: 12), [.red, .blue])
    theme.dataColors = []
    XCTAssertEqual(theme.chartColors(forSeriesCount: 12), [theme.accent])
  }
}
