import Foundation
import OpenUILang
import SwiftUI
import XCTest
@testable import OpenUISwiftUI

final class ResourcePresentationTests: XCTestCase {
    func testOneContextResolvesRelativeResourcesWithoutRewritingTheirPayload() throws {
        let context = OpenUIResourceContext(baseURL: URL(string: "https://example.com/chat/"))
        let source = "/api/image?url=https%3A%2F%2Fimages.example%2Fa%3Fx%3D1&sig=a%2Bb%3D"
        XCTAssertEqual(context.request(for: source)?.url?.absoluteString, "https://example.com" + source)
        XCTAssertEqual(context.request(for: "photo.jpg?q=1")?.url?.absoluteString, "https://example.com/chat/photo.jpg?q=1")
        XCTAssertEqual(context.request(for: "https://cdn.example/photo.jpg")?.url?.host, "cdn.example")
        for unsupported in ["", "javascript:alert(1)", "file:///etc/hosts", "data:text/html,hello"] {
            XCTAssertNil(context.request(for: unsupported))
        }
        XCTAssertNil(OpenUIResourceContext().request(for: "photo.jpg"))
    }

    func testTransportIsScopedAndRejectsHTTPFailures() async throws {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [ResourceProtocol.self]
        let session = URLSession(configuration: configuration)
        defer { session.invalidateAndCancel() }
        let loader = OpenUIURLSessionResourceLoader(session: session)
        let good = try XCTUnwrap(loader.request(for: "https://resource.example/ok", relativeTo: nil))
        let loaded = try await loader.data(for: good)
        XCTAssertEqual(String(data: loaded, encoding: .utf8), "image data")
        let bad = try XCTUnwrap(loader.request(for: "https://resource.example/fail", relativeTo: nil))
        do { _ = try await loader.data(for: bad); XCTFail("An HTTP error is not a loaded image") }
        catch { XCTAssertEqual((error as? URLError)?.code, .badServerResponse) }
    }

    func testTablesShareSpaceAndOnlyOverflowWhenMinimumColumnsRequireIt() {
        let compact = NativeTableColumnPlacement.widths(ideal: [60, 120, 800], minimum: 88, available: 335, gap: 16)
        XCTAssertEqual(compact.reduce(0, +) + 32, 335, accuracy: 0.5)
        XCTAssertGreaterThanOrEqual(compact[0], 60)
        XCTAssertTrue(compact.dropFirst().allSatisfy { $0 >= 88 })
        XCTAssertGreaterThan(compact[2], compact[0])
        let short = NativeTableColumnPlacement.widths(
            ideal: [50, 50, 50, 50, 50], minimum: 88, available: 335, gap: 16)
        XCTAssertEqual(
            short.reduce(0, +) + 64, 335, accuracy: 0.5,
            "Short scalar columns fit without reserving paragraph-sized floors")
        let wide = NativeTableColumnPlacement.widths(
            ideal: [120, 120, 120, 120, 120], minimum: 88, available: 335, gap: 16)
        XCTAssertGreaterThan(wide.reduce(0, +) + 64, 335)
        XCTAssertEqual(NativeTableColumnPlacement.widths(ideal: [], minimum: 88, available: 0, gap: 16), [])
    }

    func testChartTooltipsRemainInsideThePlotViewportAtEveryEdge() {
        let bounds = CGSize(width: 240, height: 130)
        for point in [CGPoint.zero, CGPoint(x: 239, y: 0), CGPoint(x: 0, y: 129), CGPoint(x: 239, y: 129)] {
            let frame = NativeChartTooltipPlacement.frame(size: CGSize(width: 180, height: 52), anchor: point, bounds: bounds)
            XCTAssertTrue(CGRect(origin: .zero, size: bounds).contains(frame))
        }
    }
}

private final class ResourceProtocol: URLProtocol, @unchecked Sendable {
    override class func canInit(with request: URLRequest) -> Bool { request.url?.host == "resource.example" }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        let response = HTTPURLResponse(url: request.url!, statusCode: request.url?.path == "/fail" ? 404 : 200,
            httpVersion: "HTTP/1.1", headerFields: nil)!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: Data("image data".utf8))
        client?.urlProtocolDidFinishLoading(self)
    }
    override func stopLoading() {}
}
