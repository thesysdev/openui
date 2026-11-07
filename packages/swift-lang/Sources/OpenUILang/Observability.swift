import Foundation

/// How serious an `ObservabilityEvent` is.
public enum ObservabilityLevel: String, Sendable {
  case info, warning, error
}

/// One event on the observability bus.
public struct ObservabilityEvent: Sendable {
  public var level: ObservabilityLevel
  /// Milliseconds since 1970, like JavaScript's `Date.now()`.
  public var timestamp: Double
  /// What happened: `kind` names it, the other fields describe it.
  public var detail: OpenUIObject
}

/// Port of `@openuidev/observability`: one shared bus that OpenUI emits events
/// on and sinks (logging, analytics, a debugging view) listen to.
///
/// The runtime emits a `react-lang:stream` event as each response streams and
/// when it settles, with the same fields as react-lang's, so a sink written
/// for the web reads these too. Listeners are called on the emitting thread.
public final class Observability: @unchecked Sendable {
  public typealias Handler = @Sendable (ObservabilityEvent) -> Void

  /// The bus OpenUI emits on.
  public static let shared = Observability()

  private let lock = NSLock()
  private var listeners: [(id: Int, key: String, handler: Handler)] = []
  private var nextID = 0

  public init() {}

  /// Whether anything listens, so emitters can skip building events.
  public var hasListeners: Bool { lock.withLock { !listeners.isEmpty } }

  /// Milliseconds since 1970, like `Date.now()`.
  static func now() -> Double { (Date().timeIntervalSince1970 * 1000).rounded(.down) }

  /// Emits `detail` at `level` to its listeners and to `listenAll` ones.
  public func emit(_ level: ObservabilityLevel, _ detail: OpenUIObject) {
    let event = ObservabilityEvent(level: level, timestamp: Self.now(), detail: detail)
    let targets = lock.withLock {
      listeners.filter { $0.key == level.rawValue } + listeners.filter { $0.key == Self.all }
    }
    for target in targets { target.handler(event) }
  }

  public func info(_ detail: OpenUIObject) { emit(.info, detail) }
  public func warn(_ detail: OpenUIObject) { emit(.warning, detail) }
  public func error(_ detail: OpenUIObject) { emit(.error, detail) }

  /// Listens to every event at `levels`. Call the result to stop.
  @discardableResult
  public func listen(
    _ levels: [ObservabilityLevel], _ handler: @escaping Handler
  ) -> @Sendable () -> Void {
    let removers = levels.map { subscribe($0.rawValue, handler) }
    return {
      for remove in removers { remove() }
    }
  }

  /// Listens to every event. Call the result to stop.
  @discardableResult
  public func listenAll(_ handler: @escaping Handler) -> @Sendable () -> Void {
    subscribe(Self.all, handler)
  }

  private static let all = "all"

  private func subscribe(_ key: String, _ handler: @escaping Handler) -> @Sendable () -> Void {
    let id = lock.withLock {
      nextID += 1
      listeners.append((nextID, key, handler))
      return nextID
    }
    return { [weak self] in
      guard let self else { return }
      self.lock.withLock { self.listeners.removeAll { $0.id == id } }
    }
  }
}

/// The `kind` of the stream lifecycle events, react-lang's `STREAM_EVENT_KIND`.
public let streamEventKind = "react-lang:stream"

/// One response's stream lifecycle as react-lang's Renderer publishes it
/// (`advanceStreamingObservability`): a stable id from the first streamed
/// chunk, a `streaming` update for each new chunk, then one `settled` update,
/// repeated only when the errors change. Streaming again starts a new id.
struct StreamObservation: Sendable {
  enum Phase: String, Sendable {
    case streaming, settled
  }

  struct Update: Equatable, Sendable {
    var id: String
    var phase: Phase
    var updateIndex: Int
  }

  var id: String?
  var updateIndex = 0
  var lastResponse: String?
  var hasPublishedStreamingSnapshot = false
  var settled = false
  var lastSettledErrorKey: String?
  var startedAt: Double?
  var durationMs: Double?

  /// The update to publish for this state, if any. `settledErrorKey`
  /// identifies the errors once settled.
  mutating func advance(
    isStreaming: Bool, response: String?, settledErrorKey: String?,
    idFactory: () -> String = { UUID().uuidString.lowercased() }
  ) -> Update? {
    if isStreaming {
      if settled { self = StreamObservation() }
      let id = self.id ?? idFactory()
      self.id = id
      if hasPublishedStreamingSnapshot && lastResponse == response { return nil }
      hasPublishedStreamingSnapshot = true
      lastResponse = response
      updateIndex += 1
      return Update(id: id, phase: .streaming, updateIndex: updateIndex)
    }
    guard let id else { return nil }
    if settled && (settledErrorKey == nil || lastSettledErrorKey == settledErrorKey) {
      return nil
    }
    updateIndex += 1
    settled = true
    lastSettledErrorKey = settledErrorKey
    return Update(id: id, phase: .settled, updateIndex: updateIndex)
  }

  /// react-lang's `captureStreamTiming`: when the stream started, how long it
  /// has run, and its duration, frozen once it settles.
  mutating func timing(now: Double = Observability.now()) -> OpenUIObject {
    let startedAt = self.startedAt ?? now
    self.startedAt = startedAt
    if settled, durationMs == nil { durationMs = max(0, now - startedAt) }
    var fields: OpenUIObject = [
      "startedAt": .number(startedAt), "elapsedMs": .number(durationMs ?? max(0, now - startedAt)),
    ]
    if let durationMs { fields["durationMs"] = .number(durationMs) }
    return fields
  }
}
