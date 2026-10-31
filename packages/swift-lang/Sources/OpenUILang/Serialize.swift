import Foundation

public struct SerializeOptions: Sendable {
    /// $variable declarations to include (e.g. from ParseResult.stateDeclarations).
    public var stateDeclarations: [(String, Materialized)]
    public init(stateDeclarations: [(String, Materialized)] = []) {
        self.stateDeclarations = stateDeclarations
    }
}

public func jsonToOpenUI(_ tree: ElementNode, params: [String: [ParamDef]], calls: [String: CallDef] = builtinCallDefs, options: SerializeOptions = SerializeOptions()) -> String {
    let core = SharedCore.shared
    return core.sync {
        let library = core.library(LibrarySchema(components: params, callDefs: calls))
        let opts = core.object([("stateDeclarations", core.object(options.stateDeclarations.map { (OpenUIString($0.0), core.materialized($0.1)) }))])
        return core.call("serialize", [core.materialized(.element(tree)), library, opts]).toString()
    }
}
