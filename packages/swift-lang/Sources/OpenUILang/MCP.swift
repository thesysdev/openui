// Optional MCP adaptation with no dependency on an MCP SDK or Apple frameworks.
import Foundation

public struct MCPToolError: Error, CustomStringConvertible, Sendable {
    public let toolErrorText: OpenUIString
    public var description: String { "MCP tool error: " + (toolErrorText.isEmpty ? "Unknown error" : toolErrorText.displayString) }
    @_disfavoredOverload public init<S: StringProtocol>(_ text: S) { toolErrorText = OpenUIString(String(text)) }
    public init(_ text: OpenUIString) { toolErrorText = text }
}

/// Extracts structuredContent first; otherwise joins text and attempts JSON.
/// Transport owners can wrap an MCP SDK with ToolProvider and this function.
public func extractToolResult(_ result: JSONValue) throws -> Value {
    let core = SharedCore.shared
    return try core.sync {
        let decoded = core.call("extract", [core.json(result)])
        if !decoded.forProperty("error").isUndefined { throw MCPToolError(core.string(decoded.forProperty("error"))) }
        return core.decode(decoded.forProperty("value"))
    }
}
