import Foundation
import SwiftUI

/// Resource policy and transport are injected once for an entire rendered tree.
/// Implementations can add authorization or resolve application-owned resources
/// without changing the language, its evaluated values, or individual builders.
public protocol OpenUIResourceLoading: AnyObject {
    func request(for source: String, relativeTo baseURL: URL?) -> URLRequest?
    func data(for request: URLRequest) async throws -> Data
}

public final class OpenUIURLSessionResourceLoader: OpenUIResourceLoading {
    public static let shared = OpenUIURLSessionResourceLoader()
    private let session: URLSession

    public init(session: URLSession = .shared) { self.session = session }

    public func request(for source: String, relativeTo baseURL: URL?) -> URLRequest? {
        guard !source.isEmpty,
              let url = URL(string: source, relativeTo: baseURL)?.absoluteURL,
              let scheme = url.scheme?.lowercased(), ["https", "http"].contains(scheme),
              url.host?.isEmpty == false else { return nil }
        return URLRequest(url: url)
    }

    public func data(for request: URLRequest) async throws -> Data {
        let (data, response) = try await session.data(for: request)
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            throw URLError(.badServerResponse)
        }
        return data
    }
}

public struct OpenUIResourceContext {
    public var baseURL: URL?
    public var loader: any OpenUIResourceLoading

    public init(baseURL: URL? = nil, loader: any OpenUIResourceLoading = OpenUIURLSessionResourceLoader.shared) {
        self.baseURL = baseURL
        self.loader = loader
    }

    public func request(for source: String?) -> URLRequest? {
        source.flatMap { loader.request(for: $0, relativeTo: baseURL) }
    }
}

/// Presentation-scoped transport shared by images, SVG and native Markdown.
/// A view relocation does not own/cancel the underlying request. Credentials,
/// resource policy and source addresses continue to belong to the injected loader.
@MainActor final class NativeResourceStore {
    private struct Key: Hashable {
        let request: URLRequest
        let loader: ObjectIdentifier
        let policy: UInt
    }
    private var loaders: [ObjectIdentifier: ScopedResourceLoader] = [:]
    private var pending: [Key: Task<Data, Error>] = [:]
    private var completed: [Key: Data] = [:]
    private var order: [Key] = []
    private var generation = 0
    func scoped(_ context: OpenUIResourceContext) -> OpenUIResourceContext {
        var owner = context.loader
        while let scoped = owner as? ScopedResourceLoader { owner = scoped.owner }
        let id = ObjectIdentifier(owner)
        let loader: ScopedResourceLoader
        if let existing = loaders[id] { loader = existing }
        else { loader = ScopedResourceLoader(owner: owner, store: self, epoch: generation); loaders[id] = loader }
        return .init(baseURL: context.baseURL, loader: loader)
    }
    fileprivate func data(_ request: URLRequest, owner: any OpenUIResourceLoading, epoch: Int) async throws -> Data {
        try Task.checkCancellation()
        guard epoch == generation else { throw CancellationError() }
        let key = Key(request: request, loader: ObjectIdentifier(owner), policy: request.cachePolicy.rawValue)
        let retains = request.cachePolicy == .useProtocolCachePolicy || request.cachePolicy == .returnCacheDataElseLoad || request.cachePolicy == .returnCacheDataDontLoad
        if retains, let data = completed[key] { return data }
        if let task = pending[key] { return try await task.value }
        let task = Task { @MainActor [weak self] in
            let data = try await owner.data(for: request)
            try Task.checkCancellation()
            guard let self, self.generation == epoch else { throw CancellationError() }
            if retains, data.count <= 2 * 1024 * 1024 {
                self.completed[key] = data
                self.order.removeAll { $0 == key }; self.order.append(key)
                while self.order.count > 16 || self.completed.values.reduce(0, { $0 + $1.count }) > 2 * 1024 * 1024 {
                    self.completed.removeValue(forKey: self.order.removeFirst())
                }
            }
            return data
        }
        pending[key] = task
        defer { if generation == epoch { pending[key] = nil } }
        return try await task.value
    }
    func removeAll() {
        generation &+= 1
        pending.values.forEach { $0.cancel() }; pending.removeAll()
        completed.removeAll(); order.removeAll(); loaders.removeAll()
    }
}

private final class ScopedResourceLoader: OpenUIResourceLoading {
    fileprivate let owner: any OpenUIResourceLoading
    private weak var store: NativeResourceStore?
    private let epoch: Int
    init(owner: any OpenUIResourceLoading, store: NativeResourceStore, epoch: Int) { self.owner = owner; self.store = store; self.epoch = epoch }
    func request(for source: String, relativeTo baseURL: URL?) -> URLRequest? { owner.request(for: source, relativeTo: baseURL) }
    @MainActor func data(for request: URLRequest) async throws -> Data {
        try Task.checkCancellation()
        guard let store else { throw CancellationError() }
        return try await store.data(request, owner: owner, epoch: epoch)
    }
}

private struct OpenUIResourceContextKey: EnvironmentKey {
    static let defaultValue = OpenUIResourceContext()
}

extension EnvironmentValues {
    public var openUIResourceContext: OpenUIResourceContext {
        get { self[OpenUIResourceContextKey.self] }
        set { self[OpenUIResourceContextKey.self] = newValue }
    }
}

extension View {
    public func openUIResourceContext(_ context: OpenUIResourceContext) -> some View {
        environment(\.openUIResourceContext, context)
    }
}

struct NativeResourceRequestID: Hashable {
    let request: URLRequest?
    let loader: ObjectIdentifier
    let attempt: Int
}
