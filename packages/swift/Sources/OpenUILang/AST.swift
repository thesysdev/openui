public indirect enum ASTNode {
    case comp(name: String, args: [ASTNode], mappedProps: [String: ASTNode]?)
    case str(String)
    case num(Double)
    case bool(Bool)
    case null
    case arr([ASTNode])
    case obj([(String, ASTNode)])
    case ref(String)
    case ph(String)
    case stateRef(String)
    case runtimeRef(name: String, refType: String)
    case binOp(op: String, left: ASTNode, right: ASTNode)
    case unaryOp(op: String, operand: ASTNode)
    case ternary(cond: ASTNode, then: ASTNode, `else`: ASTNode)
    case member(obj: ASTNode, field: String)
    case index(obj: ASTNode, index: ASTNode)
    case assign(target: String, value: ASTNode)

    public var isRuntimeExpr: Bool {
        switch self {
        case .stateRef, .runtimeRef, .binOp, .unaryOp, .ternary, .member, .index, .assign:
            return true
        default:
            return false
        }
    }
}

public struct CallNode {
    public let callee: String
    public let args: [ASTNode]
}

public enum Statement {
    case value(id: String, expr: ASTNode)
    case state(id: String, initExpr: ASTNode)
    case query(id: String, call: CallNode, expr: ASTNode, deps: [String]?)
    case mutation(id: String, call: CallNode, expr: ASTNode)
}
