import XCTest
@testable import OpenUILang

final class FeedbackAuditSchemaProbeTests: XCTestCase {
    private func compiled() throws -> LibrarySchema {
        try createLibrary(components: [defineComponent(name: "Box", description: "", params: [ParamDef(name: "text", required: true)])]).toSchema()
    }
    func testCompiledSchemaComponentAdditionTakesEffect() throws {
        var schema = try compiled()
        schema.components["Extra"] = [ParamDef(name: "value", required: true)]
        let result = createParser(schema: schema).parse("root=Extra(7)")
        XCTAssertEqual(result.root?.typeName, "Extra", "Errors: \(result.meta.errors)")
    }
    func testCompileLibrarySchemaEntryAlsoHonorsParameterEdits() throws {
        let library = try createLibrary(components: [defineComponent(name: "Box", description: "", params: [ParamDef(name: "text", required: true)])])
        var schema = compileLibrarySchema(library.toSpec())
        schema.components["Box"] = [ParamDef(name: "renamed", required: true)]
        XCTAssertEqual(createParser(schema: schema).parse("root=Box(7)").root?.props.first?.key, "renamed")
    }
    func testCompiledSchemaComponentRemovalTakesEffect() throws {
        var schema = try compiled()
        schema.components.removeValue(forKey: "Box")
        let result = createParser(schema: schema).parse("root=Box(\"old\")")
        XCTAssertTrue(result.meta.errors.contains { $0.code == .unknownComponent }, "Removed component was accepted: \(result.meta.errors)")
    }
    func testCompiledSchemaParameterEditTakesEffect() throws {
        let original = try compiled()
        _ = createParser(schema: original).parse("root=Box(\"warm\")")
        var copy = original
        copy.components["Box"] = [ParamDef(name: "renamed", required: true)]
        let edited = createParser(schema: copy).parse("root=Box(\"new\")")
        let unchanged = createParser(schema: original).parse("root=Box(\"old\")")
        XCTAssertEqual(edited.root?.props.first?.key, "renamed")
        XCTAssertEqual(unchanged.root?.props.first?.key, "text")
    }
    func testCompiledSchemaCustomCallAdditionTakesEffect() throws {
        var schema = try compiled()
        schema.callDefs["Upper"] = CallDef(kind: .function, params: [ParamDef(name: "text", required: true)])
        let result = createParser(schema: schema).parse("root=Box(@Upper(\"hello\"))")
        XCTAssertFalse(result.meta.errors.contains { $0.code == .unknownFunction }, "\(result.meta.errors)")
    }
    func testManualSchemaEditAndLibraryExtendAreWorkingControls() throws {
        var manual = LibrarySchema(components: ["Box": [ParamDef(name: "text", required: true)]])
        manual.components["Extra"] = [ParamDef(name: "value", required: true)]
        XCTAssertEqual(createParser(schema: manual).parse("root=Extra(7)").root?.typeName, "Extra")
        let library = try createLibrary(components: [defineComponent(name: "Box", description: "", params: [])])
        let extended = try library.extend(LibraryExtension(addComponents: [defineComponent(name: "Extra", description: "", params: [ParamDef(name: "value", required: true)])]))
        XCTAssertEqual(createParser(schema: extended.toSchema()).parse("root=Extra(7)").root?.typeName, "Extra")
        XCTAssertNil(library.toSchema().components["Extra"])
    }
    func testResourceExhaustionIsDistinctFromOrdinaryPatternMismatch() {
        let text = String(repeating: "a", count: 1_048_577)
        XCTAssertEqual(testRegExp("^a+$", value: OpenUIString(text)), .resourceError)
        let rules = parseStructuredRules(try! parseJSONPreservingOrder(#"{"pattern":"^a+$"}"#))
        let exhausted = validate(.string(OpenUIString(text)), rules: rules)
        let ordinary = validate(.string("b"), rules: rules)
        print("AUDIT pattern exhausted=\(String(describing: exhausted)), mismatch=\(String(describing: ordinary))")
        XCTAssertNotEqual(exhausted, ordinary, "Resource exhaustion must not be indistinguishable from a nonmatching value")
    }
    func testInvalidPatternKeepsOfficialLenientBehavior() throws {
        let rules = parseStructuredRules(try parseJSONPreservingOrder(#"{"pattern":"["}"#))
        XCTAssertNil(validate(.string("abc"), rules: rules))
    }
}
