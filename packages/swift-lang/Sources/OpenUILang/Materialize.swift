// OpenUILang — Materialize.
//
// Native context/AST projection for the shared materializer.

import Foundation
import JavaScriptCore

// MARK: - Context

/// Materialization context. Reference type: shared and mutated during lowering.
/// Mirrors parser/types.ts MaterializeCtx.
public final class MaterializeContext {
    /// Statement id → AST (value statements: expr; state: init).
    public var syms: [String: ASTNode] = [:]
    /// Component name → positional params. Nil = no catalog (all components unknown).
    public var catalog: [String: [ParamDef]]?
    /// Function/action call defs (built-ins + custom).
    public var callDefs: [String: CallDef] = builtinCallDefs
    public var errors: [OpenUIError] = []
    /// Names referenced but not defined.
    public var unresolved: [String] = []
    public var visited: Set<String> = []
    /// True while streaming (defers some checks).
    public var partial: Bool = false
    public var currentStatementId: String? = nil
    /// Statement ids not yet reached; remainder = orphaned.
    public var unreached: Set<String>? = nil

    public init() {}

    /// All component names known to the catalog.
    public var componentNames: Set<String> {
        guard let catalog = catalog else { return [] }
        return Set(catalog.keys)
    }
}

/// Compatibility surface backed by the shared materializer.
public func containsDynamicValue(_ value: Materialized) -> Bool {
    let core = SharedCore.shared
    return core.sync { core.call("dynamic", [core.materialized(value)]).toBool() }
}
public func nameArgs(_ args: [ASTNode], _ params: [ParamDef]) -> [(String, ASTNode)] {
    zip(params, args).map { ($0.0.name, $0.1) }
}
public func materializeExpr(_ node: ASTNode, _ ctx: MaterializeContext) -> ASTNode {
    let core = SharedCore.shared
    return core.sync { core.decodeAST(core.lower("expr", core.ast(node), ctx).forProperty("result")) }
}
public func materializeValue(_ node: ASTNode, _ ctx: MaterializeContext) -> Materialized {
    let core = SharedCore.shared
    return core.sync { core.materialized(core.lower("value", core.ast(node), ctx).forProperty("result")) }
}
extension SharedCore {
    func lower(_ mode: String, _ value: JSValue, _ ctx: MaterializeContext, component: String = "", path: OpenUIString = "", schema: JSONValue = .null) -> JSValue {
        let lib = LibrarySchema(components: ctx.catalog ?? [:], callDefs: ctx.callDefs)
        let result = call("materialize", [mode, value, json(schemaJSON(lib)), object(ctx.syms.map { (OpenUIString($0.key), ast($0.value)) }), ctx.partial, ctx.currentStatementId as Any, Array(ctx.visited), ctx.unreached.map(Array.init) as Any, component, string(path), json(schema)])
        ctx.errors += items(result.forProperty("errors")).map(error)
        ctx.unresolved += items(result.forProperty("unresolved")).map { $0.toString() }
        if ctx.unreached != nil { ctx.unreached = Set(items(result.forProperty("unreached")).map { $0.toString()! }) }
        return result
    }
}
