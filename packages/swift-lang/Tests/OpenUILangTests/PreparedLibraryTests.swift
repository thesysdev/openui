import XCTest
@testable import OpenUILang

final class PreparedLibraryTests: XCTestCase {
    private func schema() -> LibrarySchema {
        LibrarySchema(components: ["Text": [ParamDef(name: "text", required: true)]],
                      callDefs: builtinCallDefs, rootComponent: "Text")
    }

    func testPreparedLibraryIsReusedAcrossEvaluatorSchemaCopies() {
        let core = SharedCore.shared
        let original = schema()
        core.sync {
            let first = core.library(original)
            let copy = original
            XCTAssertTrue(core.library(copy) === first)
            for _ in 0..<20 { XCTAssertTrue(core.library(original) === first) }
            XCTAssertFalse(core.library(schema()) === first, "Independent schema lifetimes do not share mutable cache ownership")
        }
    }

    func testEditingACopyInvalidatesOnlyItsPreparedLibrary() {
        let core = SharedCore.shared
        let original = schema()
        core.sync {
            let first = core.library(original)
            var edited = original
            edited.components["Text"]?[0].isBindable = true
            XCTAssertFalse(core.library(edited) === first)
            XCTAssertTrue(core.library(original) === first)

            let beforeCalls = core.library(edited)
            edited.callDefs.removeValue(forKey: "Sum")
            XCTAssertFalse(core.library(edited) === beforeCalls)

            let beforeRoot = core.library(edited)
            edited.rootComponent = nil
            XCTAssertFalse(core.library(edited) === beforeRoot)

            let beforeWire = core.library(edited)
            edited.wireSchema = core.schemaJSON(edited)
            XCTAssertFalse(core.library(edited) === beforeWire)
            XCTAssertTrue(core.library(original) === first)
        }
    }
}
