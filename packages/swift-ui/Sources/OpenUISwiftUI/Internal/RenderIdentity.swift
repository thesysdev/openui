import OpenUILang

/// Identity for a rendered child. Dynamic stateful content should declare a
/// runtime statement id or a key/id already supported by its schema.
public struct OpenUIRenderChild: Identifiable {
    public let id: String
    public let value: Value

    public static func children(of value: Value) -> [OpenUIRenderChild] {
        func flattened(_ value: Value, path: String) -> [(String, Value)] {
            if case .array(let items) = value {
                return items.enumerated().flatMap { flattened($0.element, path: path + "." + String($0.offset)) }
            }
            if case .null = value { return [] }
            if case .undefined = value { return [] }
            return [(path, value)]
        }
        var occurrences: [String: Int] = [:]
        return flattened(value, path: "root").map { position, value in
            let base: String
            if case .element(let element) = value {
                let identityProps = element.typeName == "TabItem" ? ["key", "value"] : ["key", "id", "resourceId"]
                let key = identityProps.lazy.compactMap { name -> String? in
                    guard let value = element.props.last(where: { $0.0 == name })?.1 else { return nil }
                    switch value {
                    // ASCII encoding keeps canonical Unicode variants and
                    // isolated UTF-16 units distinct in Swift String IDs.
                    case .string(let key) where !key.isEmpty:
                        return "u:" + key.codeUnits.map { String($0, radix: 16) }.joined(separator: ".")
                    case .number(let key) where key.isFinite: return "n:" + jsNumberString(key)
                    default: return nil
                    }
                }.first
                if let key { base = "key:\(element.typeName):\(key)" }
                else if let statement = element.statementId { base = "statement:\(statement)" }
                else { base = "anonymous:\(element.typeName):\(position)" }
            } else { base = "scalar:\(position)" }
            let occurrence = occurrences[base, default: 0]
            occurrences[base] = occurrence + 1
            return OpenUIRenderChild(id: base + ":" + String(occurrence), value: value)
        }
    }
}
