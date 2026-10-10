import Foundation
import Testing

@testable import OpenUILang

@MainActor
@Suite struct QueryManagerTests {
  /// Waits for in-flight tool calls to settle.
  func settle() async {
    for _ in 0..<20 { await Task.yield() }
  }

  @Test func fetchesQueriesAndFallsBackToDefaults() async {
    let provider = FunctionToolProvider([
      "list_users": { args in ["rows": [["name": args["q"] ?? .null]]] }
    ])
    let manager = QueryManager(toolProvider: provider)
    let node = QueryNode(
      statementId: "users", toolName: "list_users", args: ["q": "ada"], defaults: ["rows": []],
      refreshInterval: nil, deps: nil, complete: true)

    manager.evaluateQueries([node])
    #expect(manager.result("users") == ["rows": []])
    #expect(manager.isLoading("users"))

    await settle()
    #expect(manager.result("users") == ["rows": [["name": "ada"]]])
    #expect(!manager.isAnyLoading)
    #expect(manager.result("unknown") == .null)
  }

  /// A refresh interval comes straight from the response, so one too large
  /// to schedule (or infinite) mustn't bring the app down.
  @Test func survivesHugeRefreshIntervals() async {
    let manager = QueryManager(toolProvider: FunctionToolProvider(["tick": { _ in 1 }]))
    for interval in [Double.infinity, 1e30] {
      manager.evaluateQueries([
        QueryNode(
          statementId: "q", toolName: "tick", args: [:], defaults: 0, refreshInterval: interval,
          deps: nil, complete: true)
      ])
      await settle()
    }
    #expect(manager.result("q") == 1)
    manager.dispose()
  }

  @Test func reportsMissingTools() async {
    let manager = QueryManager(toolProvider: FunctionToolProvider(["other": { _ in .null }]))
    manager.evaluateQueries([
      QueryNode(
        statementId: "q", toolName: "nope", args: [:], defaults: .null, refreshInterval: nil,
        deps: nil, complete: true)
    ])
    await settle()
    #expect(manager.snapshot.errors.first?.code == "tool-not-found")
    #expect(manager.snapshot.errors.first?.hint == "Available tools: other")
  }

  @Test func refetchRecoversFromAFailedQuery() async {
    struct Unavailable: Error {}
    final class Calls: @unchecked Sendable { var count = 0 }
    let calls = Calls()
    let manager = QueryManager(
      toolProvider: FunctionToolProvider([
        "flaky": { _ in
          calls.count += 1
          if calls.count == 1 { throw Unavailable() }
          return ["ok": true]
        }
      ]))
    manager.evaluateQueries([
      QueryNode(
        statementId: "q", toolName: "flaky", args: [:], defaults: ["ok": false],
        refreshInterval: nil, deps: nil, complete: true)
    ])
    await settle()
    #expect(manager.snapshot.errors.map(\.code) == ["tool-error"])
    #expect(manager.result("q") == ["ok": false])

    manager.invalidate(["q"])
    #expect(manager.isLoading("q"))
    await settle()
    #expect(manager.snapshot.errors.isEmpty)
    #expect(manager.result("q") == ["ok": true])
    #expect(calls.count == 2)
  }

  @Test func mutationSuccessAndFailure() async {
    let provider = FunctionToolProvider([
      "save": { args in ["saved": args["name"] ?? .null] },
      "fail": { _ in throw McpToolError(toolErrorText: "nope") },
    ])
    let manager = QueryManager(toolProvider: provider)
    manager.registerMutations([
      MutationNode(statementId: "save", toolName: "save"),
      MutationNode(statementId: "boom", toolName: "fail"),
    ])
    #expect(manager.mutationResult("save") == ["status": "idle"])

    #expect(await manager.fireMutation("save", args: ["name": "ada"]))
    #expect(manager.mutationResult("save") == ["status": "success", "data": ["saved": "ada"]])

    #expect(await manager.fireMutation("boom", args: [:]) == false)
    #expect(manager.mutationResult("boom")?["status"] == "error")
    #expect(manager.snapshot.errors.first?.code == "mcp-error")
  }

  /// Errors read like lang-core's `err.message`: a Cocoa error's localized
  /// description rather than its `Error Domain=… Code=0 "(null)"` debug form,
  /// and a `LocalizedError`'s own description.
  @Test func toolErrorsUseTheErrorsMessage() async {
    struct Offline: LocalizedError {
      var errorDescription: String? { "You're offline." }
    }
    let cocoa = NSError(domain: "kCLErrorDomain", code: 0)
    let provider = FunctionToolProvider([
      "locate": { _ in throw cocoa },
      "sync": { _ in throw Offline() },
    ])
    let manager = QueryManager(toolProvider: provider)
    manager.registerMutations([
      MutationNode(statementId: "locate", toolName: "locate"),
      MutationNode(statementId: "sync", toolName: "sync"),
    ])
    _ = await manager.fireMutation("locate", args: [:])
    _ = await manager.fireMutation("sync", args: [:])
    let messages = manager.snapshot.errors.map(\.message)
    #expect(messages.contains("Mutation \"locate\" failed: \(cocoa.localizedDescription)"))
    #expect(messages.contains("Mutation \"sync\" failed: You're offline."))
    #expect(!messages.joined().contains("Error Domain"))
    #expect(manager.mutationResult("sync")?["error"] == "You're offline.")
  }

  @Test func failedMutationHaltsTheActionPlan() async {
    let provider = FunctionToolProvider(["fail": { _ in throw ToolNotFoundError(toolName: "x") }])
    let runtime = OpenUIRuntime(library: FixtureLibrary(schemaName: "test"), toolProvider: provider)
    var events: [ActionEvent] = []
    runtime.onAction = { events.append($0) }
    runtime.update(
      response: """
        save = Mutation("fail", {})
        root = Card([Button("Save", Action([@Run(save), @ToAssistant("Saved")]))])
        """, isStreaming: false)
    let action = runtime.evaluatedRoot()?.props["children"]?.arrayValue?.first?.elementValue?
      .props["action"]

    await runtime.triggerAction("Save", action: action)
    #expect(events.isEmpty)
  }

  @Test func extractsMcpResults() throws {
    #expect(
      try extractToolResult(["content": [["type": "text", "text": "{\"a\":1}"]]]) == ["a": 1])
    #expect(try extractToolResult(["content": [["type": "text", "text": "plain"]]]) == "plain")
    #expect(try extractToolResult(["structuredContent": ["b": 2], "content": []]) == ["b": 2])
    #expect(throws: McpToolError.self) {
      try extractToolResult(["isError": true, "content": [["type": "text", "text": "bad"]]])
    }
  }

  /// An MCP client as the tool provider, as react-lang's Renderer takes one:
  /// raw results are unwrapped, and error results become `mcp-error`.
  @Test func mcpClientResultsAreUnwrapped() async throws {
    let provider = McpToolProvider { name, arguments in
      if name == "fail" {
        return ["isError": true, "content": [["type": "text", "text": "quota exceeded"]]]
      }
      let echo = OpenUIValue.string("{\"echo\":\(JSON.stringify(arguments["q"] ?? .null))}")
      return ["content": [["type": "text", "text": echo]]]
    }
    #expect(try await provider.callTool("search", arguments: ["q": "ada"]) == ["echo": "ada"])

    let manager = QueryManager(toolProvider: provider)
    manager.registerMutations([MutationNode(statementId: "boom", toolName: "fail")])
    #expect(await manager.fireMutation("boom", args: [:]) == false)
    #expect(manager.snapshot.errors.first?.code == "mcp-error")
    #expect(manager.snapshot.errors.first?.message.contains("quota exceeded") == true)
  }
}

@Suite struct FormRulesTests {
  @Test func parsesRules() {
    #expect(parseRule("min:8") == ParsedRule(type: "min", arg: 8))
    #expect(parseRule("pattern:^[a-z]:x") == ParsedRule(type: "pattern", arg: "^[a-z]:x"))
    #expect(parseRule("minLength:abc") == ParsedRule(type: "minLength", arg: "abc"))
    #expect(
      parseStructuredRules(["required": true, "email": false, "max": 5, "min": .null])
        == [ParsedRule(type: "required"), ParsedRule(type: "max", arg: 5)])
  }

  @Test func builtInMessages() {
    let cases: [(OpenUIValue, [ParsedRule], String?)] = [
      ("", [ParsedRule(type: "required")], "This field is required"),
      (["value": ""], [ParsedRule(type: "required")], "This field is required"),
      (
        ["a": false, "b": false], [ParsedRule(type: "required")], "At least one option is required"
      ),
      ("ada@x.io", [ParsedRule(type: "email")], nil),
      ("ada@x", [ParsedRule(type: "email")], "Please enter a valid email"),
      ("https://openui.com", [ParsedRule(type: "url")], nil),
      ("openui.com", [ParsedRule(type: "url")], "Please enter a valid URL"),
      ("12px", [ParsedRule(type: "numeric")], nil),
      ("abc", [ParsedRule(type: "numeric")], "Must be a number"),
      ("3", [ParsedRule(type: "min", arg: 5)], "Must be at least 5"),
      (11, [ParsedRule(type: "max", arg: 10.5)], "Must be no more than 10.5"),
      ("ab", [ParsedRule(type: "minLength", arg: 3)], "Must be at least 3 characters"),
      ("😀😀", [ParsedRule(type: "maxLength", arg: 3)], "Must be no more than 3 characters"),
      ("abc", [ParsedRule(type: "pattern", arg: "^[0-9]+$")], "Invalid format"),
      (
        "x", [ParsedRule(type: "unknownRule"), ParsedRule(type: "minLength", arg: 2)],
        "Must be at least 2 characters"
      ),
    ]
    for (value, rules, expected) in cases {
      #expect(validate(value, rules) == expected, "\(value) \(rules)")
    }
  }

  @Test func customValidatorsWin() {
    let custom: [String: ValidatorFn] = ["required": { _, _ in "custom" }]
    #expect(
      validate("filled", [ParsedRule(type: "required")], customValidators: custom) == "custom")
  }
}
