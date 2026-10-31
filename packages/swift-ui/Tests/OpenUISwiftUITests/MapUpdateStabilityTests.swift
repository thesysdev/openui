#if os(macOS)
import AppKit
import MapKit
import OpenUILang
import SwiftUI
import XCTest
@testable import OpenUISwiftUI

final class MapUpdateStabilityTests: XCTestCase {
  @MainActor func testLaterStreamingTextKeepsTheSameMapAndAnnotations() throws {
    _ = NSApplication.shared
    let library = try OpenUIMapComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.push("root=Stack([places,tail],\"column\",\"m\")\nplaces=Map([{id:\"one\",title:\"One\",lat:30.25,lng:120.15},{id:\"two\",title:\"Two\",lat:30.26,lng:120.16}],[],null,\"compact\",\"wgs84\")\ntail=TextContent(\"After the map")
    let hosting = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry).frame(width: 350, height: 500))
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 350, height: 500), styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false; window.contentView = hosting
    hosting.frame = NSRect(x: 0, y: 0, width: 350, height: 500)
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
    defer { window.close() }
    func mapIn(_ view: NSView) -> MKMapView? {
      if let map = view as? MKMapView { return map }
      return view.subviews.lazy.compactMap(mapIn).first
    }
    hosting.layoutSubtreeIfNeeded(); RunLoop.main.run(until: Date().addingTimeInterval(0.3))
    let map = try XCTUnwrap(mapIn(hosting))
    func ids(_ map: MKMapView) -> Set<ObjectIdentifier> {
      Set(map.annotations.filter { ["One", "Two"].contains($0.title ?? "") }.map { ObjectIdentifier($0 as AnyObject) })
    }
    let original = ids(map); XCTAssertEqual(original.count, 2)
    for _ in 0..<20 {
      state.push(" more text")
      hosting.layoutSubtreeIfNeeded(); RunLoop.main.run(until: Date().addingTimeInterval(0.01))
      XCTAssertTrue(mapIn(hosting) === map, "Later text cannot recreate the accepted native map")
      XCTAssertEqual(ids(map), original, "Later text cannot replace the existing annotations")
    }
  }

  @MainActor func testShortMapPageSitsAtTheBottomWithoutAnEmptyMaximumHeightFrame() throws {
    _ = NSApplication.shared
    let standard = try OpenUIMapComponents.library()
    let text = try XCTUnwrap(standard.library.components.first { $0.name == "Text" })
    let reading = MapPageFrame()
    let library = try standard.extending(overriding: [OpenUIComponent(text) { _ in
      Color.clear.frame(height: 72).background(GeometryReader { geometry in
        Color.clear.onAppear { reading.frame = geometry.frame(in: .named("map-card-reading")) }
          .onChange(of: geometry.frame(in: .named("map-card-reading"))) { reading.frame = $0 }
      })
    }])
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("root=Map([{id:\"one\",title:\"One\",lat:48.86,lng:2.34}],[],null,\"compact\",\"wgs84\",{one:Text(\"text\",\"Place\")})")
    XCTAssertTrue(state.errors.isEmpty)
    let host = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
      .frame(width: 350, height: 240).coordinateSpace(name: "map-card-reading"))
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 350, height: 240),
      styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false; window.contentView = host
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
    defer { window.close() }
    host.layoutSubtreeIfNeeded(); RunLoop.main.run(until: Date().addingTimeInterval(0.3))
    XCTAssertEqual(reading.frame.height, 72, accuracy: 1)
    XCTAssertEqual(240 - reading.frame.maxY, 18, accuracy: 1,
      "A short place page must align to the bottom inset instead of the top of the maximum-height container")
  }

  @MainActor private func data(_ url: String) throws -> NativeMapData {
    let library = try OpenUIMapComponents.library()
    let state = OpenUIState(schema: library.library.toSchema())
    state.setSource("root=Map([{id:\"one\",title:\"One\",lat:30.25,lng:120.15,url:\"\(url)\"}],[],null,\"compact\",\"wgs84\")")
    return NativeMapData(context: .init(element: try XCTUnwrap(state.root), registry: library.registry, state: state), target: .wgs84)
  }
  @MainActor func testMetadataChangesDoNotReassignUnchangedCoordinates() throws {
    _ = NSApplication.shared
    let map = MKMapView(frame: NSRect(x: 0, y: 0, width: 350, height: 240))
    let coordinator = NativeMapCoordinator(onSelection: { _ in })
    coordinator.update(map, data: try data("https://example.invalid/first"), selected: nil, canInteract: true, accent: .blue)
    let annotation = try XCTUnwrap(map.annotations.first as? NSObject)
    let observer = CoordinateObserver()
    annotation.addObserver(observer, forKeyPath: "coordinate", options: [], context: nil)
    defer { annotation.removeObserver(observer, forKeyPath: "coordinate") }
    coordinator.update(map, data: try data("https://example.invalid/changed-link"), selected: nil, canInteract: true, accent: .blue)
    XCTAssertEqual(observer.changes, 0, "A link/metadata update must not send MapKit a new coordinate")
  }
  @MainActor func testRepeatedSelectionStateKeepsTheExistingMarkerBitmap() throws {
    _ = NSApplication.shared
    let map = MKMapView(frame: NSRect(x: 0, y: 0, width: 350, height: 240))
    let coordinator = NativeMapCoordinator(onSelection: { _ in })
    coordinator.update(map, data: try data("https://example.invalid/first"), selected: nil, canInteract: true, accent: .blue)
    let annotation = try XCTUnwrap(map.annotations.first)
    let marker = try XCTUnwrap(coordinator.mapView(map, viewFor: annotation))
    marker.setSelected(true, animated: false)
    let image = try XCTUnwrap(marker.image)
    marker.setSelected(true, animated: false)
    XCTAssertTrue(marker.image === image, "An unchanged selected marker must not receive a freshly drawn image")
  }
}
private final class MapPageFrame { var frame = CGRect.zero }

private final class CoordinateObserver: NSObject {
  var changes = 0
  override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey: Any]?, context: UnsafeMutableRawPointer?) {
    if keyPath == "coordinate" { changes += 1 }
  }
}
#endif
