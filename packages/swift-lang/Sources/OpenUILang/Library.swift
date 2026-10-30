// Typed Swift authoring values and ordered protocol DTOs.
// All library/schema rules execute in the pinned shared lang-core.
import Foundation

/// A library authoring failure reported by the shared core.
public enum LibraryValidationError: Error, CustomStringConvertible, Sendable {
    case sharedCore(String)
    public var description: String {
        switch self { case .sharedCore(let message): return message }
    }
}

public struct DefinedComponent: Sendable {
    public var name: String
    public var description: String
    public var params: [ParamDef]
    public init(name: String, description: String, params: [ParamDef]) {
        self.name = name
        self.description = description
        self.params = params
    }
}

/// A custom function: called as `@Name(...)` with positional args in `params`
/// key order. `fn` receives args by name; a throw evaluates to null.
public struct DefinedFunction: Sendable {
    public var name: String
    public var description: String
    public var params: [ParamDef]
    public var returns: JSONValue?
    public var fn: @Sendable ([String: Value]) throws -> Value
    public init(
        name: String,
        description: String,
        params: [ParamDef],
        returns: JSONValue? = nil,
        fn: @Sendable @escaping ([String: Value]) throws -> Value
    ) {
        self.name = name
        self.description = description
        self.params = params
        self.returns = returns
        self.fn = fn
    }
}

/// A custom action: used as `@Name(...)` steps in action props. The client
/// does not run it; the host receives it in `onAction`.
public struct DefinedAction: Sendable {
    public var name: String
    public var description: String
    public var params: [ParamDef]
    public init(name: String, description: String, params: [ParamDef]) {
        self.name = name
        self.description = description
        self.params = params
    }
}

public func defineComponent(name: String, description: String, params: [ParamDef]) -> DefinedComponent {
    DefinedComponent(name: name, description: description, params: params)
}

public func defineFunction(
    name: String,
    description: String,
    params: [ParamDef],
    returns: JSONValue? = nil,
    fn: @Sendable @escaping ([String: Value]) throws -> Value
) -> DefinedFunction {
    DefinedFunction(name: name, description: description, params: params, returns: returns, fn: fn)
}

public func defineAction(name: String, description: String, params: [ParamDef]) -> DefinedAction {
    DefinedAction(name: name, description: description, params: params)
}

public struct Library: Sendable {
    public var components: [DefinedComponent]
    public var functions: [DefinedFunction]
    public var actions: [DefinedAction]
    public var root: String?
    public var id: String?
    public var componentGroups: [ComponentGroup]?

    public init(
        components: [DefinedComponent] = [],
        functions: [DefinedFunction] = [],
        actions: [DefinedAction] = [],
        root: String? = nil,
        id: String? = nil,
        componentGroups: [ComponentGroup]? = nil
    ) {
        self.componentGroups = componentGroups
        self.components = components
        self.functions = functions
        self.actions = actions
        self.root = root
        self.id = id
    }

    /// Core authoring owns rule checks, extension and schema production.
    public func toSchema() -> LibrarySchema {
        let spec = toSpec(), core = SharedCore.shared
        return core.sync {
            core.compiledLibrary(spec.schema, spec: spec, bindings: Dictionary(
                components.map { ($0.name, $0.params.filter(\.isBindable).map(\.name)) },
                uniquingKeysWith: { _, next in next }))
        }
    }

    public func customFunctions() -> [String: CustomFunction] {
        var out: [String: CustomFunction] = [:]
        for f in functions { out[f.name] = CustomFunction(params: f.params, returns: f.returns, fn: f.fn) }
        return out
    }


    public func extend(_ ext: LibraryExtension) throws -> Library {
        let core = SharedCore.shared
        return try core.sync {
            let value = try core.authoredLibrary(self, extending: ext)
            return core.decodeLibrary(value, functions: functions + ext.addFunctions)
        }
    }
    public func toSpec() -> LibrarySpec {
        let core = SharedCore.shared
        return core.sync {
            do { return LibrarySpec(json: core.authoringJSON(try core.authoredLibrary(self).forProperty("spec"))) }
            catch { preconditionFailure("Invalid library: \(error)") }
        }
    }
    public func toJSONSchema() -> JSONValue { toSpec().schema }
}

public func createLibrary(
    components: [DefinedComponent] = [], functions: [DefinedFunction] = [],
    actions: [DefinedAction] = [], root: String? = nil, id: String? = nil,
    componentGroups: [ComponentGroup]? = nil
) throws -> Library {
    let library = Library(components: components, functions: functions, actions: actions, root: root, id: id, componentGroups: componentGroups)
    let core = SharedCore.shared
    return try core.sync {
        let value = try core.authoredLibrary(library)
        return core.decodeLibrary(value, functions: functions)
    }
}

public struct LibraryExtension: Sendable {
    public var addComponents: [DefinedComponent]
    public var overrideComponents: [DefinedComponent]
    public var removeComponents: [String]
    public var addFunctions: [DefinedFunction]
    public var addActions: [DefinedAction]
    public var addComponentSlots: [String: [String]]
    public init(
        addComponents: [DefinedComponent] = [],
        overrideComponents: [DefinedComponent] = [],
        removeComponents: [String] = [],
        addFunctions: [DefinedFunction] = [],
        addActions: [DefinedAction] = [],
        addComponentSlots: [String: [String]] = [:]
    ) {
        self.addComponentSlots = addComponentSlots
        self.addComponents = addComponents
        self.overrideComponents = overrideComponents
        self.removeComponents = removeComponents
        self.addFunctions = addFunctions
        self.addActions = addActions
    }
}

public struct LibrarySpecEntry: Codable, Sendable {
    public var name: String
    public var signature: String
    public var description: String
    public init(name: String, signature: String, description: String) {
        self.name = name
        self.signature = signature
        self.description = description
    }
}

/// The full spec document: id, version, root, the ordered JSON schema, and
/// signatures + descriptions for components, functions, and actions.
public struct LibrarySpec: Codable, Sendable {
    public var id: String?
    public var version: String
    public var root: String?
    public var schema: JSONValue
    public var components: [LibrarySpecEntry]
    public var functions: [LibrarySpecEntry]
    public var actions: [LibrarySpecEntry]
    public var componentGroups: [ComponentGroup]?
    public init(
        id: String? = nil,
        version: String = "",
        root: String? = nil,
        schema: JSONValue,
        components: [LibrarySpecEntry] = [],
        functions: [LibrarySpecEntry] = [],
        actions: [LibrarySpecEntry] = [], componentGroups: [ComponentGroup]? = nil
    ) {
        self.id = id
        self.version = version
        self.root = root
        self.schema = schema
        self.components = components
        self.functions = functions
        self.actions = actions
        self.componentGroups = componentGroups
    }
    public func toJSONValue() -> JSONValue {
        func entries(_ values: [LibrarySpecEntry]) -> JSONValue {
            .object(values.map { .init(key: $0.name, value: .object([
                .init(key: "signature", value: .string($0.signature)),
                .init(key: "description", value: .string($0.description))
            ])) })
        }
        var fields: [JSONField] = []
        if let root { fields.append(.init(key: "root", value: .string(root))) }
        fields.append(.init(key: "components", value: entries(components)))
        if let componentGroups { fields.append(.init(key: "componentGroups", value: .array(componentGroups.map { $0.toJSONValue() }))) }
        if !functions.isEmpty { fields.append(.init(key: "functions", value: entries(functions))) }
        if !actions.isEmpty { fields.append(.init(key: "actions", value: entries(actions))) }
        fields.append(.init(key: "schema", value: schema))
        if let id { fields.append(.init(key: "id", value: .string(id))) }
        if !version.isEmpty { fields.append(.init(key: "version", value: .string(version))) }
        return .object(fields)
    }
    /// Use this for protocol transport: JSONEncoder does not promise property order.
    public func jsonString() -> String { jsonStringify(toJSONValue()) }

    public init(from decoder: Decoder) throws {
        let value = try JSONValue(from: decoder)
        self.init(json: value)
    }
    public init(jsonString: String) throws { self.init(json: try parseJSONPreservingOrder(jsonString)) }
    public init(json: JSONValue) {
        func entries(_ key: String) -> [LibrarySpecEntry] {
            (json.field(key)?.objectFields ?? []).map {
                LibrarySpecEntry(name: $0.0, signature: $0.1.field("signature")?.stringValue ?? "", description: $0.1.field("description")?.stringValue ?? "")
            }
        }
        id = json.field("id")?.stringValue; version = json.field("version")?.stringValue ?? ""
        root = json.field("root")?.stringValue; schema = json.field("schema") ?? .object([])
        components = entries("components"); functions = entries("functions"); actions = entries("actions")
        componentGroups = json.field("componentGroups")?.arrayItems?.map(ComponentGroup.init(json:))
    }
    public func encode(to encoder: Encoder) throws { try toJSONValue().encode(to: encoder) }
}

// MARK: - Codable convenience (use parseJSONPreservingOrder/jsonString for ordered protocol transport)

private struct AnyCodingKey: CodingKey {
    var stringValue: String
    var intValue: Int? { nil }
    init(stringValue: String) { self.stringValue = stringValue }
    init?(intValue: Int) { nil }
}

extension JSONValue: Codable {
    public init(from decoder: Decoder) throws {
        let single = try decoder.singleValueContainer()
        if single.decodeNil() { self = .null; return }
        if let b = try? single.decode(Bool.self) { self = .boolean(b); return }
        if let n = try? single.decode(Double.self) { self = .number(n); return }
        if let s = try? single.decode(String.self) { self = .string(s); return }
        if var arr = try? decoder.unkeyedContainer() {
            var items: [JSONValue] = []
            while !arr.isAtEnd { items.append(try arr.decode(JSONValue.self)) }
            self = .array(items)
            return
        }
        let obj = try decoder.container(keyedBy: AnyCodingKey.self)
        self = .object(try obj.allKeys.map { JSONField(key: $0.stringValue, value: try obj.decode(JSONValue.self, forKey: $0)) })
    }

    public func encode(to encoder: Encoder) throws {
        switch self {
        case .string(let s):
            var c = encoder.singleValueContainer(); try c.encode(s)
        case .number(let n):
            var c = encoder.singleValueContainer(); try c.encode(n)
        case .boolean(let b):
            var c = encoder.singleValueContainer(); try c.encode(b)
        case .null:
            var c = encoder.singleValueContainer(); try c.encodeNil()
        case .array(let items):
            var c = encoder.unkeyedContainer()
            for i in items { try c.encode(i) }
        case .object(let fields):
            // JSONEncoder does not guarantee object order. Use jsonStringify
            // or LibrarySpec.jsonString for protocol transport.
            var c = encoder.container(keyedBy: AnyCodingKey.self)
            var seen: [String: OpenUIString] = [:]
            for f in fields {
                let key = try f.key.requireSwiftString()
                if let previous = seen[key], previous != f.key { throw JSONValueBridgeError.normalizationCollision }
                seen[key] = f.key
                try c.encode(f.value, forKey: AnyCodingKey(stringValue: key))
            }
        }
    }
}

func plainValueJSON(_ value: Value) -> JSONValue {
    switch value {
    case .string(let s): return .string(s)
    case .number(let n): return n.isFinite ? .number(n) : .null
    case .boolean(let b): return .boolean(b)
    case .array(let values): return .array(values.map(plainValueJSON))
    case .object(let fields): return .object(fields.filter { if case .undefined = $0.value { return false }; return true }.map { .init(key: $0.key, value: plainValueJSON($0.value)) })
    default: return .null
    }
}

public func compileLibrarySchema(_ json: JSONValue) -> LibrarySchema {
    let core = SharedCore.shared
    return core.sync { core.compiledLibrary(json) }
}

public func compileLibrarySchema(_ spec: LibrarySpec) -> LibrarySchema {
    let core = SharedCore.shared
    return core.sync { core.compiledLibrary(spec.schema, spec: spec) }
}
