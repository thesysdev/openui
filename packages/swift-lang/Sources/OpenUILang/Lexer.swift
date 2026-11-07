// OpenUILang — Lexer.
//
// Projects tokens and statement helpers from the shared lang-core engine.

import Foundation

// MARK: - Tokens

public enum Token: Equatable {
    case newline
    case lParen, rParen
    case lBrack, rBrack
    case lBrace, rBrace
    case comma, colon
    case equals, eqEq
    case not, notEq
    case greater, greaterEq
    case less, lessEq
    case and, or
    case dot, question
    case plus, star, slash, percent
    case minus
    case str(OpenUIString)
    case num(Double)
    case ident(String) // lowercase reference
    case type(String) // PascalCase component name
    case stateVar(String) // $name, $ included
    case builtinCall(String) // @name, @ excluded
    case `true`, `false`, `null`
    case eof
}

public func tokenize(_ src: String) -> [Token] {
    let core = SharedCore.shared
    return core.sync { core.items(core.core("tokenize", [src])).map(core.token) }
}
func unescapeJSONString(_ body: String) -> OpenUIString { (try? decodeJSONString("\"" + body + "\"")) ?? OpenUIString(body) }
public func stripFences(_ input: String) -> String {
    let core = SharedCore.shared
    return core.sync { core.call("fences", [input]).toString() }
}
public func preprocess(_ input: String) -> String {
    let core = SharedCore.shared
    return core.sync { core.call("preprocess", [input]).toString() }
}
public func autoClose(_ input: String) -> (text: String, wasIncomplete: Bool) {
    let core = SharedCore.shared
    return core.sync {
        let value = core.core("autoClose", [input])
        return (value.forProperty("text").toString(), value.forProperty("wasIncomplete").toBool())
    }
}
public struct RawStatement {
    public var id: String
    public var isStateVar: Bool
    public var tokens: [Token]
}

/// Split a flat token stream into `identifier = expression` statements.
/// Newlines end a statement only at bracket depth 0, with ternary continuation.
public func splitStatements(_ tokens: [Token]) -> [RawStatement] {
    let core = SharedCore.shared
    return core.sync {
        core.items(core.core("split", [core.array(tokens.map(core.token))])).map { js in
            RawStatement(id: js.forProperty("id").toString(), isStateVar: js.forProperty("idTokenType").toInt32() == 18, tokens: core.items(js.forProperty("tokens")).map(core.token))
        }
    }
}
public func splitStatementTexts(_ input: String) -> [String] {
    let core = SharedCore.shared
    return core.sync { core.items(core.call("splitSource", [input])).map { $0.toString() } }
}
