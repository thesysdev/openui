#if os(macOS)
import AppKit
import XCTest
import SwiftUI
import OpenUILang
@testable import OpenUISwiftUI

final class CardTextClippingTests: XCTestCase {
  /// Compare visible glyph coverage, excluding color-space/antialias rounding.
  /// An explicit old rounded mask is a negative control for missing strokes.
  @MainActor func testOpenCardsPreserveChineseAndLatinGlyphs() throws {
    _ = NSApplication.shared
    let library = try OpenUIStandardComponents.library()
    let schema = library.library.toSchema()
    func bitmap(_ source: String, horizontalInset: CGFloat = 0, oldMask: Bool = false) throws -> (Int, Int, Data) {
      let state = OpenUIState(schema: schema)
      state.setSource(source)
      XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
      let content = OpenUIRenderer(state: state, registry: library.registry)
        .padding(.horizontal, horizontalInset)
        .frame(width: 320, alignment: .leading)
      let view = Group {
        if oldMask { content.clipShape(RoundedRectangle(cornerRadius: OpenUITheme().cornerRadius, style: .continuous)) }
        else { content }
      }
      .padding(8).background(Color.white)
      .environment(\.colorScheme, .light)
      .environment(\.locale, Locale(identifier: "zh_CN"))
      let renderer = ImageRenderer(content: view)
      renderer.scale = 2
      let image = try XCTUnwrap(renderer.cgImage)
      let width = image.width, height = image.height
      let context = try XCTUnwrap(CGContext(data: nil, width: width, height: height,
        bitsPerComponent: 8, bytesPerRow: width * 4, space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
      context.setFillColor(CGColor(gray: 1, alpha: 1))
      context.fill(CGRect(x: 0, y: 0, width: width, height: height))
      context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
      let bytes = try XCTUnwrap(context.data).assumingMemoryBound(to: UInt8.self)
      var ink = Data(count: width * height)
      for pixel in 0..<(width * height) {
        let i = pixel * 4
        ink[pixel] = (Int(bytes[i]) + Int(bytes[i + 1]) + Int(bytes[i + 2])) < 160 * 3 ? 1 : 0
      }
      return (width, height, ink)
    }
    for title in ["岩质行星", "Retirement savings"] {
      let header = "CardHeader(\"\(title)\",\"水星 · 金星 · 地球 · 火星\")"
      let reference = try bitmap("root=Stack([\(header)])")
      let card = try bitmap("root=Card([\(header)],\"card\")")
      XCTAssertEqual(card.0, reference.0)
      XCTAssertEqual(card.1, reference.1)
      XCTAssertEqual(card.2, reference.2, "Default Card must retain all visible glyph strokes: \(title)")
      let insetReference = try bitmap("root=Stack([\(header)])", horizontalInset: OpenUITheme().spacing("l"))
      let clear = try bitmap("root=Card([\(header)],\"clear\")")
      XCTAssertEqual(clear.0, insetReference.0)
      XCTAssertEqual(clear.1, insetReference.1)
      XCTAssertEqual(clear.2, insetReference.2, "Clear Card must preserve glyphs and existing inset geometry: \(title)")
      let bad = try bitmap("root=Stack([\(header)])", oldMask: true)
      let lostStrokes = zip(reference.2, bad.2).filter { $0.0 == 1 && $0.1 == 0 }.count
      XCTAssertGreaterThan(lostStrokes, 0, "Negative control must still detect the original corner-clipping defect")
    }
  }
}
#endif
