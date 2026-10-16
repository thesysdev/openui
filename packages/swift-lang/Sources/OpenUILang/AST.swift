/// Every value that can appear in an OpenUI Lang expression.
///
/// Mirrors lang-core's `ASTNode` union. Literal and structural nodes are lowered
/// to plain values by the materializer; the reactive and operator nodes survive
/// into props and are resolved by the evaluator at runtime.
public indirect enum ASTNode: Sendable, Equatable {
  /// A component or builtin call: `Header("Hello")`, `@Count(items)`.
  /// `mappedProps` holds the arguments keyed by prop name for catalog
  /// components inside runtime expressions.
  case comp(name: String, args: [ASTNode], mappedProps: [ASTEntry]?)
  case str(String)
  case num(Double)
  case bool(Bool)
  case null
  case arr([ASTNode])
  case obj([ASTEntry])
  /// A reference to another statement.
  case ref(String)
  /// A placeholder for a reference that could not be resolved.
  case ph(String)
  /// A reactive state variable, including the `$`: `$count`.
  case stateRef(String)
  /// A Query or Mutation result, resolved at runtime.
  case runtimeRef(String, refType: RuntimeRefType)
  case binOp(op: String, left: ASTNode, right: ASTNode)
  case unaryOp(op: String, operand: ASTNode)
  case ternary(cond: ASTNode, then: ASTNode, else: ASTNode)
  case member(obj: ASTNode, field: String)
  case index(obj: ASTNode, index: ASTNode)
  case assign(target: String, value: ASTNode)

  /// The discriminant lang-core stores in `k`.
  public var kind: String {
    switch self {
    case .comp: return "Comp"
    case .str: return "Str"
    case .num: return "Num"
    case .bool: return "Bool"
    case .null: return "Null"
    case .arr: return "Arr"
    case .obj: return "Obj"
    case .ref: return "Ref"
    case .ph: return "Ph"
    case .stateRef: return "StateRef"
    case .runtimeRef: return "RuntimeRef"
    case .binOp: return "BinOp"
    case .unaryOp: return "UnaryOp"
    case .ternary: return "Ternary"
    case .member: return "Member"
    case .index: return "Index"
    case .assign: return "Assign"
    }
  }

  /// Nodes that must survive parser lowering for runtime evaluation.
  public var isRuntimeExpr: Bool {
    switch self {
    case .stateRef, .runtimeRef, .binOp, .unaryOp, .ternary, .member, .index, .assign:
      return true
    default:
      return false
    }
  }

  /// Visits this node and every node below it, depth first.
  public func walk(_ visit: (ASTNode) -> Void) {
    visit(self)
    switch self {
    case .comp(_, let args, let mappedProps):
      for arg in args { arg.walk(visit) }
      for entry in mappedProps ?? [] { entry.value.walk(visit) }
    case .arr(let elements):
      for element in elements { element.walk(visit) }
    case .obj(let entries):
      for entry in entries { entry.value.walk(visit) }
    case .binOp(_, let left, let right):
      left.walk(visit)
      right.walk(visit)
    case .unaryOp(_, let operand):
      operand.walk(visit)
    case .ternary(let cond, let then, let otherwise):
      cond.walk(visit)
      then.walk(visit)
      otherwise.walk(visit)
    case .member(let obj, _):
      obj.walk(visit)
    case .index(let obj, let index):
      obj.walk(visit)
      index.walk(visit)
    case .assign(_, let value):
      value.walk(visit)
    default:
      break
    }
  }
}

public struct ASTEntry: Sendable, Equatable {
  public var key: String
  public var value: ASTNode

  public init(_ key: String, _ value: ASTNode) {
    self.key = key
    self.value = value
  }
}

public enum RuntimeRefType: String, Sendable, Equatable {
  case query
  case mutation
}

/// A call extracted from a Query or Mutation statement.
public struct CallNode: Sendable, Equatable {
  public var callee: String
  public var args: [ASTNode]
}

/// A statement classified at parse time from its identifier token and expression shape.
public enum Statement: Sendable, Equatable {
  case value(id: String, expr: ASTNode)
  case state(id: String, initial: ASTNode)
  case query(id: String, call: CallNode, expr: ASTNode, deps: [String]?)
  case mutation(id: String, call: CallNode, expr: ASTNode)

  public var id: String {
    switch self {
    case .value(let id, _), .state(let id, _), .query(let id, _, _, _), .mutation(let id, _, _):
      return id
    }
  }
}
