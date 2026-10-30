import Foundation
import JavaScriptCore

/// State semantics are owned by lang-core. Swift retains only the native facade.
final class CoreStore: Store {
    private let core = SharedCore.shared
    private let store: JSValue
    public init() { store = SharedCore.shared.sync { SharedCore.shared.call("store") } }
    public func get(_ name: OpenUIString) -> Value? { core.sync {
        let snapshot = store.invokeMethod("getSnapshot", withArguments: [])!
        guard core.entries(snapshot).contains(where: { $0.0 == name }) else { return nil }
        return core.decode(store.invokeMethod("get", withArguments: [core.string(name)]))
    } }
    public func set(_ name: OpenUIString, value: Value, pristine: Bool) { core.sync {
        _ = store.invokeMethod("set", withArguments: [core.string(name), core.encode(value), ["pristine": pristine]])
    } }
    public func initialize(defaults: [(String, Materialized)], persisted: [OpenUIString: Value]) { core.sync {
        _ = store.invokeMethod("initialize", withArguments: [core.object(defaults.map { (OpenUIString($0.0), core.encode(protocolMaterializedValue($0.1))) }), core.object(persisted.map { ($0.key, core.encode($0.value)) })])
    } }
    public func getSnapshot() -> [OpenUIString: Value] { core.sync {
        Dictionary(core.entries(store.invokeMethod("getSnapshot", withArguments: [])).map { ($0.0, core.decode($0.1)) }, uniquingKeysWith: { _, new in new })
    } }
    public func subscribe(_ listener: @escaping @Sendable () -> Void) -> () -> Void { core.sync {
        let callback: @convention(block) () -> Void = { listener() }
        let unsubscribe = store.invokeMethod("subscribe", withArguments: [callback])!
        let runtime = core
        return { runtime.sync { _ = unsubscribe.call(withArguments: []) } }
    } }
    public func dispose() { core.sync { _ = store.invokeMethod("dispose", withArguments: []) } }
}
public func createStore() -> Store { CoreStore() }
