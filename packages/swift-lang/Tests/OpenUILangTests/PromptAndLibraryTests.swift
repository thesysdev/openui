import Testing

@testable import OpenUILang

/// Reads a lang-core `PromptSpec` object from fixture JSON.
func promptSpec(from json: OpenUIValue) -> PromptSpec {
  let components = (json["components"].objectValue ?? OpenUIObject()).entries.map { name, value in
    (
      name: name,
      spec: ComponentPromptSpec(
        signature: value["signature"].stringValue ?? "",
        description: value["description"].stringValue)
    )
  }
  let groups = json["componentGroups"].arrayValue?.map { group in
    ComponentGroup(
      name: group["name"].stringValue ?? "",
      components: (group["components"].arrayValue ?? []).compactMap(\.stringValue),
      notes: group["notes"].arrayValue?.compactMap(\.stringValue))
  }
  let tools: [ToolDescriptor]? = json["tools"].arrayValue?.map { tool in
    if case .string(let name) = tool { return .name(name) }
    return .spec(
      ToolSpec(
        name: tool["name"].stringValue ?? "", description: tool["description"].stringValue,
        inputSchema: tool["inputSchema"], outputSchema: tool["outputSchema"]))
  }
  func strings(_ key: String) -> [String]? { json[key].arrayValue?.compactMap(\.stringValue) }
  return PromptSpec(
    root: json["root"].stringValue, components: components, componentGroups: groups,
    options: PromptOptions(
      preamble: json["preamble"].stringValue, additionalRules: strings("additionalRules"),
      examples: strings("examples"), toolExamples: strings("toolExamples"), tools: tools,
      editMode: json["editMode"].boolValue, inlineMode: json["inlineMode"].boolValue,
      toolCalls: json["toolCalls"].boolValue, bindings: json["bindings"].boolValue))
}

/// The first line where two texts differ, for readable failures.
func firstLineDifference(_ actual: String, _ expected: String) -> String? {
  let a = actual.split(separator: "\n", omittingEmptySubsequences: false)
  let e = expected.split(separator: "\n", omittingEmptySubsequences: false)
  for index in 0..<max(a.count, e.count) {
    let lhs = index < a.count ? String(a[index]) : "<end>"
    let rhs = index < e.count ? String(e[index]) : "<end>"
    if lhs != rhs { return "line \(index + 1):\n  got:      \(lhs)\n  expected: \(rhs)" }
  }
  return nil
}

@Suite struct PromptConformanceTests {
  @Test(arguments: FixtureCase.all("prompts"))
  func generatePromptMatchesLangCore(_ fixture: FixtureCase) {
    let prompt = generatePrompt(promptSpec(from: fixture.value["spec"]))
    let expected = fixture.value["expected"].stringValue!
    #expect(prompt == expected, "\(fixture.name): \(firstLineDifference(prompt, expected) ?? "")")
  }
}

/// Swift-defined components must serialize like the Zod-defined originals.
@Suite struct LibraryDSLTests {
  static let rules: PropType = .object(
    ["required", "email", "url", "numeric"].map { Prop($0, .boolean, .optional) }
      + ["min", "max", "minLength", "maxLength"].map { Prop($0, .number, .optional) }
      + [Prop("pattern", .string, .optional)])

  static let components: [ComponentSchema] = [
    ComponentSchema(
      "TextContent",
      description:
        "Text block. Supports markdown. Optional size: \"small\" | \"default\" | \"large\" | \"small-heavy\" | \"large-heavy\".",
      props: [
        Prop("text", .string),
        Prop(
          "size", .enumeration(["small", "default", "large", "small-heavy", "large-heavy"]),
          .optional),
      ]),
    ComponentSchema(
      "Input", description: "",
      props: [
        Prop("name", .string), Prop("placeholder", .string, .optional),
        Prop("type", .enumeration(["text", "email", "password", "number", "url"]), .optional),
        Prop("rules", rules, .optional), Prop("value", .string, .optional, binding: true),
      ]),
    ComponentSchema(
      "Button", description: "Clickable button",
      props: [
        Prop("label", .string), Prop("action", .actionExpression, .optional),
        Prop("variant", .enumeration(["primary", "secondary", "tertiary"]), .optional),
        Prop("type", .enumeration(["normal", "destructive"]), .optional),
        Prop("size", .enumeration(["extra-small", "small", "medium", "large"]), .optional),
      ]),
    ComponentSchema(
      "Col", description: "Column definition — holds label + data array",
      props: [
        Prop("label", .string), Prop("data", .any),
        Prop("type", .enumeration(["string", "number", "action"]), .optional),
      ]),
    ComponentSchema(
      "CheckBoxGroup", description: "",
      props: [
        Prop("name", .string), Prop("items", .array(.component("CheckBoxItem"))),
        Prop("rules", rules, .optional),
        Prop("value", .record(.boolean), .optional, binding: true),
      ]),
    ComponentSchema(
      "EntityList",
      description:
        "Two-column key/value rows (left label, right value). size 'default' supports optional header and footer rows; rightVariant 'number' uses tabular numbers.",
      props: [
        Prop("rows", .array(entityRow), .defaulted([])),
        Prop("size", .enumeration(["small", "default"]), .defaulted("default")),
        Prop("header", entityRow, .optional), Prop("footer", entityRow, .optional),
      ]),
    ComponentSchema(
      "Chips",
      description:
        "A form field of compact selectable chips for choosing one or many short options; the selection is stored under `name`.",
      props: [
        Prop("name", .string),
        Prop("type", .enumeration(["single", "multiple"]), .defaulted("multiple")),
        Prop("items", .array(.component("ChipItem")), .defaulted([])),
        Prop("rules", rules, .optional),
        Prop("defaultValue", .union([.string, .array(.string)]), .optional),
      ]),
  ]

  static let entityRow: PropType = .object([
    Prop("left", .string), Prop("right", .string),
    Prop("rightVariant", .enumeration(["text", "number"]), .defaulted("text")),
  ])

  static let chatDefs = Fixtures.schemas["chat"]["schema"]["$defs"]
  static let chatSpec = Fixtures.load("chat-spec")

  @Test(arguments: components.map(\.name))
  func schemaMatchesZod(_ name: String) {
    let component = Self.components.first { $0.name == name }!
    let expected = Self.chatDefs[name]
    let diff = firstDifference(normalized(component.jsonSchema), normalized(expected))
    #expect(diff == nil, "\(name): \(diff ?? "")")
    // Property order is positional-argument order, so it must match exactly.
    #expect(
      component.jsonSchema["properties"].objectValue?.keys
        == expected["properties"].objectValue?.keys)
  }

  @Test(arguments: components.map(\.name))
  func signatureMatchesLangCore(_ name: String) {
    let component = Self.components.first { $0.name == name }!
    #expect(component.signature == Self.chatSpec["components"][name]["signature"].stringValue)
  }

  @Test func libraryWiresBindingsRootAndSchema() {
    let library = Library(
      components: Self.components.map { ComponentDefinition($0, content: ()) }, root: "TextContent")
    #expect(library.isReactiveProp("Input", "value"))
    #expect(!library.isReactiveProp("Input", "name"))
    #expect(
      library.paramMap["Button"]?.map(\.name) == ["label", "action", "variant", "type", "size"])
    #expect(library.toJSONSchema()["required"].arrayValue?.count == Self.components.count)
    #expect(
      library.toSpec()["components"]["Button"]["signature"].stringValue?.hasPrefix(
        "Button(label: string, action?: ActionExpression") == true)

    let result = parse(
      "root = TextContent(\"hi\", \"large\")", library.paramMap, rootName: library.rootName)
    #expect(result.root?.props == ["text": "hi", "size": "large"])
  }

  @Test func promptIncludesActionAndBindingNotes() {
    let library = Library(components: Self.components.map { ComponentDefinition($0, content: ()) })
    let prompt = library.prompt()
    #expect(
      prompt.contains("Props typed `ActionExpression` accept an Action([@steps...]) expression."))
    #expect(prompt.contains("Props marked `$binding<type>` accept a `$variable` reference"))
    #expect(prompt.contains("root = Root(...)"))
  }
}
