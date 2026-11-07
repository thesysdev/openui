import Foundation
import XCTest
@testable import OpenUILang

final class SemanticDifferentialTests: XCTestCase {
    func testUpstreamIdentityUTF16AndRegExpOracle() throws {
        let url = try XCTUnwrap(Bundle.module.url(forResource: "semantic-vectors", withExtension: "json", subdirectory: "Fixtures"))
        let fixture = try parseJSONPreservingOrder(String(contentsOf: url, encoding: .utf8))
        let vectors = try XCTUnwrap(fixture.field("vectors")?.arrayItems)
        let item = Value.object([ObjectField(key: "n", value: .number(1))])
        let a = Value.array([item]), b = Value.array([.object([ObjectField(key: "n", value: .number(1))])])
        let object = Value.object([ObjectField(key: "n", value: .number(1))])
        let state = createStore()
        let initial: [OpenUIString: Value] = ["$a":a, "$alias":a, "$b":b, "$item":item, "$obj":object, "$objAlias":object,
            "$hi":.string(OpenUIString(codeUnits:[0xD800])), "$lo":.string(OpenUIString(codeUnits:[0xDC00])),
            "$keys":.object([ObjectField(key:OpenUIString(codeUnits:[0xD800]),value:.string(OpenUIString(codeUnits:[0xDC00]))),
                ObjectField(key:"é",value:.number(1)), ObjectField(key:"e\u{301}",value:.number(2))])]
        for (name,value) in initial { state.set(name,value:value,pristine:false) }
        let mutation = Value.object([ObjectField(key:"status",value:.string("idle"))])
        let parameter = ParamDef(name:"value",required:true)
        let evaluator = Evaluator(context: EvaluationContext(getState: { state.get($0) ?? .null },
            resolveRef: { $0 == "query" ? a : $0 == "mutation" ? mutation : .null },
            functions:["Identity":CustomFunction(params:[parameter],fn: { $0["value"]! }),
                "Clone":CustomFunction(params:[parameter],fn: { if case .array(let values) = $0["value"] { return .array(values.values) }; return .null })]),
            store:state,schema:LibrarySchema())
        var count = 0
        for vector in vectors {
            let id = vector.field("id")?.stringValue ?? "unknown"
            if ProcessInfo.processInfo.environment["OPENUI_TRACE_SEMANTIC"] != nil { FileHandle.standardError.write(Data((id + "\n").utf8)) }
            let expected = try XCTUnwrap(vector.field("expectedRef") ?? vector.field("expected"), id)
            let actual: JSONValue
            switch vector.field("kind")?.stringValue {
            case "expression":
                let source = try XCTUnwrap(vector.field("expression")?.stringValue, id)
                actual = canonical(evaluator.evaluate(parseExpression(tokenize(source))))
            case "regexp":
                let pattern = try XCTUnwrap(vector.field("pattern")?.codeUnitString, id)
                let value = try XCTUnwrap(vector.field("value")?.codeUnitString, id)
                switch testRegExp(pattern,value:value) {
                case .matches: actual = .string("matches")
                case .noMatch: actual = .string("noMatch")
                case .invalidPattern: actual = .string("invalidPattern")
                case .resourceError: actual = .string("resourceError")
                }
            case "stateAlias":
                let store = createStore()
                let first = Value.object([ObjectField(key:"n",value:.number(1))])
                let second = Value.object([ObjectField(key:"n",value:.number(1))])
                store.set("$first",value:first,pristine:false); store.set("$second",value:second,pristine:false)
                store.set("$second",value:first,pristine:false)
                actual = .boolean(store.get("$second")!.isSameValue(as:first))
            default: XCTFail("Unknown semantic vector \(id)"); continue
            }
            XCTAssertEqual(actual,expected,id)
            count += 1
        }
        XCTAssertEqual(count,1906,"Do not silently omit identity/UTF16/RegExp cases")
        print("Identity/UTF16/RegExp differential: \(count) pinned reference cases; no native normative overrides")
    }
    private func units(_ text: OpenUIString) -> JSONValue { .array(text.codeUnits.map { .number(Double($0)) }) }
    private func tagged(_ name: OpenUIString,_ value: JSONValue) -> JSONValue { .object([JSONField(key:name,value:value)]) }
    private func canonical(_ value: Value) -> JSONValue {
        switch value {
        case .undefined: return tagged("undefined",.boolean(true))
        case .string(let text): return tagged("utf16",units(text))
        case .number(let n) where !n.isFinite || (n == 0 && n.sign == .minus):
            return tagged("number",.string(n.isNaN ? "NaN" : n == 0 ? "-0" : n > 0 ? "Infinity" : "-Infinity"))
        case .number(let n): return .number(n)
        case .boolean(let b): return .boolean(b)
        case .null: return .null
        case .array(let values): return tagged("array",.array(values.map(canonical)))
        case .object(let fields): return tagged("object",.array(fields.map { .array([units($0.key),canonical($0.value)]) }))
        default: XCTFail("Unexpected non-data oracle result"); return .null
        }
    }
}
