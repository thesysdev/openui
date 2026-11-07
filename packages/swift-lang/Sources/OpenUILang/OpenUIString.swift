import Foundation

/// ECMAScript strings are sequences of UTF-16 code units, including unpaired
/// surrogates. Swift String conversion is explicit and only for host display.
public struct OpenUIString: Sendable, Hashable, ExpressibleByStringInterpolation, CustomStringConvertible {
    public let codeUnits: [UInt16]
    public init(_ value: String) { codeUnits = Array(value.utf16) }
    public init(codeUnits: [UInt16]) { self.codeUnits = codeUnits }
    public init(stringLiteral value: String) { self.init(value) }
    public var utf16: [UInt16] { codeUnits }
    public var isEmpty: Bool { codeUnits.isEmpty }
    public var count: Int { codeUnits.count }
    public var description: String { displayString }
    public var displayString: String { String(decoding: codeUnits, as: UTF16.self) }
    public var wellFormedString: String? {
        var index = 0
        while index < codeUnits.count {
            let unit = codeUnits[index]
            if (0xD800...0xDBFF).contains(unit) {
                guard index + 1 < codeUnits.count, (0xDC00...0xDFFF).contains(codeUnits[index + 1]) else { return nil }
                index += 2
            } else {
                if (0xDC00...0xDFFF).contains(unit) { return nil }
                index += 1
            }
        }
        return displayString
    }
    public static func + (lhs: Self, rhs: Self) -> Self { Self(codeUnits: lhs.codeUnits + rhs.codeUnits) }
    public func contains(_ needle: Self) -> Bool {
        if needle.isEmpty { return true }
        guard needle.count <= count else { return false }
        return (0...(count - needle.count)).contains { codeUnits[$0..<($0 + needle.count)].elementsEqual(needle.codeUnits) }
    }
    public func hasPrefix(_ prefix: Self) -> Bool { codeUnits.starts(with: prefix.codeUnits) }
    public func hasSuffix(_ suffix: Self) -> Bool { codeUnits.suffix(suffix.count).elementsEqual(suffix.codeUnits) }
}

extension Value { @_disfavoredOverload public static func string<S: StringProtocol>(_ text: S) -> Value { .string(OpenUIString(String(text))) } }
extension ASTNode { @_disfavoredOverload public static func str<S: StringProtocol>(_ text: S) -> ASTNode { .str(OpenUIString(String(text))) } }
extension Token { @_disfavoredOverload public static func str<S: StringProtocol>(_ text: S) -> Token { .str(OpenUIString(String(text))) } }
extension JSONValue { @_disfavoredOverload public static func string<S: StringProtocol>(_ text: S) -> JSONValue { .string(OpenUIString(String(text))) } }
extension ValidationRuleParameter { @_disfavoredOverload public static func string<S: StringProtocol>(_ text: S) -> Self { .string(OpenUIString(String(text))) } }

func jsStringEqual(_ a: OpenUIString, _ b: OpenUIString) -> Bool { a == b }
func jsStringEqual(_ a: OpenUIString, _ b: String) -> Bool { a == OpenUIString(b) }
func jsStringEqual(_ a: String, _ b: OpenUIString) -> Bool { OpenUIString(a) == b }

/// Strict JSON escape decoding without normalizing or repairing UTF-16 units.
func decodeJSONString(_ literal: String) throws -> OpenUIString { try decodeJSONString(OpenUIString(literal)) }
func decodeJSONString(_ literal: OpenUIString) throws -> OpenUIString {
    let input = literal.codeUnits
    guard input.count >= 2, input.first == 34, input.last == 34 else { throw JSONParseError.invalidToken("string") }
    var result: [UInt16] = [], index = 1
    func hex(_ unit: UInt16) -> UInt16? {
        switch unit { case 48...57: return unit - 48; case 65...70: return unit - 55; case 97...102: return unit - 87; default: return nil }
    }
    while index < input.count - 1 {
        let unit = input[index]; index += 1
        guard unit >= 32, unit != 34 else { throw JSONParseError.invalidToken("string character") }
        if unit != 92 { result.append(unit); continue }
        guard index < input.count - 1 else { throw JSONParseError.unexpectedEnd }
        let escaped = input[index]; index += 1
        switch escaped {
        case 34, 47, 92: result.append(escaped)
        case 98: result.append(8)
        case 102: result.append(12)
        case 110: result.append(10)
        case 114: result.append(13)
        case 116: result.append(9)
        case 117:
            guard index + 4 <= input.count - 1 else { throw JSONParseError.unexpectedEnd }
            var value: UInt16 = 0
            for _ in 0..<4 {
                guard let digit = hex(input[index]) else { throw JSONParseError.invalidToken("unicode escape") }
                value = value * 16 + digit; index += 1
            }
            result.append(value)
        default: throw JSONParseError.invalidToken("escape")
        }
    }
    return OpenUIString(codeUnits: result)
}

/// JSON.stringify-compatible lossless representation. Valid pairs can remain
/// literal Unicode; isolated surrogates must use a \uXXXX escape.
public func jsonStringLiteral(_ text: OpenUIString) -> String {
    var output = "\"", index = 0
    while index < text.codeUnits.count {
        let unit = text.codeUnits[index]; index += 1
        switch unit {
        case 34: output += "\\\""
        case 92: output += "\\\\"
        case 8: output += "\\b"
        case 12: output += "\\f"
        case 10: output += "\\n"
        case 13: output += "\\r"
        case 9: output += "\\t"
        case 0..<32: output += String(format: "\\u%04x", unit)
        case 0xD800...0xDBFF:
            if index < text.codeUnits.count, (0xDC00...0xDFFF).contains(text.codeUnits[index]) {
                output += String(decoding: [unit, text.codeUnits[index]], as: UTF16.self); index += 1
            } else { output += String(format: "\\u%04x", unit) }
        case 0xDC00...0xDFFF: output += String(format: "\\u%04x", unit)
        default: output += String(UnicodeScalar(unit)!)
        }
    }
    return output + "\""
}

public func == (lhs: OpenUIString, rhs: String) -> Bool { lhs == OpenUIString(rhs) }
public func == (lhs: String, rhs: OpenUIString) -> Bool { OpenUIString(lhs) == rhs }
public func != (lhs: OpenUIString, rhs: String) -> Bool { !(lhs == rhs) }
public func != (lhs: String, rhs: OpenUIString) -> Bool { !(lhs == rhs) }

extension ASTNode {
    @_disfavoredOverload public static func obj(_ fields: [(String, ASTNode)]) -> Self { .obj(fields.map { (OpenUIString($0.0), $0.1) }) }
    @_disfavoredOverload public static func member<S: StringProtocol>(_ value: ASTNode, _ key: S) -> Self { .member(value, OpenUIString(String(key))) }
}
extension Materialized {
    @_disfavoredOverload public static func object(_ fields: [(String, Materialized)]) -> Self { .object(fields.map { (OpenUIString($0.0), $0.1) }) }
}

extension Sequence where Element == OpenUIString {
    func joined(separator: String) -> OpenUIString {
        var units: [UInt16] = [], first = true
        for text in self { if !first { units.append(contentsOf: separator.utf16) }; first = false; units.append(contentsOf: text.codeUnits) }
        return OpenUIString(codeUnits: units)
    }
}

extension OpenUIString {
    public func uppercased() -> OpenUIString { mappedWellFormed { $0.uppercased() } }
    public func lowercased() -> OpenUIString { mappedWellFormed { $0.lowercased() } }
    private func mappedWellFormed(_ transform: (String) -> String) -> OpenUIString {
        var output: [UInt16] = [], span: [UInt16] = [], index = 0
        func flush() { output.append(contentsOf: transform(String(decoding: span, as: UTF16.self)).utf16); span.removeAll() }
        while index < codeUnits.count {
            let unit = codeUnits[index]
            if (0xD800...0xDBFF).contains(unit), index + 1 < codeUnits.count, (0xDC00...0xDFFF).contains(codeUnits[index + 1]) {
                span.append(contentsOf: [unit, codeUnits[index + 1]]); index += 2
            } else if (0xD800...0xDFFF).contains(unit) { flush(); output.append(unit); index += 1 }
            else { span.append(unit); index += 1 }
        }
        flush(); return OpenUIString(codeUnits: output)
    }
}

public enum StringBridgeError: Error { case unpairedSurrogate }
extension OpenUIString: Codable {
    public func requireSwiftString() throws -> String {
        guard let text = wellFormedString else { throw StringBridgeError.unpairedSurrogate }
        return text
    }
    public init(from decoder: Decoder) throws { self.init(try decoder.singleValueContainer().decode(String.self)) }
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(requireSwiftString())
    }
}
extension JSONValue {
    public var rawObjectFields: [(OpenUIString, JSONValue)]? {
        guard case .object(let fields) = self else { return nil }; return fields.map { ($0.key, $0.value) }
    }
    public func jsonString() -> String { jsonStringify(self) }
}

public enum JSONValueBridgeError: Error { case nonDataValue, normalizationCollision }
extension Value {
    /// Renderer inspection of runtime values, including evaluated elements.
    /// Keep JSON.stringify semantics in the shared ECMAScript realm; the public
    /// data-only jsonValue/jsonString APIs retain their existing restrictions.
    @_spi(RuntimeInspection) public func jsonStringifyUTF16Length() -> Int? {
        let core = SharedCore.shared
        return core.sync {
            let result = core.context.objectForKeyedSubscript("JSON")
                .invokeMethod("stringify", withArguments: [core.encode(self)])
            defer { core.context.exception = nil }
            guard core.context.exception == nil, let result, result.isString else { return nil }
            return core.string(result).codeUnits.count
        }
    }

    /// Lossless transport for the data values accepted by tools and state.
    /// Runtime UI/action objects require the host's explicit serialization policy.
    public func jsonValue() throws -> JSONValue {
        switch self {
        case .string(let text): return .string(text)
        case .number(let number): return number.isFinite ? .number(number) : .null
        case .boolean(let value): return .boolean(value)
        case .null, .undefined: return .null
        case .array(let values): return .array(try values.map { try $0.jsonValue() })
        case .object(let fields):
            return .object(try fields.compactMap { field in
                if case .undefined = field.value { return nil }
                return JSONField(key: field.key, value: try field.value.jsonValue())
            })
        default: throw JSONValueBridgeError.nonDataValue
        }
    }
    public func jsonString() throws -> String { try jsonValue().jsonString() }
}
extension OpenUIObject {
    public func jsonString() throws -> String { try Value.object(self).jsonString() }
}

extension OpenUIString: Comparable {
    public static func < (lhs: Self, rhs: Self) -> Bool { lhs.codeUnits.lexicographicallyPrecedes(rhs.codeUnits) }
}

extension Dictionary where Key == OpenUIString {
    @_disfavoredOverload public subscript<S: StringProtocol>(nativeKey: S) -> Value? {
        get { self[OpenUIString(String(nativeKey))] }
        set { self[OpenUIString(String(nativeKey))] = newValue }
    }
}

extension OpenUIString {
    public struct StringInterpolation: StringInterpolationProtocol {
        var units: [UInt16] = []
        public init(literalCapacity: Int, interpolationCount: Int) { units.reserveCapacity(literalCapacity) }
        public mutating func appendLiteral(_ text: String) { units.append(contentsOf: text.utf16) }
        public mutating func appendInterpolation(_ text: OpenUIString) { units.append(contentsOf: text.codeUnits) }
        public mutating func appendInterpolation(_ value: Value) { units.append(contentsOf: toString(value).codeUnits) }
        public mutating func appendInterpolation<T>(_ value: T) { units.append(contentsOf: String(describing: value).utf16) }
    }
    public init(stringInterpolation: StringInterpolation) { codeUnits = stringInterpolation.units }
}
