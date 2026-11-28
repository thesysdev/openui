/// The type of a component prop. Mirrors the Zod schemas lang-core libraries
/// are written with, and serializes to the same JSON Schema.
public indirect enum PropType: Sendable, Equatable {
  case string
  case number
  case boolean
  /// Unconstrained (`z.any()`).
  case any
  case enumeration([String])
  case literal(OpenUIValue)
  /// An array, optionally with a minimum length (`.min(n)` in Zod).
  case array(PropType, minItems: Int? = nil)
  /// A nested object (`z.object`).
  case object([Prop])
  /// `Record<string, value>`.
  case record(PropType)
  /// A reference to another component in the library.
  case component(String)
  case union([PropType])
  /// A type shown by name in signatures (like lang-core's `tagSchemaId`),
  /// serialized as its underlying schema.
  case named(String, PropType)

  /// The action prop type (`ActionExpression`): an `Action([...])` expression,
  /// or one of the legacy action objects.
  public static let actionExpression: PropType = .named(
    "ActionExpression",
    .union([
      .object([Prop("type", .literal("open_url")), Prop("url", .string)]),
      .object([
        Prop("type", .literal("continue_conversation")), Prop("context", .string, .optional),
      ]),
      .object([Prop("type", .string), Prop("params", .record(.any), .optional)]),
    ]))
}

/// A component prop: its name, type, and whether it may be omitted.
public struct Prop: Sendable, Equatable {
  public enum Presence: Sendable, Equatable {
    case required
    case optional
    /// Filled with this value when missing (`.default(value)` in Zod).
    case defaulted(OpenUIValue)
  }

  public var name: String
  public var type: PropType
  public var presence: Presence
  /// Binds two-way to a `$state` variable (lang-core's `reactive()`), shown as
  /// `$binding<type>` in signatures.
  public var isBinding: Bool
  public var description: String?

  public init(
    _ name: String, _ type: PropType, _ presence: Presence = .required, binding: Bool = false,
    description: String? = nil
  ) {
    self.name = name
    self.type = type
    self.presence = presence
    self.isBinding = binding
    self.description = description
  }

  /// Optional in signatures: `.optional` and `.defaulted` props may be omitted.
  public var isOptional: Bool { presence != .required }

  /// Listed in the JSON Schema's `required`: Zod treats defaulted props as
  /// required in its output schema.
  var isSchemaRequired: Bool { presence != .optional }

  var defaultValue: OpenUIValue? {
    if case .defaulted(let value) = presence { return value }
    return nil
  }
}

/// A component's contract with the model: name, description and props in
/// positional order. Independent of how any UI layer renders it.
public struct ComponentSchema: Sendable, Equatable {
  public var name: String
  public var description: String
  public var props: [Prop]

  public init(_ name: String, description: String, props: [Prop]) {
    self.name = name
    self.description = description
    self.props = props
  }

  /// The prompt signature, e.g. `TextContent(text: string, size?: "small" | "large")`.
  public var signature: String {
    let params = props.map { prop in
      let type = typeAnnotation(prop.type, binding: prop.isBinding)
      return prop.isOptional ? "\(prop.name)?: \(type)" : "\(prop.name): \(type)"
    }
    return "\(name)(\(params.joined(separator: ", ")))"
  }

  /// This component's entry in the library JSON Schema's `$defs`.
  public var jsonSchema: OpenUIValue {
    var schema = objectSchema(props).objectValue!
    if !description.isEmpty { schema["description"] = .string(description) }
    return .object(schema)
  }
}

/// A library component: its schema plus how a UI layer renders it.
public struct ComponentDefinition<Content> {
  public var schema: ComponentSchema
  public var content: Content

  public init(_ schema: ComponentSchema, content: Content) {
    self.schema = schema
    self.content = content
  }

  public var name: String { schema.name }
}

// MARK: - Signatures

private func typeAnnotation(_ type: PropType, binding: Bool) -> String {
  let base = baseTypeAnnotation(type)
  return binding ? "$binding<\(base)>" : base
}

private func baseTypeAnnotation(_ type: PropType) -> String {
  switch type {
  case .named(let name, _), .component(let name):
    return name
  case .union(let options):
    return options.isEmpty
      ? "any" : options.map { typeAnnotation($0, binding: false) }.joined(separator: " | ")
  case .array(let inner, _):
    let innerType = typeAnnotation(inner, binding: false)
    if case .union = inner { return "(\(innerType))[]" }
    return "\(innerType)[]"
  case .string: return "string"
  case .number: return "number"
  case .boolean: return "boolean"
  case .any: return "any"
  case .record(let value): return "Record<string, \(typeAnnotation(value, binding: false))>"
  case .enumeration(let values): return values.map { "\"\($0)\"" }.joined(separator: " | ")
  case .literal(let value):
    if case .string(let string) = value { return "\"\(string)\"" }
    return value.jsString
  case .object(let props):
    let fields = props.map { prop in
      "\(prop.name)\(prop.isOptional ? "?" : ""): \(typeAnnotation(prop.type, binding: prop.isBinding))"
    }
    return "{\(fields.joined(separator: ", "))}"
  }
}

// MARK: - JSON Schema (Zod 4 `toJSONSchema` output)

func jsonSchema(_ type: PropType) -> OpenUIValue {
  switch type {
  case .string: return ["type": "string"]
  case .number: return ["type": "number"]
  case .boolean: return ["type": "boolean"]
  case .any: return [:]
  case .enumeration(let values):
    return ["type": "string", "enum": .array(values.map { .string($0) })]
  case .literal(let value):
    return ["type": .string(value.jsTypeof), "const": value]
  case .array(let inner, let minItems):
    // Zod writes length checks before the type.
    var schema = OpenUIObject()
    if let minItems { schema["minItems"] = .number(Double(minItems)) }
    schema["type"] = "array"
    schema["items"] = jsonSchema(inner)
    return .object(schema)
  case .object(let props): return objectSchema(props)
  case .record(let value):
    return [
      "type": "object", "propertyNames": ["type": "string"],
      "additionalProperties": jsonSchema(value),
    ]
  case .component(let name): return ["$ref": .string("#/$defs/\(name)")]
  case .union(let options): return ["anyOf": .array(options.map(jsonSchema))]
  case .named(_, let inner): return jsonSchema(inner)
  }
}

private func propSchema(_ prop: Prop) -> OpenUIValue {
  var schema = OpenUIObject()
  if let defaultValue = prop.defaultValue { schema["default"] = defaultValue }
  for (key, value) in jsonSchema(prop.type).objectValue ?? OpenUIObject() { schema[key] = value }
  if let description = prop.description { schema["description"] = .string(description) }
  return .object(schema)
}

func objectSchema(_ props: [Prop]) -> OpenUIValue {
  var schema: OpenUIObject = ["type": "object"]
  schema["properties"] = .object(OpenUIObject(props.map { ($0.name, propSchema($0)) }))
  let required = props.filter(\.isSchemaRequired).map { OpenUIValue.string($0.name) }
  if !required.isEmpty { schema["required"] = .array(required) }
  schema["additionalProperties"] = false
  return .object(schema)
}

// MARK: - Library

/// A component library: the components a model may use, their prompt, and the
/// schema the parser maps positional arguments with. `Content` is how a UI
/// layer renders each component.
public struct Library<Content>: ComponentLibrary {
  /// Components in library order (the order of the prompt and the schema).
  public let components: [ComponentDefinition<Content>]
  public let root: String?
  public let componentGroups: [ComponentGroup]?
  public let id: String?
  public let paramMap: ParamMap
  private let byName: [String: Int]
  private let bindings: Set<String>

  public init(
    components: [ComponentDefinition<Content>], root: String? = nil,
    componentGroups: [ComponentGroup]? = nil, id: String? = nil
  ) {
    let byName = Dictionary(
      components.enumerated().map { ($0.element.name, $0.offset) }, uniquingKeysWith: { $1 })
    if let root, byName[root] == nil {
      preconditionFailure(
        "[createLibrary] Root component \"\(root)\" was not found in components. Available components: \(components.map(\.name).joined(separator: ", "))"
      )
    }
    self.components = components
    self.root = root
    self.componentGroups = componentGroups
    self.id = id
    self.byName = byName
    self.bindings = Set(
      components.flatMap { component in
        component.schema.props.filter(\.isBinding).map { "\(component.name).\($0.name)" }
      })
    self.paramMap = compileSchema(Self.buildSchema(components))
  }

  public var rootName: String? { root }

  public var componentNames: [String] { components.map(\.name) }

  public func component(named name: String) -> ComponentDefinition<Content>? {
    byName[name].map { components[$0] }
  }

  public func isReactiveProp(_ component: String, _ prop: String) -> Bool {
    bindings.contains("\(component).\(prop)")
  }

  /// The library JSON Schema, shaped like lang-core's `library.toJSONSchema()`.
  public func toJSONSchema() -> OpenUIValue {
    Self.buildSchema(components)
  }

  private static func buildSchema(_ components: [ComponentDefinition<Content>]) -> OpenUIValue {
    var properties = OpenUIObject()
    for component in components {
      properties[component.name] = ["$ref": .string("#/$defs/\(component.name)")]
    }
    var defs = OpenUIObject()
    for name in definitionOrder(components) {
      defs[name] = components.first { $0.name == name }!.schema.jsonSchema
    }
    var root: OpenUIObject = ["$schema": "https://json-schema.org/draft/2020-12/schema"]
    root["type"] = "object"
    root["properties"] = .object(properties)
    root["required"] = .array(components.map { .string($0.name) })
    root["additionalProperties"] = false
    root["$defs"] = .object(defs)
    return .object(root)
  }

  /// Zod adds a component to `$defs` the first time its depth-first walk of the
  /// library reaches it, so a component referenced by an earlier one comes
  /// before its own place in the list.
  private static func definitionOrder(_ components: [ComponentDefinition<Content>]) -> [String] {
    var order: [String] = []
    var seen: Set<String> = []

    func visit(_ name: String) {
      guard !seen.contains(name), let component = components.first(where: { $0.name == name })
      else { return }
      seen.insert(name)
      order.append(name)
      for prop in component.schema.props { walk(prop.type) }
    }

    func walk(_ type: PropType) {
      switch type {
      case .component(let name): visit(name)
      case .array(let element, _): walk(element)
      case .record(let value): walk(value)
      case .named(_, let underlying): walk(underlying)
      case .object(let props): for prop in props { walk(prop.type) }
      case .union(let options): for option in options { walk(option) }
      case .string, .number, .boolean, .any, .enumeration, .literal: break
      }
    }

    for component in components { visit(component.name) }
    return order
  }

  /// The prompt inputs for this library.
  public func promptSpec(_ options: PromptOptions = PromptOptions()) -> PromptSpec {
    PromptSpec(
      root: root,
      components: components.map {
        (
          $0.name,
          ComponentPromptSpec(signature: $0.schema.signature, description: $0.schema.description)
        )
      }, componentGroups: componentGroups, options: options)
  }

  /// The system prompt for this library.
  public func prompt(_ options: PromptOptions = PromptOptions()) -> String {
    generatePrompt(promptSpec(options))
  }

  /// A JSON `LibrarySpec` (root, component signatures, groups, schema), the
  /// same shape as lang-core's `library.toSpec()`. A server can pass it to
  /// `generateSystemPrompt({ library })` to build the prompt for this app.
  public func toSpec() -> OpenUIValue {
    var spec = OpenUIObject()
    spec["root"] = root.map { .string($0) } ?? .undefined
    spec["components"] = .object(
      OpenUIObject(
        components.map { component in
          var entry: OpenUIObject = ["signature": .string(component.schema.signature)]
          entry["description"] = .string(component.schema.description)
          return (component.name, .object(entry))
        }))
    if let componentGroups {
      spec["componentGroups"] = .array(
        componentGroups.map { group in
          var entry: OpenUIObject = ["name": .string(group.name)]
          entry["components"] = .array(group.components.map { .string($0) })
          if let notes = group.notes { entry["notes"] = .array(notes.map { .string($0) }) }
          return .object(entry)
        })
    }
    spec["schema"] = toJSONSchema()
    if let id { spec["id"] = .string(id) }
    return .object(spec)
  }
}

// Libraries are usually global constants; with sendable content (SwiftUI's
// main-actor render closures are) they can be shared across concurrency domains.
extension ComponentDefinition: Sendable where Content: Sendable {}
extension Library: Sendable where Content: Sendable {}
