import Foundation

/// Compatibility writes into the authoritative ordered schema document.
/// Untouched constraints, shared $defs, references and annotations stay intact.
/// Structural authoring should use Library.extend rather than editing projections.
enum SchemaDocument {
    static func setting(_ object: JSONValue, _ key: String, _ value: JSONValue?) -> JSONValue {
        var fields = object.objectFields?.map { JSONField(key: $0.0, value: $0.1) } ?? []
        if let index = fields.firstIndex(where: { $0.key == OpenUIString(key) }) {
            if let value { fields[index].value = value } else { fields.remove(at: index) }
        } else if let value { fields.append(.init(key: key, value: value)) }
        return .object(fields)
    }

    private static func same(_ a: ParamDef, _ b: ParamDef) -> Bool {
        a.name == b.name && a.required == b.required && a.hasDefault == b.hasDefault
            && a.defaultValue == b.defaultValue && a.schema == b.schema
    }
    private static func same(_ a: [ParamDef], _ b: [ParamDef]) -> Bool {
        a.count == b.count && zip(a,b).allSatisfy { same($0,$1) }
    }
    private static func parameters(_ base: JSONValue?, old: [ParamDef], new: [ParamDef]) -> JSONValue {
        let raw = base?.field("properties")
        let properties = new.map { p -> JSONField in
            let previous = old.first { $0.name == p.name }
            if let previous, same(previous, p), let original = raw?.field(p.name) {
                return .init(key: p.name, value: original)
            }
            // compileSchema may inline a referenced action shape in its typed
            // projection. A required/default edit must keep the original ref.
            var value = previous?.schema == p.schema ? raw?.field(p.name) ?? p.schema ?? .object([]) : p.schema ?? .object([])
            if case .object = value {
                if p.hasDefault { value = setting(value, "default", plainValueJSON(p.defaultValue)) }
                else if previous?.hasDefault == true { value = setting(value, "default", nil) }
            }
            return .init(key: p.name, value: value)
        }
        var result = base ?? .object([.init(key: "type", value: .string("object"))])
        result = setting(result, "properties", .object(properties))
        return setting(result, "required", .array(new.filter(\.required).map { .string($0.name) }))
    }

    static func components(_ wire: JSONValue, old: [String: [ParamDef]], new: [String: [ParamDef]]) -> JSONValue {
        var defs = wire.field("$defs") ?? .object([])
        // A retained definition may still be referenced as data by another
        // component. Component membership is controlled by top-level properties.
        var membership = wire.field("properties") ?? .object(old.keys.sorted().map {
            .init(key: $0, value: .object([.init(key: "$ref", value: .string("#/$defs/" + $0))]))
        })
        for name in old.keys where new[name] == nil { membership = setting(membership, name, nil) }
        for name in new.keys.sorted() {
            let params = new[name]!
            if let previous = old[name], same(previous, params) { continue }
            defs = setting(defs, name, parameters(defs.field(name), old: old[name] ?? [], new: params))
            if membership.field(name) == nil {
                membership = setting(membership, name, .object([.init(key: "$ref", value: .string("#/$defs/" + name))]))
            }
        }
        var result = setting(setting(wire, "$defs", defs), "properties", membership)
        if let required = wire.field("required")?.arrayItems {
            result = setting(result, "required", .array(required.filter {
                guard let name = $0.stringValue else { return true }
                return old[name] == nil || new[name] != nil
            }))
        }
        return result
    }

    static func calls(_ wire: JSONValue, old: [String: CallDef], new: [String: CallDef]) -> JSONValue {
        var result = wire
        for (key, kind) in [("functions", CallDef.Kind.function), ("actions", .action)] {
            var group = wire.field(key) ?? .object([])
            for name in old.keys where !old[name]!.isBuiltin && old[name]!.kind == kind {
                if new[name].map({ !$0.isBuiltin && $0.kind == kind }) != true { group = setting(group, name, nil) }
            }
            for name in new.keys.sorted() {
                let definition = new[name]!
                guard !definition.isBuiltin, definition.kind == kind else { continue }
                if let previous = old[name], !previous.isBuiltin, previous.kind == kind, same(previous.params, definition.params) { continue }
                let entry = group.field(name) ?? .object([])
                group = setting(group, name, setting(entry, "params", parameters(entry.field("params"), old: old[name]?.params ?? [], new: definition.params)))
                if kind == .action, let body = result.field("$defs")?.field(name),
                   let properties = body.field("properties"), let params = properties.field("params") {
                    let updated = setting(body, "properties", setting(properties, "params", parameters(params, old: old[name]?.params ?? [], new: definition.params)))
                    result = setting(result, "$defs", setting(result.field("$defs")!, name, updated))
                }
            }
            if wire.field(key) != nil || !(group.objectFields?.isEmpty ?? true) { result = setting(result, key, group) }
        }
        return result
    }
}
