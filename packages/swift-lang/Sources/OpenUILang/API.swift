import Foundation
import JavaScriptCore

final class CoreParser: Parser {
    private let core = SharedCore.shared
    private let parser: JSValue
    init(schema: LibrarySchema) {
        let runtime = SharedCore.shared
        parser = runtime.sync { runtime.core("createParser", [runtime.json(runtime.schemaJSON(schema)), schema.rootComponent as Any]) }
    }
    public func parse(_ input: String) -> ParseResult { core.sync {
        let content = stripMessageMarkers(input)
        if sourceExceedsLimits(content) { return limitedParseResult() }
        return core.parseResult(parser.invokeMethod("parse", withArguments: [content]))
    } }
}
public func createParser(schema: LibrarySchema) -> Parser { CoreParser(schema: schema) }
public func createStreamingParser(schema: LibrarySchema) -> StreamParser { CoreStreamParser(schema: schema) }
