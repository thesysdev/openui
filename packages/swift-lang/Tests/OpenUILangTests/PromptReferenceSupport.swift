import Foundation
@testable import OpenUILang

extension PromptOptions {
    init(fixture json: JSONValue) {
        func bool(_ key: String) -> Bool? { if case .boolean(let b) = json.field(key) { return b }; return nil }
        func strings(_ key: String) -> [String]? { json.field(key)?.arrayItems?.compactMap(\.stringValue) }
        let tools: [ToolDescriptor]? = json.field("tools")?.arrayItems?.map {
            if case .string(let name) = $0 { return .name(name.displayString) }
            return .spec(ToolSpec(name: $0.field("name")?.stringValue ?? "", description: $0.field("description")?.stringValue,
                                  inputSchema: $0.field("inputSchema"), outputSchema: $0.field("outputSchema")))
        }
        self.init(preamble: json.field("preamble")?.stringValue, additionalRules: strings("additionalRules"),
                  examples: strings("examples"), toolExamples: strings("toolExamples"), tools: tools,
                  editMode: bool("editMode"), inlineMode: bool("inlineMode"), toolCalls: bool("toolCalls"),
                  bindings: bool("bindings"), builtinFunctions: bool("builtinFunctions"))
    }
}
