import Testing

@testable import OpenUILang

extension Fixtures {
  static func schemaContext(_ schemaName: String) -> SchemaContext {
    let reactive = schemas[schemaName]["reactive"].objectValue ?? OpenUIObject()
    return SchemaContext { component, prop in
      (reactive[component]?.arrayValue ?? []).contains(.string(prop))
    }
  }
}

/// Prop evaluation must match lang-core's `evaluateElementProps`.
@Suite struct EvaluationConformanceTests {
  @Test(arguments: FixtureCase.all("evaluation"))
  func evaluateTree(_ fixture: FixtureCase) {
    let schema = fixture.value["schema"].stringValue!
    let result = OpenUILang.parse(
      fixture.value["input"].stringValue!, Fixtures.paramMap(schema),
      rootName: Fixtures.rootName(schema))

    let store = Store()
    store.initialize(defaults: result.stateDeclarations, persisted: OpenUIObject())
    for (key, value) in fixture.value["state"].objectValue ?? OpenUIObject() {
      store.set(key, value)
    }
    let queryResults = fixture.value["queryResults"].objectValue ?? OpenUIObject()
    let context = EvaluationContext(
      getState: { unwrapFieldValue(store.get($0)) },
      resolveRef: { queryResults[$0] ?? .null })

    let root = result.root.map {
      evaluateElementProps($0, context, Fixtures.schemaContext(schema))
    }
    let diff = firstDifference(
      normalized(root.map(\.jsonRepresentation) ?? .null),
      normalized(fixture.value["expected"]["root"]))
    #expect(diff == nil, "\(fixture.name): \(diff ?? "")")
  }
}
