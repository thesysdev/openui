/// A dynamically typed value flowing through the parser and runtime.
///
/// lang-core passes `unknown` values around and relies on JavaScript semantics
/// for them, so this enum keeps the distinctions those semantics depend on:
/// `undefined` versus `null`, and the parser/runtime markers (element nodes,
/// preserved AST expressions, action plans, reactive assignments) that live
/// inside props next to plain data.
public indirect enum OpenUIValue: Sendable, Equatable {
  case undefined
  case null
  case bool(Bool)
  case number(Double)
  case string(String)
  case array([OpenUIValue])
  case object(OpenUIObject)
  case element(ElementNode)
  case ast(ASTNode)
  case actionPlan(ActionPlan)
  case actionStep(ActionStep)
  case reactiveAssign(ReactiveAssign)

  /// `null` or `undefined` (JavaScript's `value == null`).
  public var isNullish: Bool {
    switch self {
    case .undefined, .null: return true
    default: return false
    }
  }

  public var stringValue: String? {
    if case .string(let value) = self { return value }
    return nil
  }

  public var numberValue: Double? {
    if case .number(let value) = self { return value }
    return nil
  }

  public var boolValue: Bool? {
    if case .bool(let value) = self { return value }
    return nil
  }

  public var arrayValue: [OpenUIValue]? {
    if case .array(let value) = self { return value }
    return nil
  }

  public var objectValue: OpenUIObject? {
    if case .object(let value) = self { return value }
    return nil
  }

  public var elementValue: ElementNode? {
    if case .element(let value) = self { return value }
    return nil
  }

  /// Member lookup for plain objects; `undefined` for anything else.
  public subscript(key: String) -> OpenUIValue {
    if case .object(let object) = self { return object[key] ?? .undefined }
    return .undefined
  }
}

extension OpenUIValue: ExpressibleByStringLiteral, ExpressibleByBooleanLiteral,
  ExpressibleByFloatLiteral, ExpressibleByIntegerLiteral, ExpressibleByNilLiteral,
  ExpressibleByArrayLiteral, ExpressibleByDictionaryLiteral
{
  public init(stringLiteral value: String) { self = .string(value) }
  public init(booleanLiteral value: Bool) { self = .bool(value) }
  public init(floatLiteral value: Double) { self = .number(value) }
  public init(integerLiteral value: Int) { self = .number(Double(value)) }
  public init(nilLiteral: ()) { self = .null }
  public init(arrayLiteral elements: OpenUIValue...) { self = .array(elements) }
  public init(dictionaryLiteral elements: (String, OpenUIValue)...) {
    var object = OpenUIObject()
    for (key, value) in elements { object[key] = value }
    self = .object(object)
  }
}

/// An object with JavaScript property ordering.
///
/// JavaScript enumerates integer-like keys first in ascending order, then the
/// remaining keys in insertion order. Prop order drives positional argument
/// mapping and error order, so the port keeps the same rule instead of using an
/// unordered dictionary.
public struct OpenUIObject: Sendable, Equatable, Sequence {
  private var insertionOrder: [String] = []
  private var storage: [String: OpenUIValue] = [:]

  public init() {}

  public init(_ entries: [(String, OpenUIValue)]) {
    for (key, value) in entries { self[key] = value }
  }

  public var count: Int { storage.count }
  public var isEmpty: Bool { storage.isEmpty }

  /// Keys in JavaScript enumeration order.
  public var keys: [String] {
    let indexKeys = insertionOrder.compactMap { key in arrayIndex(key).map { (key, $0) } }
    guard !indexKeys.isEmpty else { return insertionOrder }
    let sortedIndexKeys = indexKeys.sorted { $0.1 < $1.1 }.map(\.0)
    return sortedIndexKeys + insertionOrder.filter { arrayIndex($0) == nil }
  }

  public var values: [OpenUIValue] { keys.map { storage[$0]! } }

  public var entries: [(key: String, value: OpenUIValue)] { keys.map { ($0, storage[$0]!) } }

  public func contains(_ key: String) -> Bool { storage[key] != nil }

  /// Assigning `nil` deletes the key (JavaScript `delete`).
  public subscript(key: String) -> OpenUIValue? {
    get { storage[key] }
    set {
      if let newValue {
        if storage.updateValue(newValue, forKey: key) == nil { insertionOrder.append(key) }
      } else if storage.removeValue(forKey: key) != nil {
        insertionOrder.removeAll { $0 == key }
      }
    }
  }

  public func makeIterator() -> IndexingIterator<[(key: String, value: OpenUIValue)]> {
    entries.makeIterator()
  }

  public static func == (lhs: OpenUIObject, rhs: OpenUIObject) -> Bool {
    lhs.keys == rhs.keys && lhs.storage == rhs.storage
  }
}

/// A canonical array index (`"0"` … `"4294967294"`), which JavaScript orders first.
private func arrayIndex(_ key: String) -> UInt32? {
  guard let value = UInt32(key), value != UInt32.max, String(value) == key else { return nil }
  return value
}

extension OpenUIObject: ExpressibleByDictionaryLiteral {
  public init(dictionaryLiteral elements: (String, OpenUIValue)...) {
    self.init(elements)
  }
}
