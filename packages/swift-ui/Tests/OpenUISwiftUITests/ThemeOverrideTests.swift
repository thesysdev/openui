#if os(macOS)
import AppKit
import SwiftUI
import XCTest
import OpenUILang
@testable import OpenUISwiftUI

final class ThemeOverrideTests: XCTestCase {
  @MainActor func testListTitlesAndCompactDescriptionsUseTheirIndependentThemeFonts() throws {
    _ = NSApplication.shared
    let library = try OpenUIStandardComponents.library()
    func height(_ source: String, _ theme: OpenUIThemeValues) -> CGFloat {
      let state = OpenUIState(schema: library.library.toSchema()); state.setSource(source)
      XCTAssertTrue(state.errors.isEmpty)
      return NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
        .openUITheme(theme).frame(width: 320)).fittingSize.height
    }
    let list = "root=ListBlock([ListItem(\"A clear place name\",\"A supporting explanation\")],\"number\")"
    let heading = "root=InlineHeader(\"A section\",\"A supporting explanation\")"
    let base = OpenUIThemeValues()
    var titles = base; titles.textBodyDefaultHeavy = OpenUIFont(size: 32, weight: .light)
    XCTAssertGreaterThan(height(list, titles), height(list, base) + 8)
    XCTAssertEqual(height(heading, titles), height(heading, base), accuracy: 1)
    var descriptions = base; descriptions.textBodySm = OpenUIFont(size: 28)
    XCTAssertGreaterThan(height(heading, descriptions), height(heading, base) + 8)
  }

  func testResolvingUnchangedOverridesPreservesColorIdentity() {
    let first = OpenUITheme().resolved()
    let second = OpenUITheme().resolved()
    XCTAssertEqual(first.textNeutralPrimary, second.textNeutralPrimary)
    XCTAssertEqual(first.background, second.background)
    XCTAssertEqual(first.sunk, second.sunk)
    XCTAssertEqual(first.interactiveAccentDisabled, second.interactiveAccentDisabled)
  }

  func testPublishedSpacingAndRadiusDefaultsStayUnchanged() {
    let theme = OpenUIThemeValues()
    let keys = ["none", "3xs", "2xs", "xs", "s", "sm", "m", "ml", "l", "xl", "2xl", "3xl"]
    XCTAssertEqual(keys.map { theme.spacing($0) }, [0, 2, 4, 6, 8, 10, 12, 16, 18, 24, 36, 48])
    XCTAssertEqual(theme.spacing(nil), 12)
    XCTAssertEqual(theme.spacing("unknown"), 12)
    XCTAssertEqual([theme.radiusL, theme.radius3xl, theme.radiusM, theme.radius5xl], [10, 16, 8, 24])
    XCTAssertEqual([theme.cardRadius(for: "Context"), theme.cardRadius(for: "Overview"), theme.cardRadius(for: "Composite")], [12, 14, 16])
  }

  func testOverridesResolveWithoutHiddenPaddingOrRadiusAliases() {
    var overrides = OpenUITheme()
    overrides.spaceM = 20; overrides.radius3xl = 22; overrides.radiusXl = 5
    let theme = overrides.resolved()
    XCTAssertEqual(theme.spacing("m"), 20)
    XCTAssertEqual(theme.cardRadius(for: "Composite"), 22)
    XCTAssertEqual(theme.cardRadius(for: "Context"), 5)
    XCTAssertEqual(theme.cardRadius(for: "Overview"), 14)
    XCTAssertEqual(theme.spaceSM, 10, "Compact cards have their own official spacing token")
    XCTAssertEqual(OpenUITheme().resolved().spaceM, 12)
  }

  @MainActor func testStackAndCardReadTheSameOverriddenSpacing() throws {
    _ = NSApplication.shared
    let standard = try OpenUIStandardComponents.library()
    let text = try XCTUnwrap(standard.library.components.first { $0.name == "TextContent" })
    let library = try standard.extending(overriding: [OpenUIComponent(text) { _ in
      Color.primary.frame(height: 10)
    }])
    func height(_ source: String, _ theme: OpenUIThemeValues) throws -> CGFloat {
      let state = OpenUIState(schema: library.library.toSchema()); state.setSource(source)
      XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
      return NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
        .openUITheme(theme).frame(width: 300)).fittingSize.height
    }
    let base = OpenUIThemeValues(); var custom = base
    custom.spaceM = 22; custom.spaceL = 28
    let children = "[TextContent(\"A\"),TextContent(\"B\")]"
    XCTAssertEqual(try height("root=Stack(\(children))", custom) - height("root=Stack(\(children))", base), 10, accuracy: 0.5)
    XCTAssertEqual(try height("root=Card(\(children),\"sunk\")", custom) - height("root=Card(\(children),\"sunk\")", base), 30, accuracy: 0.5)
  }

  @MainActor func testTagPaddingUsesTheOverriddenToken() throws {
    _ = NSApplication.shared
    func height(_ theme: OpenUIThemeValues) -> CGFloat {
      NSHostingView(rootView: NativeTagPill(text: "Tag", size: "md", variant: nil, theme: theme) { EmptyView() }
        .openUITheme(theme).fixedSize()).fittingSize.height
    }
    let base = OpenUIThemeValues(); var custom = base; custom.spaceXs = 10
    XCTAssertEqual(height(custom) - height(base), 8, accuracy: 0.5)
  }

  func testTextRolesAreCompleteIndependentOverrides() {
    var overrides = OpenUITheme()
    overrides.textBodyDefault = OpenUIFont(size: 19)
    XCTAssertEqual(overrides.resolved().textBodyDefaultHeavy.size, 16)
    overrides.textBodyDefaultHeavy = OpenUIFont(size: 22, weight: .bold, lineSpacing: 0.3)
    overrides.textBodyDefault = OpenUIFont(size: 17)
    let theme = overrides.resolved()
    XCTAssertEqual(theme.textBodyDefault.size, 17)
    XCTAssertEqual(theme.textBodyDefaultHeavy.size, 22)
    XCTAssertEqual(theme.textBodyDefaultHeavy.weight, .bold)
    XCTAssertEqual(theme.textBodyDefaultHeavy.lineSpacing, 0.3)
  }

  @MainActor func testImageTextEmphasisUsesTheCompleteConfiguredFont() throws {
    _ = NSApplication.shared
    let library = try OpenUIStandardComponents.library()
    func height(bold: Bool, theme: OpenUIThemeValues) -> CGFloat {
      let state = OpenUIState(schema: library.library.toSchema())
      state.setSource("root=ImageText(\"\",\"\",\"Product name\",\"Description\",\(bold),\"horizontal\",20)")
      return NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
        .openUITheme(theme).frame(width: 320)).fittingSize.height
    }
    let base = OpenUIThemeValues()
    var custom = base
    custom.textBodySmHeavy = OpenUIFont(size: 34, weight: .light, lineSpacing: 0.4)
    XCTAssertGreaterThan(height(bold: true, theme: custom), height(bold: true, theme: base) + 10)
    XCTAssertEqual(height(bold: false, theme: custom), height(bold: false, theme: base), accuracy: 0.5)
  }

  @MainActor func testBannerTitleUsesHeavyBodyWithoutChangingSubtitleRole() throws {
    _ = NSApplication.shared
    let library = try OpenUIStandardComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("root=ImageTextLarge(\"\",\"\",\"杭州兰郡酒店（西湖店）\",\"青年路31号｜平台标注舒适型\")")
    XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    func height(_ theme: OpenUIThemeValues) -> CGFloat {
      NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
        .openUITheme(theme).frame(width: 360)).fittingSize.height
    }
    let base = OpenUIThemeValues(); var custom = base
    custom.textBodyDefaultHeavy = OpenUIFont(size: 30, weight: .bold)
    XCTAssertGreaterThan(height(custom), height(base) + 10)
    XCTAssertEqual(custom.textBodySm, base.textBodySm)
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

  @MainActor func testLineHeightAndTrackingReachNativeAndMarkdownText() {
    _ = NSApplication.shared
    let base = OpenUIFont(size: 16)
    let taller = OpenUIFont(size: 16, lineHeight: 2.5)
    let wider = OpenUIFont(size: 16, letterSpacing: 0.15)
    func native(_ font: OpenUIFont) -> NSSize {
      NSHostingView(rootView: Text("One line\nTwo lines\nThree lines").openUIFont(font).fixedSize()).fittingSize
    }
    func markdown(_ font: OpenUIFont) -> NSSize {
      NSHostingView(rootView: NativeMarkdownText(text: "One line\nTwo lines\nThree lines", mode: .inline,
        style: .init(font: font)).frame(width: 300)).fittingSize
    }
    XCTAssertGreaterThan(native(taller).height, native(base).height + 10)
    XCTAssertGreaterThan(markdown(taller).height, markdown(base).height + 10)
    XCTAssertGreaterThan(native(wider).width, native(base).width + 5)
    XCTAssertEqual(OpenUIFont(size: 16, lineHeight: 0.1).additionalLineSpacing(), 0,
      "A requested line height cannot cut into native font metrics")
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
      let base = OpenUIThemeValues()
      let original = NativeBadgeColors(variant: "inverted", theme: base)
      XCTAssertEqual(try rgba(original.foreground, scheme), try rgba(base.background, scheme))
      XCTAssertEqual(try rgba(original.background, scheme), try rgba(base.textNeutralPrimary, scheme))
      var changed = base; changed.background = .pink
      XCTAssertEqual(try rgba(NativeBadgeColors(variant: "inverted", theme: changed).foreground, scheme), try rgba(original.foreground, scheme))
      changed.textAccentPrimary = .yellow; changed.invertedBackground = .blue; changed.textNeutralLink = .green
      let colors = NativeBadgeColors(variant: "inverted", theme: changed)
      XCTAssertEqual(try rgba(colors.foreground, scheme), try rgba(.yellow, scheme))
      XCTAssertEqual(try rgba(colors.background, scheme), try rgba(.blue, scheme))
      XCTAssertEqual(try rgba(changed.textNeutralLink, scheme), try rgba(.green, scheme))
      XCTAssertEqual(try rgba(changed.textNeutralPrimary, scheme), try rgba(base.textNeutralPrimary, scheme))
    }
  }
}
#endif
