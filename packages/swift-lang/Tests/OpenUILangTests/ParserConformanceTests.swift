import Testing

@testable import OpenUILang

/// The Swift parser must produce exactly what lang-core produces for the same input.
@Suite struct ParserConformanceTests {
  @Test(arguments: FixtureCase.all("parser"))
  func parse(_ fixture: FixtureCase) {
    let schema = fixture.value["schema"].stringValue!
    let result = OpenUILang.parse(
      fixture.value["input"].stringValue!, Fixtures.paramMap(schema),
      rootName: Fixtures.rootName(schema))
    let diff = firstDifference(
      normalized(result.jsonRepresentation), normalized(fixture.value["expected"]))
    #expect(diff == nil, "\(fixture.name): \(diff ?? "")")
  }

  @Test(arguments: FixtureCase.all("streaming"))
  func streamingPush(_ fixture: FixtureCase) {
    let schema = fixture.value["schema"].stringValue!
    let input = Array(fixture.value["input"].stringValue!.utf16)
    let parser = StreamParser(Fixtures.paramMap(schema), rootName: Fixtures.rootName(schema))
    var last = 0
    for checkpoint in fixture.value["checkpoints"].arrayValue ?? [] {
      let at = Int(checkpoint["at"].numberValue!)
      let chunk = String(decoding: input[last..<at], as: UTF16.self)
      last = at
      let result = parser.push(chunk)
      let diff = firstDifference(
        normalized(result.jsonRepresentation), normalized(checkpoint["expected"]))
      #expect(diff == nil, "\(fixture.name) @\(at): \(diff ?? "")")
      if diff != nil { return }
    }
  }

  @Test(arguments: FixtureCase.all("stream-set"))
  func streamingSet(_ fixture: FixtureCase) {
    let schema = fixture.value["schema"].stringValue!
    let parser = StreamParser(Fixtures.paramMap(schema), rootName: Fixtures.rootName(schema))
    for (index, step) in (fixture.value["steps"].arrayValue ?? []).enumerated() {
      let result = parser.set(step["text"].stringValue!)
      let diff = firstDifference(
        normalized(result.jsonRepresentation), normalized(step["expected"]))
      #expect(diff == nil, "\(fixture.name) step \(index): \(diff ?? "")")
    }
  }
}
