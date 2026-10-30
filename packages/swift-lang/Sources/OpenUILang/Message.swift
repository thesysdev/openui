import Foundation

/// The shared message protocol: context is parsed JSON or raw text, and end
/// identifies a complete winning content section.
public struct ParsedMessage: Sendable {
    public var content: String
    public var context: JSONValue
    public var attributes: [String: String]
    public var end: Bool

    public init(content: String, context: JSONValue = .null,
                attributes: [String: String] = [:], end: Bool = false) {
        self.content = content; self.context = context
        self.attributes = attributes; self.end = end
    }
}

public func parseMessage(_ text: String, streaming: Bool = false) -> ParsedMessage {
    let core = SharedCore.shared
    return core.sync {
        let value = core.core("parseMessage", [text, ["streaming": streaming]])
        return ParsedMessage(content: value.forProperty("content").toString(),
            context: core.authoringJSON(value.forProperty("context")),
            attributes: Dictionary(core.entries(value.forProperty("attributes")).map {
                ($0.0.displayString, $0.1.toString()!)
            }, uniquingKeysWith: { _, new in new }), end: value.forProperty("end").toBool())
    }
}

public func buildMessage(content: String, context: JSONValue? = nil,
                         attributes: [(String, String)] = [], end: Bool = false) -> String {
    let core = SharedCore.shared
    return core.sync {
        let js = core.object([
            ("content", core.string(OpenUIString(content))),
            ("attributes", core.object(attributes.map { (OpenUIString($0.0), core.string(OpenUIString($0.1))) })),
        ])
        js.setValue(end, forProperty: "end")
        if let context { js.setValue(core.json(context), forProperty: "context") }
        return core.core("buildMessage", [js]).toString()
    }
}
