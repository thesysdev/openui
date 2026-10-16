import Testing

@testable import OpenUILang

/// A library built straight from the test fixture schema.
struct FixtureLibrary: ComponentLibrary {
  let schemaName: String
  var paramMap: ParamMap { Fixtures.paramMap(schemaName) }
  var rootName: String? { Fixtures.rootName(schemaName) }
  func isReactiveProp(_ component: String, _ prop: String) -> Bool {
    Fixtures.schemaContext(schemaName).isReactiveProp(component, prop)
  }
}

@MainActor
@Suite struct RuntimeTests {
  func makeRuntime(_ schema: String = "test", initialState: OpenUIObject? = nil) -> OpenUIRuntime {
    OpenUIRuntime(library: FixtureLibrary(schemaName: schema), initialState: initialState)
  }

  @Test func streamsAndSeedsStateFromDeclarations() {
    let runtime = makeRuntime()
    runtime.update(response: "$count = 3\nroot = Card([Text(\"n \" + $co", isStreaming: true)
    #expect(runtime.parseResult?.meta.incomplete == true)
    #expect(runtime.store.get("$count") == 3)

    runtime.update(response: "$count = 3\nroot = Card([Text(\"n \" + $count)])", isStreaming: false)
    #expect(
      runtime.evaluatedRoot()?.props["children"]?.arrayValue?.first?.elementValue?
        .props["text"] == "n 3")
  }

  /// `preload` renders a response before the host is told about it; the first
  /// `update` with the same text reports it once, as if nothing came before.
  @Test func preloadDefersCallbacksToTheFirstUpdate() {
    let runtime = makeRuntime()
    var reported = 0
    var stateUpdates = 0
    runtime.onParseResult = { _ in reported += 1 }
    runtime.onStateUpdate = { _ in stateUpdates += 1 }
    let response = "$count = 3\nroot = Card([Text(\"n \" + $count)])"

    runtime.preload(response: response, isStreaming: false)
    #expect(reported == 0)
    #expect(stateUpdates == 0)
    #expect(runtime.store.get("$count") == 3)
    #expect(
      runtime.evaluatedRoot()?.props["children"]?.arrayValue?.first?.elementValue?
        .props["text"] == "n 3")

    runtime.update(response: response, isStreaming: false)
    #expect(reported == 1)
    runtime.update(response: response, isStreaming: false)
    #expect(reported == 1)
    #expect(stateUpdates == 0)
  }

  @Test func keepsUserChangesWhenDeclarationsChange() {
    let runtime = makeRuntime()
    runtime.update(response: "$name = \"\"\nroot = Card([Text($name)])", isStreaming: true)
    runtime.store.set("$name", "Ada")
    // A new declaration arrives while streaming; the user's value must survive.
    runtime.update(
      response: "$name = \"\"\n$other = 1\nroot = Card([Text($name)])", isStreaming: false)
    #expect(runtime.store.get("$name") == "Ada")
    #expect(runtime.store.get("$other") == 1)
  }

  @Test func initialStateSplitsBindingsAndFormData() {
    let runtime = makeRuntime(initialState: ["$name": "Restored", "contact": ["email": "a@b.co"]])
    runtime.update(response: "$name = \"\"\nroot = Card([Text($name)])", isStreaming: false)
    #expect(runtime.store.get("$name") == "Restored")
    #expect(runtime.store.get("contact") == ["email": "a@b.co"])
  }

  @Test func runsActionPlanSteps() async {
    let runtime = makeRuntime()
    var events: [ActionEvent] = []
    runtime.onAction = { events.append($0) }
    runtime.update(
      response: """
        $n = 1
        root = Card([b])
        b = Button("Go", Action([@Set($n, $n + 1), @ToAssistant("Bumped", "ctx"), @OpenUrl("https://openui.com")]))
        """, isStreaming: false)
    let action = runtime.evaluatedRoot()?.props["children"]?.arrayValue?.first?.elementValue?
      .props["action"]

    await runtime.triggerAction("Go", action: action)

    #expect(runtime.store.get("$n") == 2)
    #expect(events.map(\.type) == ["continue_conversation", "open_url"])
    #expect(events[0].humanFriendlyMessage == "Bumped")
    #expect(events[0].params == ["context": "ctx"])
    #expect(events[1].params == ["url": "https://openui.com"])

    await runtime.triggerAction(
      "Reset", action: .actionPlan(ActionPlan(steps: [.reset(targets: ["$n"])])))
    #expect(runtime.store.get("$n") == 1)
  }

  @Test func plainAndLegacyActionsContinueTheConversation() async {
    let runtime = makeRuntime()
    var events: [ActionEvent] = []
    runtime.onAction = { events.append($0) }
    runtime.update(response: "root = Card([Text(\"x\")])", isStreaming: false)

    await runtime.triggerAction("Send it")
    await runtime.triggerAction(
      "Docs", action: ["type": "open_url", "url": "https://openui.com", "params": ["a": 1]])

    #expect(events[0].type == "continue_conversation")
    #expect(events[0].humanFriendlyMessage == "Send it")
    #expect(events[1].type == "open_url")
    #expect(events[1].params == ["a": 1, "url": "https://openui.com"])
  }

  @Test func formFieldsAreWrappedAndPayloadIsScoped() async {
    let runtime = makeRuntime()
    var events: [ActionEvent] = []
    runtime.onAction = { events.append($0) }
    runtime.update(response: "root = Card([Text(\"x\")])", isStreaming: false)

    runtime.setFieldValue(form: "contact", componentType: "Input", name: "email", value: "a@b.co")
    #expect(runtime.fieldValue(form: "contact", name: "email") == "a@b.co")
    #expect(runtime.store.get("contact")["email"] == ["value": "a@b.co", "componentType": "Input"])

    await runtime.triggerAction("Submit", form: "contact")
    #expect(events.first?.formName == "contact")
    #expect(events.first?.formState?.keys == ["contact"])
  }

  @Test func reactiveBindingWritesState() {
    let runtime = makeRuntime()
    runtime.update(
      response:
        "$v = \"start\"\nroot = Card([Input(\"name\", $v), Input(\"upper\", $u = $value + \"!\")])",
      isStreaming: false)
    let inputs = runtime.evaluatedRoot()?.props["children"]?.arrayValue ?? []

    let plain = runtime.stateField(
      name: "name", binding: inputs[0].elementValue!.props["value"]!, form: nil)
    #expect(plain.isReactive)
    #expect(plain.value == "start")
    plain.setValue("typed")
    #expect(runtime.store.get("$v") == "typed")

    let derived = runtime.stateField(
      name: "upper", binding: inputs[1].elementValue!.props["value"]!, form: nil)
    derived.setValue("hey")
    #expect(runtime.store.get("$u") == "hey!")
  }

  /// lang-core nests the binding of a reactive input inside `@Each` four levels
  /// deep, so typing writes `undefined` into the state. The Swift port keeps the
  /// binding intact and writes the typed value.
  @Test func reactiveBindingInsideEachWritesState() {
    let runtime = makeRuntime("chat")
    runtime.update(
      response: """
        $items = ["a"]
        $v = "start"
        root = Card([Form("f", Buttons([Button("ok")]), @Each($items, it, FormControl("L", Input("n", "p", "text", null, $v))))])
        """, isStreaming: false)
    let form = runtime.evaluatedRoot()?.props["children"]?.arrayValue?.first?.elementValue
    let input = form?.props["fields"]?.arrayValue?.first?.elementValue?.props["input"]?
      .elementValue
    let binding = input?.props["value"] ?? .undefined
    #expect(binding == .reactiveAssign(ReactiveAssign(target: "$v", expr: .stateRef("$value"))))

    runtime.stateField(name: "n", binding: binding, form: "f").setValue("typed")
    #expect(runtime.store.get("$v") == "typed")
  }

  @Test func stateUpdatesReachTheHostAfterInitialization() {
    let runtime = makeRuntime()
    var updates = 0
    runtime.onStateUpdate = { _ in updates += 1 }
    runtime.update(response: "$n = 1\nroot = Card([Text(\"x\")])", isStreaming: false)
    #expect(updates == 0)
    runtime.store.set("$n", 2)
    #expect(updates == 1)
  }

  @Test func emptyResponseClearsTheResult() {
    let runtime = makeRuntime()
    runtime.update(response: "root = Card([Text(\"x\")])", isStreaming: false)
    runtime.update(response: "", isStreaming: false)
    #expect(runtime.parseResult == nil)
    #expect(runtime.evaluatedRoot() == nil)
  }
}
