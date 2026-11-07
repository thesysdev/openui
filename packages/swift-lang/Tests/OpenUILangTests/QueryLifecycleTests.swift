import Foundation
import XCTest
@testable import OpenUILang

final class QueryLifecycleTests: XCTestCase {
    private final class Provider: ToolProvider {
        private let lock = NSLock()
        private var history: [String] = []
        var calls: [String] { lock.lock(); defer { lock.unlock() }; return history }
        private func record(_ name: String) { lock.lock(); history.append(name); lock.unlock() }
        func callTool(name: OpenUIString, arguments: OpenUIObject) async throws -> Value {
            record(name.displayString)
            if name == "slow" { try? await Task.sleep(nanoseconds: 50_000_000) }
            if name == "fail" { throw NSError(domain: "fixture", code: 1) }
            return .string(name)
        }
    }
    private func request(_ tool: String, id: String = "q", interval: Double? = nil) -> QueryRequest {
        QueryRequest(statementId: id, tool: tool, args: .object([]), defaults: .string("default"), refreshInterval: interval)
    }
    private func eventually(_ predicate: @escaping () -> Bool) async {
        for _ in 0..<300 {
            if predicate() { return }
            try? await Task.sleep(nanoseconds: 1_000_000)
        }
        XCTFail("Lifecycle did not settle")
    }
    func testCacheDeduplicationStaleResultsAndRemoval() {
        let finished = expectation(description: "Query lifecycle")
        Task {
            defer { finished.fulfill() }
            let provider = Provider()
            let queries = QueryManager(provider: provider)
            queries.synchronizeQueries([request("slow", id: "a"), request("slow", id: "b")])
            await eventually { provider.calls.count == 1 }
            XCTAssertEqual(queries.queryState(for: "a")?.status, .loading)
            queries.synchronizeQueries([request("fast", id: "a"), request("fast", id: "b")])
            await eventually { queries.queryState(for: "a")?.status == .success }
            try? await Task.sleep(nanoseconds: 65_000_000)
            XCTAssertEqual(queries.queryState(for: "a")?.data, .string("fast"))
            XCTAssertEqual(queries.queryState(for: "b")?.data, .string("fast"))
            XCTAssertEqual(provider.calls.sorted(), ["fast", "slow"])
            queries.synchronizeQueries([])
            XCTAssertNil(queries.queryState(for: "a")); queries.dispose()
        }
        wait(for: [finished], timeout: 3)
    }
    func testExplicitSynchronizationRetriesFailureWithLastGoodData() {
        let finished = expectation(description: "Query error")
        Task {
            defer { finished.fulfill() }
            let provider = Provider()
            let queries = QueryManager(provider: provider)
            queries.synchronizeQueries([request("good")])
            await eventually { queries.queryState(for: "q")?.status == .success }
            queries.synchronizeQueries([request("fail")])
            XCTAssertEqual(queries.queryState(for: "q")?.data, .string("good"))
            await eventually { queries.queryState(for: "q")?.status == .error }
            queries.synchronizeQueries([request("fail")])
            await eventually { provider.calls.filter { $0 == "fail" }.count == 2 && queries.queryState(for: "q")?.status == .error }
            XCTAssertEqual(queries.queryState(for: "q")?.data, .string("good"))
            XCTAssertEqual(provider.calls.filter { $0 == "fail" }.count, 2)
            XCTAssertEqual(queries.queryState(for: "q")?.error?.code, .toolError)
            queries.dispose()
        }
        wait(for: [finished], timeout: 3)
    }
    func testRefetchDuringFlightQueuesAndRefreshTimerStops() {
        let finished = expectation(description: "Query invalidation and timer")
        Task {
            defer { finished.fulfill() }
            let provider = Provider()
            let manager = QueryManager(provider: provider)
            manager.synchronizeQueries([request("slow")])
            await eventually { provider.calls.count == 1 }
            manager.runQuery(statementId: "q", tool: "slow", args: .object([]), defaults: .null)
            XCTAssertEqual(provider.calls.count, 1)
            await eventually { provider.calls.count == 2 }
            await eventually { manager.queryState(for: "q")?.status == .success }
            manager.synchronizeQueries([request("timer", interval: 0.02)])
            await eventually { provider.calls.filter { $0 == "timer" }.count >= 2 }
            manager.synchronizeQueries([request("timer", interval: 0)])
            let count = provider.calls.count
            try? await Task.sleep(nanoseconds: 65_000_000)
            XCTAssertEqual(provider.calls.count, count)
            manager.dispose()
        }
        wait(for: [finished], timeout: 3)
    }
    func testMutationReplacementDiscardsOldResponseAndConcurrentRunIsRejected() {
        let finished = expectation(description: "Mutation identity")
        Task {
            defer { finished.fulfill() }
            let provider = Provider()
            let manager = QueryManager(provider: provider)
            manager.registerMutations(["save": "slow"])
            let pending = Task { await manager.runMutation(statementId: "save", tool: "slow", args: .object([])) }
            await eventually { manager.mutationState(for: "save")?.status == .loading }
            let duplicate = await manager.runMutation(statementId: "save", tool: "slow", args: .object([]))
            XCTAssertEqual(duplicate.status, .loading)
            manager.registerMutations(["save": "new"])
            _ = await pending.value
            XCTAssertEqual(manager.mutationState(for: "save")?.status, .idle)
            XCTAssertEqual(provider.calls.count, 1)
            manager.dispose()
        }
        wait(for: [finished], timeout: 3)
    }
}
