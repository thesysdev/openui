/// Mutable state threaded through one materialization pass.
final class MaterializeContext {
  var syms: [String: ASTNode]
  var cat: ParamMap?
  var errors: [ValidationError] = []
  var unres: [String] = []
  var visited: Set<String> = []
  var partial: Bool
  /// The statement being materialized, for error attribution.
  var currentStatementId: String?
  /// Statements not reached yet, in insertion order. Whatever remains is orphaned.
  var unreached: [String]? = nil

  init(syms: [String: ASTNode], cat: ParamMap?, partial: Bool, currentStatementId: String?) {
    self.syms = syms
    self.cat = cat
    self.partial = partial
    self.currentStatementId = currentStatementId
  }

  func markReached(_ id: String) {
    unreached?.removeAll { $0 == id }
  }
}

// MARK: - Schema introspection

private let scalarTypeofs: Set<String> = ["string", "number", "boolean"]

/// `{ $ref: "#/$defs/Name" }` → `"Name"`.
private func refName(_ schema: OpenUIValue) -> String? {
  guard let ref = schema["$ref"].stringValue else { return nil }
  return ref.split(separator: "/", omittingEmptySubsequences: false).last.map(String.init)
}

/// The `$ref` names a slot allows: one for `$ref`, several for anyOf/oneOf.
private func slotRefNames(_ schema: OpenUIObject) -> [String?] {
  let options = schema["anyOf"]?.arrayValue ?? schema["oneOf"]?.arrayValue ?? [.object(schema)]
  return options.map(refName)
}

/// True when every option of the slot is a `$ref` to a component.
private func isOnlyComponentSlot(_ schema: OpenUIObject, _ ctx: MaterializeContext) -> Bool {
  let names = slotRefNames(schema)
  return !names.isEmpty && names.allSatisfy { name in name.map { ctx.cat?[$0] != nil } ?? false }
}

private func isCompositeSchema(_ schema: OpenUIObject) -> Bool {
  schema.contains("$ref") || schema.contains("anyOf") || schema.contains("oneOf")
    || schema.contains("allOf")
}

/// Scalar type or enum values of a JSON Schema leaf.
struct ScalarTypeInfo {
  var expectedType: String?
  var enumValues: [OpenUIValue]?
}

func scalarTypeInfo(_ schema: OpenUIObject) -> ScalarTypeInfo {
  if case .array(let values)? = schema["enum"] { return ScalarTypeInfo(enumValues: values) }
  if let constant = schema["const"] { return ScalarTypeInfo(enumValues: [constant]) }
  switch schema["type"] {
  case .string("string"): return ScalarTypeInfo(expectedType: "string")
  case .string("number"), .string("integer"): return ScalarTypeInfo(expectedType: "number")
  case .string("boolean"): return ScalarTypeInfo(expectedType: "boolean")
  default: return ScalarTypeInfo()
  }
}

/// A JSON Schema fragment's `default`; `nil` when it has none.
func schemaDefaultValue(_ property: OpenUIValue?) -> OpenUIValue? {
  guard case .object(let object)? = property else { return nil }
  return object["default"]
}

/// The type hint used in signatures and messages, e.g. `string` or `"a"|"b"`.
func typeFromSchema(_ property: OpenUIValue?) -> String? {
  guard case .object(let object)? = property else { return nil }
  if case .string(let ref)? = object["$ref"] {
    return ref.split(separator: "/", omittingEmptySubsequences: false).last.map(String.init)
  }
  let leaf = scalarTypeInfo(object)
  if let enumValues = leaf.enumValues {
    return enumValues.map { JSON.stringify($0) }.joined(separator: "|")
  }
  if let expectedType = leaf.expectedType { return expectedType }
  if case .string(let type)? = object["type"] { return type }
  return nil
}

/// A typed signature like `Header(title*: string, variant: "a"|"b")`; `*` marks
/// required params, in positional order so an LLM can fix swapped arguments.
func buildParamsSignature(_ component: String, _ params: [ParamDef]) -> String {
  let rendered = params.map { param -> String in
    let marked = param.required ? "\(param.name)*" : param.name
    if let type = typeFromSchema(param.schema) { return "\(marked): \(type)" }
    return marked
  }
  return "\(component)(\(rendered.joined(separator: ", ")))"
}

/// `Array.prototype.includes` (SameValueZero).
private func includes(_ values: [OpenUIValue], _ value: OpenUIValue) -> Bool {
  values.contains { candidate in
    if case .number(let a) = candidate, case .number(let b) = value {
      return a == b || (a.isNaN && b.isNaN)
    }
    return candidate == value
  }
}

private func checkTypeMismatch(_ value: OpenUIValue, _ info: ScalarTypeInfo) -> (
  expected: String, actual: String
)? {
  let actual = value.jsTypeof
  if let enumValues = info.enumValues {
    if !scalarTypeofs.contains(actual) { return nil }
    if includes(enumValues, value) { return nil }
    return (
      "one of [\(enumValues.map { JSON.stringify($0) }.joined(separator: ", "))]",
      JSON.stringify(value)
    )
  }
  if let expectedType = info.expectedType, expectedType != actual {
    return (expectedType, value.jsType)
  }
  return nil
}

// MARK: - Errors

enum ValidationIssue {
  case typeMismatch(expected: String, actual: String)
  case missingRequired(signature: String?)
  case nullRequired(signature: String?)
  case unknownComponent(available: [String]?)
  case inlineReserved
  case excessArgs(declared: Int, got: Int)

  var code: ValidationErrorCode {
    switch self {
    case .typeMismatch: return .typeMismatch
    case .missingRequired: return .missingRequired
    case .nullRequired: return .nullRequired
    case .unknownComponent: return .unknownComponent
    case .inlineReserved: return .inlineReserved
    case .excessArgs: return .excessArgs
    }
  }
}

private func validationMessage(_ component: String, _ path: String, _ issue: ValidationIssue)
  -> String
{
  switch issue {
  case .typeMismatch(let expected, let actual):
    return "field \"\(path)\" expects \(expected) but got \(actual)"
  case .missingRequired(let signature):
    return "missing required field \"\(path)\"" + (signature.map { " — signature: \($0)" } ?? "")
  case .nullRequired(let signature):
    return "required field \"\(path)\" cannot be null"
      + (signature.map { " — signature: \($0)" } ?? "")
  case .unknownComponent(let available):
    let list =
      available.flatMap {
        $0.isEmpty ? nil : ". Available components: \($0.joined(separator: ", "))"
      }
      ?? ""
    return "Unknown component \"\(component)\" — not found in catalog or builtins\(list)"
  case .inlineReserved:
    return "\(component)() must be declared as a top-level statement, not used inline as a value"
  case .excessArgs(let declared, let got):
    return "\(component) takes \(declared) arg(s), got \(got) (\(got - declared) excess dropped)"
  }
}

func pushValidationIssue(
  _ ctx: MaterializeContext, _ component: String, _ path: String, _ issue: ValidationIssue
) {
  ctx.errors.append(
    ValidationError(
      code: issue.code, component: component, path: path,
      message: validationMessage(component, path, issue), statementId: ctx.currentStatementId))
}

// MARK: - Invalid-value resolution (the edge rule)

/// Substitutes a default for an invalid value when one exists. Otherwise a
/// required key propagates invalidity upward (returns true) and an optional
/// key is deleted.
func resolveInvalidValue(
  _ container: inout OpenUIObject, _ key: String, required: Bool, defaultValue: OpenUIValue?
) -> Bool {
  if let defaultValue {
    container[key] = defaultValue
    return false
  }
  if required { return true }
  container[key] = nil
  return false
}

// MARK: - Validators

/// Component elements in data slots: slots that admit components (`$ref`,
/// `anyOf`, `oneOf`) are unchecked, plain-data slots can never hold one.
private func validateElementPosition(
  _ element: ElementNode, _ schema: OpenUIObject, _ component: String, _ path: String,
  _ ctx: MaterializeContext
) -> Bool {
  if isCompositeSchema(schema) { return false }
  let type = schema["type"]?.stringValue
  if type != nil || schema["enum"]?.arrayValue != nil || schema.contains("const") {
    pushValidationIssue(
      ctx, component, path,
      .typeMismatch(
        expected: type ?? "a literal value", actual: "component \"\(element.typeName)\""))
    return true
  }
  return false
}

private func validateObjectValue(
  _ value: inout OpenUIValue, _ schema: OpenUIObject, _ component: String, _ path: String,
  _ ctx: MaterializeContext
) -> Bool {
  guard case .object(var object) = value else {
    pushValidationIssue(
      ctx, component, path, .typeMismatch(expected: "object", actual: value.jsType))
    return true
  }
  let props = schema["properties"]?.objectValue ?? OpenUIObject()
  let required: [String] = (schema["required"]?.arrayValue ?? []).compactMap(\.stringValue)
  var invalid = false
  // Structural checks are streaming-sensitive, so they only run on complete input.
  if !ctx.partial {
    for key in required {
      let present = object.contains(key)
      if object[key]?.isNullish ?? true {
        if let fallback = schemaDefaultValue(props[key]) {
          object[key] = fallback
          continue
        }
        pushValidationIssue(
          ctx, component, "\(path)/\(key)",
          present ? .nullRequired(signature: nil) : .missingRequired(signature: nil))
        invalid = true
      }
    }
  }
  for key in props.keys where object.contains(key) {
    let sub = props[key]
    guard var child = object[key] else { continue }
    let childInvalid = validateSchemaValue(&child, sub, component, "\(path)/\(key)", ctx)
    object[key] = child
    if childInvalid,
      resolveInvalidValue(
        &object, key, required: required.contains(key), defaultValue: schemaDefaultValue(sub))
    {
      invalid = true
    }
  }
  value = .object(object)
  return invalid
}

/// Invalid items are pruned in place, after validating all of them so error
/// paths keep their original indices.
private func validateArrayValue(
  _ value: inout OpenUIValue, _ schema: OpenUIObject, _ component: String, _ path: String,
  _ ctx: MaterializeContext
) -> Bool {
  guard case .array(var items) = value else {
    pushValidationIssue(
      ctx, component, path, .typeMismatch(expected: "array", actual: value.jsType))
    return true
  }
  guard case .object = schema["items"] else { return false }
  let itemSchema = schema["items"]
  var invalid: [Int] = []
  for index in items.indices {
    if validateSchemaValue(&items[index], itemSchema, component, "\(path)/\(index)", ctx) {
      invalid.append(index)
    }
  }
  for index in invalid.reversed() { items.remove(at: index) }
  value = .array(items)
  return false
}

/// Enum membership is deferred while streaming (a partial literal may still
/// complete to a valid member); scalar type checks always run.
private func validateLeafValue(
  _ value: OpenUIValue, _ schema: OpenUIObject, _ component: String, _ path: String,
  _ ctx: MaterializeContext
) -> Bool {
  let leaf = scalarTypeInfo(schema)
  if leaf.expectedType == nil && leaf.enumValues == nil { return false }
  if leaf.enumValues != nil && ctx.partial { return false }
  if let mismatch = checkTypeMismatch(value, leaf) {
    pushValidationIssue(
      ctx, component, path, .typeMismatch(expected: mismatch.expected, actual: mismatch.actual))
    return true
  }
  return false
}

/// Validates a materialized value against a JSON Schema fragment, pruning
/// unsalvageable data along the way. Returns true when the value itself is
/// invalid; the caller then applies the edge rule (`resolveInvalidValue`).
func validateSchemaValue(
  _ value: inout OpenUIValue, _ schema: OpenUIValue?, _ component: String, _ path: String,
  _ ctx: MaterializeContext
) -> Bool {
  guard case .object(let s)? = schema else { return false }
  // Absence is handled by the parent's required checks.
  if value.isNullish { return false }
  switch value {
  case .ast:
    // Runtime expressions resolve later.
    return false
  case .element(let element):
    return validateElementPosition(element, s, component, path, ctx)
  default:
    break
  }
  if isCompositeSchema(s) {
    // Data (an object, array, string, number or boolean) in a component-only slot is invalid.
    guard isOnlyComponentSlot(s, ctx) else { return false }
    let actual: String
    switch value {
    case .array: actual = "array"
    case .string: actual = "string"
    case .number: actual = "number"
    case .bool: actual = "boolean"
    default: actual = "plain object"
    }
    let expected = slotRefNames(s).map { $0 ?? "" }.joined(separator: " | ")
    pushValidationIssue(ctx, component, path, .typeMismatch(expected: expected, actual: actual))
    return true
  }
  switch s["type"] {
  case .string("object"): return validateObjectValue(&value, s, component, path, ctx)
  case .string("array"): return validateArrayValue(&value, s, component, path, ctx)
  default: return validateLeafValue(value, s, component, path, ctx)
  }
}
