import Foundation
import Testing

@testable import OpenUILang

/// Loads the conformance fixtures generated from @openuidev/lang-core
/// (see Scripts/generate-fixtures.mjs).
enum Fixtures {
  static func load(_ name: String) -> OpenUIValue {
    let url = Bundle.module.url(forResource: name, withExtension: "json", subdirectory: "Fixtures")!
    let text = try! String(contentsOf: url, encoding: .utf8)
    return try! JSON.parse(text)
  }

  static let schemas = load("schemas")

  static func paramMap(_ schemaName: String) -> ParamMap {
    compileSchema(schemas[schemaName]["schema"])
  }

  static func rootName(_ schemaName: String) -> String? {
    schemas[schemaName]["root"].stringValue
  }
}

/// A named fixture case, printable in test output.
struct FixtureCase: CustomTestStringConvertible, Sendable {
  let name: String
  let value: OpenUIValue
  var testDescription: String { name }

  static func all(_ file: String) -> [FixtureCase] {
    (Fixtures.load(file).arrayValue ?? []).map {
      FixtureCase(name: $0["name"].stringValue ?? "?", value: $0)
    }
  }
}

/// Round-trips through JSON text so both sides get identical treatment of
/// `undefined`, NaN and -0, exactly as `JSON.stringify` would.
func normalized(_ value: OpenUIValue) -> OpenUIValue {
  try! JSON.parse(JSON.stringify(value))
}

/// The path of the first difference between two JSON values, or nil if they
/// are equivalent. Object key order is ignored; array order is not.
func firstDifference(_ actual: OpenUIValue, _ expected: OpenUIValue, path: String = "$") -> String?
{
  switch (actual, expected) {
  case (.object(let a), .object(let e)):
    for key in Set(a.keys).union(e.keys).sorted() {
      guard let av = a[key] else { return "\(path).\(key): missing in Swift result" }
      guard let ev = e[key] else { return "\(path).\(key): unexpected in Swift result" }
      if let diff = firstDifference(av, ev, path: "\(path).\(key)") { return diff }
    }
    return nil
  case (.array(let a), .array(let e)):
    if a.count != e.count { return "\(path): \(a.count) items, expected \(e.count)" }
    for index in a.indices {
      if let diff = firstDifference(a[index], e[index], path: "\(path)[\(index)]") { return diff }
    }
    return nil
  default:
    return actual == expected
      ? nil : "\(path): got \(JSON.stringify(actual)), expected \(JSON.stringify(expected))"
  }
}
