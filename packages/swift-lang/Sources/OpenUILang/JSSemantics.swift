// JavaScript value semantics that lang-core relies on implicitly. Each helper
// follows the ECMAScript algorithm it is named after, so expressions evaluate
// the same in Swift as in the TypeScript runtime.

extension OpenUIValue {
  /// ECMAScript ToBoolean.
  public var isTruthy: Bool {
    switch self {
    case .undefined, .null: return false
    case .bool(let value): return value
    case .number(let value): return !(value == 0 || value.isNaN)
    case .string(let value): return !value.isEmpty
    default: return true
    }
  }

  /// JavaScript `typeof`.
  var jsTypeof: String {
    switch self {
    case .undefined: return "undefined"
    case .bool: return "boolean"
    case .number: return "number"
    case .string: return "string"
    default: return "object"
    }
  }

  /// `Array.isArray(value) ? "array" : typeof value`, used in validation messages.
  var jsType: String {
    if case .array = self { return "array" }
    return jsTypeof
  }

  /// JavaScript `String(value)`.
  public var jsString: String {
    switch self {
    case .undefined: return "undefined"
    case .null: return "null"
    case .bool(let value): return value ? "true" : "false"
    case .number(let value): return jsNumberToString(value)
    case .string(let value): return value
    case .array(let elements):
      return elements.map { $0.isNullish ? "" : $0.jsString }.joined(separator: ",")
    default: return "[object Object]"
    }
  }

  private var isPrimitiveForEquality: Bool {
    switch self {
    case .undefined, .null, .bool, .number, .string: return true
    default: return false
    }
  }

  /// JavaScript `==` (IsLooselyEqual).
  ///
  /// Composite values (arrays, objects, elements) compare by identity in
  /// JavaScript. Values here have no identity, so two composites are never
  /// loosely equal, which matches every case where they were built separately.
  public func looselyEquals(_ other: OpenUIValue) -> Bool {
    switch (self, other) {
    case (.undefined, .undefined), (.null, .null), (.undefined, .null), (.null, .undefined):
      return true
    case (.undefined, _), (.null, _), (_, .undefined), (_, .null):
      return false
    case (.number(let lhs), .number(let rhs)): return lhs == rhs
    case (.string(let lhs), .string(let rhs)): return lhs == rhs
    case (.bool(let lhs), .bool(let rhs)): return lhs == rhs
    case (.number(let lhs), .string(let rhs)): return lhs == jsStringToNumber(rhs)
    case (.string(let lhs), .number(let rhs)): return jsStringToNumber(lhs) == rhs
    case (.bool(let lhs), _): return OpenUIValue.number(lhs ? 1 : 0).looselyEquals(other)
    case (_, .bool(let rhs)): return looselyEquals(.number(rhs ? 1 : 0))
    default:
      if isPrimitiveForEquality, !other.isPrimitiveForEquality {
        return looselyEquals(.string(other.jsString))
      }
      if !isPrimitiveForEquality, other.isPrimitiveForEquality {
        return OpenUIValue.string(jsString).looselyEquals(other)
      }
      return false
    }
  }

  /// JavaScript `===` for the values the store compares (`Object.is` for numbers
  /// aside from NaN, structural for composites since they have no identity here).
  func isSameValue(_ other: OpenUIValue) -> Bool {
    switch (self, other) {
    case (.number(let lhs), .number(let rhs)):
      if lhs.isNaN && rhs.isNaN { return true }
      return lhs == rhs && lhs.sign == rhs.sign
    default:
      return self == other
    }
  }
}

/// lang-core's lenient `toNumber`: numbers pass through, numeric strings parse
/// (anything else becomes 0), booleans become 1/0, everything else is 0.
public func toNumber(_ value: OpenUIValue) -> Double {
  switch value {
  case .number(let number): return number
  case .string(let string):
    let number = jsStringToNumber(string)
    return number.isNaN ? 0 : number
  case .bool(let bool): return bool ? 1 : 0
  default: return 0
  }
}

// MARK: - Number → String (ECMAScript Number::toString)

/// Formats a number exactly like JavaScript's `String(number)`.
public func jsNumberToString(_ value: Double) -> String {
  if value.isNaN { return "NaN" }
  if value == 0 { return "0" }
  if value < 0 { return "-" + jsNumberToString(-value) }
  if value.isInfinite { return "Infinity" }

  let (digits, n) = shortestDigits(value)
  let k = digits.count
  if k <= n && n <= 21 {
    return digits + String(repeating: "0", count: n - k)
  }
  if 0 < n && n <= 21 {
    let index = digits.index(digits.startIndex, offsetBy: n)
    return digits[..<index] + "." + digits[index...]
  }
  if -6 < n && n <= 0 {
    return "0." + String(repeating: "0", count: -n) + digits
  }
  let exponent = n - 1
  let sign = exponent < 0 ? "-" : "+"
  let first = digits.prefix(1)
  let rest = digits.dropFirst()
  return first + (rest.isEmpty ? "" : "." + rest) + "e" + sign + String(abs(exponent))
}

/// The shortest round-trip decimal digits of a positive finite double and the
/// position `n` of the decimal point, such that value = 0.digits × 10^n.
private func shortestDigits(_ value: Double) -> (String, Int) {
  // Swift's description is the shortest representation that round-trips.
  let description = "\(value)"
  var mantissa = Substring(description)
  var exponent = 0
  if let e = description.firstIndex(where: { $0 == "e" || $0 == "E" }) {
    mantissa = description[..<e]
    exponent = Int(description[description.index(after: e)...]) ?? 0
  }
  let parts = mantissa.split(separator: ".", omittingEmptySubsequences: false)
  let integerPart = parts[0]
  let fractionPart = parts.count > 1 ? parts[1] : ""
  var digits = Array(integerPart + fractionPart)
  var point = integerPart.count + exponent
  while digits.first == "0" {
    digits.removeFirst()
    point -= 1
  }
  while digits.last == "0" { digits.removeLast() }
  return (String(digits), point)
}

// MARK: - String → Number (ECMAScript StringToNumber)

let jsWhitespace: Set<Unicode.Scalar> = [
  "\u{0009}", "\u{000A}", "\u{000B}", "\u{000C}", "\u{000D}", "\u{0020}", "\u{00A0}", "\u{1680}",
  "\u{2000}", "\u{2001}", "\u{2002}", "\u{2003}", "\u{2004}", "\u{2005}", "\u{2006}", "\u{2007}",
  "\u{2008}", "\u{2009}", "\u{200A}", "\u{2028}", "\u{2029}", "\u{202F}", "\u{205F}", "\u{3000}",
  "\u{FEFF}",
]

/// JavaScript `String.prototype.trim()`.
func jsTrim(_ string: String) -> String {
  let scalars = Array(string.unicodeScalars)
  var start = 0
  var end = scalars.count
  while start < end, jsWhitespace.contains(scalars[start]) { start += 1 }
  while end > start, jsWhitespace.contains(scalars[end - 1]) { end -= 1 }
  var view = String.UnicodeScalarView()
  view.append(contentsOf: scalars[start..<end])
  return String(view)
}

/// JavaScript `trimEnd()`.
func jsTrimEnd(_ string: String) -> String {
  var scalars = Array(string.unicodeScalars)
  while let last = scalars.last, jsWhitespace.contains(last) { scalars.removeLast() }
  var view = String.UnicodeScalarView()
  view.append(contentsOf: scalars)
  return String(view)
}

/// JavaScript `Number(string)`.
public func jsStringToNumber(_ string: String) -> Double {
  let text = jsTrim(string)
  if text.isEmpty { return 0 }
  switch text {
  case "Infinity", "+Infinity": return .infinity
  case "-Infinity": return -.infinity
  default: break
  }
  let chars = Array(text.utf8)
  if chars.count > 2, chars[0] == UInt8(ascii: "0") {
    let radix: Int? =
      switch chars[1] {
      case UInt8(ascii: "x"), UInt8(ascii: "X"): 16
      case UInt8(ascii: "o"), UInt8(ascii: "O"): 8
      case UInt8(ascii: "b"), UInt8(ascii: "B"): 2
      default: nil
      }
    if let radix {
      var result = 0.0
      for char in chars[2...] {
        guard let digit = Int(String(UnicodeScalar(char)), radix: radix) else { return .nan }
        result = result * Double(radix) + Double(digit)
      }
      return result
    }
  }
  guard isStrDecimalLiteral(chars) else { return .nan }
  return Double(text) ?? .nan
}

/// `[+-] (digits [. digits?] | . digits) [(e|E) [+-] digits]`
private func isStrDecimalLiteral(_ chars: [UInt8]) -> Bool {
  var i = 0
  func isDigit(_ index: Int) -> Bool {
    index < chars.count && chars[index] >= UInt8(ascii: "0") && chars[index] <= UInt8(ascii: "9")
  }
  if i < chars.count, chars[i] == UInt8(ascii: "+") || chars[i] == UInt8(ascii: "-") { i += 1 }
  var sawDigits = false
  while isDigit(i) {
    i += 1
    sawDigits = true
  }
  if i < chars.count, chars[i] == UInt8(ascii: ".") {
    i += 1
    while isDigit(i) {
      i += 1
      sawDigits = true
    }
  }
  guard sawDigits else { return false }
  if i < chars.count, chars[i] == UInt8(ascii: "e") || chars[i] == UInt8(ascii: "E") {
    i += 1
    if i < chars.count, chars[i] == UInt8(ascii: "+") || chars[i] == UInt8(ascii: "-") { i += 1 }
    guard isDigit(i) else { return false }
    while isDigit(i) { i += 1 }
  }
  return i == chars.count
}

extension UInt16 {
  /// A UTF-16 code unit for an ASCII scalar; JavaScript strings are UTF-16.
  init(ascii scalar: Unicode.Scalar) {
    self = UInt16(scalar.value)
  }
}
