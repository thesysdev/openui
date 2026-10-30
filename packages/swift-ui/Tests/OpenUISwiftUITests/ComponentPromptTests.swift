import OpenUILang
import XCTest
@testable import OpenUISwiftUI

final class ComponentPromptTests: XCTestCase {
    func testLibraryPromptForwardsCoreOptionsUnchanged() throws {
        let library = try OpenUIStandardComponents.library()
        let options = PromptOptions(preamble: "Host", additionalRules: ["Host choice"], examples: ["Host example"])
        XCTAssertEqual(library.prompt(options), library.library.prompt(options))
        XCTAssertEqual(library.prompt(options), generateSystemPrompt(library: library.toSpec(), promptOptions: options))
        XCTAssertEqual(library.prompt(), library.library.prompt())
    }

    func testSubsetPromptComesFromTheSelectedCoreLibrary() throws {
        let allowed = Set(["Stack", "TextContent"])
        let subset = try OpenUIComponentLibrary(
            components: OpenUIStandardComponents.components.filter { allowed.contains($0.definition.name) }, root: "Stack")
        let prompt = subset.prompt()
        XCTAssertEqual(prompt, generateSystemPrompt(library: subset.toSpec()))
        for name in ["OverviewCardBlock", "Buttons", "ImageText", "Table"] {
            XCTAssertFalse(prompt.contains(name + "("), "An excluded component must not appear: \(name)")
        }
    }
}
