#if os(macOS)
import AppKit
import SwiftUI
import XCTest
import OpenUILang
@testable import OpenUISwiftUI

final class ThemeArchitectureTests: XCTestCase {
    @MainActor func testNestedScopesStartFromDefaultsWithoutChangingSiblings() throws {
        _ = NSApplication.shared
        var parent = OpenUITheme()
        parent.spaceM = 19; parent.spaceL = 27
        parent.textBodyDefault = OpenUIFont(size: 21)
        let samples = ThemeSamples()
        let content = VStack {
            ThemeProbe(name: "parent", samples: samples)
            VStack {
                ThemeProbe(name: "child", samples: samples)
                ThemeProbe(name: "grandchild", samples: samples)
                    .openUITheme { $0.spaceL = 39 }
                ThemeProbe(name: "replacement", samples: samples)
                    .openUITheme(OpenUITheme())
            }.openUITheme { $0.spaceM = 25 }
            ThemeProbe(name: "sibling", samples: samples)
        }.openUITheme(parent)
        let hosting = NSHostingView(rootView: content)
        _ = hosting.fittingSize
        XCTAssertEqual(try XCTUnwrap(samples.values["parent"]), [19, 27, 21])
        XCTAssertEqual(try XCTUnwrap(samples.values["child"]), [25, 18, 16])
        XCTAssertEqual(try XCTUnwrap(samples.values["grandchild"]), [12, 39, 16])
        XCTAssertEqual(try XCTUnwrap(samples.values["replacement"]), [12, 18, 16])
        XCTAssertEqual(try XCTUnwrap(samples.values["sibling"]), [19, 27, 21])
    }

    @MainActor func testDarkOverridesFallbackAndExplicitMode() throws {
        _ = NSApplication.shared
        var light = OpenUITheme(); light.spaceM = 23
        var dark = OpenUITheme(); dark.spaceL = 41
        let samples = ThemeSamples()
        let view = VStack {
            ThemeProbe(name: "dark-fallback", samples: samples)
                .openUITheme(lightTheme: light)
            ThemeProbe(name: "dark-explicit", samples: samples)
                .openUITheme(lightTheme: light, darkTheme: dark)
            ThemeProbe(name: "forced-light", samples: samples)
                .openUITheme(mode: .light, lightTheme: light, darkTheme: dark)
        }.environment(\.colorScheme, .dark)
        _ = NSHostingView(rootView: view).fittingSize
        XCTAssertEqual(samples.values["dark-fallback"], [23, 18, 16])
        XCTAssertEqual(samples.values["dark-explicit"], [12, 41, 16])
        XCTAssertEqual(samples.values["forced-light"], [23, 18, 16])
        XCTAssertEqual(samples.schemes["dark-fallback"], .dark)
        XCTAssertEqual(samples.schemes["forced-light"], .light)
    }

    @MainActor func testChangingAppearanceResolvesAgainWithoutRemountingContent() {
        _ = NSApplication.shared
        var light = OpenUITheme(); light.spaceM = 23
        var dark = OpenUITheme(); dark.spaceM = 31
        let samples = ThemeSamples()
        let content = ThemeProbe(name: "live", samples: samples)
            .openUITheme(lightTheme: light, darkTheme: dark)
        let host = NSHostingView(rootView: content.environment(\.colorScheme, .light))
        _ = host.fittingSize
        let identity = samples.identities["live"]
        host.rootView = content.environment(\.colorScheme, .dark)
        _ = host.fittingSize
        XCTAssertEqual(samples.values["live"]?.first, 31)
        XCTAssertEqual(samples.identities["live"], identity)
    }

    @MainActor func testGapNoneRemainsZeroAfterZeroTokenOverride() throws {
        _ = NSApplication.shared
        let standard = try OpenUIStandardComponents.library()
        let text = try XCTUnwrap(standard.library.components.first { $0.name == "TextContent" })
        let library = try standard.extending(overriding: [OpenUIComponent(text) { _ in Color.primary.frame(height: 10) }])
        var theme = OpenUIThemeValues(); theme.space000 = 99; theme.spaceM = 31
        for source in [
            "root=Stack([TextContent(\"A\"),TextContent(\"B\")],\"column\",\"none\")",
            "root=Card([TextContent(\"A\"),TextContent(\"B\")],\"card\",\"column\",\"none\")"
        ] {
            let state = OpenUIState(schema: library.library.toSchema()); state.setSource(source)
            XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
            let height = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
                .openUITheme(theme).frame(width: 300)).fittingSize.height
            XCTAssertEqual(height, 20, accuracy: 0.5)
        }
    }

    func testHeadingOverridesDoNotChangeBodyTextRoles() throws {
        let base = OpenUIThemeValues(); var theme = base
        theme.textHeadingXs.weight = .black
        theme.textHeadingSm = OpenUIFont(size: 40, weight: .light)
        for size in ["default", "small", "small-heavy", "large", "large-heavy"] {
            XCTAssertEqual(NativeRichTextStyle.textContent(size, theme: theme).font,
                           NativeRichTextStyle.textContent(size, theme: base).font, size)
        }
        for size in ["xs", "sm", "md", "lg"] {
            XCTAssertEqual(theme.inlineFont(size, emphasized: true), base.inlineFont(size, emphasized: true))
        }
        theme.textBodyLgHeavy = OpenUIFont(size: 25, weight: .bold)
        XCTAssertEqual(NativeRichTextStyle.textContent("large-heavy", theme: theme).font, theme.textBodyLgHeavy)
        XCTAssertEqual(theme.inlineFont("lg", emphasized: true), theme.textBodyLgHeavy)
    }

    @MainActor func testBodyHeavyOverrideReachesBoldTextRendering() throws {
        _ = NSApplication.shared
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("root=BoldText(\"text\",\"Same emphasis\")")
        XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
        func height(_ theme: OpenUIThemeValues) -> CGFloat {
            NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
                .openUITheme(theme).frame(width: 300)).fittingSize.height
        }
        let base = OpenUIThemeValues(); var custom = base
        custom.textBodyDefaultHeavy = OpenUIFont(size: 30, weight: .bold)
        XCTAssertGreaterThan(height(custom), height(base) + 8)
        XCTAssertEqual(custom.textHeadingXs, base.textHeadingXs)
    }
}

@MainActor private final class ThemeSamples {
    var values: [String: [CGFloat]] = [:]
    var schemes: [String: ColorScheme] = [:]
    var identities: [String: UUID] = [:]
}
private struct ThemeProbe: View {
    let name: String
    let samples: ThemeSamples
    @Environment(\.openUITheme) private var theme
    @Environment(\.colorScheme) private var scheme
    @State private var identity = UUID()
    var body: some View {
        samples.schemes[name] = scheme
        samples.identities[name] = identity
        samples.values[name] = [theme.spaceM, theme.spaceL, theme.textBodyDefault.size]
        return Color.clear.frame(width: 1, height: 1)
    }
}
#endif
