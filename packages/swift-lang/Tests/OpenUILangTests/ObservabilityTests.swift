import Foundation
import Testing

@testable import OpenUILang

/// react-lang's streaming observability tests, ported.
@Suite struct StreamObservationTests {
  typealias Update = StreamObservation.Update

  @Test func noEventForContentThatWasNeverStreamed() {
    var state = StreamObservation()
    var calls = 0
    let update = state.advance(
      isStreaming: false, response: #"root = Card("done")"#, settledErrorKey: "[]",
      idFactory: {
        calls += 1
        return "stream-1"
      })
    #expect(update == nil)
    #expect(calls == 0)
  }

  @Test func oneStableIDForEveryUpdateAndTheSettledEvent() {
    var state = StreamObservation()
    var calls = 0
    let id = {
      calls += 1
      return "stream-1"
    }
    #expect(
      state.advance(isStreaming: true, response: "root = Car", settledErrorKey: nil, idFactory: id)
        == Update(id: "stream-1", phase: .streaming, updateIndex: 1))
    #expect(
      state.advance(
        isStreaming: true, response: #"root = Card("done")"#, settledErrorKey: nil, idFactory: id)
        == Update(id: "stream-1", phase: .streaming, updateIndex: 2))
    #expect(
      state.advance(
        isStreaming: false, response: #"root = Card("done")"#, settledErrorKey: "[]", idFactory: id)
        == Update(id: "stream-1", phase: .settled, updateIndex: 3))
    #expect(calls == 1)
  }

  @Test func emitsOncePerResponseAndUnchangedSettledSnapshot() {
    var state = StreamObservation()
    let id = { "stream-1" }
    #expect(
      state.advance(isStreaming: true, response: "root = Car", settledErrorKey: nil, idFactory: id)
        != nil)
    #expect(
      state.advance(isStreaming: true, response: "root = Car", settledErrorKey: nil, idFactory: id)
        == nil)
    #expect(
      state.advance(
        isStreaming: false, response: "root = Car", settledErrorKey: "[]", idFactory: id) != nil)
    #expect(
      state.advance(
        isStreaming: false, response: "root = Car", settledErrorKey: "[]", idFactory: id) == nil)
  }

  @Test func startsANewIDWhenASettledRendererStreamsAgain() {
    var state = StreamObservation()
    var ids = ["stream-1", "stream-2"]
    let id = { ids.removeFirst() }
    #expect(
      state.advance(isStreaming: true, response: "first", settledErrorKey: nil, idFactory: id)
        == Update(id: "stream-1", phase: .streaming, updateIndex: 1))
    #expect(
      state.advance(isStreaming: false, response: "first", settledErrorKey: "[]", idFactory: id)
        == Update(id: "stream-1", phase: .settled, updateIndex: 2))
    #expect(
      state.advance(isStreaming: true, response: "second", settledErrorKey: nil, idFactory: id)
        == Update(id: "stream-2", phase: .streaming, updateIndex: 1))
    #expect(
      state.advance(isStreaming: false, response: "second", settledErrorKey: "[]", idFactory: id)
        == Update(id: "stream-2", phase: .settled, updateIndex: 2))
    #expect(ids.isEmpty)
  }

  @Test func republishesSettledWhenTheErrorSnapshotChanges() {
    var state = StreamObservation()
    let id = { "stream-1" }
    _ = state.advance(
      isStreaming: true, response: "root = Card()", settledErrorKey: nil, idFactory: id)
    _ = state.advance(
      isStreaming: false, response: "root = Card()", settledErrorKey: "[]", idFactory: id)
    let queryError = #"[{"code":"query-error"}]"#
    #expect(
      state.advance(
        isStreaming: false, response: "root = Card()", settledErrorKey: queryError, idFactory: id)
        == Update(id: "stream-1", phase: .settled, updateIndex: 3))
    #expect(
      state.advance(
        isStreaming: false, response: "root = Card()", settledErrorKey: queryError, idFactory: id)
        == nil)
    #expect(
      state.advance(
        isStreaming: false, response: "root = Card()",
        settledErrorKey: #"[{"code":"query-error"},{"code":"tool-failed"}]"#, idFactory: id)
        == Update(id: "stream-1", phase: .settled, updateIndex: 4))
  }
}

@Suite struct ObservabilityBusTests {
  final class Log: @unchecked Sendable {
    private let lock = NSLock()
    private var items: [ObservabilityEvent] = []
    func append(_ event: ObservabilityEvent) { lock.withLock { items.append(event) } }
    var events: [ObservabilityEvent] { lock.withLock { items } }
  }

  @Test func deliversByLevelAndToListenAll() {
    let bus = Observability()
    let errors = Log()
    let all = Log()
    let stopErrors = bus.listen([.error]) { errors.append($0) }
    let stopAll = bus.listenAll { all.append($0) }
    bus.info(["kind": "a"])
    bus.error(["kind": "b"])
    #expect(errors.events.map(\.detail["kind"]) == ["b"])
    #expect(all.events.map(\.level) == [.info, .error])
    stopErrors()
    stopAll()
    bus.error(["kind": "c"])
    #expect(errors.events.count == 1)
    #expect(!bus.hasListeners)
  }

  /// The runtime publishes react-lang's stream events: one per streamed
  /// chunk, then the settled response with its errors.
  @MainActor
  @Test func runtimePublishesTheStreamLifecycle() {
    let log = Log()
    // The bus is shared with tests running in parallel; keep only ours.
    let marker = "observability-\(UUID().uuidString)"
    let stop = Observability.shared.listenAll { event in
      if event.detail["response"]?.stringValue?.contains(marker) == true { log.append(event) }
    }
    defer { stop() }

    let runtime = OpenUIRuntime(library: FixtureLibrary(schemaName: "test"))
    let full = #"root = Card([Text("\#(marker)"), Mystery()])"#
    runtime.update(response: #"root = Card([Text("\#(marker)""#, isStreaming: true)
    runtime.update(response: full, isStreaming: true)
    runtime.update(response: full, isStreaming: true)
    runtime.update(response: full, isStreaming: false)

    let events = log.events.map { (level: $0.level, detail: OpenUIValue.object($0.detail)) }
    #expect(events.map { $0.detail["phase"] } == ["streaming", "streaming", "settled"])
    #expect(Set(events.compactMap { $0.detail["id"].stringValue }).count == 1)
    #expect(events.map { $0.detail["updateIndex"] } == [1, 2, 3])
    let settled = events.last!
    #expect(settled.detail["kind"] == .string(streamEventKind))
    #expect(settled.level == .error)
    #expect(settled.detail["errorCount"] == 1)
    #expect(settled.detail["errors"].arrayValue?.first?["code"] == "unknown-component")
    #expect(settled.detail["parser"]["statementCount"] == 1)
    #expect(settled.detail["message"] == "OpenUI Lang settled with 1 error")
    #expect(settled.detail["durationMs"].numberValue != nil)
  }
}
