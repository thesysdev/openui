public enum ValidationErrorCode: String {
    case missingRequired = "missing-required"
    case nullRequired = "null-required"
    case unknownComponent = "unknown-component"
    case inlineReserved = "inline-reserved"
    case excessArgs = "excess-args"
}

public struct ValidationError: Equatable {
    public let code: ValidationErrorCode
    public let component: String
    public let path: String
    public let message: String
    public let statementId: String?
}

public struct ElementNode: Equatable {
    public let type = "element"
    public let statementId: String?
    public let typeName: String
    // In Swift we can use Any, but Equatable with Any is tricky.
    // For now we'll represent props as [String: AnyHashable] or a custom enum value if needed.
    // We can also use a generic AnyCodable if we bring one in. Let's use `[String: Any]` and skip Equatable for now, or just implement it.
    public let props: [String: Any]
    public let partial: Bool
    public let hasDynamicProps: Bool?

    public init(statementId: String?, typeName: String, props: [String: Any], partial: Bool, hasDynamicProps: Bool? = nil) {
        self.statementId = statementId
        self.typeName = typeName
        self.props = props
        self.partial = partial
        self.hasDynamicProps = hasDynamicProps
    }

    public static func == (lhs: ElementNode, rhs: ElementNode) -> Bool {
        lhs.statementId == rhs.statementId &&
        lhs.typeName == rhs.typeName &&
        lhs.partial == rhs.partial &&
        lhs.hasDynamicProps == rhs.hasDynamicProps
        // skipping deep prop equality for now
    }
}

public struct ParseResultMeta {
    public let incomplete: Bool
    public let unresolved: [String]
    public let orphaned: [String]
    public let statementCount: Int
    public let errors: [ValidationError]
}

public struct QueryStatementInfo {
    public let statementId: String
    public let toolAST: ASTNode?
    public let argsAST: ASTNode?
    public let defaultsAST: ASTNode?
    public let refreshAST: ASTNode?
    public let deps: [String]?
    public let complete: Bool
}

public struct MutationStatementInfo {
    public let statementId: String
    public let toolAST: ASTNode?
    public let argsAST: ASTNode?
}

public struct ParseResult {
    public let root: ElementNode?
    public let meta: ParseResultMeta
    public let stateDeclarations: [String: Any]
    public let queryStatements: [QueryStatementInfo]
    public let mutationStatements: [MutationStatementInfo]
}

public struct ParamDef {
    public let name: String
    public let required: Bool
    public let defaultValue: Any?
}

public typealias ParamMap = [String: [ParamDef]]
