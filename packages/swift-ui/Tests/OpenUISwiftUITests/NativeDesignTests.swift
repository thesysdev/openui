import OpenUILang
import SwiftUI
import XCTest

@testable import OpenUISwiftUI

final class NativeDesignTests: XCTestCase {
    func testCustomTypographyReachesEveryTextSizeWithoutSeparateNumericConstants() {
        var theme = OpenUITheme()
        theme.typography.body.size = 21
        theme.typography.detail.size = 18
        theme.typography.title.size = 30
        theme.typography.title.weight = .light
        theme.typography.bodyLarge.size = 26
        theme.typography.bodyLargeHeavy.weight = .bold
        theme.typography.display.size = 32
        theme.typography.display.weight = .bold
        theme.typography.family = "Example typeface"
        XCTAssertEqual(NativeRichTextStyle.textContent("default", theme: theme).font?.size, 21)
        XCTAssertEqual(NativeRichTextStyle.textContent("small", theme: theme).font?.size, 18)
        XCTAssertEqual(NativeRichTextStyle.textContent("large-heavy", theme: theme).font?.size, 26)
        XCTAssertEqual(NativeRichTextStyle.textContent("large-heavy", theme: theme).font?.weight, .bold)
        XCTAssertEqual(theme.typography.inline("md").size, 21)
        XCTAssertEqual(theme.typography.inline("sm").size, 21,
            "Upstream Text sm is body-default; xs is body-small")
        XCTAssertEqual(theme.typography.inline("xs").size, 18)
        XCTAssertEqual(theme.typography.resolve(theme.typography.detail).family, "Example typeface")
        let override = OpenUIFont(size: 18, family: "Object typeface")
        XCTAssertEqual(theme.typography.resolve(override).family, "Object typeface")
        XCTAssertNil(theme.typography.resolve(theme.typography.code).family,
            "A prose font override must not remove the code role's fixed-width face")
    }

    func testOfficialBodyEmphasisVariantsKeepTheirReadingScale() throws {
        let theme = OpenUITheme()
        for (plain, emphasized) in [("small", "small-heavy"), ("large", "large-heavy")] {
            let a = NativeRichTextStyle.textContent(plain, theme: theme).font
            let b = NativeRichTextStyle.textContent(emphasized, theme: theme).font
            XCTAssertEqual(a?.size, b?.size, "Emphasis must not promote body copy to a display heading")
            XCTAssertNotEqual(a?.weight, b?.weight)
            XCTAssertEqual(a?.design, b?.design)
        }
        XCTAssertLessThan(try XCTUnwrap(NativeRichTextStyle.textContent("large-heavy", theme: theme).font).size,
                          theme.typography.display.size)
    }

    func testBodySizeVariantsDoNotChangeInformationPriorityColor() {
        var theme = OpenUITheme()
        theme.foreground = .red
        theme.secondary = .blue
        for variant in ["small", "small-heavy", "default", "large", "large-heavy"] {
            XCTAssertEqual(NativeRichTextStyle.textContent(variant, theme: theme).color, theme.foreground,
                           "Size alone does not make a recommendation or explanation secondary")
        }
    }

    func testAccentForegroundChoosesReadableContrastForLightAndDarkAccents() {
        XCTAssertTrue(NativeControlPalette.prefersDarkForeground(red: 1, green: 1, blue: 1))
        XCTAssertTrue(NativeControlPalette.prefersDarkForeground(red: 1, green: 0.9, blue: 0.2))
        XCTAssertFalse(NativeControlPalette.prefersDarkForeground(red: 0, green: 0, blue: 0))
        XCTAssertFalse(NativeControlPalette.prefersDarkForeground(red: 0.12, green: 0.44, blue: 0.34))
        XCTAssertFalse(NativeControlPalette.prefersDarkForeground(red: 0.345, green: 0.337, blue: 0.839))
    }

    func testControlStringsFollowTheScopedLocale() {
        XCTAssertEqual(
            NativeControlText.localized("Start date", locale: Locale(identifier: "zh-Hans")), "开始日期")
        XCTAssertEqual(NativeControlText.localized("End date", locale: Locale(identifier: "zh_CN")), "结束日期")
        XCTAssertEqual(NativeControlText.localized("Select", locale: Locale(identifier: "en_US")), "Select")
    }

    @MainActor func testPendingCalendarRetainsTheSourceThatOpenedIt() throws {
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("$date=null\nroot=DatePicker(\"date\",\"single\",null,$date)")
        let context = OpenUIComponentContext(
            element: try XCTUnwrap(state.root), registry: library.registry, state: state)
        let field = NativeFieldState(context: context)
        field.initialize()
        let before = state.snapshotState()
        let request = NativeDateRequest(part: .single, label: "Date", date: Date(), context: context)
        XCTAssertEqual(state.snapshotState(), before, "Opening a calendar must not commit today's date")
        state.setSource("root=TextContent(\"A different response\")")
        NativeFieldState(context: request.context).write(NativeCalendarDate.encode(request.date))
        XCTAssertFalse(request.context.canInteract)
        XCTAssertEqual(
            state.stateValue("$date"), .null, "A stale calendar must not write to a replacement response")
    }
}
