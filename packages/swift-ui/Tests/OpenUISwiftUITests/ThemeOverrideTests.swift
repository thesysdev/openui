#if os(macOS)
import AppKit
import SwiftUI
import XCTest
import OpenUILang
@testable import OpenUISwiftUI

final class ThemeOverrideTests: XCTestCase {
  func testPublishedSpacingAndRadiusDefaultsStayUnchanged() {
    let theme = OpenUITheme()
    let keys = ["none", "3xs", "2xs", "xs", "s", "sm", "m", "ml", "l", "xl", "2xl", "3xl"]
    XCTAssertEqual(keys.map { theme.spacing($0) }, [0, 2, 4, 6, 8, 10, 12, 16, 18, 24, 36, 48])
    XCTAssertEqual(theme.spacing(nil), 12)
    XCTAssertEqual(theme.spacing("unknown"), 12)
    XCTAssertEqual([theme.controlCornerRadius, theme.cornerRadius, theme.mediaCornerRadius, theme.overlayCornerRadius], [10, 16, 8, 24])
    XCTAssertEqual([theme.cardRadius(for: "Context"), theme.cardRadius(for: "Overview"), theme.cardRadius(for: "Composite")], [12, 14, 16])
    XCTAssertEqual([theme.cardPadding, theme.contentSpacing], [12, 12])
  }

  func testSharedTokensPropagateUntilExplicitNativeOverride() {
    var theme = OpenUITheme()
    theme.spaceM = 20; theme.radiusM = 9; theme.radius3xl = 22
    XCTAssertEqual([theme.spacing("m"), theme.contentSpacing, theme.cardPadding], [20, 20, 20])
    XCTAssertEqual(theme.mediaCornerRadius, 9)
    XCTAssertEqual(theme.cornerRadius, 22)
    theme.cardPadding = 7; theme.contentSpacing = 11; theme.cornerRadius = 30
    theme.spaceM = 24; theme.radius3xl = 40
    XCTAssertEqual([theme.cardPadding, theme.contentSpacing, theme.spacing("m")], [7, 11, 24])
    XCTAssertEqual([theme.cornerRadius, theme.cardRadius(for: "Context"), theme.cardRadius(for: "Overview")], [30, 26, 28])
    theme.radiusXl = 5
    var tokensOnly = OpenUITheme(); tokensOnly.radiusXl = 5
    XCTAssertEqual(tokensOnly.cardRadius(for: "Context"), 5)
    XCTAssertEqual(theme.cardRadius(for: "Context"), 26, "Existing explicit card radius keeps precedence")
  }

  @MainActor func testStackAndCardReadTheSameOverriddenSpacing() throws {
    _ = NSApplication.shared
    let standard = try OpenUIStandardComponents.library()
    let text = try XCTUnwrap(standard.library.components.first { $0.name == "TextContent" })
    let library = try standard.extending(overriding: [OpenUIComponent(text) { _ in
      Color.primary.frame(height: 10)
    }])
    func height(_ source: String, _ theme: OpenUITheme) throws -> CGFloat {
      let state = OpenUIState(schema: library.library.toSchema()); state.setSource(source)
      XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
      return NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
        .openUITheme(theme).frame(width: 300)).fittingSize.height
    }
    let base = OpenUITheme(); var custom = base
    custom.spaceM = 22; custom.spaceL = 28
    let children = "[TextContent(\"A\"),TextContent(\"B\")]"
    XCTAssertEqual(try height("root=Stack(\(children))", custom) - height("root=Stack(\(children))", base), 10, accuracy: 0.5)
    XCTAssertEqual(try height("root=Card(\(children),\"sunk\")", custom) - height("root=Card(\(children),\"sunk\")", base), 30, accuracy: 0.5)
  }

  @MainActor func testTagPaddingUsesTheOverriddenToken() throws {
    _ = NSApplication.shared
    func height(_ theme: OpenUITheme) -> CGFloat {
      NSHostingView(rootView: NativeTagPill(text: "Tag", size: "md", variant: nil, theme: theme) { EmptyView() }
        .openUITheme(theme).fixedSize()).fittingSize.height
    }
    let base = OpenUITheme(); var custom = base; custom.spaceXs = 10
    XCTAssertEqual(height(custom) - height(base), 8, accuracy: 0.5)
  }

  func testHeavyBodyTracksBodyAndCanBeOverriddenIndependently() {
    var type = OpenUITypography()
    XCTAssertEqual(type.bodyHeavy.size, type.body.size)
    XCTAssertEqual(type.bodyHeavy.weight, .semibold)
    type.body.size = 19
    XCTAssertEqual(type.bodyHeavy.size, 19)
    type.bodyHeavy = OpenUIFont(size: 22, weight: .bold, lineSpacing: 0.3)
    type.body.size = 17
    XCTAssertEqual(type.bodyHeavy.size, 22)
    XCTAssertEqual(type.bodyHeavy.weight, .bold)
    XCTAssertEqual(type.bodyHeavy.lineSpacing, 0.3)
  }

  @MainActor func testBannerTitleUsesHeavyBodyWithoutChangingSubtitleRole() throws {
    _ = NSApplication.shared
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("root=ImageTextLarge(\"\",\"\",\"杭州兰郡酒店（西湖店）\",\"青年路31号｜平台标注舒适型\")")
    XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    func height(_ theme: OpenUITheme) -> CGFloat {
      NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
        .openUITheme(theme).frame(width: 360)).fittingSize.height
    }
    let base = OpenUITheme(); var custom = base
    custom.typography.bodyHeavy = OpenUIFont(size: 30, weight: .bold)
    XCTAssertGreaterThan(height(custom), height(base) + 10)
    XCTAssertEqual(custom.typography.detail, base.typography.detail)
  }

  @MainActor func testPerRoleLineSpacingReachesRenderedMarkdown() {
    _ = NSApplication.shared
    func height(_ font: OpenUIFont) -> CGFloat {
      NSHostingView(rootView: NativeMarkdownText(text: "First line\nSecond line\nThird line", mode: .inline,
        style: .init(font: font)).frame(width: 300)).fittingSize.height
    }
    let base = OpenUIFont(size: 16)
    var custom = base; custom.lineSpacing = 0.8
    XCTAssertGreaterThan(height(custom), height(base) + 8)
  }

  @MainActor func testInvertedAndLinkColorsHaveIndependentThemeRoles() throws {
    _ = NSApplication.shared
    func rgba(_ color: Color, _ appearance: NSAppearance.Name) throws -> [CGFloat] {
      var result: [CGFloat]?
      try XCTUnwrap(NSAppearance(named: appearance)).performAsCurrentDrawingAppearance {
        if let c = NSColor(color).usingColorSpace(.sRGB) { result = [c.redComponent, c.greenComponent, c.blueComponent, c.alphaComponent] }
      }
      return try XCTUnwrap(result)
    }
    for scheme in [NSAppearance.Name.aqua, .darkAqua] {
      let base = OpenUITheme()
      let original = NativeBadgeColors(variant: "inverted", theme: base)
      XCTAssertEqual(try rgba(original.foreground, scheme), try rgba(base.canvas, scheme))
      XCTAssertEqual(try rgba(original.background, scheme), try rgba(base.foreground, scheme))
      var changed = base; changed.canvas = .pink
      XCTAssertEqual(try rgba(NativeBadgeColors(variant: "inverted", theme: changed).foreground, scheme), try rgba(original.foreground, scheme))
      changed.invertedForeground = .yellow; changed.invertedBackground = .blue; changed.link = .green
      let colors = NativeBadgeColors(variant: "inverted", theme: changed)
      XCTAssertEqual(try rgba(colors.foreground, scheme), try rgba(.yellow, scheme))
      XCTAssertEqual(try rgba(colors.background, scheme), try rgba(.blue, scheme))
      XCTAssertEqual(try rgba(changed.link, scheme), try rgba(.green, scheme))
      XCTAssertEqual(try rgba(changed.foreground, scheme), try rgba(base.foreground, scheme))
    }
  }
}
#endif
