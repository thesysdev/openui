import OpenUILang
import XCTest

@testable import OpenUISwiftUI

final class NativeMapComponentsTests: XCTestCase {
  @MainActor func testInvalidDuplicateDoesNotHideValidPointAndOptionalFactsStayAbsent() throws {
    let library = try OpenUIMapComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    let bad: Value = .object([.init(key: "id", value: .string("a")), .init(key: "title", value: .string("Invalid"))])
    let good: Value = .object([
      .init(key: "id", value: .string("a")), .init(key: "title", value: .string("Zero coordinates")),
      .init(key: "lat", value: .number(0)), .init(key: "lng", value: .number(0)),
      .init(key: "url", value: .string("https://example.invalid/place?a=1")),
    ])
    let element = EvaluatedElement(typeName: "Map", props: [("points", .array([bad, good]))])
    let context = OpenUIComponentContext(element: element, registry: library.registry, state: state)
    let data = NativeMapData(context: context, target: .wgs84)
    XCTAssertEqual(data.points.count, 1)
    XCTAssertEqual(data.points.first?.title, "Zero coordinates")
    XCTAssertEqual(data.points.first?.coordinate.latitude, 0)
    XCTAssertNil(data.points.first?.imageSrc)
    XCTAssertNil(data.points.first?.subtitle)
    XCTAssertNil(data.points.first?.icon)
    XCTAssertEqual(data.points.first?.url, "https://example.invalid/place?a=1")
    XCTAssertTrue(data.routes.isEmpty)
  }
  @MainActor func testMapIsAnOptInExtensionOfAll82StandardComponents() throws {
    let standard = try OpenUIStandardComponents.library()
    let mapped = try OpenUIMapComponents.install(into: standard)
    XCTAssertEqual(standard.library.components.count, 82)
    XCTAssertNil(standard.registry["Map"])
    XCTAssertEqual(mapped.library.components.count, 83)
    XCTAssertNotNil(mapped.registry["Map"])
    XCTAssertNil(standard.library.toSchema().components["Map"])
    XCTAssertEqual(
      mapped.library.toSchema().components["Map"]?.map(\.name),
      ["points", "routes", "value", "size", "crs", "content"])
    XCTAssertTrue(mapped.prompt().contains("Map("))
  }

  @MainActor func testMapContentIsEvaluatedByTheSameCoreAndTracksSelection() throws {
    let library = try OpenUIMapComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("""
      $selected="one"
      root=Map([{id:"one",title:"One",lat:30,lng:120},{id:"two",title:"Two",lat:31,lng:121}],[],
        $selected,"regular","wgs84",{one:Card([TextContent($selected)]),two:Card([TextContent($selected)])})
      """)
    XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    let first = try XCTUnwrap(state.root)
    guard case .element(let firstPage) = NativeValue.prop(PropValue.value(first, "content"), "one") else { return XCTFail("Map content keeps its ordinary component nodes") }
    XCTAssertEqual(firstPage.typeName, "Card")
    state.setState("$selected", value: .string("two"))
    XCTAssertTrue(state.errors.isEmpty)
    let updated = try XCTUnwrap(state.root)
    guard case .element(let card) = NativeValue.prop(PropValue.value(updated, "content"), "two") else { return XCTFail("Missing second page") }
    XCTAssertEqual(PropValue.string(try XCTUnwrap(PropValue.children(card).first), "text"), "two")
    XCTAssertEqual(try XCTUnwrap(state.binding(for: updated, prop: "value")).wrappedValue, .string("two"))
  }

  @MainActor func testMapComposesInsideTabsUsingTheOriginalLanguageRuntime() throws {
    let library = try OpenUIMapComponents.library()
    let source = """
      $selected = "one"
      root = Stack([
        Tabs([TabItem("today", "Today", [
          Map([
            {id:"one", title:"Point one", lat:30.245, lng:120.164},
            {id:"two", title:"Point two", lat:30.251, lng:120.172}
          ], [[
            {lat:30.245,lng:120.164},
            {lat:30.248,lng:120.168},
            {lat:30.251,lng:120.172}
          ]], $selected, "regular", "gcj02")
        ])])
      ])
      """
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource(source)
    XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    XCTAssertEqual(state.stateValue("$selected"), .string("one"))
    XCTAssertEqual(library.toSpec().components.last?.name, "Map")
    let signatures = library.toSpec().components.map(\.signature)
    XCTAssertTrue(signatures.contains { $0.contains("Map(") })
  }

  @MainActor func testMapComposesInsideUpstreamTableCell() throws {
    let library = try OpenUIMapComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("""
      root=Table([
        Col("Kind",["text","chart","image","place"]),
        Col("Preview",[
          TextContent("A"),
          BarChart(["A","B"],[Series("Visits",[2,3])]),
          Image("Photo","https://example.invalid/photo.jpg"),
          Map([{id:"one",title:"Point",lat:30.245,lng:120.164}],[],null,"compact","gcj02")
        ])
      ])
      """)
    XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    let table = try XCTUnwrap(state.root)
    let columns = PropValue.children(table, "columns")
    XCTAssertEqual(columns.count, 2)
    let values = OpenUIRenderChild.children(of: try XCTUnwrap(PropValue.value(columns[1], "data")))
    XCTAssertEqual(values.count, 4)
    guard case .element(let map) = values.last?.value else {
      XCTFail("Map must survive evaluation inside Col.data")
      return
    }
    XCTAssertEqual(map.typeName, "Map")
  }

  func testCoordinateAdapterIsExplicitAndReversible() {
    let raw = Value.object([
      ObjectField(key: "lat", value: .number(30.245)),
      ObjectField(key: "lng", value: .number(120.164)),
    ])
    let wgs = NativeMapCoordinate.read(raw, source: .gcj02, target: .wgs84)!
    XCTAssertGreaterThan(abs(wgs.latitude - 30.245), 0.001)
    let back = Value.object([
      ObjectField(key: "lat", value: .number(wgs.latitude)),
      ObjectField(key: "lng", value: .number(wgs.longitude)),
    ])
    let gcj = NativeMapCoordinate.read(back, source: .wgs84, target: .gcj02)!
    XCTAssertEqual(gcj.latitude, 30.245, accuracy: 0.000001)
    XCTAssertEqual(gcj.longitude, 120.164, accuracy: 0.000001)
    let outside = Value.object([
      ObjectField(key: "lat", value: .number(48.858)),
      ObjectField(key: "lng", value: .number(2.294)),
    ])
    XCTAssertEqual(
      NativeMapCoordinate.read(outside, source: .gcj02, target: .wgs84),
      NativeMapCoordinate(latitude: 48.858, longitude: 2.294))
    let invalid = Value.object([
      ObjectField(key: "lat", value: .number(999)),
      ObjectField(key: "lng", value: .number(2.294)),
    ])
    XCTAssertNil(NativeMapCoordinate.read(invalid, source: .wgs84, target: .gcj02))
  }
}
