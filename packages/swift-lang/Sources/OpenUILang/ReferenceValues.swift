import Foundation

/// Immutable containers retain ECMAScript identity across state/cache reads.
/// Constructing another container allocates a distinct identity, even if equal.
public final class OpenUIArray: RandomAccessCollection, Sendable {
    public typealias Index = Int
    public let values: [Value]
    public init(_ values: [Value]) { self.values = values }
    public var startIndex: Int { values.startIndex }
    public var endIndex: Int { values.endIndex }
    public subscript(index: Int) -> Value { values[index] }
}

public final class OpenUIObject: RandomAccessCollection, Sendable {
    public typealias Index = Int
    public let fields: [ObjectField]
    public init(_ fields: [ObjectField]) { self.fields = orderedObjectFields(fields) }
    public var startIndex: Int { fields.startIndex }
    public var endIndex: Int { fields.endIndex }
    public subscript(index: Int) -> ObjectField { fields[index] }
}

extension Value {
    public static func array(_ values: [Value]) -> Value { .array(OpenUIArray(values)) }
    public static func object(_ fields: [ObjectField]) -> Value { .object(OpenUIObject(fields)) }

    /// ECMAScript SameValue. Separate from structural Equatable used by views.
    public func isSameValue(as other: Value) -> Bool {
        switch (self, other) {
        case (.number(let a), .number(let b)):
            return (a.isNaN && b.isNaN) || (a == b && (a != 0 || a.sign == b.sign))
        case (.binding(let a), .binding(let b)), (.reactiveBinding(let a), .reactiveBinding(let b)),
             (.binding(let a), .reactiveBinding(let b)), (.reactiveBinding(let a), .binding(let b)): return a === b
        case (.array(let a), .array(let b)): return a === b
        case (.object(let a), .object(let b)): return a === b
        case (.element(let a), .element(let b)): return a === b
        case (.actionPlan(let a), .actionPlan(let b)): return a === b
        default: return self == other
        }
    }
}

extension OpenUIObject {
    public subscript(key: OpenUIString) -> Value? { fields.last(where: { $0.key == key })?.value }
    @_disfavoredOverload public subscript(key: String) -> Value? { self[OpenUIString(key)] }
}

/// A declaration owns its default graph once. Re-evaluation of a view must not
/// allocate a fresh default object and overwrite pristine state by accident.
public final class StateDefault: Sendable {
    public let source: Materialized
    public let value: Value
    public init(_ source: Materialized) { self.source = source; self.value = protocolMaterializedValue(source) }
}

public final class ReactiveAssign: Sendable {
    public let target: String
    public let expression: ASTNode
    public init(target: String, expression: ASTNode) { self.target = target; self.expression = expression }
}
extension Value {
    public static func binding(_ target: String) -> Value { .binding(ReactiveAssign(target: target, expression: .stateRef("$value"))) }
    public static func reactiveBinding(target: String, expression: ASTNode) -> Value { .reactiveBinding(ReactiveAssign(target: target, expression: expression)) }
}

public extension Store {
    func initialize<S: StringProtocol & Hashable>(defaults: [(String, Materialized)], persisted: [S: Value]) {
        let values = Dictionary(persisted.map { (OpenUIString(String($0.key)), $0.value) }, uniquingKeysWith: { _, new in new })
        initialize(defaults: defaults, persisted: values)
    }
}
