import Foundation

// OpenUILang — Core types.
//
// Native compatibility types and ordered codecs for the shared lang-core engine.
// Language execution lives in the bundled TypeScript resource.

// MARK: - Values

/// An object field. Struct (not tuple) so Value can be Equatable.
public struct ObjectField: Equatable, Sendable {
    public static func == (lhs: Self, rhs: Self) -> Bool { jsStringEqual(lhs.key, rhs.key) && lhs.value == rhs.value }
    public var key: OpenUIString
    public var value: Value
    @_disfavoredOverload public init<S: StringProtocol>(key: S, value: Value) { self.init(key: OpenUIString(String(key)), value: value) }
    public init(key: OpenUIString, value: Value) {
        self.key = key
        self.value = value
    }
}

/// A runtime value in OpenUI Lang: the output of evaluation.
public indirect enum Value: Sendable {
    case string(OpenUIString)
    case number(Double)
    case boolean(Bool)
    case null
    /// Missing JavaScript property; distinct from an explicit null.
    case undefined
    case array(OpenUIArray)
    case object(OpenUIObject)
    case element(EvaluatedElement)
    case actionPlan(ActionPlan)
    /// A `$variable` passed to a `$binding<type>` prop: two-way binding marker.
    /// Summarizes as `{ "$binding": "$name" }`.
    case binding(ReactiveAssign)
    /// Explicit write transform, evaluated with `$value` when the host writes.
    case reactiveBinding(ReactiveAssign)
}

extension Value: Equatable {
    public static func == (lhs: Value, rhs: Value) -> Bool {
        switch (lhs, rhs) {
        case (.string(let a), .string(let b)): return jsStringEqual(a, b)
        case (.number(let a), .number(let b)): return a == b || (a.isNaN && b.isNaN)
        case (.boolean(let a), .boolean(let b)): return a == b
        case (.null, .null), (.undefined, .undefined): return true
        case (.array(let a), .array(let b)): return a === b || a.values == b.values
        case (.object(let a), .object(let b)): return a === b || a.fields == b.fields
        case (.element(let a), .element(let b)): return a == b
        case (.actionPlan(let a), .actionPlan(let b)): return a == b
        case (.binding(let a), .binding(let b)), (.reactiveBinding(let a), .reactiveBinding(let b)): return a.target == b.target && a.expression == b.expression
        default: return false
        }
    }
}

// MARK: - Materialized values (parser output)

/// The output of materialization: plain values, runtime expressions kept as
/// AST, component nodes, or null. Mirrors the `unknown` values in
/// parser/materialize.ts.
public indirect enum Materialized: Sendable {
    case value(Value)
    case expr(ASTNode)
    case element(ElementNode)
    case null
    case array([Materialized])
    case object([(OpenUIString, Materialized)])
    case stateDefault(StateDefault)
}

extension Materialized: Equatable {
    public static func == (lhs: Materialized, rhs: Materialized) -> Bool {
        switch (lhs, rhs) {
        case (.stateDefault(let a), .stateDefault(let b)): return a.source == b.source
        case (.value(let a), .value(let b)): return a == b
        case (.expr(let a), .expr(let b)): return a == b
        case (.element(let a), .element(let b)): return a == b
        case (.null, .null): return true
        case (.array(let a), .array(let b)): return a == b
        case (.object(let a), .object(let b)):
            guard a.count == b.count else { return false }
            return zip(a, b).allSatisfy { $0.0 == $1.0 && $0.1 == $1.1 }
        default: return false
        }
    }
}

/// A component prop entry.
public struct PropEntry: Equatable, Sendable {
    public var key: String
    public var value: Materialized
    public init(key: String, value: Materialized) {
        self.key = key
        self.value = value
    }
}

// MARK: - AST

/// Every value that can appear in an openui-lang expression.
/// Mirrors parser/ast.ts ASTNode.
public indirect enum ASTNode: Sendable {
    case comp(name: String, args: [ASTNode], mappedProps: [(String, ASTNode)]?, fn: Bool)
    case str(OpenUIString)
    case num(Double)
    case bool(Bool)
    case null
    case arr([ASTNode])
    case obj([(OpenUIString, ASTNode)])
    case ref(String)
    case ph(String) // placeholder for an unresolvable reference
    case stateRef(String) // $name
    case runtimeRef(String, refType: QueryRefType) // query/mutation result, resolved at runtime
    case binOp(String, ASTNode, ASTNode)
    case unaryOp(String, ASTNode)
    case ternary(ASTNode, ASTNode, ASTNode)
    case member(ASTNode, OpenUIString)
    case index(ASTNode, ASTNode)
    case assign(String, ASTNode) // $name = expr inside an expression
    /// Runtime capture only; never a language token or a wire AST extension.
    case runtimeValue(Value)
}

public enum QueryRefType: String, Sendable {
    case query
    case mutation
}

/// Nodes that survive parser lowering and are resolved by the evaluator.
public func isRuntimeExpr(_ node: ASTNode) -> Bool {
    switch node {
    case .stateRef, .runtimeRef, .binOp, .unaryOp, .ternary, .member, .index, .assign, .runtimeValue:
        return true
    default:
        return false
    }
}

/// Walk every node of an AST.
public func walkAST(_ node: ASTNode, visit: (ASTNode) -> Void) {
    visit(node)
    switch node {
    case .comp(_, let args, let mapped, _):
        args.forEach { walkAST($0, visit: visit) }
        mapped?.forEach { walkAST($0.1, visit: visit) }
    case .arr(let els):
        els.forEach { walkAST($0, visit: visit) }
    case .obj(let entries):
        entries.forEach { walkAST($0.1, visit: visit) }
    case .binOp(_, let l, let r):
        walkAST(l, visit: visit); walkAST(r, visit: visit)
    case .unaryOp(_, let o):
        walkAST(o, visit: visit)
    case .ternary(let c, let t, let e):
        walkAST(c, visit: visit); walkAST(t, visit: visit); walkAST(e, visit: visit)
    case .member(let o, _):
        walkAST(o, visit: visit)
    case .index(let o, let i):
        walkAST(o, visit: visit); walkAST(i, visit: visit)
    case .assign(_, let v):
        walkAST(v, visit: visit)
    default:
        break
    }
}

/// Convert a plain value to a literal AST. Mirrors toLiteralAST.
public func toLiteralAST(_ value: Value) -> ASTNode {
    switch value {
    case .string(let s): return .str(s)
    case .number(let n): return .num(n)
    case .boolean(let b): return .bool(b)
    case .null, .undefined: return .null
    case .array(let a): return .arr(a.map(toLiteralAST))
    case .object(let fields): return .obj(fields.map { ($0.key, toLiteralAST($0.value)) })
    case .element, .actionPlan, .binding, .reactiveBinding: return .null
    }
}

/// Extract a literal value from an AST node, or nil if not fully literal.
/// Mirrors literalValue.
public func literalValue(_ node: ASTNode) -> Value? {
    switch node {
    case .runtimeValue(let value): return value
    case .str(let s): return .string(s)
    case .num(let n): return .number(n)
    case .bool(let b): return .boolean(b)
    case .null: return .null
    case .arr(let els):
        var out: [Value] = []
        for e in els { guard let v = literalValue(e) else { return nil }; out.append(v) }
        return .array(out)
    case .obj(let entries):
        var out: [ObjectField] = []
        for (k, e) in entries { guard let v = literalValue(e) else { return nil }; out.append(ObjectField(key: k, value: v)) }
        return .object(out)
    default:
        return nil
    }
}

// MARK: - Statements

public enum StatementKind: Sendable {
    case value
    case state
    case query
    case mutation
}

/// A classified statement. Mirrors parser/ast.ts Statement.
public struct Statement: Sendable {
    public var kind: StatementKind
    public var id: String
    /// For value/state: the expression. For query/mutation: the Comp call node.
    public var expr: ASTNode
    /// Pre-computed $variable deps for query statements.
    public var deps: [String]?
    public init(kind: StatementKind, id: String, expr: ASTNode, deps: [String]? = nil) {
        self.kind = kind
        self.id = id
        self.expr = expr
        self.deps = deps
    }
}

// MARK: - Element nodes

/// A fully resolved component node. Mirrors parser/types.ts ElementNode.
public struct ElementNode: Sendable {
    public var typeName: String
    public var props: [PropEntry]
    public var statementId: String?
    public var partial: Bool
    public var hasDynamicProps: Bool
    public init(typeName: String, props: [PropEntry] = [], statementId: String? = nil, partial: Bool = false, hasDynamicProps: Bool = true) {
        self.typeName = typeName
        self.props = props
        self.statementId = statementId
        self.partial = partial
        self.hasDynamicProps = hasDynamicProps
    }
}

/// An evaluated element tree: all props resolved to runtime Values.
/// Produced by Evaluator.evaluateRoot / evaluateElementProps.
public final class EvaluatedElement: Sendable, Equatable {
    public let typeName: String
    public let props: [(String, Value)]
    public let statementId: String?
    public let partial: Bool
    /// Native source readiness, independent of the protocol's program-wide
    /// partial flag. This advisory metadata is never serialized as OpenUI Lang.
    public let isSourceComplete: Bool

    public init(typeName: String, props: [(String, Value)] = [], statementId: String? = nil, partial: Bool = false, isSourceComplete: Bool? = nil) {
        self.typeName = typeName
        self.props = props
        self.statementId = statementId
        self.partial = partial
        self.isSourceComplete = isSourceComplete ?? !partial
    }

    public static func == (lhs: EvaluatedElement, rhs: EvaluatedElement) -> Bool {
        lhs === rhs || (lhs.typeName == rhs.typeName && lhs.statementId == rhs.statementId &&
        lhs.partial == rhs.partial && lhs.props.count == rhs.props.count &&
        zip(lhs.props, rhs.props).allSatisfy { $0.0 == $1.0 && $0.1 == $1.1 })
    }
}

extension ElementNode: Equatable {
    public static func == (lhs: ElementNode, rhs: ElementNode) -> Bool {
        lhs.typeName == rhs.typeName && lhs.props == rhs.props
    }
}

// MARK: - Errors

public enum OpenUIErrorSource: String, Sendable {
    case parser
    case runtime
    case query
    case mutation
}

public enum OpenUIErrorCode: String, Sendable {
    case unknownComponent = "unknown-component"
    case missingRequired = "missing-required"
    case nullRequired = "null-required"
    case inlineReserved = "inline-reserved"
    case excessArgs = "excess-args"
    case typeMismatch = "type-mismatch"
    case unknownFunction = "unknown-function"
    case noRoot = "no-root"
    case parseFailed = "parse-failed"
    case parseException = "parse-exception"
    case runtimeError = "runtime-error"
    case renderError = "render-error"
    case toolNotFound = "tool-not-found"
    case toolError = "tool-error"
    case mcpError = "mcp-error"
}

/// Structured, LLM-friendly error. Mirrors parser/types.ts OpenUIError.
public struct OpenUIError: Sendable {
    public var source: OpenUIErrorSource
    public var code: OpenUIErrorCode
    public var message: String
    public var statementId: String?
    public var component: String?
    public var path: OpenUIString?
    public var toolName: OpenUIString?
    public var hint: String?
    public var severity: String? // "warning" when the page still renders
    public init(
        source: OpenUIErrorSource,
        code: OpenUIErrorCode,
        message: String,
        statementId: String? = nil,
        component: String? = nil,
        path: OpenUIString? = nil,
        toolName: OpenUIString? = nil,
        hint: String? = nil,
        severity: String? = nil
    ) {
        self.source = source
        self.code = code
        self.message = message
        self.statementId = statementId
        self.component = component
        self.path = path
        self.toolName = toolName
        self.hint = hint
        self.severity = severity
    }
}

// MARK: - Parse result

public struct ParseMeta: Sendable {
    public var incomplete: Bool
    public var unresolved: [String]
    public var orphaned: [String]
    public var statementCount: Int
    public var errors: [OpenUIError]
}

public struct QueryStatementInfo: Sendable {
    public var statementId: String
    public var toolAST: ASTNode?
    public var argsAST: ASTNode?
    public var defaultsAST: ASTNode?
    public var refreshAST: ASTNode?
    public var deps: [String]?
    public var complete: Bool
}

public struct MutationStatementInfo: Sendable {
    public var statementId: String
    public var toolAST: ASTNode?
    public var argsAST: ASTNode?
}

public struct ParseResult: Sendable {
    private var nativeRoot: ElementNode?
    private var nativeExpression: ASTNode?
    private var rootOverridden: Bool
    private var expressionOverridden: Bool
    public var root: ElementNode? {
        get { rootOverridden ? nativeRoot : coreSnapshot?.root }
        set { nativeRoot = newValue; rootOverridden = true }
    }
    public var rootExpression: ASTNode? {
        get { expressionOverridden ? nativeExpression : coreSnapshot?.expression }
        set { nativeExpression = newValue; expressionOverridden = true }
    }
    public var meta: ParseMeta
    /// $name → materialized default value.
    public var stateDeclarations: [(String, Materialized)]
    public var queryStatements: [QueryStatementInfo]
    public var mutationStatements: [MutationStatementInfo]
    /// Keeps the original lang-core value for evaluation within its serialized
    /// JavaScript realm. Native fields remain the public typed representation.
    var coreSnapshot: CoreParseSnapshot? = nil

    init(root: ElementNode?, rootExpression: ASTNode?, meta: ParseMeta,
         stateDeclarations: [(String, Materialized)], queryStatements: [QueryStatementInfo],
         mutationStatements: [MutationStatementInfo]) {
        nativeRoot = root; nativeExpression = rootExpression
        rootOverridden = true; expressionOverridden = true
        self.meta = meta; self.stateDeclarations = stateDeclarations
        self.queryStatements = queryStatements; self.mutationStatements = mutationStatements
    }
    init(snapshot: CoreParseSnapshot, meta: ParseMeta,
         stateDeclarations: [(String, Materialized)], queryStatements: [QueryStatementInfo],
         mutationStatements: [MutationStatementInfo]) {
        nativeRoot = nil; nativeExpression = nil
        rootOverridden = false; expressionOverridden = false
        coreSnapshot = snapshot
        self.meta = meta; self.stateDeclarations = stateDeclarations
        self.queryStatements = queryStatements; self.mutationStatements = mutationStatements
    }
    func usesSnapshot(_ snapshot: CoreParseSnapshot) -> Bool {
        !rootOverridden && !expressionOverridden && coreSnapshot === snapshot
    }
}

// MARK: - Actions

public enum ActionStep: Sendable {
    case run(statementId: String, refType: QueryRefType)
    case continueConversation(messageAST: ASTNode, contextAST: ASTNode?)
    case openUrl(urlAST: ASTNode)
    case set(target: String, valueAST: ASTNode)
    case reset(targets: [String])
    case custom(name: String, args: [(String, ASTNode)])
}

extension ActionStep: Equatable {
    public static func == (a: ActionStep, b: ActionStep) -> Bool {
        switch (a, b) {
        case (.run(let id, let type), .run(let other, let otherType)): return id == other && type == otherType
        case (.reset(let ids), .reset(let other)): return ids == other
        case (.set(let target, let value), .set(let other, let otherValue)): return target == other && value == otherValue
        case (.openUrl(let value), .openUrl(let other)): return value == other
        case (.continueConversation(let message, let context), .continueConversation(let other, let otherContext)):
            return message == other && context == otherContext
        case (.custom(let name, let args), .custom(let other, let otherArgs)):
            return name == other && args.count == otherArgs.count && zip(args, otherArgs).allSatisfy { $0.0 == $1.0 && $0.1 == $1.1 }
        default: return false
        }
    }
}

extension ASTNode: Equatable {
    public static func == (a: ASTNode, b: ASTNode) -> Bool {
        if case .comp(let name, let args, let props, let fn) = a {
            guard case .comp(let otherName, let otherArgs, let otherProps, let otherFn) = b,
                  name == otherName, args == otherArgs, fn == otherFn else { return false }
            switch (props, otherProps) {
            case (nil, nil): return true
            case (.some(let p), .some(let q)):
                return p.count == q.count && zip(p, q).allSatisfy { $0.0 == $1.0 && $0.1 == $1.1 }
            default: return false
            }
        }
        return protocolASTValue(a) == protocolASTValue(b)
    }
}

public final class ActionPlan: Sendable {
    public let steps: [ActionStep]
    public let isSourceComplete: Bool
    public init(steps: [ActionStep] = [], isSourceComplete: Bool = true) {
        self.steps = steps
        self.isSourceComplete = isSourceComplete
    }
}

extension ActionPlan: Equatable {
    public static func == (lhs: ActionPlan, rhs: ActionPlan) -> Bool {
        lhs.steps == rhs.steps
    }
}

/// Host action event. Mirrors parser/types.ts ActionEvent.
public struct ActionEvent: Sendable {
    public var type: OpenUIString
    public var params: [(OpenUIString, Value)]
    public var humanFriendlyMessage: OpenUIString
    public var formState: [(OpenUIString, Value)]?
    public var formName: OpenUIString?
    public init(type: OpenUIString, params: [(OpenUIString, Value)] = [], humanFriendlyMessage: OpenUIString = "",
                formState: [(OpenUIString, Value)]? = nil, formName: OpenUIString? = nil) {
        self.type = type; self.params = params; self.humanFriendlyMessage = humanFriendlyMessage
        self.formState = formState; self.formName = formName
    }
}

// MARK: - JSON Schema (order-preserving)

/// Ordered JSON value. Object key order is preserved because the schema's
/// property order IS the positional argument order (spec/prompt.md §2.3).
public indirect enum JSONValue: Sendable {
    case string(OpenUIString)
    case number(Double)
    case boolean(Bool)
    case null
    case array([JSONValue])
    case object([JSONField])
}

extension JSONValue: Equatable {
    public static func == (lhs: JSONValue, rhs: JSONValue) -> Bool { jsonValuesEqual(lhs, rhs) }
}

public struct JSONField: Sendable {
    public var key: OpenUIString
    public var value: JSONValue
    @_disfavoredOverload public init<S: StringProtocol>(key: S, value: JSONValue) { self.init(key: OpenUIString(String(key)), value: value) }
    public init(key: OpenUIString, value: JSONValue) {
        self.key = key
        self.value = value
    }
}

/// Minimal JSON parser that preserves object key order.
/// Only what the schema reader needs; throws on malformed input.
public enum JSONParseError: Error {
    case unexpectedEnd
    case invalidToken(String)
}

@_disfavoredOverload public func parseJSONPreservingOrder(_ text: String) throws -> JSONValue { try parseJSONPreservingOrder(OpenUIString(text)) }

public func parseJSONPreservingOrder(_ text: OpenUIString) throws -> JSONValue {
    let chars = text.codeUnits
    var pos = 0
    var depth = 0

    func skipWS() {
        while pos < chars.count && (chars[pos] == 32 || chars[pos] == 9 || chars[pos] == 10 || chars[pos] == 13) {
            pos += 1
        }
    }
    func parseValue() throws -> JSONValue {
        guard depth < 128 else { throw JSONParseError.invalidToken("Maximum JSON nesting depth exceeded") }
        depth += 1; defer { depth -= 1 }
        skipWS()
        guard pos < chars.count else { throw JSONParseError.unexpectedEnd }
        let c = chars[pos]
        switch c {
        case 123: return try parseObject()
        case 91: return try parseArray()
        case 34: return .string(try parseString())
        case 116: try expect("true"); return .boolean(true)
        case 102: try expect("false"); return .boolean(false)
        case 110: try expect("null"); return .null
        default: return try parseNumber()
        }
    }
    func expect(_ s: String) throws {
        for ch in s.utf16 {
            guard pos < chars.count && chars[pos] == ch else { throw JSONParseError.invalidToken(s) }
            pos += 1
        }
    }
    func parseString() throws -> OpenUIString {
        let start = pos
        pos += 1
        while pos < chars.count {
            if chars[pos] == 92 { pos += 2; continue }
            if chars[pos] == 34 {
                pos += 1
                let literal = OpenUIString(codeUnits: Array(chars[start..<pos]))
                let value = try decodeJSONString(literal)
                return value
            }
            pos += 1
        }
        throw JSONParseError.unexpectedEnd
    }
    func parseObject() throws -> JSONValue {
        pos += 1 // {
        var fields: [JSONField] = []
        skipWS()
        if pos < chars.count && chars[pos] == 125 { pos += 1; return .object(orderedPairs(fields.map { ($0.key, $0.value) }).map { JSONField(key: $0.0, value: $0.1) }) }
        while true {
            skipWS()
            guard pos < chars.count && chars[pos] == 34 else { throw JSONParseError.invalidToken("object key") }
            let key = try parseString()
            skipWS()
            guard pos < chars.count && chars[pos] == 58 else { throw JSONParseError.invalidToken(":") }
            pos += 1
            let value = try parseValue()
            fields.append(JSONField(key: key, value: value))
            skipWS()
            guard pos < chars.count else { throw JSONParseError.unexpectedEnd }
            if chars[pos] == 44 { pos += 1; continue }
            if chars[pos] == 125 { pos += 1; return .object(orderedPairs(fields.map { ($0.key, $0.value) }).map { JSONField(key: $0.0, value: $0.1) }) }
            throw JSONParseError.invalidToken(String(format: "U+%04x", chars[pos]))
        }
    }
    func parseArray() throws -> JSONValue {
        pos += 1 // [
        var items: [JSONValue] = []
        skipWS()
        if pos < chars.count && chars[pos] == 93 { pos += 1; return .array(items) }
        while true {
            items.append(try parseValue())
            skipWS()
            guard pos < chars.count else { throw JSONParseError.unexpectedEnd }
            if chars[pos] == 44 { pos += 1; continue }
            if chars[pos] == 93 { pos += 1; return .array(items) }
            throw JSONParseError.invalidToken(String(format: "U+%04x", chars[pos]))
        }
    }
    func parseNumber() throws -> JSONValue {
        let start = pos
        if pos < chars.count && chars[pos] == 45 { pos += 1 }
        while pos < chars.count && (48...57).contains(chars[pos]) { pos += 1 }
        if pos < chars.count && chars[pos] == 46 {
            pos += 1
            while pos < chars.count && (48...57).contains(chars[pos]) { pos += 1 }
        }
        if pos < chars.count && (chars[pos] == 101 || chars[pos] == 69) {
            pos += 1
            if pos < chars.count && (chars[pos] == 43 || chars[pos] == 45) { pos += 1 }
            while pos < chars.count && (48...57).contains(chars[pos]) { pos += 1 }
        }
        let text = String(decoding: chars[start..<pos], as: UTF16.self)
        let pattern = #"^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$"#
        guard text.range(of: pattern, options: .regularExpression) != nil,
              let n = Double(text) else { throw JSONParseError.invalidToken(text) }
        return .number(n)
    }

    let v = try parseValue()
    skipWS()
    guard pos == chars.count else { throw JSONParseError.invalidToken("trailing content") }
    return v
}

extension JSONValue {
    /// Object field lookup.
    @_disfavoredOverload public func field(_ key: String) -> JSONValue? {
        guard case .object(let fields) = self else { return nil }
        return fields.last(where: { jsStringEqual($0.key, key) })?.value
    }
    public func field(_ key: OpenUIString) -> JSONValue? {
        guard case .object(let fields) = self else { return nil }
        return fields.last(where: { $0.key == key })?.value
    }
    public var objectFields: [(String, JSONValue)]? {
        guard case .object(let fields) = self else { return nil }
        var output: [(String, JSONValue)] = []
        for field in fields { guard let key = field.key.wellFormedString else { return nil }; output.append((key, field.value)) }
        return output
    }
    public var arrayItems: [JSONValue]? {
        guard case .array(let items) = self else { return nil }
        return items
    }
    public var stringValue: String? {
        guard case .string(let s) = self else { return nil }
        return s.wellFormedString
    }
    public var codeUnitString: OpenUIString? { if case .string(let value) = self { return value }; return nil }
}

// MARK: - Library schema

/// A component parameter. Positional order = order in `params`.
public struct ParamDef: Sendable {
    public var name: String
    public var required: Bool
    public var hasDefault: Bool
    public var defaultValue: Value
    /// True when the signature prints this prop as `$binding<type>`.
    public var isBindable: Bool
    public var schema: JSONValue?
    public init(name: String, required: Bool, hasDefault: Bool = false, defaultValue: Value = .null, isBindable: Bool = false, schema: JSONValue? = nil) {
        self.name = name
        self.required = required
        self.hasDefault = hasDefault
        self.defaultValue = defaultValue
        self.isBindable = isBindable
        self.schema = schema
    }
}

public struct CallDef: Sendable {
    public enum Kind: Sendable { case function, action }
    public var kind: Kind
    public var params: [ParamDef]
    public var isBuiltin: Bool
    public var isLazy: Bool
    public init(kind: Kind, params: [ParamDef], isBuiltin: Bool = false, isLazy: Bool = false) {
        self.kind = kind
        self.params = params
        self.isBuiltin = isBuiltin
        self.isLazy = isLazy
    }
}

public struct FunctionSchema: Sendable {
    public var description: String?
    public var params: [ParamDef]
    public var returns: JSONValue?
}

/// The compiled library schema used by the parser/validator.
/// Mirrors the ParamMap produced by compileSchema.
public struct LibrarySchema: Sendable {
    // Copies share the prepared immutable library until either copy is edited.
    var coreLibraryCache = CoreLibraryCache()
    var wireSchema: JSONValue? = nil { didSet { coreLibraryCache = CoreLibraryCache() } }
    /// Component name → params (positional order).
    public var components: [String: [ParamDef]] { didSet { coreLibraryCache = CoreLibraryCache() } }
    /// Built-in + custom function/action call defs.
    public var callDefs: [String: CallDef] { didSet { coreLibraryCache = CoreLibraryCache() } }
    public var rootComponent: String? { didSet { coreLibraryCache = CoreLibraryCache() } }
    public init(components: [String: [ParamDef]] = [:], callDefs: [String: CallDef] = [:], rootComponent: String? = nil) {
        self.components = components
        self.callDefs = callDefs
        self.rootComponent = rootComponent
    }
}

// MARK: - Built-in registry (mirrors parser/builtins.ts BUILTIN_CALLS)

private func builtinFn(_ name: String, params: [String], lazy: Bool = false) -> (String, CallDef) {
    (name, CallDef(kind: .function, params: params.map { ParamDef(name: $0, required: false) }, isBuiltin: true, isLazy: lazy))
}

private func builtinAction(_ name: String, params: [String], lazy: Bool = false) -> (String, CallDef) {
    (name, CallDef(kind: .action, params: params.map { ParamDef(name: $0, required: false) }, isBuiltin: true, isLazy: lazy))
}

/// The 14 built-in functions + 5 built-in actions + Action. Single source of truth.
public let builtinCallDefs: [String: CallDef] = {
    var defs: [String: CallDef] = [:]
    let fns: [(String, CallDef)] = [
        builtinFn("Count", params: ["array"]),
        builtinFn("First", params: ["array"]),
        builtinFn("Last", params: ["array"]),
        builtinFn("Sum", params: ["numbers"]),
        builtinFn("Avg", params: ["numbers"]),
        builtinFn("Min", params: ["numbers"]),
        builtinFn("Max", params: ["numbers"]),
        builtinFn("Sort", params: ["array", "field", "direction"]),
        builtinFn("Filter", params: ["array", "field", "operator", "value"]),
        builtinFn("Round", params: ["number", "decimals"]),
        builtinFn("Abs", params: ["number"]),
        builtinFn("Floor", params: ["number"]),
        builtinFn("Ceil", params: ["number"]),
        builtinFn("Each", params: ["array", "varName", "template"], lazy: true),
    ]
    let actions: [(String, CallDef)] = [
        builtinAction("Run", params: ["ref"], lazy: true),
        builtinAction("ToAssistant", params: ["message", "context"]),
        builtinAction("OpenUrl", params: ["url"]),
        builtinAction("Set", params: ["variable", "value"], lazy: true),
        builtinAction("Reset", params: ["variable"], lazy: true),
        builtinAction("Action", params: ["steps"], lazy: true),
    ]
    for (name, def) in fns + actions { defs[name] = def }
    return defs
}()

public func isBuiltinFunction(_ name: String) -> Bool {
    builtinCallDefs[name]?.kind == .function
}

public func isBuiltinAction(_ name: String) -> Bool {
    builtinCallDefs[name]?.kind == .action
}

/// Reserved statement-level call names — not builtins, not components.
public func isReservedCall(_ name: String) -> Bool {
    name == "Query" || name == "Mutation"
}

// MARK: - State store protocol (implemented in Store.swift)

public protocol Store: AnyObject {
    func get(_ name: OpenUIString) -> Value?
    func set(_ name: OpenUIString, value: Value, pristine: Bool)
    func initialize(defaults: [(String, Materialized)], persisted: [OpenUIString: Value])
    func getSnapshot() -> [OpenUIString: Value]
    func subscribe(_ listener: @escaping @Sendable () -> Void) -> () -> Void
    func dispose()
}

// MARK: - Evaluation context (implemented in Evaluator.swift)

/// Custom (library) function implementation. May throw; a throw is
/// reported as `runtime-error` and the call evaluates to null.
public struct CustomFunction: Sendable {
    public var params: [ParamDef]
    public var fn: @Sendable ([String: Value]) throws -> Value
    public var returns: JSONValue?
    public init(params: [ParamDef], returns: JSONValue? = nil, fn: @Sendable @escaping ([String: Value]) throws -> Value) {
        self.params = params
        self.returns = returns
        self.fn = fn
    }
}

public struct EvaluationContext: Sendable {
    public var getState: @Sendable (String) -> Value
    public var resolveRef: @Sendable (String) -> Value
    public var functions: [String: CustomFunction]
    public var actions: [String: CallDef]
    public var reportError: (@Sendable (String) -> Void)?
    public var extraScope: [String: Value]?
    public init(
        getState: @Sendable @escaping (String) -> Value,
        resolveRef: @Sendable @escaping (String) -> Value,
        functions: [String: CustomFunction] = [:],
        actions: [String: CallDef] = [:],
        reportError: (@Sendable (String) -> Void)? = nil,
        extraScope: [String: Value]? = nil
    ) {
        self.getState = getState
        self.resolveRef = resolveRef
        self.functions = functions
        self.actions = actions
        self.reportError = reportError
        self.extraScope = extraScope
    }
}

// MARK: - Public API contracts
//
// Implemented in API.swift / StreamingParser.swift. Declared here so the
// fixture harness and other modules can rely on exact signatures.

public protocol Parser: AnyObject {
    func parse(_ input: String) -> ParseResult
}

public protocol StreamParser: AnyObject {
    @discardableResult func push(_ chunk: String, complete: Bool) -> ParseResult
    @discardableResult func set(_ fullText: String, complete: Bool) -> ParseResult
    func getResult(complete: Bool) -> ParseResult
}

public extension StreamParser {
    @discardableResult func push(_ chunk: String) -> ParseResult {
        push(chunk, complete: false)
    }
    @discardableResult func set(_ fullText: String) -> ParseResult {
        set(fullText, complete: false)
    }
    func getResult() -> ParseResult {
        getResult(complete: false)
    }
}

extension JSONValue {
    public var numberValue: Double? { if case .number(let number) = self { return number }; return nil }
}

public extension Store {
    @_disfavoredOverload func get<S: StringProtocol>(_ name: S) -> Value? { get(OpenUIString(String(name))) }
    @_disfavoredOverload func set<S: StringProtocol>(_ name: S, value: Value, pristine: Bool) { set(OpenUIString(String(name)), value: value, pristine: pristine) }
}
