import CryptoKit
import Foundation
import Testing

@testable import OpenUILang

/// `mergeStatements` must match lang-core's edit-mode merge.
@Suite struct MergeConformanceTests {
  @Test(arguments: FixtureCase.all("merge"))
  func merge(_ fixture: FixtureCase) {
    let value = fixture.value
    let merged = mergeStatements(
      value["existing"].stringValue!, value["patch"].stringValue!,
      rootId: value["rootId"].stringValue ?? "root")
    let expected = value["expected"].stringValue!
    #expect(merged == expected, "\(fixture.name): \(firstLineDifference(merged, expected) ?? "")")
  }
}

/// `generateCloudConfig` must produce the same config block, or the same
/// error, as `generateSystemPrompt({ cloud: true })`.
@Suite struct CloudConfigConformanceTests {
  static let fixtures = Fixtures.load("cloud")

  static var cases: [FixtureCase] {
    (fixtures["cases"].arrayValue ?? []).map {
      FixtureCase(name: $0["name"].stringValue ?? "?", value: $0)
    }
  }

  @Test(arguments: cases)
  func config(_ fixture: FixtureCase) {
    let spec = fixture.value["spec"]
    let result = Result {
      try generateCloudConfig(
        library: spec["library"], promptOptions: Self.promptOptions(spec["promptOptions"]),
        instructions: spec["instructions"].stringValue)
    }
    switch result {
    case .success(let config):
      #expect(config == fixture.value["expected"].stringValue, "\(fixture.name)")
    case .failure(let error):
      #expect("\(error)" == fixture.value["error"].stringValue, "\(fixture.name)")
    }
  }

  @Test func chatLibraryConfigMatchesLangCore() throws {
    // lang-core's config for openuiChatLibrary with its prompt options is
    // ~80 KB, so the fixture keeps its length and SHA-256.
    let library = Library(
      components: ChatComponents.all.map { ComponentDefinition($0, content: ()) }, root: "Card",
      componentGroups: ChatComponents.groups)
    let config = try library.cloudConfig(ChatComponents.promptOptions)

    let expected = Self.fixtures["chat"]
    #expect(Double(config.utf16.count) == expected["length"].numberValue)
    let digest = SHA256.hash(data: Data(config.utf8)).map { String(format: "%02x", $0) }.joined()
    #expect(digest == expected["sha256"].stringValue)
  }

  static func promptOptions(_ value: OpenUIValue) -> PromptOptions? {
    guard value.objectValue != nil else { return nil }
    let strings = { (key: String) in value[key].arrayValue?.compactMap(\.stringValue) }
    return PromptOptions(
      preamble: value["preamble"].stringValue, additionalRules: strings("additionalRules"),
      examples: strings("examples"), tools: strings("tools")?.map(ToolDescriptor.name),
      editMode: value["editMode"].boolValue)
  }
}

/// The Cloud message format must split and wrap messages exactly like
/// react-ui's sentinel parser.
@Suite struct CloudMessageConformanceTests {
  static let fixtures = Fixtures.load("messages")

  static var cases: [FixtureCase] {
    (fixtures["separate"].arrayValue ?? []).map {
      FixtureCase(name: $0["name"].stringValue ?? "?", value: $0)
    }
  }

  @Test(arguments: cases)
  func separatesContentAndContext(_ fixture: FixtureCase) {
    let parsed = separateContentAndContext(fixture.value["input"].stringValue!)
    let expected = fixture.value["expected"]
    #expect(parsed.content == expected["content"].stringValue)
    #expect(parsed.contextString == expected["contextString"].stringValue)
    #expect(parsed.contentHeader == expected["contentHeader"].stringValue)
    #expect(parsed.end == (expected["end"].boolValue ?? false))
  }

  @Test func detectsLangSyntax() {
    for entry in Self.fixtures["langSyntax"].arrayValue ?? [] {
      let input = entry["input"].stringValue!
      #expect(hasLangSyntax(input) == entry["expected"].boolValue, "\(input.debugDescription)")
    }
    #expect(!hasLangSyntax(nil))
  }

  @Test func parsesArtifacts() {
    for entry in Self.fixtures["artifacts"].arrayValue ?? [] {
      let input = entry["input"].stringValue!
      let parsed = parseArtifactSentinel(input)
      let expected = entry["expected"]
      guard expected != .null else {
        #expect(parsed == nil, "\(input.debugDescription)")
        continue
      }
      let header = expected["header"]
      #expect(parsed?.header.artifactId == header["artifact_id"].stringValue)
      #expect(parsed?.header.type.rawValue == header["type"].stringValue)
      #expect(parsed?.header.name == header["name"].stringValue)
      #expect(parsed?.header.version == header["version"].stringValue)
      #expect(parsed?.program == expected["program"].stringValue)
    }
  }

  @Test func wraps() {
    let wrap = Self.fixtures["wrap"]
    #expect(wrapContent("root = X()") == wrap["content"].stringValue)
    #expect(
      wrapContentWithHeader("root = X()", "]]>openui:content?thesys=true")
        == wrap["contentWithHeader"].stringValue)
    #expect(wrapContentWithHeader("root = X()", nil) == wrap["contentWithoutHeader"].stringValue)
    #expect(wrapContext(#"[{"a":1}]"#) == wrap["context"].stringValue)
  }

  /// The two messages react-ui's chat builds (GenUIAssistantMessage).
  @Test func buildsChatMessages() throws {
    var event = ActionEvent(
      type: BuiltinActionType.continueConversation, humanFriendlyMessage: "Book it")
    #expect(
      continueConversationMessage(event)
        == "]]>openui:content\nBook it\n]]>openui:context\n[\"User clicked: Book it\"]")
    event.formState = ["form": ["seats": ["value": 2, "componentType": "Input"]]]
    #expect(
      continueConversationMessage(event)
        == #"]]>openui:content\#nBook it\#n]]>openui:context\#n["User clicked: Book it",{"form":{"seats":{"value":2,"componentType":"Input"}}}]"#
    )

    let state: OpenUIObject = ["$tab": "b"]
    let saved = messageWithState(
      content: "root = X()", contentHeader: "]]>openui:content?thesys=true", state: state)
    #expect(
      saved == "]]>openui:content?thesys=true\nroot = X()\n]]>openui:context\n[{\"$tab\":\"b\"}]")
    #expect(
      messageWithState(content: "root = X()", contentHeader: nil, state: [:])
        == wrapContent("root = X()"))

    // Round trip: what was saved comes back as the renderer's initial state.
    let parsed = separateContentAndContext(saved)
    #expect(parsed.content == "root = X()")
    #expect(initialState(fromContext: parsed.contextString) == state)
    #expect(initialState(fromContext: #"{"a":1}"#) == ["a": 1])
    #expect(initialState(fromContext: "[null]") == nil)
    #expect(initialState(fromContext: "not json") == nil)
  }
}
