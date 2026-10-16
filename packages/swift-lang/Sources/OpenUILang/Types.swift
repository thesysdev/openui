/// A resolved component node produced by the parser: positional arguments
/// mapped to named props through the library schema.
public struct ElementNode: Sendable, Equatable {
  /// Source statement name (`header` in `header = TextContent(...)`); `nil` for inline components.
  public var statementId: String?
  /// Component name as defined in the library.
  public var typeName: String
  public var props: OpenUIObject
  /// True while the parser hasn't received all tokens yet.
  public var partial: Bool
  /// False when every prop is a static literal, so evaluation can be skipped.
  /// `nil` is treated as dynamic.
  public var hasDynamicProps: Bool?

  public init(
    statementId: String? = nil, typeName: String, props: OpenUIObject, partial: Bool,
    hasDynamicProps: Bool? = nil
  ) {
    self.statementId = statementId
    self.typeName = typeName
    self.props = props
    self.partial = partial
    self.hasDynamicProps = hasDynamicProps
  }
}

public enum ValidationErrorCode: String, Sendable, Equatable {
  case missingRequired = "missing-required"
  case nullRequired = "null-required"
  case unknownComponent = "unknown-component"
  case inlineReserved = "inline-reserved"
  case excessArgs = "excess-args"
  case typeMismatch = "type-mismatch"
}

/// A prop validation error. Components with missing required props are dropped
/// from the tree and reported here.
public struct ValidationError: Sendable, Equatable {
  public var code: ValidationErrorCode
  public var component: String
  /// JSON Pointer within the props object, e.g. `/title`.
  public var path: String
  public var message: String
  public var statementId: String?
}

public enum OpenUIErrorSource: String, Sendable, Equatable {
  case parser
  case runtime
  case query
  case mutation
}

/// A structured, LLM-friendly error from the OpenUI Lang pipeline.
public struct OpenUIError: Sendable, Equatable {
  public var source: OpenUIErrorSource
  /// A `ValidationErrorCode` raw value, or one of `runtime-error`, `render-error`,
  /// `parse-exception`, `parse-failed`, `tool-not-found`, `tool-error`, `mcp-error`.
  public var code: String
  public var message: String
  public var statementId: String?
  public var component: String?
  public var path: String?
  public var toolName: String?
  public var hint: String?

  public init(
    source: OpenUIErrorSource, code: String, message: String, statementId: String? = nil,
    component: String? = nil, path: String? = nil, toolName: String? = nil, hint: String? = nil
  ) {
    self.source = source
    self.code = code
    self.message = message
    self.statementId = statementId
    self.component = component
    self.path = path
    self.toolName = toolName
    self.hint = hint
  }
}

/// Built-in action types delivered to the host app.
public enum BuiltinActionType {
  public static let continueConversation = "continue_conversation"
  public static let openUrl = "open_url"
}

/// One step of an `ActionPlan`. Step type names match lang-core's `ACTION_STEPS`.
public enum ActionStep: Sendable, Equatable {
  case run(statementId: String, refType: RuntimeRefType)
  case continueConversation(message: String, context: String?)
  case openUrl(url: String)
  /// `valueAST` is evaluated when the action fires, not when it is built.
  case set(target: String, valueAST: ASTNode)
  case reset(targets: [String])

  public var type: String {
    switch self {
    case .run: return "run"
    case .continueConversation: return "continue_conversation"
    case .openUrl: return "open_url"
    case .set: return "set"
    case .reset: return "reset"
    }
  }
}

/// The ordered steps an `Action([...])` expression evaluates to.
public struct ActionPlan: Sendable, Equatable {
  public var steps: [ActionStep]

  public init(steps: [ActionStep]) {
    self.steps = steps
  }
}

/// A structured action event fired by interactive components.
public struct ActionEvent: Sendable, Equatable {
  /// See `BuiltinActionType`; custom types pass through unchanged.
  public var type: String
  public var params: OpenUIObject
  /// Human-readable label for the action (shown as the user message in chat).
  public var humanFriendlyMessage: String
  /// Form state at the time of the action.
  public var formState: OpenUIObject?
  public var formName: String?

  public init(
    type: String, params: OpenUIObject = OpenUIObject(), humanFriendlyMessage: String,
    formState: OpenUIObject? = nil, formName: String? = nil
  ) {
    self.type = type
    self.params = params
    self.humanFriendlyMessage = humanFriendlyMessage
    self.formState = formState
    self.formName = formName
  }
}

/// A two-way binding between a reactive prop and a `$state` variable. Setting
/// the field evaluates `expr` with `$value` bound to the new value.
public struct ReactiveAssign: Sendable, Equatable {
  public var target: String
  public var expr: ASTNode

  public init(target: String, expr: ASTNode) {
    self.target = target
    self.expr = expr
  }
}

/// A `Query(...)` statement with its positional arguments kept as AST.
public struct QueryStatementInfo: Sendable, Equatable {
  public var statementId: String
  public var toolAST: ASTNode?
  public var argsAST: ASTNode?
  public var defaultsAST: ASTNode?
  public var refreshAST: ASTNode?
  /// `$variable` dependencies of the arguments, collected at parse time.
  public var deps: [String]?
  public var complete: Bool
}

/// A `Mutation(...)` statement with its positional arguments kept as AST.
public struct MutationStatementInfo: Sendable, Equatable {
  public var statementId: String
  public var toolAST: ASTNode?
  public var argsAST: ASTNode?
}

/// The result of parsing (or re-parsing while streaming) an OpenUI Lang response.
public struct ParseResult: Sendable, Equatable {
  public struct Meta: Sendable, Equatable {
    /// True if the input was truncated (still streaming).
    public var incomplete: Bool
    /// References used but not defined yet.
    public var unresolved: [String]
    /// Value statements defined but not reachable from the root.
    public var orphaned: [String]
    public var statementCount: Int
    public var errors: [ValidationError]
  }

  public var root: ElementNode?
  public var meta: Meta
  /// `$variable` declarations mapped to their default values.
  public var stateDeclarations: OpenUIObject
  public var queryStatements: [QueryStatementInfo]
  public var mutationStatements: [MutationStatementInfo]

  static func empty(incomplete: Bool = true) -> ParseResult {
    ParseResult(
      root: nil,
      meta: Meta(
        incomplete: incomplete, unresolved: [], orphaned: [], statementCount: 0, errors: []),
      stateDeclarations: OpenUIObject(), queryStatements: [], mutationStatements: [])
  }
}

/// A component parameter compiled from the library JSON Schema.
public struct ParamDef: Sendable, Equatable {
  public var name: String
  public var required: Bool
  /// The schema `default`, used when a required prop is missing or null.
  public var defaultValue: OpenUIValue?
  public var schema: OpenUIValue?
}

/// Positional parameter lists keyed by component name, in schema `$defs` order.
public struct ParamMap: Sendable, Equatable {
  public var componentNames: [String] = []
  private var params: [String: [ParamDef]] = [:]

  public init() {}

  public subscript(component: String) -> [ParamDef]? {
    get { params[component] }
    set {
      if params[component] == nil, newValue != nil { componentNames.append(component) }
      params[component] = newValue
    }
  }
}
