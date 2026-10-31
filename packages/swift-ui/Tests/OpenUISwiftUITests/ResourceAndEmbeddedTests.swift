import Foundation
import OpenUILang
import SwiftUI
import XCTest
@testable import OpenUISwiftUI
#if os(macOS)
import AppKit
import WebKit
#endif

final class ResourceAndEmbeddedTests: XCTestCase {
    #if os(macOS)
    @MainActor func testValidInlineSvgWithAnExtraSrcMountsItsRenderer() throws {
        _ = NSApplication.shared
        let library = try OpenUIWebComponents.install(into: OpenUIStandardComponents.library())
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("root=SVG(\"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'><circle cx='20' cy='20' r='10'/></svg>\",\"lunar-phase-diagram\",\"A circle\",100)")
        let hosting = NSHostingView(rootView: OpenUIRenderer(state: state, registry: library.registry).frame(width: 350, height: 160))
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 350, height: 160),
            styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false; window.contentView = hosting
        hosting.frame = NSRect(x: 0, y: 0, width: 350, height: 160)
        window.setFrameOrigin(NSPoint(x: -10000, y: -10000)); window.orderFront(nil)
        defer { window.close() }
        func containsWeb(_ view: NSView) -> Bool { view is WKWebView || view.subviews.contains(where: containsWeb) }
        let deadline = Date().addingTimeInterval(5)
        repeat {
            hosting.layoutSubtreeIfNeeded(); RunLoop.main.run(until: Date().addingTimeInterval(0.02))
        } while !containsWeb(hosting) && Date() < deadline
        XCTAssertTrue(containsWeb(hosting), "A valid inline illustration must not become an unavailable box because src was also filled")
    }
    #endif
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

    @MainActor func testOptionalEmbeddedComponentsKeepStandardContractsAndComposeThroughCore() throws {
        let standard = try OpenUIStandardComponents.library()
        let extended = try installingPresentation(into: standard)
        XCTAssertEqual(standard.library.components.count, 82)
        for name in ["SVG", "WebView"] { XCTAssertNil(standard.registry[name], "Importing the UI product must not install embedded components") }
        XCTAssertEqual(extended.library.components.count, 85)
        for name in ["SVG", "WebView", "Popover"] { XCTAssertNotNil(extended.registry[name]) }
        for original in standard.library.components {
            let actual = try XCTUnwrap(extended.library.components.first { $0.name == original.name })
            XCTAssertEqual(actual.params.map(\.name), original.params.map(\.name))
            for (a, b) in zip(actual.params, original.params) {
                XCTAssertEqual(a.required, b.required)
                XCTAssertEqual(a.defaultValue, b.defaultValue)
                XCTAssertEqual(a.isBindable, b.isBindable)
                let isExtendedSlot = (original.name == "Card" && b.name == "children")
                    || (["TabItem", "AccordionItem"].contains(original.name) && b.name == "content")
                if !isExtendedSlot { XCTAssertEqual(a.schema, b.schema, "\(original.name).\(b.name)") }
                else {
                    XCTAssertTrue(Self.references(in: b.schema).isSubset(of: Self.references(in: a.schema)))
                    for name in ["SVG", "WebView", "Popover"] {
                        XCTAssertTrue(Self.references(in: a.schema).contains("#/$defs/" + name))
                    }
                }
            }
        }
        let state = OpenUIState(schema: extended.library.toSchema())
        state.setSource("""
          root=Card([SVG("<svg viewBox='0 0 200 100'><path d='M0 0L200 100'/></svg>"),
            WebView("<p>Ordinary HTML</p>"),Popover(Icon("info"),Stack([TextContent("Optional detail")]),"Details")])
          """)
        XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
        XCTAssertEqual(PropValue.children(try XCTUnwrap(state.root)).map(\.typeName), ["SVG", "WebView", "Popover"])
        XCTAssertFalse(OpenUIWebPolicy().allowsJavaScript)
    }

    private static func references(in value: JSONValue?) -> Set<String> {
        guard let value else { return [] }
        switch value {
        case .object(let fields):
            return fields.reduce(into: Set<String>()) { result, field in
                if field.key == "$ref", case .string(let ref) = field.value { result.insert(ref.displayString) }
                result.formUnion(references(in: field.value))
            }
        case .array(let values): return values.reduce(into: Set<String>()) { $0.formUnion(references(in: $1)) }
        default: return []
        }
    }

    func testSVGUsesARealXMLDocumentAndKeepsItsViewBox() {
        let source = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 120'><path d='M0 0L300 120'/></svg>"
        let html = NativeSVGDocument.html(source, alt: "A < B & C")
        XCTAssertTrue(html?.contains(source) == true)
        XCTAssertTrue(html?.contains("A &lt; B &amp; C") == true)
        XCTAssertTrue(html?.contains("script-src 'none'") == true)
        XCTAssertNil(NativeSVGDocument.html("<p>Not SVG</p>", alt: ""))
        XCTAssertNil(NativeSVGDocument.html("<svg><broken></svg>", alt: ""))
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
