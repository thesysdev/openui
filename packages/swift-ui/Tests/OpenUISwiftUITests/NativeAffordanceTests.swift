import SwiftUI
import XCTest
@testable import OpenUISwiftUI

final class NativeAffordanceTests: XCTestCase {
    func testCardHeaderUsesBodyLargeTitleRatherThanDisplayHeading() {
        let theme = OpenUIThemeValues.defaults
        let title = NativeHeadingStyle.titleFont(compact: false, theme: theme)
        XCTAssertEqual(title, theme.textBodyLgHeavy)
        XCTAssertEqual(title.size, 18)
        XCTAssertLessThan(title.size, theme.textHeadingMd.size)
        XCTAssertEqual(theme.textBodyDefaultHeavy.size, 16)
    }

    func testCardBorderUsesInteractiveDefaultAndSupportsIndependentOverride() {
        let theme = OpenUIThemeValues.defaults
        let presentation = OpenUIPresentation()
        XCTAssertEqual(presentation.resolvedCardBorderColor(with: theme), theme.borderInteractive)

        var customized = presentation
        customized.cardBorderColor = .red
        XCTAssertEqual(customized.resolvedCardBorderColor(with: theme), .red)
    }

    func testTabsOverflowHintRequiresActualOverflow() {
        XCTAssertFalse(NativeTabsOverflow.shouldShowHint(contentWidth: 200, viewportWidth: 240))
        XCTAssertFalse(NativeTabsOverflow.shouldShowHint(contentWidth: 240, viewportWidth: 240))
        XCTAssertFalse(NativeTabsOverflow.shouldShowHint(contentWidth: 241, viewportWidth: 240))
        XCTAssertTrue(NativeTabsOverflow.shouldShowHint(contentWidth: 242, viewportWidth: 240))
        XCTAssertTrue(NativeTabsOverflow.shouldShowHint(contentWidth: 100, viewportWidth: 0))
    }
}
