import JavaScriptCore
import XCTest
@testable import OpenUILang

/// Fixtures are produced only by verify-compatibility.mjs from an unmodified,
/// pinned official core and the official framework action callback.
final class StrictCompatibilityTests: XCTestCase {
    private func fixture() throws -> JSONValue {
        let url = try XCTUnwrap(Bundle.module.url(forResource: "strict-compatibility", withExtension: "json", subdirectory: "Fixtures"))
        return try parseJSONPreservingOrder(String(contentsOf: url, encoding: .utf8))
    }
    private func digest(_ value: JSValue, fixture: JSONValue) -> String {
        let core = SharedCore.shared
        return core.sync {
            let fn = core.context.evaluateScript("(" + fixture.field("canonicalSource")!.stringValue! + ")")!
            let result = fn.call(withArguments: [value])!
            return core.context.objectForKeyedSubscript("JSON").invokeMethod("stringify", withArguments: [result]).toString()
        }
    }
    func testSwiftParserMatchesEveryPinnedIntermediateSnapshotWithoutDroppingDiagnostics() throws {
        let fixture = try fixture(), core = SharedCore.shared
        let schema = compileLibrarySchema(try XCTUnwrap(fixture.field("schema")))
        var compared = 0
        for item in try XCTUnwrap(fixture.field("fixtures")?.arrayItems) {
            let stream = createStreamingParser(schema: schema)
            for operation in try XCTUnwrap(item.field("operations")?.arrayItems) {
                let text = operation.field("text")?.stringValue ?? ""
                let result: ParseResult
                switch operation.field("kind")?.stringValue {
                case "push": result = stream.push(text)
                case "complete": result = stream.getResult(complete: true)
                case "set": result = stream.set(text, complete: true)
                case "batch": result = createParser(schema: schema).parse(text)
                default: return XCTFail("Unknown oracle operation")
                }
                let raw = try XCTUnwrap(result.coreSnapshot).value
                XCTAssertEqual(digest(raw,fixture:fixture),operation.field("expected")?.stringValue,item.field("id")?.stringValue ?? "snapshot")
                core.sync {
                    let errors = core.items(raw.forProperty("meta").forProperty("errors"))
                    XCTAssertEqual(errors.count,result.meta.errors.count)
                    for (native,reference) in zip(result.meta.errors,errors) {
                        XCTAssertEqual(native.protocolSource?.rawValue,core.optionalString(reference.forProperty("source")))
                        XCTAssertEqual(native.code.rawValue,reference.forProperty("code").toString())
                        XCTAssertEqual(native.message,reference.forProperty("message").toString())
                        XCTAssertEqual(native.statementId,core.optionalString(reference.forProperty("statementId")))
                        XCTAssertEqual(native.component,core.optionalString(reference.forProperty("component")))
                    }
                }
                compared += 1
            }
        }
        XCTAssertGreaterThan(compared,40)
        print("Strict Swift/official parser: \(compared) complete and intermediate snapshots; all fields and order retained")
    }

    @MainActor func testNativeActionExecutorMatchesThePinnedOfficialFrameworkCallback() async throws {
        let fixture = try fixture(), core = SharedCore.shared
        let schema = compileLibrarySchema(try XCTUnwrap(fixture.field("schema")))
        for item in try XCTUnwrap(fixture.field("actions")?.arrayItems) {
            let parsed = createParser(schema:schema).parse(try XCTUnwrap(item.field("source")?.stringValue))
            let store = createStore()
            store.initialize(defaults:parsed.stateDeclarations,persisted:[:])
            let runtime = Evaluator(context:EvaluationContext(getState:{store.get($0) ?? .null},resolveRef:{_ in .null},actions:schema.callDefs.filter{$0.value.kind == .action}),store:store,schema:schema)
            let root = try XCTUnwrap(runtime.evaluateRoot(parsed))
            guard case .actionPlan(let plan) = root.props.last(where:{$0.0 == "action"})?.1 else { return XCTFail("Missing action") }
            var active = true
            var tools:[Value] = []
            let fields:() -> [(OpenUIString,Value)] = {
                parsed.stateDeclarations.map { (OpenUIString($0.0),store.get(OpenUIString($0.0)) ?? .undefined) }
            }
            let context = ActionRuntimeContext(store:store,evaluate:{runtime.evaluate($0)},stateDefaults:Dictionary(uniqueKeysWithValues:parsed.stateDeclarations.map{(OpenUIString($0.0),protocolMaterializedValue($0.1))}),
                runQuery:{_ in XCTFail("Unexpected query action")},runMutation:{id in
                    let mutation = parsed.mutationStatements.first{$0.statementId == id}!
                    let name = runtime.evaluate(mutation.toolAST!)
                    let args = mutation.argsAST.map{runtime.evaluate($0)} ?? .object([])
                    tools.append(.object([.init(key:"name",value:name),.init(key:"args",value:args)]))
                    if item.field("toolOutcome")?.stringValue == "failure" { return .failure }
                    if item.field("toolOutcome")?.stringValue == "cancel" { active = false }
                    return .success(.object([.init(key:"saved",value:.boolean(true))]))
                },formState:fields,isActive:{active})
            let events = await runActionPlan(plan,context:context)
            core.sync {
                let encoded = core.array(events.map { event in
                    core.object([("type",core.string(event.type)),("params",core.object(event.params.map{($0.0,core.encode($0.1))})),
                        ("humanFriendlyMessage",core.string(event.humanFriendlyMessage)),
                        ("formState",core.object((event.formState ?? []).map{($0.0,core.encode($0.1))})),
                        ("formName",event.formName.map{core.string($0)} ?? JSValue(undefinedIn:core.context)!)])
                })
                XCTAssertEqual(digest(encoded,fixture:fixture),item.field("events")?.stringValue,item.field("id")?.stringValue ?? "events")
                XCTAssertEqual(digest(core.object(fields().map{($0.0,core.encode($0.1))}),fixture:fixture),item.field("state")?.stringValue)
                XCTAssertEqual(digest(core.encode(.array(tools)),fixture:fixture),item.field("tools")?.stringValue)
            }
        }
    }
}
