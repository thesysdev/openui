// Prompt generation for LibrarySpec, ported from the pinned TypeScript reference.
import Foundation

public struct ComponentGroup: Codable, Sendable {
    public var name: String
    public var components: [String]
    public var notes: [String]?
    public init(name: String, components: [String], notes: [String]? = nil) {
        self.name = name; self.components = components; self.notes = notes
    }
    init(json: JSONValue) {
        name = json.field("name")?.stringValue ?? ""
        components = json.field("components")?.arrayItems?.compactMap(\.stringValue) ?? []
        notes = json.field("notes")?.arrayItems?.compactMap(\.stringValue)
    }
    func toJSONValue() -> JSONValue {
        var fields: [JSONField] = [.init(key: "name", value: .string(name)), .init(key: "components", value: .array(components.map(JSONValue.string)))]
        if let notes { fields.append(.init(key: "notes", value: .array(notes.map(JSONValue.string)))) }
        return .object(fields)
    }
}

public struct ToolSpec: Sendable {
    public var name: String
    public var description: String?
    public var inputSchema: JSONValue?
    public var outputSchema: JSONValue?
    public init(name: String, description: String? = nil, inputSchema: JSONValue? = nil, outputSchema: JSONValue? = nil) {
        self.name = name; self.description = description; self.inputSchema = inputSchema; self.outputSchema = outputSchema
    }
}
public enum ToolDescriptor: Sendable { case name(String), spec(ToolSpec) }

public struct PromptOptions: Sendable {
    public var preamble: String?
    public var additionalRules: [String]?
    public var examples: [String]?
    public var toolExamples: [String]?
    public var tools: [ToolDescriptor]?
    public var editMode: Bool?
    public var inlineMode: Bool?
    public var toolCalls: Bool?
    public var bindings: Bool?
    public var builtinFunctions: Bool?
    public init(preamble: String? = nil, additionalRules: [String]? = nil, examples: [String]? = nil,
                toolExamples: [String]? = nil, tools: [ToolDescriptor]? = nil, editMode: Bool? = nil,
                inlineMode: Bool? = nil, toolCalls: Bool? = nil, bindings: Bool? = nil, builtinFunctions: Bool? = nil) {
        self.preamble = preamble; self.additionalRules = additionalRules; self.examples = examples
        self.toolExamples = toolExamples; self.tools = tools; self.editMode = editMode; self.inlineMode = inlineMode
        self.toolCalls = toolCalls; self.bindings = bindings; self.builtinFunctions = builtinFunctions
    }
}

public func generateSystemPrompt(library: LibrarySpec, promptOptions options: PromptOptions = PromptOptions()) -> String {
    let core = SharedCore.shared
    return core.sync {
        var fields: [JSONField] = []
        if let value = options.preamble { fields.append(.init(key: "preamble", value: .string(value))) }
        for (key, value) in [("additionalRules",options.additionalRules),("examples",options.examples),("toolExamples",options.toolExamples)] {
            if let value { fields.append(.init(key: key, value: .array(value.map { .string($0) }))) }
        }
        for (key, value) in [("editMode", options.editMode), ("inlineMode", options.inlineMode), ("toolCalls", options.toolCalls), ("bindings", options.bindings), ("builtinFunctions", options.builtinFunctions)] {
            if let value { fields.append(.init(key: key, value: .boolean(value))) }
        }
        if let tools = options.tools {
            fields.append(.init(key: "tools", value: .array(tools.map { tool in
                switch tool {
                case .name(let name): return .string(name)
                case .spec(let spec):
                    var values: [JSONField] = [.init(key: "name", value: .string(spec.name))]
                    if let description = spec.description { values.append(.init(key: "description", value: .string(description))) }
                    if let input = spec.inputSchema { values.append(.init(key: "inputSchema", value: input)) }
                    if let output = spec.outputSchema { values.append(.init(key: "outputSchema", value: output)) }
                    return .object(values)
                }
            })))
        }
        return core.core("generateSystemPrompt", [core.json(.object([.init(key: "library", value: library.toJSONValue()), .init(key: "promptOptions", value: .object(fields))]))]).toString()
    }
}
extension Library {
    public func prompt(_ options: PromptOptions = PromptOptions()) -> String { generateSystemPrompt(library: toSpec(), promptOptions: options) }
}
