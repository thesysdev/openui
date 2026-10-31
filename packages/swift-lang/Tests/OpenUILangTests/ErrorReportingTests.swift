import Testing

@testable import OpenUILang

/// `OpenUIRuntime.onError` must report what react-lang's `onError` does.
@MainActor
@Suite struct ErrorReportingTests {
  static let library = Library(
    components: ChatComponents.all.map { ComponentDefinition($0, content: ()) }, root: "Card",
    componentGroups: ChatComponents.groups)

  /// Collects every `onError` call.
  final class Reports {
    var calls: [[OpenUIError]] = []
  }

  func makeRuntime(toolProvider: (any ToolProvider)? = nil) -> (OpenUIRuntime, Reports) {
    let runtime = OpenUIRuntime(library: Self.library, toolProvider: toolProvider)
    let reports = Reports()
    runtime.onError = { reports.calls.append($0) }
    return (runtime, reports)
  }

  @Test(arguments: FixtureCase.all("errors"))
  func parserErrorHintsMatchLangCore(_ fixture: FixtureCase) {
    let (runtime, reports) = makeRuntime()
    runtime.update(response: fixture.value["input"].stringValue!, isStreaming: false)
    let reported = OpenUIValue.array((reports.calls.last ?? []).map(\.jsonRepresentation))
    let diff = firstDifference(normalized(reported), normalized(fixture.value["expected"]))
    #expect(diff == nil, "\(fixture.name): \(diff ?? "")")
  }

  @Test func reportsOnlyAfterStreamingAndOnlyOnChange() {
    let (runtime, reports) = makeRuntime()
    runtime.update(response: "root = Card([Mystery(", isStreaming: true)
    #expect(reports.calls.isEmpty)

    runtime.update(response: "root = Card([Mystery()])", isStreaming: false)
    #expect(reports.calls.map { $0.map(\.code) } == [["unknown-component"]])
    runtime.update(response: "root = Card([Mystery()])", isStreaming: false)
    #expect(reports.calls.count == 1)

    // The next response clears the errors as soon as it starts streaming.
    runtime.update(response: "root = Card([", isStreaming: true)
    runtime.update(response: "root = Card([TextContent(", isStreaming: true)
    #expect(reports.calls.count == 2 && reports.calls[1].isEmpty)

    runtime.update(response: "root = Card([TextContent(\"ok\")])", isStreaming: false)
    #expect(reports.calls.count == 3 && reports.calls[2].isEmpty)
  }

  @Test func reportsAResponseWithoutARoot() {
    let (runtime, reports) = makeRuntime()
    runtime.update(response: "Here is a summary in plain text.", isStreaming: false)
    let error = reports.calls.last?.first
    #expect(error?.code == "parse-failed")
    #expect(error?.message == "Code parsed but produced no renderable root component")
    #expect(
      error?.hint
        == "The entire response must be valid openui-lang code starting with root = Card(...)")
  }

  @Test func reportsFailedQueriesWhenTheyFinish() async {
    let (runtime, reports) = makeRuntime(
      toolProvider: FunctionToolProvider(["other": { _ in .null }]))
    runtime.update(
      response: "root = Card([TextContent(\"x\")])\nq = Query(\"missing_tool\", {}, {})",
      isStreaming: false)
    for _ in 0..<20 { await Task.yield() }
    let last = reports.calls.last ?? []
    #expect(last.map(\.code) == ["tool-not-found"])
    #expect(last.first?.toolName == "missing_tool")
  }

  @Test func reportsParseResultChanges() {
    let runtime = OpenUIRuntime(library: Self.library)
    var results: [ParseResult?] = []
    runtime.onParseResult = { results.append($0) }
    runtime.update(response: nil, isStreaming: false)
    runtime.update(response: "root = Card([", isStreaming: true)
    runtime.update(response: "root = Card([", isStreaming: false)
    runtime.update(response: "root = Card([TextContent(\"a\")])", isStreaming: false)
    #expect(results.count == 3)
    #expect(results[0] == nil)
    #expect(results[2]?.root?.typeName == "Card")
  }
}
