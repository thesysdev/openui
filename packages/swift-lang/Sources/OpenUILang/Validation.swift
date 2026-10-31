import Foundation

public enum ValidationIssue {
    case typeMismatch(expected: String, actual: String)
    case missingRequired(signature: String?)
    case nullRequired(signature: String?)
    case unknownComponent(available: [String]?)
    case inlineReserved
    case excessArgs(declared: Int, got: Int)
    case unknownFunction
    case noRoot(reason: NoRootReason)
}

public enum NoRootReason {
    case missing
    case notComponent
    case fallback
}

public enum ValidationOutcome { case kept(Materialized), invalid }
public enum InvalidResolution { case useDefault(Value), dropProp, invalid }
public func resolveInvalidValue(required: Bool, hasDefault: Bool, defaultValue: Value) -> InvalidResolution {
    if hasDefault { return .useDefault(defaultValue) };return required ? .invalid : .dropProp
}
public func buildParamsSignature(_ component: String, _ params: [ParamDef]) -> String {
    let core = SharedCore.shared
    return core.sync { core.call("signature", [component, core.json(core.parameters(params))]).toString() }
}
public func validateMaterialized(_ value: Materialized, schema: JSONValue?, component: String, path: OpenUIString, ctx: MaterializeContext) -> ValidationOutcome {
    guard let schema else { return .kept(value) }
    let core = SharedCore.shared
    return core.sync {
        let result = core.lower("validate", core.materialized(value), ctx, component: component, path: path, schema: schema)
        return result.forProperty("invalid").toBool() ? .invalid : .kept(core.materialized(result.forProperty("result")))
    }
}
public func pushValidationIssue(_ ctx: MaterializeContext, component: String, path: OpenUIString, issue: ValidationIssue) {
    let core = SharedCore.shared
    core.sync {
        var fields: [ObjectField] = []
        func add(_ key: String, _ value: Value) { fields.append(.init(key: key, value: value)) }
        switch issue {
        case .typeMismatch(let expected, let actual): add("code", .string("type-mismatch"));add("expected", .string(expected));add("actual", .string(actual))
        case .missingRequired(let signature): add("code", .string("missing-required"));if let signature { add("signature", .string(signature)) }
        case .nullRequired(let signature): add("code", .string("null-required"));if let signature { add("signature", .string(signature)) }
        case .unknownComponent(let available): add("code", .string("unknown-component"));if let available { add("available", .array(available.map { .string($0) })) }
        case .inlineReserved: add("code", .string("inline-reserved"))
        case .excessArgs(let declared, let got): add("code", .string("excess-args"));add("declared", .number(Double(declared)));add("got", .number(Double(got)))
        case .unknownFunction: add("code", .string("unknown-function"))
        case .noRoot(let reason): add("code", .string("no-root"));add("reason", .string(reason == .missing ? "missing" : reason == .fallback ? "fallback" : "not-component"))
        }
        _ = core.lower("issue", core.encode(.object(fields)), ctx, component: component, path: path)
    }
}

public func jsonToValue(_ j: JSONValue) -> Value {
    switch j {
    case .string(let s): return .string(s)
    case .number(let n): return .number(n)
    case .boolean(let b): return .boolean(b)
    case .null: return .null
    case .array(let items): return .array(items.map(jsonToValue))
    case .object(let fields):
        return .object(fields.map { ObjectField(key: $0.key, value: jsonToValue($0.value)) })
    }
}


func jsonValuesEqual(_ a: JSONValue, _ b: JSONValue) -> Bool {
    switch (a, b) {
    case (.string(let x), .string(let y)): return jsStringEqual(x, y)
    case (.number(let x), .number(let y)): return x == y
    case (.boolean(let x), .boolean(let y)): return x == y
    case (.null, .null): return true
    case (.array(let x), .array(let y)):
        return x.count == y.count && zip(x, y).allSatisfy(jsonValuesEqual)
    case (.object(let x), .object(let y)):
        return x.count == y.count && zip(x, y).allSatisfy { jsStringEqual($0.key, $1.key) && jsonValuesEqual($0.value, $1.value) }
    default: return false
    }
}


func materializedToPlain(_ m: Materialized) -> Value? {
    switch m {
    case .stateDefault(let value): return value.value
    case .value(let v): return v
    case .null: return .null
    case .element: return nil // Unevaluated element has no plain Value form.
    case .array(let items):
        var out: [Value] = []
        for i in items { guard let v = materializedToPlain(i) else { return nil }; out.append(v) }
        return .array(out)
    case .object(let entries):
        var out: [ObjectField] = []
        for (k, v) in entries { guard let pv = materializedToPlain(v) else { return nil }; out.append(ObjectField(key: k, value: pv)) }
        return .object(out)
    case .expr: return nil
    }
}
