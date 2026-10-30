#if os(macOS)
import AppKit
import SwiftUI
import XCTest
import OpenUILang
@testable import OpenUISwiftUI

final class ThemeArchitectureTests: XCTestCase {
    @MainActor func testLocalUpdatesInheritParentWithoutChangingSiblings() throws {
        _ = NSApplication.shared
        var parent = OpenUITheme()
        parent.spaceM = 19; parent.spaceL = 27
        parent.typography.body.size = 21
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
        XCTAssertEqual(try XCTUnwrap(samples.values["child"]), [25, 27, 21])
        XCTAssertEqual(try XCTUnwrap(samples.values["grandchild"]), [25, 39, 21])
        XCTAssertEqual(try XCTUnwrap(samples.values["replacement"]), [12, 18, 16])
        XCTAssertEqual(try XCTUnwrap(samples.values["sibling"]), [19, 27, 21])
    }

    @MainActor func testGapNoneRemainsZeroAfterZeroTokenOverride() throws {
        _ = NSApplication.shared
        let standard = try OpenUIStandardComponents.library()
        let text = try XCTUnwrap(standard.library.components.first { $0.name == "TextContent" })
        let library = try standard.extending(overriding: [OpenUIComponent(text) { _ in Color.primary.frame(height: 10) }])
        var theme = OpenUITheme(); theme.space000 = 99; theme.spaceM = 31
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
        let base = OpenUITheme(); var theme = base
        theme.typography.heading.weight = .black
        theme.typography.title = OpenUIFont(size: 40, weight: .light)
        for size in ["default", "small", "small-heavy", "large", "large-heavy"] {
            XCTAssertEqual(NativeRichTextStyle.textContent(size, theme: theme).font,
                           NativeRichTextStyle.textContent(size, theme: base).font, size)
        }
        for size in ["xs", "sm", "md", "lg"] {
            XCTAssertEqual(theme.typography.inline(size, emphasized: true), base.typography.inline(size, emphasized: true))
        }
        theme.typography.bodyLargeHeavy = OpenUIFont(size: 25, weight: .bold)
        XCTAssertEqual(NativeRichTextStyle.textContent("large-heavy", theme: theme).font, theme.typography.bodyLargeHeavy)
        XCTAssertEqual(theme.typography.inline("lg", emphasized: true), theme.typography.bodyLargeHeavy)
    }

    @MainActor func testBodyHeavyOverrideReachesBoldTextRendering() throws {
        _ = NSApplication.shared
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("root=BoldText(\"text\",\"Same emphasis\")")
        XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
        func height(_ theme: OpenUITheme) -> CGFloat {
            NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
                .openUITheme(theme).frame(width: 300)).fittingSize.height
        }
        let base = OpenUITheme(); var custom = base
        custom.typography.bodyHeavy = OpenUIFont(size: 30, weight: .bold)
        XCTAssertGreaterThan(height(custom), height(base) + 8)
        XCTAssertEqual(custom.typography.heading, base.typography.heading)
    }
}

@MainActor private final class ThemeSamples {
    var values: [String: [CGFloat]] = [:]
}
private struct ThemeProbe: View {
    let name: String
    let samples: ThemeSamples
    @Environment(\.openUITheme) private var theme
    var body: some View {
        samples.values[name] = [theme.spaceM, theme.spaceL, theme.typography.body.size]
        return Color.clear.frame(width: 1, height: 1)
    }
}
#endif
