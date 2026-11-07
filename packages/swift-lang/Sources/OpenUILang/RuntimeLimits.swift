// Bounded recursive work: model output must not exhaust the native call stack.
import Foundation

/// Keep tokenization and statement splitting in the shared realm. Re-encoding
/// every token into JavaScript just to split it adds work to every stream push.
func sourceExceedsLimits(_ source: String) -> Bool {
    let core = SharedCore.shared
    return core.sync {
        // Apply the very same fence/comment handling as the shared parser.
        // Comment contents must not count toward expression complexity.
        let cleaned = core.call("preprocess", [source])
        let tokens = core.core("tokenize", [cleaned])
        let statements = core.core("split", [tokens])
        return core.items(statements).contains { statement in
            expressionExceedsLimits(core.items(statement.forProperty("tokens")).map(core.token))
        }
    }
}

func expressionExceedsLimits(_ tokens: [Token]) -> Bool {
    var depth = 0, operators = 0
    for token in tokens {
        switch token {
        case .lParen, .lBrack, .lBrace: depth += 1
        case .rParen, .rBrack, .rBrace: depth = max(0, depth - 1)
        case .plus, .minus, .star, .slash, .percent, .not, .and, .or, .eqEq, .notEq, .greater, .less, .greaterEq, .lessEq, .question, .dot:
            operators += 1
        default: break
        }
        if depth > 128 || operators > 256 { return true }
    }
    return false
}

func limitedParseResult() -> ParseResult {
    var result = emptyParseResult(incomplete: false)
    result.meta.errors = [OpenUIError(source: .parser, code: .parseException,
        message: "Expression exceeds the native runtime limit (128 nesting levels or 256 operators).")]
    return result
}
