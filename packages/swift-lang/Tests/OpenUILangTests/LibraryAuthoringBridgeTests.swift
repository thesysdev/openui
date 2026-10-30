import Foundation
import XCTest
@testable import OpenUILang

final class LibraryAuthoringBridgeTests: XCTestCase {
    func testDefinitionOutcomesMatchUnmodifiedPinnedCore() throws {
        let url = try XCTUnwrap(Bundle.module.url(forResource: "upstream-authoring-behavior", withExtension: "json", subdirectory: "Fixtures"))
        let fixture = try parseJSONPreservingOrder(String(contentsOf: url, encoding: .utf8))
        XCTAssertEqual(fixture.field("upstream")?.stringValue, "9823ec05d4b29bc78d101676dc16b44fe17f1830")
        let cases = try XCTUnwrap(fixture.field("cases")?.arrayItems)
        XCTAssertEqual(cases.count, 8)
        let core = SharedCore.shared
        for item in cases {
            let input = try XCTUnwrap(item.field("input")), expected = try XCTUnwrap(item.field("expected"))
            let actual: JSONValue = core.sync {
                let result = core.call("nativeAuthoring", [core.json(input)])
                if result.forProperty("error").isString {
                    return .object([.init(key: "error", value: .string(core.string(result.forProperty("error"))))])
                }
                let value = result.forProperty("value")!
                return .object([
                    .init(key: "components", value: .array(core.items(value.forProperty("components")).map { .object([
                        .init(key: "name", value: .string(core.string($0.forProperty("name")))),
                        .init(key: "description", value: .string(core.string($0.forProperty("description"))))
                    ]) })),
                    .init(key: "root", value: core.authoringJSON(value.forProperty("root"))),
                    .init(key: "componentGroups", value: core.authoringJSON(value.forProperty("componentGroups")))
                ])
            }
            XCTAssertEqual(actual, expected, item.field("id")?.stringValue ?? "authoring case")
        }
    }

    func testSharedExtensionKeepsNativeFunctionCallbacks() throws {
        let number = JSONValue.object([.init(key: "type", value: .string("number"))])
        let output = defineComponent(name: "Output", description: "", params: [ParamDef(name: "value", required: true, schema: number)])
        let increment = defineFunction(name: "Increment", description: "", params: [ParamDef(name: "n", required: true, schema: number)], returns: number) { args in
            guard case .number(let n) = args["n"] else { return .null }
            return .number(n + 1)
        }
        let base = try createLibrary(components: [output], functions: [increment], root: "Output")
        let extended = try base.extend(LibraryExtension(addComponents: [defineComponent(name: "Extra", description: "", params: [])]))
        let schema = extended.toSchema()
        let parsed = createParser(schema: schema).parse("root=Output(@Increment(2))")
        let runtime = Evaluator(context: EvaluationContext(getState: { _ in .null }, resolveRef: { _ in .null }, functions: extended.customFunctions()), store: createStore(), schema: schema)
        XCTAssertEqual(try XCTUnwrap(runtime.evaluateRoot(parsed)).props.first?.1, .number(3))
        XCTAssertTrue(parsed.meta.errors.isEmpty)
    }

    func testSchemaConversionDoesNotInterpretLiteralDefaults() throws {
        let payload = try parseJSONPreservingOrder(#"{"type":"object","$ref":"data","anyOf":[{"$ref":"data"}],"extra":7}"#)
        let component = defineComponent(name: "Payload", description: "", params: [ParamDef(name: "value", required: false, hasDefault: true, defaultValue: jsonToValue(payload), schema: .object([.init(key: "type", value: .string("object"))]))])
        let library = try createLibrary(components: [component])
        let actual = library.toSpec().schema.field("$defs")?.field("Payload")?.field("properties")?.field("value")?.field("default")
        XCTAssertEqual(actual, payload, "Data inside defaults is not a schema graph")
    }

    func testIntegerRangesSurviveAndOpenObjectsUseCanonicalSchema() throws {
        let integer = JSONValue.object([.init(key: "type", value: .string("integer")), .init(key: "minimum", value: .number(0))])
        let open = JSONValue.object([.init(key: "type", value: .string("object")), .init(key: "properties", value: .object([])), .init(key: "additionalProperties", value: .boolean(true))])
        let component = defineComponent(name: "Counter", description: "", params: [ParamDef(name: "count", required: true, schema: integer), ParamDef(name: "metadata", required: false, schema: open)])
        let library = try createLibrary(components: [component], root: "Counter")
        let properties = library.toSpec().schema.field("$defs")?.field("Counter")?.field("properties")
        XCTAssertEqual(properties?.field("count"), integer)
        XCTAssertEqual(properties?.field("metadata")?.field("type"), .string("object"))
        XCTAssertEqual(properties?.field("metadata")?.field("additionalProperties"), .object([]),
          "Canonical Zod/core output uses an unconstrained schema for open properties")
        let parsed = createParser(schema: library.toSchema()).parse("root=Counter(1000000000000000000)")
        XCTAssertTrue(parsed.meta.errors.isEmpty, "A transport converter must not narrow the host's integer range")
        let wide = JSONValue.object([.init(key: "type", value: .string("integer")), .init(key: "minimum", value: .number(-1e18)), .init(key: "maximum", value: .number(1e18))])
        let ranged = try createLibrary(components: [defineComponent(name: "Wide", description: "", params: [ParamDef(name: "value", required: true, schema: wide)])])
        XCTAssertEqual(ranged.toSpec().schema.field("$defs")?.field("Wide")?.field("properties")?.field("value"), wide)
    }

    func testUntypedNativeBindingMetadataSurvivesAuthoringAndExtension() throws {
        let field = defineComponent(name: "Field", description: "", params: [ParamDef(name: "value", required: false, isBindable: true)])
        let base = try createLibrary(components: [field], root: "Field")
        let extended = try base.extend(LibraryExtension(addComponents: [defineComponent(name: "Extra", description: "", params: [])]))
        XCTAssertEqual(extended.toSpec().components.first?.signature, "Field(value?: $binding<any>)")
        let schema = extended.toSchema()
        XCTAssertEqual(schema.components["Field"]?.first?.isBindable, true)
        let parsed = createParser(schema: schema).parse("$selected=\"old\"\nroot=Field($selected)")
        let runtime = Evaluator(context: EvaluationContext(getState: { _ in .string("old") }, resolveRef: { _ in .null }), store: createStore(), schema: schema)
        guard case .binding(let binding) = try XCTUnwrap(runtime.evaluateRoot(parsed)).props.first?.1 else {
            return XCTFail("Typed native binding metadata was lost")
        }
        XCTAssertEqual(binding.target, "$selected")
    }

    func testComponentNamedLikeAnActionHelperKeepsCoreNamespacePriority() throws {
        let component = defineComponent(name: "ActionExpression", description: "A component", params: [ParamDef(name: "title", required: true)])
        let library = try createLibrary(components: [component], root: "ActionExpression")
        let body = library.toSpec().schema.field("$defs")?.field("ActionExpression")
        XCTAssertNotNil(body?.field("properties")?.field("title"))
        XCTAssertNil(body?.field("anyOf"))
    }
}
