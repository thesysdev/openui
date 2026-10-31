#if os(macOS)
import AppKit
import Foundation
import OpenUILang
import SwiftUI
import XCTest
@testable import OpenUISwiftUI

final class StreamingMediaRetentionTests: XCTestCase {
  @MainActor func testEachMediaAndActionBecomeReadyInsideTheSameMountedCard() throws {
    _ = NSApplication.shared
    let loader = RetentionImageLoader()
    let statuses = RetentionStatusLog()
    let mounts = EachReadinessMounts()
    let standard = try OpenUIStandardComponents.library()
    let image = try XCTUnwrap(standard.library.components.first { $0.name == "ImageTextLarge" })
    let button = try XCTUnwrap(standard.library.components.first { $0.name == "Button" })
    let library = try standard.extending(overriding: [
      OpenUIComponent(image) { context in
        NativeRemoteImage(src: context.string("src"), alt: "A", layout: .aspect(1.5),
          onStatus: { status, _ in statuses.statuses["A", default: []].append(status) })
      },
      OpenUIComponent(button) { context in
        OpenUIActionSurface(context: context, message: "Open", action: context.value("action")) {
          EachReadinessButton(log: mounts).frame(width: 120, height: 32)
        }
      },
    ])
    let state = OpenUIState(schema: library.library.toSchema())
    state.push("root=CompositeCardBlock(@Each([{id:\"a\",name:\"A\",src:\"https://images.example/a.png\"}],\"item\",CompositeCardItem(item.id,ImageTextLarge(item.src,item.name,item.name),[],{button:Button(\"Open\",@OpenUrl(\"https://example.com\"))}")
    let host = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
      .openUIResourceContext(OpenUIResourceContext(loader: loader)).frame(width: 390))
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 390, height: 700),
      styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false; window.contentView = host
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
    defer { window.close() }
    func settle(_ ready: () -> Bool) {
      let deadline = Date().addingTimeInterval(2)
      repeat {
        host.layoutSubtreeIfNeeded()
        RunLoop.main.run(until: Date().addingTimeInterval(0.01))
      } while !ready() && Date() < deadline
      XCTAssertTrue(ready())
    }
    settle { mounts.button != nil }
    let first = try XCTUnwrap(mounts.button)
    XCTAssertEqual(mounts.enabled, false, "The actual SDK action surface supplies the disabled environment")
    XCTAssertEqual(loader.count("a.png"), 0, "An unfinished Each must not load its generated media")
    state.push(")),\"carousel\",true)\nunrelated=TextContent(\"still arriving")
    settle { mounts.enabled == true && statuses.statuses["A", default: []].contains(.loaded) }
    XCTAssertFalse(state.isComplete)
    XCTAssertTrue(mounts.button === first)
    XCTAssertEqual(mounts.created, 1, "Readiness must propagate without remounting the card")
    XCTAssertEqual(loader.count("a.png"), 1)
    XCTAssertTrue(state.errors.isEmpty)
  }
  @MainActor func testSlowRequestSurvivesRelocationBeforeItHasLoaded() throws {
    _ = NSApplication.shared
    let loader = RetentionImageLoader(delay: 500_000_000)
    let log = RetentionStatusLog()
    let standard = try OpenUIStandardComponents.library()
    let definition = try XCTUnwrap(standard.library.components.first { $0.name == "ImageText" })
    let library = try standard.extending(overriding: [OpenUIComponent(definition) { context in
      NativeRemoteImage(src: context.string("src"), alt: context.string("alt") ?? "",
        layout: .thumbnail(CGSize(width: 72, height: 72)),
        onStatus: { status, _ in log.statuses[context.string("alt") ?? "", default: []].append(status) })
    }])
    let state = OpenUIState(schema: library.library.toSchema())
    state.push("root=CompositeCardBlock([CompositeCardItem(\"a\",ImageText(\"https://images.example/a.png\",\"A\",\"First\"),[])")
    let hosting = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
      .openUIResourceContext(OpenUIResourceContext(loader: loader)).frame(width: 1040, height: 350))
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1040, height: 350),
      styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false
    window.contentView = hosting
    hosting.frame = NSRect(x: 0, y: 0, width: 1040, height: 350)
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
    defer { window.close() }
    func settle(_ ready: () -> Bool) {
      let deadline = Date().addingTimeInterval(3)
      repeat {
        hosting.layoutSubtreeIfNeeded()
        RunLoop.main.run(until: Date().addingTimeInterval(0.01))
      } while !ready() && Date() < deadline
      XCTAssertTrue(ready())
    }
    settle { loader.count("a.png") == 1 }
    XCTAssertFalse(log.statuses["A", default: []].contains(.loaded), "Relocate during the pending request, not after a cached success")
    state.push(",CompositeCardItem(\"b\",ImageText(\"https://images.example/b.png\",\"B\",\"Second\"),[]),CompositeCardItem(\"c\",ImageText(\"https://images.example/c.png\",\"C\",\"Third\"),[])],\"carousel\",true)")
    state.complete()
    settle { log.statuses["A", default: []].contains(.loaded) }
    XCTAssertEqual(loader.count("a.png"), 1, "A pending image belongs to the presentation and must not restart on relocation")
  }

  @MainActor func testDeclaredMediaRoleKeepsItsAllocatedSlotInEveryResourceState() {
    _ = NSApplication.shared
    // A cover's 3:2 role is already known before its enclosing grid/carousel
    // argument arrives. Loading, unavailable and retained pixels use that slot.
    for width in [CGFloat(160), 320, 560] {
      for mode in 0..<3 {
        let view = NativeRemoteImage(src: mode == 0 ? nil : "https://images.example/cover.png",
          layout: .aspect(1.5), cachedImage: mode == 2 ? Image(systemName: "photo") : nil)
          .frame(width: width)
        let hosting = NSHostingView(rootView: view)
        XCTAssertEqual(hosting.fittingSize.width, width, accuracy: 1)
        XCTAssertEqual(hosting.fittingSize.height, width / 1.5, accuracy: 1,
          "A known cover must not shrink to a thumbnail and leave its card mostly empty")
      }
    }
    let thumbnail = NSHostingView(rootView: NativeRemoteImage(src: nil,
      layout: .thumbnail(CGSize(width: 72, height: 72))))
    XCTAssertEqual(thumbnail.fittingSize.width, 72, accuracy: 1)
    XCTAssertEqual(thumbnail.fittingSize.height, 72, accuracy: 1)
    let intrinsic = NSHostingView(rootView: NativeRemoteImage(src: nil, layout: .intrinsic)
      .frame(width: 320))
    XCTAssertEqual(intrinsic.fittingSize.height, 320 / (4.0 / 3), accuracy: 1,
      "A document illustration uses its allocated width instead of a temporary thumbnail cap")
  }

  @MainActor func testRestoredMountedImageSurvivesCacheEvictionAndLaterViewUpdates() {
    _ = NSApplication.shared
    let cache = NativeMediaCache()
    let loader = RetentionImageLoader()
    let log = RetentionStatusLog()
    func key(_ name: String) -> NativeResourceRequestID {
      .init(request: URLRequest(url: URL(string: "https://images.example/\(name).png")!),
        loader: ObjectIdentifier(loader), attempt: 0)
    }
    let first = key("a")
    cache.insert(.init(image: Image(systemName: "photo"), size: CGSize(width: 100, height: 200),
      cost: 80_000, resourceOwner: loader), for: first)
    cache.markPresented(first)
    func view(_ alt: String) -> some View {
      NativeRemoteImage(src: "https://images.example/a.png", alt: alt, layout: .intrinsic,
        onStatus: { status, _ in log.statuses["A", default: []].append(status) })
        .environment(\.openUIMediaCache, cache)
        .openUIResourceContext(OpenUIResourceContext(loader: loader))
        .frame(width: 100, height: 200)
    }
    let hosting = NSHostingView(rootView: view("A"))
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 100, height: 200),
      styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false
    window.contentView = hosting
    hosting.frame = NSRect(x: 0, y: 0, width: 100, height: 200)
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000))
    window.orderFront(nil)
    defer { window.close() }
    func settle() {
      let deadline = Date().addingTimeInterval(0.3)
      repeat {
        hosting.layoutSubtreeIfNeeded()
        RunLoop.main.run(until: Date().addingTimeInterval(0.02))
      } while Date() < deadline
    }
    settle()
    XCTAssertTrue(log.statuses["A", default: []].contains(.loaded))
    for index in 0..<9 {
      cache.insert(.init(image: Image(systemName: "photo"), size: CGSize(width: 1, height: 1),
        cost: 4, resourceOwner: loader), for: key("later-\(index)"))
    }
    XCTAssertNil(cache[first], "This must exercise eviction after a cache-backed mount")
    hosting.rootView = view("A updated after later cards arrived")
    settle()
    XCTAssertFalse(log.statuses["A", default: []].contains(.loading),
      "Evicting a shared cache entry must not erase a mounted image's successful phase")
    XCTAssertEqual(loader.count("a.png"), 0, "A mounted cache-restored image must not refetch")
  }

  @MainActor func testLoadedFirstCardDoesNotReloadWhenLaterCardsAndLayoutArrive() throws {
    _ = NSApplication.shared
    let loader = RetentionImageLoader()
    let log = RetentionStatusLog()
    let standard = try OpenUIStandardComponents.library()
    let definition = try XCTUnwrap(standard.library.components.first { $0.name == "ImageText" })
    let library = try standard.extending(overriding: [OpenUIComponent(definition) { context in
      NativeRemoteImage(src: context.string("src"), alt: context.string("alt") ?? "",
        layout: .thumbnail(CGSize(width: 72, height: 72)),
        onStatus: { status, _ in log.statuses[context.string("alt") ?? "", default: []].append(status) })
    }])
    let state = OpenUIState(schema: library.library.toSchema())
    state.push("root=CompositeCardBlock([CompositeCardItem(\"a\",ImageText(\"https://images.example/a.png\",\"A\",\"First\"),[TextContent(\"A body\")])")
    let hosting = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry)
      .openUIResourceContext(OpenUIResourceContext(loader: loader))
      .frame(width: 1040, height: 350))
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1040, height: 350),
      styleMask: [.borderless], backing: .buffered, defer: false)
    window.isReleasedWhenClosed = false
    window.contentView = hosting
    hosting.frame = NSRect(x: 0, y: 0, width: 1040, height: 350)
    window.setFrameOrigin(NSPoint(x: -10000, y: -10000))
    window.orderFront(nil)
    defer { window.close() }
    func settle(until ready: () -> Bool) {
      let deadline = Date().addingTimeInterval(2)
      repeat {
        hosting.layoutSubtreeIfNeeded()
        RunLoop.main.run(until: Date().addingTimeInterval(0.02))
      } while !ready() && Date() < deadline
      XCTAssertTrue(ready())
    }
    settle { log.statuses["A"]?.contains(.loaded) == true }
    XCTAssertGreaterThan(hosting.bounds.width, 1000, "The test must mount a real viewport before checking lazy cards")
    RunLoop.main.run(until: Date().addingTimeInterval(OpenUITheme().motion.mediaRevealDuration + 0.05))
    let firstLoaded = try XCTUnwrap(log.statuses["A"]?.firstIndex(of: .loaded))
    state.push(",CompositeCardItem(\"b\",ImageText(\"https://images.example/b.png\",\"B\",\"Second\"),[TextContent(\"B body\")])")
    settle { log.statuses["B"]?.contains(.loaded) == true }
    state.push(",CompositeCardItem(\"c\",ImageText(\"https://images.example/c.png\",\"C\",\"Third\"),[TextContent(\"C body\")])")
    settle { log.statuses["C"]?.contains(.loaded) == true }
    state.push("],\"carousel\",true)")
    state.complete()
    settle { log.statuses["A"]?.last == .loaded }
    XCTAssertEqual(loader.count("a.png"), 1, "Late container arguments must not refetch the loaded first image")
    XCTAssertFalse(Array(log.statuses["A", default: []].dropFirst(firstLoaded + 1)).contains(.loading),
      "A loaded image must not return to a placeholder when its native layout relocates it")
    XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    state.setSource("root=Image(\"A\",\"https://images.example/a.png\")")
    settle { loader.count("a.png") == 2 }
  }

  @MainActor func testRetainedMediaIsPresentationScopedAndBounded() {
    let first = NativeMediaCache(), second = NativeMediaCache()
    let loader = RetentionImageLoader()
    func key(_ index: Int) -> NativeResourceRequestID {
      NativeResourceRequestID(request: URLRequest(url: URL(string: "https://images.example/\(index)")!),
        loader: ObjectIdentifier(loader), attempt: 0)
    }
    for index in 0..<10 {
      first.insert(.init(image: Image(systemName: "photo"), size: CGSize(width: 1, height: 1), cost: 4,
        resourceOwner: loader), for: key(index))
    }
    XCTAssertNil(first[key(0)])
    XCTAssertNotNil(first[key(9)])
    XCTAssertNil(second[key(9)], "Independent presentations cannot inherit another reply's media")
    first.insert(.init(image: Image(systemName: "photo"), size: CGSize(width: 5000, height: 5000),
      cost: 100_000_000, resourceOwner: loader), for: key(10))
    XCTAssertNil(first[key(10)], "Large decoded images must not defeat the cache memory bound")
    first.removeAll()
    XCTAssertNil(first[key(9)])
  }
}

@MainActor private final class RetentionStatusLog {
  var statuses: [String: [NativeMediaStatus]] = [:]
}
@MainActor private final class EachReadinessMounts {
  var button: NSView?
  var created = 0
  var enabled: Bool?
}
private struct EachReadinessButton: NSViewRepresentable {
  let log: EachReadinessMounts
  @Environment(\.isEnabled) private var enabled
  func makeNSView(context: Context) -> NSView {
    let button = NSView()
    log.button = button; log.created += 1; return button
  }
  func updateNSView(_ button: NSView, context: Context) { log.enabled = enabled }
}
private final class RetentionImageLoader: OpenUIResourceLoading {
  private let delay: UInt64
  init(delay: UInt64 = 0) { self.delay = delay }
  private let lock = NSLock()
  private var requests: [String: Int] = [:]
  func request(for source: String, relativeTo baseURL: URL?) -> URLRequest? {
    URL(string: source, relativeTo: baseURL).map { URLRequest(url: $0) }
  }
  private func record(_ request: URLRequest) {
    lock.lock(); defer { lock.unlock() }
    requests[request.url!.lastPathComponent, default: 0] += 1
  }
  func count(_ name: String) -> Int {
    lock.lock(); defer { lock.unlock() }; return requests[name, default: 0]
  }
  func data(for request: URLRequest) async throws -> Data {
    record(request)
    if delay > 0 { try await Task.sleep(nanoseconds: delay) }
    return Data(base64Encoded: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII=")!
  }
}
#endif
