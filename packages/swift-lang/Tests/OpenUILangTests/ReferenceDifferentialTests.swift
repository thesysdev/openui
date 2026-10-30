import Foundation
import XCTest
@testable import OpenUILang

extension ConformanceTests {
    func testPinnedTypeScriptReference() throws {
        let url = try XCTUnwrap(Bundle.module.url(forResource: "reference-vectors", withExtension: "json", subdirectory: "Fixtures"))
        let object = try parseJSONPreservingOrder(String(contentsOf: url, encoding: .utf8))
        guard case .object(let fields) = object,
              case .array(let vectors) = fields.first(where: { $0.key == "vectors" })?.value else {
            return XCTFail("Missing pinned reference vectors")
        }
        var failures: [String] = []
        for vector in vectors {
            guard case .object(let entries) = vector else { continue }
            let data = Dictionary(uniqueKeysWithValues: entries.map { ($0.key.displayString, $0.value) })
            func string(_ key: String) -> String {
                if case .string(let value) = data[key] { return value.displayString }; return ""
            }
            let id = string("id")
            let expectedRef = data["expectedRef"]?.stringValue.flatMap { object.field("promptExpectations")?.field($0) }
            let expectedValue = try XCTUnwrap(data["expected"] ?? expectedRef, id)
            let expected = jsonValueToAny(expectedValue)
            let actual: Any
            switch string("kind") {
            case "prompt":
                let library = data["library"]?.stringValue.flatMap { object.field("libraries")?.field($0) } ?? data["library"]
                actual = generateSystemPrompt(library: LibrarySpec(json: try XCTUnwrap(library)),
                                              promptOptions: PromptOptions(fixture: data["options"] ?? .object([])))
            case "program":
                guard case .object(let expectedFields) = data["expected"] else { continue }
                let result = createParser(schema: schema).parse(string("source"))
                if !checkResult(result: result, expectedFields: expectedFields, label: id) { failures.append(id) }
                continue
            case "expression":
                let result = createParser(schema: schema).parse("root = Stack([])")
                let evaluator = makeEvaluator(result: result)
                let expression = parseExpression(tokenize(string("expression")))
                actual = referenceValue(evaluator.evaluate(expression), evaluator: evaluator)
            case "validation":
                let rules = parseStructuredRules(data["rules"] ?? .object([]))
                actual = validate(jsonValueToValue(data["value"] ?? .null), rules: rules) as Any? ?? NSNull()
            case "merge":
                actual = mergeStatements(string("existing"), string("patch"))
            case "message":
                let streaming: Bool
                if case .boolean(let value) = data["streaming"] { streaming = value } else { streaming = false }
                let message = parseMessage(string("raw"), streaming: streaming)
                actual = ["content": message.content, "context": jsonValueToAny(message.context),
                          "attributes": message.attributes, "end": message.end] as [String: Any]
            default: XCTFail("Unknown reference vector kind: " + string("kind")); failures.append(id); continue
            }
            if !jsonEqual(expected, actual) {
                print("  \(id): expected \(expected), got \(actual)")
                failures.append(id)
            }
        }
        print("Pinned TS differential: \(vectors.count - failures.count)/\(vectors.count) passed; no native normative overrides")
        XCTAssertTrue(failures.isEmpty, "Reference differences: \(failures)")
    }

    private func referenceValue(_ value: Value, evaluator: Evaluator) -> Any {
        switch value {
        case .undefined: return ["$undefined": true]
        case .number(let n) where !n.isFinite:
            return ["$number": n.isNaN ? "NaN" : n > 0 ? "Infinity" : "-Infinity"]
        case .array(let values): return values.map { referenceValue($0, evaluator: evaluator) }
        case .object(let fields):
            return Dictionary(fields.map { ($0.key.wellFormedString ?? jsonStringLiteral($0.key), referenceValue($0.value, evaluator: evaluator)) }, uniquingKeysWith: { _, new in new })
        default: return summarize(value, evaluator: evaluator)
        }
    }
}
