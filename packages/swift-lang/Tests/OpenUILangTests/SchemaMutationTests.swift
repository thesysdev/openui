import XCTest
@testable import OpenUILang

final class SchemaMutationTests: XCTestCase {
    private func wire(_ schema: LibrarySchema) -> JSONValue { SharedCore.shared.sync { SharedCore.shared.schemaJSON(schema) } }

    func testUnchangedConstraintsReferencesOrderAndBindingsSurviveCompatibilityEdits() throws {
        let document = try parseJSONPreservingOrder(##"{"$defs":{"Shared":{"type":"string","enum":["a","b"]},"Box":{"type":"object","description":"keep","additionalProperties":false,"allOf":[{"minProperties":1}],"properties":{"zeta":{"type":"number","minimum":0,"maximum":10},"alpha":{"anyOf":[{"type":"string","minLength":2},{"type":"number"}]},"reference":{"$ref":"#/$defs/Shared"}},"required":["zeta"]}},"properties":{"Box":{"$ref":"#/$defs/Box"}}}"##)
        let original = compileLibrarySchema(document)
        var copy = original
        copy.components["Extra"] = []
        copy.components["Box"]?[0].isBindable = true
        XCTAssertEqual(wire(copy).field("$defs")?.field("Shared"), document.field("$defs")?.field("Shared"))
        XCTAssertEqual(wire(copy).field("$defs")?.field("Box"), document.field("$defs")?.field("Box"))
        XCTAssertEqual(copy.components["Box"]?.map(\.name), ["zeta", "alpha", "reference"])
        let result = createParser(schema: copy).parse("$x=3\nroot=Box($x)")
        let runtime = Evaluator(context: EvaluationContext(getState: { _ in .number(3) }, resolveRef: { _ in .null }), store: createStore(), schema: copy)
        guard case .binding = try XCTUnwrap(runtime.evaluateRoot(result)).props.first?.1 else { return XCTFail("Binding metadata lost") }
        XCTAssertEqual(wire(original), document)
        XCTAssertFalse(original.components["Box"]![0].isBindable)
        copy.components["Box"]?[2].required = true
        XCTAssertEqual(wire(copy).field("$defs")?.field("Box")?.field("properties")?.field("reference"),document.field("$defs")?.field("Box")?.field("properties")?.field("reference"))
    }

    func testParameterReorderDefaultsAndConstraintChangesReachTheParser() throws {
        let document = try parseJSONPreservingOrder(##"{"$defs":{"Box":{"type":"object","additionalProperties":false,"properties":{"first":{"type":"number","minimum":2},"second":{"type":"string","default":"old"}},"required":["first"]}},"properties":{"Box":{"$ref":"#/$defs/Box"}}}"##)
        var schema = compileLibrarySchema(document)
        var params = try XCTUnwrap(schema.components["Box"])
        params[1].defaultValue = .string("new")
        schema.components["Box"] = [params[1], params[0]]
        let result = createParser(schema: schema).parse("root=Box(null,4)")
        XCTAssertEqual(result.root?.props.map(\.key), ["second", "first"])
        XCTAssertEqual(wire(schema).field("$defs")?.field("Box")?.field("properties")?.field("second")?.field("default"), .string("new"))
        XCTAssertEqual(wire(schema).field("$defs")?.field("Box")?.field("additionalProperties"), .boolean(false))
        schema.components["Box"]?[0].hasDefault = false
        XCTAssertNil(wire(schema).field("$defs")?.field("Box")?.field("properties")?.field("second")?.field("default"))
        schema.components["Box"]?[1].schema = try parseJSONPreservingOrder(#"{"type":"string"}"#)
        XCTAssertTrue(createParser(schema: schema).parse("root=Box(\"x\",7)").meta.errors.contains { $0.code == .typeMismatch })
        XCTAssertFalse(createParser(schema: schema).parse("root=Box(\"x\",\"okay\")").meta.errors.contains { $0.code == .typeMismatch })
    }

    func testCustomCallChangesAndRemovalPreserveReturnsAndMetadata() throws {
        let document = try parseJSONPreservingOrder(##"{"$defs":{"Box":{"type":"object","properties":{"value":{}}}},"properties":{"Box":{"$ref":"#/$defs/Box"}},"functions":{"Format":{"description":"keep","params":{"type":"object","properties":{"text":{"type":"string"}},"required":["text"],"additionalProperties":false},"returns":{"type":"string"}}}}"##)
        let original = compileLibrarySchema(document)
        var copy = original
        copy.callDefs["Format"]?.params = [ParamDef(name: "number", required: true, schema: try parseJSONPreservingOrder(#"{"type":"number"}"#))]
        XCTAssertEqual(wire(copy).field("functions")?.field("Format")?.field("returns"), document.field("functions")?.field("Format")?.field("returns"))
        let result = createParser(schema: copy).parse("root=Box(@Format(3))")
        XCTAssertFalse(result.meta.errors.contains { $0.code == .unknownFunction })
        copy.callDefs.removeValue(forKey: "Format")
        XCTAssertTrue(createParser(schema: copy).parse("root=Box(@Format(3))").meta.errors.contains { $0.code == .unknownFunction })
        XCTAssertEqual(wire(original), document)
    }
    @MainActor func testCustomActionParameterEditsUpdateBothCallAndReferencedShape() async throws {
        let action = defineAction(name:"Notify",description:"",params:[ParamDef(name:"text",required:true)])
        let library = try createLibrary(components:[defineComponent(name:"Box",description:"",params:[ParamDef(name:"value",required:true)])],actions:[action])
        var schema = library.toSchema()
        schema.callDefs["Notify"]?.params = [ParamDef(name:"code",required:true)]
        let parsed = createParser(schema:schema).parse("root=Box(@Notify(7))")
        XCTAssertTrue(parsed.meta.errors.isEmpty,"\(parsed.meta.errors)")
        XCTAssertNotNil(wire(schema).field("actions")?.field("Notify")?.field("params")?.field("properties")?.field("code"))
        if let body = wire(schema).field("$defs")?.field("Notify")?.field("properties")?.field("params") {
            XCTAssertNotNil(body.field("properties")?.field("code"))
            XCTAssertNil(body.field("properties")?.field("text"))
        }
        let store = createStore()
        let evaluator = Evaluator(context:EvaluationContext(getState:{_ in .null},resolveRef:{_ in .null},actions:schema.callDefs.filter{$0.value.kind == .action}),store:store,schema:schema)
        guard case .actionPlan(let plan) = try XCTUnwrap(evaluator.evaluateRoot(parsed)).props.first?.1 else { return XCTFail("Expected custom action") }
        let events = await runActionPlan(plan,context:ActionRuntimeContext(store:store,evaluate:{evaluator.evaluate($0)},stateDefaults:[:],runQuery:{_ in},runMutation:{_ in .failure},formState:{[]}))
        XCTAssertEqual(events.first?.params.first?.0,"code")
        XCTAssertEqual(events.first?.params.first?.1,.number(7))
    }
    func testBooleanParameterConstraintIsNotConvertedToAnEmptyObject() throws {
        let document = try parseJSONPreservingOrder(##"{"$defs":{"Box":{"type":"object","properties":{"value":false}}},"properties":{"Box":{"$ref":"#/$defs/Box"}}}"##)
        var schema = compileLibrarySchema(document)
        schema.components["Box"]?[0].required = true
        XCTAssertEqual(wire(schema).field("$defs")?.field("Box")?.field("properties")?.field("value"),.boolean(false))
    }
    func testEditedFunctionDefinitionReachesEvaluationWithTheMatchingHostCallback() throws {
        let library = try createLibrary(components:[defineComponent(name:"Box",description:"",params:[ParamDef(name:"value",required:true)])],functions:[defineFunction(name:"Format",description:"",params:[ParamDef(name:"text",required:true,schema:try parseJSONPreservingOrder(#"{"type":"string"}"#))]){_ in .null}])
        var schema = library.toSchema()
        let params = [ParamDef(name:"amount",required:true,schema:try parseJSONPreservingOrder(#"{"type":"number"}"#))]
        schema.callDefs["Format"]?.params = params
        let parsed = createParser(schema:schema).parse("root=Box(@Format(7))")
        XCTAssertTrue(parsed.meta.errors.isEmpty)
        let evaluator = Evaluator(context:EvaluationContext(getState:{_ in .null},resolveRef:{_ in .null},functions:["Format":CustomFunction(params:params,fn:{$0["amount"] ?? .null})]),store:createStore(),schema:schema)
        XCTAssertEqual(try XCTUnwrap(evaluator.evaluateRoot(parsed)).props.first?.1,.number(7))
    }
}
