import Testing

@testable import OpenUILang

/// The component schemas must match react-ui's Zod schemas, for both
/// openuiChatLibrary (`ChatComponents`) and openuiLibrary (`OpenUIComponents`),
/// so one backend prompt drives both the web and native renderers.
@Suite struct LibraryComponentsTests {
  /// One of react-ui's libraries: its fixture key, root and Swift schemas.
  struct Subject {
    let key: String
    let root: String
    let all: [ComponentSchema]
    let groups: [ComponentGroup]
    let promptOptions: PromptOptions

    var tsDefs: OpenUIValue { Fixtures.schemas[key]["schema"]["$defs"] }
    var tsSpec: OpenUIValue { Fixtures.load("\(key)-spec") }
    var library: Library<Void> {
      Library(
        components: all.map { ComponentDefinition($0, content: ()) }, root: root,
        componentGroups: groups)
    }
  }

  static func subject(_ key: String) -> Subject {
    key == "chat"
      ? Subject(
        key: "chat", root: "Card", all: ChatComponents.all, groups: ChatComponents.groups,
        promptOptions: ChatComponents.promptOptions)
      : Subject(
        key: "openui", root: "Stack", all: OpenUIComponents.all, groups: OpenUIComponents.groups,
        promptOptions: OpenUIComponents.promptOptions)
  }

  static let libraries = ["chat", "openui"]
  static let components: [(String, String)] = libraries.flatMap { key in
    subject(key).all.map { (key, $0.name) }
  }

  @Test(arguments: components)
  func matchesReactUI(_ key: String, _ name: String) {
    let subject = Self.subject(key)
    let schema = subject.all.first { $0.name == name }!
    let expected = subject.tsDefs[name]
    let diff = firstDifference(normalized(schema.jsonSchema), normalized(expected))
    #expect(diff == nil, "\(key) \(name): \(diff ?? "")")
    // Property order is positional-argument order, so it must match exactly.
    #expect(
      schema.jsonSchema["properties"].objectValue?.keys == expected["properties"].objectValue?.keys)
    #expect(schema.signature == subject.tsSpec["components"][name]["signature"].stringValue)
  }

  @Test(arguments: libraries)
  func coversEveryComponentInLibraryOrder(_ key: String) {
    let subject = Self.subject(key)
    #expect(subject.all.map(\.name) == subject.tsSpec["components"].objectValue?.keys)
  }

  @Test(arguments: libraries)
  func libraryJSONSchemaMatchesByteForByte(_ key: String) {
    // Key order included: top-level properties follow library order, $defs
    // follow Zod's depth-first discovery order.
    let schema = JSON.stringify(Self.subject(key).library.toJSONSchema())
    let expected = JSON.stringify(Fixtures.schemas[key]["schema"])
    #expect(schema == expected, "\(firstLineDifference(schema, expected) ?? "")")
  }

  @Test(arguments: libraries)
  func bindingsMatchReactiveProps(_ key: String) {
    let reactive = Fixtures.schemas[key]["reactive"].objectValue ?? OpenUIObject()
    for schema in Self.subject(key).all {
      let expected = (reactive[schema.name]?.arrayValue ?? []).compactMap(\.stringValue)
      #expect(schema.props.filter(\.isBinding).map(\.name) == expected, "\(key) \(schema.name)")
    }
  }

  @Test(arguments: libraries)
  func groupsMatchReactUI(_ key: String) {
    let subject = Self.subject(key)
    let expected = (subject.tsSpec["componentGroups"].arrayValue ?? []).map { group in
      ComponentGroup(
        name: group["name"].stringValue ?? "",
        components: (group["components"].arrayValue ?? []).compactMap(\.stringValue),
        notes: group["notes"].arrayValue?.compactMap(\.stringValue))
    }
    #expect(subject.groups == expected)
  }

  @Test(arguments: libraries)
  func promptWithItsOptionsMatchesLangCore(_ key: String) {
    // What react-ui apps send: the library with its prompt options.
    let subject = Self.subject(key)
    let fixture = FixtureCase.all("prompts").first { $0.name == "\(key)-options" }!
    let prompt = subject.library.prompt(subject.promptOptions)
    let expected = fixture.value["expected"].stringValue!
    #expect(prompt == expected, "\(firstLineDifference(prompt, expected) ?? "")")
  }

  @Test(arguments: libraries)
  func promptMatchesLangCore(_ key: String) {
    let fixture = FixtureCase.all("prompts").first { $0.name == "\(key)-default" }!
    let prompt = Self.subject(key).library.prompt()
    let expected = fixture.value["expected"].stringValue!
    #expect(prompt == expected, "\(firstLineDifference(prompt, expected) ?? "")")
  }
}
