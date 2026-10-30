import Foundation
import JavaScriptCore

/// Native value transport around the shared streaming parser. Completion,
/// append/replacement reconciliation and cached results remain core-owned.
final class CoreStreamParser: StreamParser {
    private let core = SharedCore.shared
    private let parser: JSValue
    private var source = ""

    init(schema: LibrarySchema) {
        parser = SharedCore.shared.sync {
            SharedCore.shared.core("createStreamingParser", [
                SharedCore.shared.json(SharedCore.shared.schemaJSON(schema)), schema.rootComponent as Any,
            ])
        }
    }
    @discardableResult func push(_ chunk: String, complete: Bool = false) -> ParseResult {
        core.sync {
            source += chunk
            guard withinBudget else { return limitedParseResult() }
            return core.parseResult(parser.invokeMethod("push", withArguments: [chunk, complete]))
        }
    }
    @discardableResult func set(_ fullText: String, complete: Bool = false) -> ParseResult {
        core.sync {
            // Guard the same selected content passed to the shared parser.
            // Subsequent appends extend this content, not discarded attempts.
            source = stripMessageMarkers(fullText)
            guard withinBudget else { return limitedParseResult() }
            return core.parseResult(parser.invokeMethod("set", withArguments: [source, complete]))
        }
    }
    func getResult(complete: Bool = false) -> ParseResult {
        core.sync {
            guard withinBudget else { return limitedParseResult() }
            return core.parseResult(parser.invokeMethod("getResult", withArguments: [complete]))
        }
    }
    private var withinBudget: Bool {
        !sourceExceedsLimits(source)
    }
}
