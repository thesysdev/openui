import Foundation

public func toNumber(_ value: Value) -> Double {
    let core = SharedCore.shared
    return core.sync { core.call("dslNumber", [core.encode(value)]).toDouble() }
}
public func toString(_ value: Value) -> OpenUIString {
    let core = SharedCore.shared
    return core.sync { core.string(core.call("stringValue", [core.encode(value)])) }
}
public func isLooselyEqual(_ a: Value, _ b: Value) -> Bool {
    let core = SharedCore.shared
    return core.sync { core.call("equal", [core.encode(a), core.encode(b)]).toBool() }
}
public func isTruthy(_ value: Value) -> Bool {
    let core = SharedCore.shared
    return core.sync { core.call("truth", [core.encode(value)]).toBool() }
}
func concatString(_ value: Value) -> OpenUIString { value.isNullish ? "" : toString(value) }
