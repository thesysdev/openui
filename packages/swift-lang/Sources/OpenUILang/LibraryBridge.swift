import Foundation
import JavaScriptCore

/// Data/closure projection only. No native library validation or slot rules.
extension SharedCore {
    func authoringJSON(_ value: JSValue) -> JSONValue {
        if value.isUndefined || value.isNull { return .null }
        if value.isString { return .string(string(value)) }
        if value.isBoolean { return .boolean(value.toBool()) }
        if value.isNumber { return .number(value.toDouble()) }
        if value.isArray { return .array(items(value).map(authoringJSON)) }
        return .object(entries(value).filter { !$0.1.isUndefined }.map { .init(key: $0.0, value: authoringJSON($0.1)) })
    }
    func authoringParameter(_ p: ParamDef) -> JSValue {
        let value = object([
            ("name", string(OpenUIString(p.name))), ("required", JSValue(bool: p.required, in: context)!),
            ("hasDefault", JSValue(bool: p.hasDefault, in: context)!), ("defaultValue", encode(p.defaultValue)),
            ("isBindable", JSValue(bool: p.isBindable, in: context)!)
        ])
        if let schema = p.schema { value.setValue(json(schema), forProperty: "schema") }
        return value
    }
    private func authoringDefinition(_ name: String, _ description: String, _ params: [ParamDef], returns: JSONValue? = nil) -> JSValue {
        let value = object([("name", string(OpenUIString(name))), ("description", string(OpenUIString(description))), ("params", array(params.map(authoringParameter)))])
        if let returns { value.setValue(json(returns), forProperty: "returns") }
        return value
    }
    func authoringInput(_ library: Library) -> JSValue {
        let value = object([
            ("components", array(library.components.map { authoringDefinition($0.name, $0.description, $0.params) })),
            ("functions", array(library.functions.map { authoringDefinition($0.name, $0.description, $0.params, returns: $0.returns) })),
            ("actions", array(library.actions.map { authoringDefinition($0.name, $0.description, $0.params) }))
        ])
        if let root = library.root { value.setValue(string(OpenUIString(root)), forProperty: "root") }
        if let id = library.id { value.setValue(string(OpenUIString(id)), forProperty: "id") }
        if let groups = library.componentGroups { value.setValue(json(.array(groups.map { $0.toJSONValue() })), forProperty: "componentGroups") }
        return value
    }
    func authoredLibrary(_ library: Library, extending ext: LibraryExtension? = nil) throws -> JSValue {
        var args: [Any] = [authoringInput(library)]
        if let ext {
            args.append(object([
                ("addComponents", array(ext.addComponents.map { authoringDefinition($0.name, $0.description, $0.params) })),
                ("overrideComponents", array(ext.overrideComponents.map { authoringDefinition($0.name, $0.description, $0.params) })),
                ("removeComponents", array(ext.removeComponents.map { string(OpenUIString($0)) })),
                ("addFunctions", array(ext.addFunctions.map { authoringDefinition($0.name, $0.description, $0.params, returns: $0.returns) })),
                ("addActions", array(ext.addActions.map { authoringDefinition($0.name, $0.description, $0.params) })),
                ("addComponentSlots", object(ext.addComponentSlots.map { (OpenUIString($0.key), array($0.value.map { string(OpenUIString($0)) })) }))
            ]))
        }
        let result = call("nativeAuthoring", args)
        if result.forProperty("error").isString { throw LibraryValidationError.sharedCore(result.forProperty("error").toString()) }
        return result.forProperty("value")
    }
    private func authoringParams(_ value: JSValue) -> [ParamDef] {
        items(value).map { p in
            ParamDef(name: p.forProperty("name").toString(), required: p.forProperty("required").toBool(),
                hasDefault: p.forProperty("hasDefault").toBool(), defaultValue: decode(p.forProperty("defaultValue"), interpret: false),
                isBindable: p.forProperty("isBindable").toBool(), schema: p.forProperty("schema").isUndefined ? nil : authoringJSON(p.forProperty("schema")))
        }
    }
    func decodeLibrary(_ value: JSValue, functions: [DefinedFunction]) -> Library {
        let callbacks = Dictionary(functions.map { ($0.name, $0.fn) }, uniquingKeysWith: { _, next in next })
        return Library(
            components: items(value.forProperty("components")).map { DefinedComponent(name: $0.forProperty("name").toString(), description: $0.forProperty("description").toString(), params: authoringParams($0.forProperty("params"))) },
            functions: items(value.forProperty("functions")).map { f in
                let name = f.forProperty("name").toString()!
                guard let callback = callbacks[name] else { preconditionFailure("Missing native function callback: \(name)") }
                return DefinedFunction(name: name, description: f.forProperty("description").toString(), params: authoringParams(f.forProperty("params")), returns: f.forProperty("returns").isUndefined ? nil : authoringJSON(f.forProperty("returns")), fn: callback)
            },
            actions: items(value.forProperty("actions")).map { DefinedAction(name: $0.forProperty("name").toString(), description: $0.forProperty("description").toString(), params: authoringParams($0.forProperty("params"))) },
            root: optionalString(value.forProperty("root")), id: optionalString(value.forProperty("id")),
            componentGroups: value.forProperty("componentGroups").isUndefined ? nil : items(value.forProperty("componentGroups")).map { ComponentGroup(json: authoringJSON($0)) })
    }
    func compiledLibrary(_ schema: JSONValue, spec: LibrarySpec? = nil, bindings: [String: [String]]? = nil) -> LibrarySchema {
        let bindingValue = bindings.map { object($0.map { (OpenUIString($0.key), array($0.value.map { string(OpenUIString($0)) })) }) } ?? JSValue(undefinedIn: context)!
        let value = call("nativeCompileSchema", [json(schema), spec.map { json($0.toJSONValue()) } ?? JSValue(undefinedIn: context)!, bindingValue])
        var compiled = LibrarySchema(
            components: Dictionary(entries(value.forProperty("components")).map { ($0.0.displayString, authoringParams($0.1)) }, uniquingKeysWith: { _, next in next }),
            callDefs: Dictionary(entries(value.forProperty("calls")).map { name, def in
                (name.displayString, CallDef(kind: def.forProperty("kind").toString() == "action" ? .action : .function, params: authoringParams(def.forProperty("params")), isBuiltin: def.forProperty("builtin").toBool(), isLazy: def.forProperty("lazy").toBool()))
            }, uniquingKeysWith: { _, next in next }), rootComponent: spec?.root ?? schema.field("root")?.stringValue)
        compiled.wireSchema = schema
        return compiled
    }
}
