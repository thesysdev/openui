import Foundation
import XCTest
@testable import OpenUISwiftUI

final class ResourceStoreTests: XCTestCase {
  @MainActor func testReleasingStateCancelsItsPendingResources() async throws {
    let library = try OpenUIStandardComponents.library()
    var state: OpenUIState? = OpenUIState(schema: library.library.toSchema())
    weak var releasedState = state
    let store = try XCTUnwrap(state).resourceStore
    let media = try XCTUnwrap(state).mediaCache
    let started = expectation(description: "both requests started")
    started.expectedFulfillmentCount = 2
    let cancelled = expectation(description: "both owned requests cancelled")
    cancelled.expectedFulfillmentCount = 2
    let loader = SuspendedResourceLoader(started: started, cancelled: cancelled)
    let scope = store.scoped(.init(loader: loader))
    let dataRequest = try XCTUnwrap(scope.request(for: "https://resource.example/data"))
    let imageRequest = try XCTUnwrap(loader.request(for: "https://resource.example/image", relativeTo: nil))
    let dataTask = Task { try await scope.loader.data(for: dataRequest) }
    let imageTask = Task { try await media.resource(
      NativeResourceRequestID(request: imageRequest, loader: ObjectIdentifier(loader), attempt: 0), loader: loader) }
    defer { store.removeAll(); media.removeAll(); dataTask.cancel(); imageTask.cancel() }
    await fulfillment(of: [started], timeout: 2)
    state = nil
    XCTAssertNil(releasedState, "The test tasks must not retain the rendering state")
    await fulfillment(of: [cancelled], timeout: 1)
  }

  @MainActor func testPendingDataIsSharedAndExplicitReloadBypassesTheCompletedCache() async throws {
    let loader = ByteLoader()
    let store = NativeResourceStore()
    let context = store.scoped(.init(loader: loader))
    let request = try XCTUnwrap(context.request(for: "https://resource.example/diagram"))
    let first = Task { try await context.loader.data(for: request) }
    let second = Task { try await context.loader.data(for: request) }
    let a = try await first.value, b = try await second.value
    XCTAssertEqual(a, b); XCTAssertEqual(loader.count, 1)
    _ = try await context.loader.data(for: request)
    XCTAssertEqual(loader.count, 1)
    var fresh = request; fresh.cachePolicy = .reloadIgnoringLocalCacheData
    _ = try await context.loader.data(for: fresh)
    _ = try await context.loader.data(for: fresh)
    XCTAssertEqual(loader.count, 3, "A user reload must not replay cached invalid bytes forever")
  }
  @MainActor func testResetRejectsRequestsFromThePreviousPresentation() async throws {
    let loader = ByteLoader(), store = NativeResourceStore()
    let original = OpenUIResourceContext(loader: loader)
    let old = store.scoped(original)
    let request = try XCTUnwrap(old.request(for: "https://resource.example/diagram"))
    store.removeAll()
    do { _ = try await old.loader.data(for: request); XCTFail("Old scopes must not refill a reset presentation") }
    catch { XCTAssertTrue(error is CancellationError) }
    XCTAssertEqual(loader.count, 0)
    _ = try await store.scoped(original).loader.data(for: request)
    XCTAssertEqual(loader.count, 1)
  }
  @MainActor func testNestedIndependentScopesDoNotShareAnotherRepliesDataOrCancellation() async throws {
    let loader = ByteLoader(), first = NativeResourceStore(), second = NativeResourceStore()
    let a = first.scoped(.init(loader: loader))
    let b = second.scoped(a)
    let request = try XCTUnwrap(a.request(for: "https://resource.example/diagram"))
    _ = try await a.loader.data(for: request)
    _ = try await b.loader.data(for: request)
    XCTAssertEqual(loader.count, 2, "Independent replies fetch into independent data stores")
    first.removeAll()
    _ = try await b.loader.data(for: request)
    XCTAssertEqual(loader.count, 2, "Resetting one reply cannot discard another reply's data")
  }
}
private final class ByteLoader: OpenUIResourceLoading {
  private let lock = NSLock()
  private var calls = 0
  var count: Int { lock.lock(); defer { lock.unlock() }; return calls }
  func request(for source: String, relativeTo baseURL: URL?) -> URLRequest? {
    URL(string: source, relativeTo: baseURL).map { URLRequest(url: $0) }
  }
  private func record() { lock.lock(); defer { lock.unlock() }; calls += 1 }
  func data(for request: URLRequest) async throws -> Data {
    record(); try await Task.sleep(nanoseconds: 50_000_000)
    return Data("resource bytes".utf8)
  }
}

private final class SuspendedResourceLoader: OpenUIResourceLoading {
  let started: XCTestExpectation
  let cancelled: XCTestExpectation
  init(started: XCTestExpectation, cancelled: XCTestExpectation) {
    self.started = started; self.cancelled = cancelled
  }
  func request(for source: String, relativeTo baseURL: URL?) -> URLRequest? {
    URL(string: source, relativeTo: baseURL).map { URLRequest(url: $0) }
  }
  func data(for request: URLRequest) async throws -> Data {
    started.fulfill()
    do { try await Task.sleep(nanoseconds: 60_000_000_000) }
    catch { cancelled.fulfill(); throw error }
    return Data()
  }
}
