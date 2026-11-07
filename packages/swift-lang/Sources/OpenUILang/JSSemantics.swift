// Ordered native data and AST codecs. No language execution or UI dependency.
import Foundation

/// Native presentation adapters use the ECMAScript primitive rather than a
/// second floating-point rounding implementation.
@_spi(RuntimeInspection) public func jsNumberToFixed(_ value: Double, digits: Int) -> String {
    precondition((0...100).contains(digits))
    let core = SharedCore.shared
    return core.sync {
        let result = core.encode(.number(value)).invokeMethod("toFixed", withArguments: [digits])!
        return core.string(result).displayString
    }
}

@_spi(RuntimeInspection) public func jsNumberLocalized(_ value: Double, locale: String) -> String {
    let core = SharedCore.shared
    return core.sync {
        let tag = locale.split(separator: "@").first.map(String.init)?.replacingOccurrences(of: "_", with: "-") ?? "en"
        let number = core.encode(.number(value))
        let formatted = number.invokeMethod("toLocaleString", withArguments: [tag])
        if core.context.exception != nil {
            core.context.exception = nil
            return core.string(number.invokeMethod("toLocaleString", withArguments: [])!).displayString
        }
        return core.string(formatted!).displayString
    }
}

extension Value {
    public var isNullish: Bool {
        switch self { case .null, .undefined: return true; default: return false }
    }

}

/// JS object construction is last-write-wins and enumerates integer keys first.
func orderedObjectFields(_ fields: [ObjectField]) -> [ObjectField] {
    var result: [ObjectField] = []
    for field in fields {
        if let i = result.firstIndex(where: { jsStringEqual($0.key, field.key) }) { result[i] = field }
        else { result.append(field) }
    }
    func index(_ key: OpenUIString) -> UInt32? {
        guard let text = key.wellFormedString, let n = UInt32(text), n != UInt32.max, String(n) == text else { return nil }; return n
    }
    let integers = result.filter { index($0.key) != nil }.sorted { index($0.key)! < index($1.key)! }
    return integers + result.filter { index($0.key) == nil }
}

func orderedPairs<T>(_ pairs: [(String, T)]) -> [(String, T)] {
    var output: [(String, T)] = []
    for pair in pairs {
        if let i = output.firstIndex(where: { jsStringEqual($0.0, pair.0) }) { output[i] = pair }
        else { output.append(pair) }
    }
    func index(_ key: String) -> UInt32? {
        guard let n = UInt32(key), n != UInt32.max, String(n) == key else { return nil }; return n
    }
    return output.filter { index($0.0) != nil }.sorted { index($0.0)! < index($1.0)! }
        + output.filter { index($0.0) == nil }
}

/// Canonical AST marker objects retained by the TS store for expression defaults.
func protocolASTValue(_ node: ASTNode) -> Value {
    func object(_ kind: String, _ fields: [(String, Value)] = []) -> Value {
        .object(([ ("k", Value.string(kind)) ] + fields).map { ObjectField(key: $0.0, value: $0.1) })
    }
    switch node {
    case .runtimeValue(let value): return value
    case .str(let v): return object("Str", [("v", .string(v))])
    case .num(let v): return object("Num", [("v", .number(v))])
    case .bool(let v): return object("Bool", [("v", .boolean(v))])
    case .null: return object("Null")
    case .arr(let els): return object("Arr", [("els", .array(els.map(protocolASTValue)))])
    case .obj(let fields): return object("Obj", [("entries", .array(fields.map { .array([.string($0.0), protocolASTValue($0.1)]) }))])
    case .ref(let n): return object("Ref", [("n", .string(n))])
    case .stateRef(let n): return object("StateRef", [("n", .string(n))])
    case .runtimeRef(let n, let type): return object("RuntimeRef", [("n", .string(n)), ("refType", .string(type.rawValue))])
    case .ph(let n): return object("Ph", [("n", .string(n))])
    case .binOp(let op, let left, let right): return object("BinOp", [("op", .string(op)), ("left", protocolASTValue(left)), ("right", protocolASTValue(right))])
    case .unaryOp(let op, let node): return object("UnaryOp", [("op", .string(op)), ("operand", protocolASTValue(node))])
    case .ternary(let cond, let yes, let no): return object("Ternary", [("cond", protocolASTValue(cond)), ("then", protocolASTValue(yes)), ("else", protocolASTValue(no))])
    case .member(let obj, let field): return object("Member", [("obj", protocolASTValue(obj)), ("field", .string(field))])
    case .index(let obj, let index): return object("Index", [("obj", protocolASTValue(obj)), ("index", protocolASTValue(index))])
    case .assign(let target, let value): return object("Assign", [("target", .string(target)), ("value", protocolASTValue(value))])
    case .comp(let name, let args, _, _): return object("Comp", [("name", .string(name)), ("args", .array(args.map(protocolASTValue)))])
    }
}

func protocolMaterializedValue(_ value: Materialized) -> Value {
    switch value {
    case .stateDefault(let value): return value.value
    case .element(let element):
        var fields = [ObjectField(key: "type", value: .string("element")), ObjectField(key: "typeName", value: .string(element.typeName)),
                      ObjectField(key: "props", value: .object(element.props.map { ObjectField(key: $0.key, value: protocolMaterializedValue($0.value)) })),
                      ObjectField(key: "partial", value: .boolean(element.partial)), ObjectField(key: "hasDynamicProps", value: .boolean(element.hasDynamicProps))]
        if let id = element.statementId { fields.append(ObjectField(key: "statementId", value: .string(id))) }
        return .object(fields)
    case .expr(let ast): return protocolASTValue(ast)
    case .array(let values): return .array(values.map(protocolMaterializedValue))
    case .object(let pairs): return .object(pairs.map { ObjectField(key: $0.0, value: protocolMaterializedValue($0.1)) })
    default: return materializedToPlain(value) ?? .null
    }
}

func jsonStringify(_ value: JSONValue) -> String {
    switch value {
    case .null: return "null"
    case .boolean(let b): return b ? "true" : "false"
    case .number(let n): return n.isFinite ? jsNumberString(n) : "null"
    case .string(let s): return jsonStringLiteral(s)
    case .array(let values): return "[" + values.map(jsonStringify).joined(separator: ",") + "]"
    case .object(let fields):
        return "{" + orderedPairs(fields.map { ($0.key, $0.value) }).map {
            jsonStringLiteral($0.0) + ":" + jsonStringify($0.1)
        }.joined(separator: ",") + "}"
    }
}

/// Swift String equality normalizes Unicode; JavaScript compares UTF-16 units.
func jsStringEqual(_ a: String, _ b: String) -> Bool { a.utf16.elementsEqual(b.utf16) }

func orderedObjectFields(_ fields: OpenUIObject) -> [ObjectField] { orderedObjectFields(fields.fields) }

func orderedPairs<T>(_ pairs: [(OpenUIString, T)]) -> [(OpenUIString, T)] {
    var output: [(OpenUIString, T)] = []
    for pair in pairs {
        if let index = output.firstIndex(where: { $0.0 == pair.0 }) { output[index] = pair }
        else { output.append(pair) }
    }
    func index(_ key: OpenUIString) -> UInt32? {
        guard let text = key.wellFormedString, let value = UInt32(text), value != UInt32.max, String(value) == text else { return nil }
        return value
    }
    return output.filter { index($0.0) != nil }.sorted { index($0.0)! < index($1.0)! } + output.filter { index($0.0) == nil }
}
