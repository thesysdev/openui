import Foundation
import XCTest
@testable import OpenUISwiftUI

final class ResourceStoreTests: XCTestCase {
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
