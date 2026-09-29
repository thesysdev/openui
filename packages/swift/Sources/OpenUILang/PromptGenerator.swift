import Foundation

public struct PromptOptions {
    public var preamble: String?
    public var additionalRules: [String]?
    public var examples: [String]?
    public var toolExamples: [String]?
    public var tools: [String]?
    
    public init(preamble: String? = nil, additionalRules: [String]? = nil, examples: [String]? = nil, toolExamples: [String]? = nil, tools: [String]? = nil) {
        self.preamble = preamble
        self.additionalRules = additionalRules
        self.examples = examples
        self.toolExamples = toolExamples
        self.tools = tools
    }
}

public class PromptGenerator {
    public static func generatePrompt(library: ComponentLibrary, options: PromptOptions? = nil) -> String {
        var prompt = ""
        
        if let preamble = options?.preamble {
            prompt += preamble + "\n\n"
        } else {
            prompt += "You are a UI generation assistant. Respond ONLY with valid OpenUI Lang code.\n\n"
        }
        
        prompt += "### Components\n\n"
        for (_, comp) in library.components.sorted(by: { $0.key < $1.key }) {
            prompt += "- \(comp.signature): \(comp.description)\n"
        }
        
        if let root = library.root {
            prompt += "\nRoot Component: \(root)\n"
        }
        
        if let rules = options?.additionalRules, !rules.isEmpty {
            prompt += "\n### Rules\n"
            for rule in rules {
                prompt += "- \(rule)\n"
            }
        }
        
        return prompt.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
