import Foundation

/// A validation rule such as `required`, `min:8` or `pattern:^[a-z]`.
public struct ParsedRule: Sendable, Equatable {
  public var type: String
  public var arg: OpenUIValue?

  public init(type: String, arg: OpenUIValue? = nil) {
    self.type = type
    self.arg = arg
  }
}

private let numericRules: Set<String> = ["min", "max", "minLength", "maxLength"]

/// `"min:8"` → `{ type: "min", arg: 8 }`.
public func parseRule(_ rule: String) -> ParsedRule {
  guard let colon = rule.firstIndex(of: ":") else { return ParsedRule(type: rule) }
  let type = String(rule[..<colon])
  let rawArg = String(rule[rule.index(after: colon)...])
  let number = jsStringToNumber(rawArg)
  return ParsedRule(
    type: type,
    arg: numericRules.contains(type) && !number.isNaN ? .number(number) : .string(rawArg))
}

/// Parses string rules, ignoring non-string items.
public func parseRules(_ rules: OpenUIValue) -> [ParsedRule] {
  (rules.arrayValue ?? []).compactMap(\.stringValue).map(parseRule)
}

/// Parses a structured rules object: `{ required: true, minLength: 5 }`.
/// `false` and `null` entries are skipped.
public func parseStructuredRules(_ rules: OpenUIValue) -> [ParsedRule] {
  guard case .object(let object) = rules else { return [] }
  return object.entries.compactMap { key, value in
    switch value {
    case .bool(false), .null, .undefined: return nil
    case .bool(true): return ParsedRule(type: key)
    default: return ParsedRule(type: key, arg: value)
    }
  }
}

public typealias ValidatorFn = @Sendable (OpenUIValue, OpenUIValue?) -> String?

private func isEmpty(_ value: OpenUIValue) -> Bool {
  switch value {
  case .undefined, .null, .string(""): return true
  case .array(let items): return items.isEmpty
  case .object(let object):
    // Form state stores { value, componentType }; check the actual value.
    if let inner = object["value"] { return isEmpty(inner) }
    // An empty object, e.g. a checkbox group with nothing selected.
    return object.isEmpty
  default: return false
  }
}

/// JavaScript `parseFloat`: the longest prefix that is a decimal literal, or NaN.
func jsParseFloat(_ string: String) -> Double {
  let units = Array(jsTrim(string).utf8)
  var i = 0
  func isDigit(_ index: Int) -> Bool {
    index < units.count && units[index] >= UInt8(ascii: "0") && units[index] <= UInt8(ascii: "9")
  }
  var sign = ""
  if i < units.count, units[i] == UInt8(ascii: "+") || units[i] == UInt8(ascii: "-") {
    sign = units[i] == UInt8(ascii: "-") ? "-" : ""
    i += 1
  }
  if Array(units[i...]).starts(with: Array("Infinity".utf8)) {
    return sign == "-" ? -.infinity : .infinity
  }
  var integer = ""
  while isDigit(i) {
    integer.append(Character(UnicodeScalar(units[i])))
    i += 1
  }
  var fraction = ""
  if i < units.count, units[i] == UInt8(ascii: ".") {
    var j = i + 1
    while isDigit(j) {
      fraction.append(Character(UnicodeScalar(units[j])))
      j += 1
    }
    if !integer.isEmpty || !fraction.isEmpty { i = j }
  }
  guard !integer.isEmpty || !fraction.isEmpty else { return .nan }
  var exponent = ""
  if i < units.count, units[i] == UInt8(ascii: "e") || units[i] == UInt8(ascii: "E") {
    var j = i + 1
    var expSign = ""
    if j < units.count, units[j] == UInt8(ascii: "+") || units[j] == UInt8(ascii: "-") {
      expSign = units[j] == UInt8(ascii: "-") ? "-" : ""
      j += 1
    }
    var digits = ""
    while isDigit(j) {
      digits.append(Character(UnicodeScalar(units[j])))
      j += 1
    }
    if !digits.isEmpty { exponent = "e" + expSign + digits }
  }
  let literal =
    sign + (integer.isEmpty ? "0" : integer) + (fraction.isEmpty ? "" : "." + fraction) + exponent
  return Double(literal) ?? .nan
}

private func numberArg(_ arg: OpenUIValue?) -> Double {
  switch arg {
  case .number(let number)?: return number
  case .string(let string)?: return jsStringToNumber(string)
  default: return .nan
  }
}

/// The built-in validators, keyed by rule type. Messages match lang-core.
public let builtInValidators: [String: ValidatorFn] = [
  "required": { value, _ in
    if isEmpty(value) { return "This field is required" }
    if case .object(let object) = value {
      let values = object.values
      let allBooleans = values.allSatisfy { $0.boolValue != nil }
      if !values.isEmpty, allBooleans, !values.contains(.bool(true)) {
        return "At least one option is required"
      }
    }
    return nil
  },
  "email": { value, _ in
    if isEmpty(value) { return nil }
    guard case .string(let string) = value else { return "Please enter a valid email" }
    return string.range(of: #"^[^\s@]+@[^\s@]+\.[^\s@]+$"#, options: .regularExpression) != nil
      ? nil : "Please enter a valid email"
  },
  "url": { value, _ in
    if isEmpty(value) { return nil }
    guard case .string(let string) = value else { return "Please enter a valid URL" }
    // `new URL(value)` requires an absolute URL with a scheme.
    let hasScheme =
      string.range(of: #"^[A-Za-z][A-Za-z0-9+.\-]*:"#, options: .regularExpression) != nil
    return hasScheme && URL(string: string) != nil ? nil : "Please enter a valid URL"
  },
  "numeric": { value, _ in
    if isEmpty(value) { return nil }
    if case .number(let number) = value, !number.isNaN { return nil }
    if case .string(let string) = value, !jsParseFloat(string).isNaN, !jsTrim(string).isEmpty {
      return nil
    }
    return "Must be a number"
  },
  "min": { value, arg in
    if isEmpty(value) { return nil }
    let number = value.numberValue ?? jsParseFloat(value.jsString)
    if number.isNaN { return nil }
    let min = numberArg(arg)
    return number >= min ? nil : "Must be at least \(jsNumberToString(min))"
  },
  "max": { value, arg in
    if isEmpty(value) { return nil }
    let number = value.numberValue ?? jsParseFloat(value.jsString)
    if number.isNaN { return nil }
    let max = numberArg(arg)
    return number <= max ? nil : "Must be no more than \(jsNumberToString(max))"
  },
  "minLength": { value, arg in
    if isEmpty(value) { return nil }
    guard case .string(let string) = value else { return nil }
    let min = numberArg(arg)
    return Double(string.utf16.count) >= min
      ? nil : "Must be at least \(jsNumberToString(min)) characters"
  },
  "maxLength": { value, arg in
    if isEmpty(value) { return nil }
    guard case .string(let string) = value else { return nil }
    let max = numberArg(arg)
    return Double(string.utf16.count) <= max
      ? nil : "Must be no more than \(jsNumberToString(max)) characters"
  },
  "pattern": { value, arg in
    if isEmpty(value) { return nil }
    guard case .string(let string) = value, case .string(let pattern)? = arg,
      let regex = try? NSRegularExpression(pattern: pattern)
    else { return nil }
    let range = NSRange(string.startIndex..., in: string)
    return regex.firstMatch(in: string, range: range) != nil ? nil : "Invalid format"
  },
]

/// Runs rules in order and returns the first error. Custom validators take
/// precedence over built-in ones; unknown rule types are skipped.
public func validate(
  _ value: OpenUIValue, _ rules: [ParsedRule], customValidators: [String: ValidatorFn] = [:]
) -> String? {
  for rule in rules {
    guard let validator = customValidators[rule.type] ?? builtInValidators[rule.type] else {
      continue
    }
    if let error = validator(value, rule.arg) { return error }
  }
  return nil
}
