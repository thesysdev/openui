import Foundation

/// A data builtin callable as `@Name(...)`: its prompt documentation and implementation.
public struct BuiltinDef: Sendable {
  public var name: String
  /// Signature for prompt docs: `Count(array) → number`.
  public var signature: String
  public var description: String
  public var fn: @Sendable ([OpenUIValue]) -> OpenUIValue
}

private func arg(_ args: [OpenUIValue], _ index: Int) -> OpenUIValue {
  index < args.count ? args[index] : .undefined
}

/// `String(x ?? "")`.
private func stringOrEmpty(_ value: OpenUIValue) -> String {
  value.isNullish ? "" : value.jsString
}

/// JavaScript property access (`obj[key]`) on plain values.
func jsProperty(_ value: OpenUIValue, _ key: String) -> OpenUIValue {
  switch value {
  case .object(let object):
    return object[key] ?? .undefined
  case .array(let items):
    if key == "length" { return .number(Double(items.count)) }
    if let index = Int(key), String(index) == key, index >= 0, index < items.count {
      return items[index]
    }
    return .undefined
  case .string(let string):
    let units = Array(string.utf16)
    if key == "length" { return .number(Double(units.count)) }
    if let index = Int(key), String(index) == key, index >= 0, index < units.count {
      return .string(String(decoding: [units[index]], as: UTF16.self))
    }
    return .undefined
  case .element(let element):
    switch key {
    case "type": return "element"
    case "typeName": return .string(element.typeName)
    case "props": return .object(element.props)
    case "partial": return .bool(element.partial)
    case "statementId": return element.statementId.map { .string($0) } ?? .undefined
    default: return .undefined
    }
  default:
    return .undefined
  }
}

/// `String.prototype.includes`, which compares UTF-16 code units (Swift's
/// `contains` would compare grapheme clusters).
func jsIncludes(_ haystack: String, _ needle: String) -> Bool {
  let h = Array(haystack.utf16)
  let n = Array(needle.utf16)
  if n.isEmpty { return true }
  guard n.count <= h.count else { return false }
  for start in 0...(h.count - n.count) where h[start] == n[0] {
    if Array(h[start..<start + n.count]) == n { return true }
  }
  return false
}

/// Resolves a dot path on an object: `"state.name"` → `obj.state.name`.
private func resolveField(_ value: OpenUIValue, _ path: String) -> OpenUIValue {
  if path.isEmpty || value.isNullish { return .undefined }
  if !path.contains(".") { return jsProperty(value, path) }
  var current = value
  for part in path.split(separator: ".", omittingEmptySubsequences: false) {
    if current.isNullish { return .undefined }
    current = jsProperty(current, String(part))
  }
  return current
}

/// `Math.min` / `Math.max` semantics: NaN propagates, -0 < +0.
private func jsMin(_ a: Double, _ b: Double) -> Double {
  if a.isNaN || b.isNaN { return .nan }
  if a == 0 && b == 0 { return a.sign == .minus ? a : b }
  return a < b ? a : b
}

private func jsMax(_ a: Double, _ b: Double) -> Double {
  if a.isNaN || b.isNaN { return .nan }
  if a == 0 && b == 0 { return a.sign == .plus ? a : b }
  return a > b ? a : b
}

/// `Math.round`: halves round toward +∞.
func jsRound(_ value: Double) -> Double {
  if !value.isFinite { return value }
  let floored = value.rounded(.down)
  let result = value - floored >= 0.5 ? floored + 1 : floored
  return result == 0 && value < 0 ? -0.0 : result
}

/// `String.prototype.localeCompare` with the default locale.
private func jsLocaleCompare(_ a: String, _ b: String) -> Double {
  switch a.compare(b, options: [], range: nil, locale: Locale(identifier: "en")) {
  case .orderedAscending: return -1
  case .orderedDescending: return 1
  case .orderedSame: return 0
  }
}

/// `Array.prototype.sort` with a comparator: stable, `undefined` items last,
/// a NaN comparator result counts as equal.
private func jsSort(_ items: [OpenUIValue], _ compare: (OpenUIValue, OpenUIValue) -> Double)
  -> [OpenUIValue]
{
  let defined = items.enumerated().filter { $0.element != .undefined }
  let undefinedCount = items.count - defined.count
  let sorted = defined.sorted { lhs, rhs in
    let result = compare(lhs.element, rhs.element)
    if result < 0 { return true }
    if result > 0 { return false }
    return lhs.offset < rhs.offset
  }
  return sorted.map(\.element) + Array(repeating: .undefined, count: undefinedCount)
}

private func isNumericForSort(_ value: OpenUIValue) -> Bool {
  switch value {
  case .number: return true
  case .string(let string): return !string.isEmpty && !jsStringToNumber(string).isNaN
  default: return false
  }
}

/// Data builtins, keyed by name. Mirrors lang-core's `BUILTINS`.
public let builtins: [String: BuiltinDef] = {
  let defs: [BuiltinDef] = [
    BuiltinDef(
      name: "Count", signature: "Count(array) → number", description: "Returns array length"
    ) { args in
      if case .array(let items) = arg(args, 0) { return .number(Double(items.count)) }
      return .number(0)
    },
    BuiltinDef(
      name: "First", signature: "First(array) → element",
      description: "Returns first element of array"
    ) { args in
      guard case .array(let items) = arg(args, 0), let first = items.first, !first.isNullish
      else { return .null }
      return first
    },
    BuiltinDef(
      name: "Last", signature: "Last(array) → element", description: "Returns last element of array"
    ) { args in
      guard case .array(let items) = arg(args, 0), let last = items.last, !last.isNullish
      else { return .null }
      return last
    },
    BuiltinDef(
      name: "Sum", signature: "Sum(numbers[]) → number", description: "Sum of numeric array"
    ) { args in
      guard case .array(let items) = arg(args, 0) else { return .number(0) }
      return .number(items.reduce(0) { $0 + toNumber($1) })
    },
    BuiltinDef(
      name: "Avg", signature: "Avg(numbers[]) → number", description: "Average of numeric array"
    ) { args in
      guard case .array(let items) = arg(args, 0), !items.isEmpty else { return .number(0) }
      return .number(items.reduce(0) { $0 + toNumber($1) } / Double(items.count))
    },
    BuiltinDef(
      name: "Min", signature: "Min(numbers[]) → number", description: "Minimum value in array"
    ) { args in
      guard case .array(let items) = arg(args, 0), let first = items.first else {
        return .number(0)
      }
      return .number(items.reduce(toNumber(first)) { jsMin($0, toNumber($1)) })
    },
    BuiltinDef(
      name: "Max", signature: "Max(numbers[]) → number", description: "Maximum value in array"
    ) { args in
      guard case .array(let items) = arg(args, 0), let first = items.first else {
        return .number(0)
      }
      return .number(items.reduce(toNumber(first)) { jsMax($0, toNumber($1)) })
    },
    BuiltinDef(
      name: "Sort", signature: "Sort(array, field, direction?) → sorted array",
      description: "Sort array by field. Direction: \"asc\" (default) or \"desc\""
    ) { args in
      guard case .array(let items) = arg(args, 0) else { return arg(args, 0) }
      let field = stringOrEmpty(arg(args, 1))
      let descending = (arg(args, 2).isNullish ? "asc" : arg(args, 2).jsString) == "desc"
      return .array(
        jsSort(items) { a, b in
          let av = field.isEmpty ? a : resolveField(a, field)
          let bv = field.isEmpty ? b : resolveField(b, field)
          if isNumericForSort(av) && isNumericForSort(bv) {
            let diff = toNumber(av) - toNumber(bv)
            return descending ? -diff : diff
          }
          let cmp = jsLocaleCompare(stringOrEmpty(av), stringOrEmpty(bv))
          return descending ? -cmp : cmp
        })
    },
    BuiltinDef(
      name: "Filter",
      signature:
        "Filter(array, field, operator: \"==\" | \"!=\" | \">\" | \"<\" | \">=\" | \"<=\" | \"contains\", value) → filtered array",
      description: "Filter array by field value"
    ) { args in
      guard case .array(let items) = arg(args, 0) else { return .array([]) }
      let field = stringOrEmpty(arg(args, 1))
      let op = arg(args, 2).isNullish ? "==" : arg(args, 2).jsString
      let value = arg(args, 3)
      return .array(
        items.filter { item in
          let v = field.isEmpty ? item : resolveField(item, field)
          switch op {
          case "==": return v.looselyEquals(value)
          case "!=": return !v.looselyEquals(value)
          case ">": return toNumber(v) > toNumber(value)
          case "<": return toNumber(v) < toNumber(value)
          case ">=": return toNumber(v) >= toNumber(value)
          case "<=": return toNumber(v) <= toNumber(value)
          case "contains": return jsIncludes(stringOrEmpty(v), stringOrEmpty(value))
          default: return false
          }
        })
    },
    BuiltinDef(
      name: "Round", signature: "Round(number, decimals?) → number",
      description: "Round to N decimal places (default 0)"
    ) { args in
      let number = toNumber(arg(args, 0))
      let decimals = arg(args, 1).isNullish ? 0 : toNumber(arg(args, 1))
      let factor = pow(10, decimals)
      return .number(jsRound(number * factor) / factor)
    },
    BuiltinDef(name: "Abs", signature: "Abs(number) → number", description: "Absolute value") {
      args in .number(abs(toNumber(arg(args, 0))))
    },
    BuiltinDef(
      name: "Floor", signature: "Floor(number) → number",
      description: "Round down to nearest integer"
    ) { args in .number(toNumber(arg(args, 0)).rounded(.down)) },
    BuiltinDef(
      name: "Ceil", signature: "Ceil(number) → number", description: "Round up to nearest integer"
    ) { args in .number(toNumber(arg(args, 0)).rounded(.up)) },
  ]
  return Dictionary(uniqueKeysWithValues: defs.map { ($0.name, $0) })
}()

/// Builtin names in declaration order, for prompt docs.
public let builtinOrder = [
  "Count", "First", "Last", "Sum", "Avg", "Min", "Max", "Sort", "Filter", "Round", "Abs", "Floor",
  "Ceil",
]

/// Builtins that receive AST nodes instead of evaluated values.
public let lazyBuiltins: Set<String> = ["Each"]

public let lazyBuiltinDefs: [String: (signature: String, description: String)] = [
  "Each": (
    "Each(array, varName, template)",
    "Evaluate template for each element. varName is the loop variable — use it ONLY inside the template expression (inline). Do NOT create a separate statement for the template."
  )
]

/// Parser-level action step names mapped to runtime step types.
public let actionSteps: [String: String] = [
  "Run": "run",
  "ToAssistant": "continue_conversation",
  "OpenUrl": "open_url",
  "Set": "set",
  "Reset": "reset",
]

/// Action step names plus the `Action` container.
public let actionNames: Set<String> = Set(["Action"]).union(actionSteps.keys)

/// Every builtin name, including action expressions.
public let builtinNames: Set<String> = Set(builtins.keys).union(lazyBuiltins).union(actionNames)

public func isBuiltin(_ name: String) -> Bool { builtinNames.contains(name) }

/// Statement-level calls that are neither builtins nor components.
public enum ReservedCall {
  public static let query = "Query"
  public static let mutation = "Mutation"
}

public func isReservedCall(_ name: String) -> Bool {
  name == ReservedCall.query || name == ReservedCall.mutation
}
