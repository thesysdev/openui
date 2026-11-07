import Foundation
import XCTest
@testable import OpenUILang

final class StoreLifecycleTests: XCTestCase {
    private final class Counter: @unchecked Sendable {
        private let lock = NSLock()
        private var count = 0
        var value: Int { lock.lock(); defer { lock.unlock() }; return count }
        func increment() { lock.lock(); count += 1; lock.unlock() }
    }

    func testCoreStoreNotificationsUnsubscribeAndDispose() {
        let store: Store = createStore()
        let notifications = Counter()
        let unsubscribe = store.subscribe { notifications.increment() }
        store.set("$value", value: .number(1), pristine: false)
        XCTAssertEqual(notifications.value, 1)
        store.set("$value", value: .number(1), pristine: false)
        XCTAssertEqual(notifications.value, 1, "Core SameValue suppresses unchanged writes")
        XCTAssertEqual(store.getSnapshot()["$value"], .number(1))

        unsubscribe()
        unsubscribe()
        store.set("$value", value: .number(2), pristine: false)
        XCTAssertEqual(notifications.value, 1)

        _ = store.subscribe { notifications.increment() }
        store.dispose()
        XCTAssertTrue(store.getSnapshot().isEmpty)
        store.set("$value", value: .number(3), pristine: false)
        XCTAssertEqual(notifications.value, 1, "Disposal removes the core's listeners")
    }
}
