import OpenUILang
import XCTest
@testable import OpenUISwiftUI

final class ComponentPromptTests: XCTestCase {
    func testOfficialGeneralPresetIsIncludedOnlyWhenRequested() throws {
        let library = try OpenUIStandardComponents.library()
        var options = OpenUIStandardComponents.promptOptions
        let examples = try XCTUnwrap(options.examples)
        let rules = try XCTUnwrap(options.additionalRules)
        XCTAssertFalse(examples.isEmpty)
        XCTAssertFalse(rules.isEmpty)
        let prompt = library.prompt(options)
        for example in examples { XCTAssertTrue(prompt.contains(example)) }
        for rule in rules { XCTAssertTrue(prompt.contains(rule)) }
        XCTAssertFalse(library.prompt().contains(try XCTUnwrap(examples.first)),
                       "Bare library prompt behavior must not silently acquire a preset")
        XCTAssertNil(options.tools)
        XCTAssertNil(options.toolExamples)
        XCTAssertNil(options.toolCalls)
        XCTAssertNil(options.bindings)
        options.additionalRules?.append("Application-specific addition")
        XCTAssertEqual(OpenUIStandardComponents.promptOptions.additionalRules, rules,
                       "A caller can customize its copy without changing the shipped preset")
    }

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
