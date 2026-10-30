#if os(macOS)
import Foundation
import XCTest
@testable import OpenUILang

final class ResourceBundleTests: XCTestCase {
    func testPackagedRuntimeTakesPriorityWithoutEvaluatingSwiftPMFallback() throws {
        let (root, host) = try applicationFixture()
        defer { try? FileManager.default.removeItem(at: root) }
        let expected = try XCTUnwrap(host.resourceURL).appendingPathComponent("swift-lang_OpenUILang.bundle")
        try FileManager.default.copyItem(at: LangCoreResources.bundle.bundleURL, to: expected)
        var usedFallback = false
        let selected = LangCoreResources.resolve(in: host) {
            usedFallback = true
            return LangCoreResources.bundle
        }
        XCTAssertFalse(usedFallback, "A packaged app must not depend on a development build directory")
        XCTAssertEqual(selected.bundleURL.resolvingSymlinksInPath(), expected.resolvingSymlinksInPath())
        let runtime = try XCTUnwrap(selected.url(forResource: "lang-core", withExtension: "js"))
        let original = try XCTUnwrap(LangCoreResources.bundle.url(forResource: "lang-core", withExtension: "js"))
        XCTAssertEqual(try Data(contentsOf: runtime), try Data(contentsOf: original))
    }

    func testMissingPackagedRuntimeUsesSwiftPMFallback() throws {
        let (root, host) = try applicationFixture()
        defer { try? FileManager.default.removeItem(at: root) }
        var usedFallback = false
        let selected = LangCoreResources.resolve(in: host) {
            usedFallback = true
            return LangCoreResources.bundle
        }
        XCTAssertTrue(usedFallback)
        XCTAssertEqual(selected.bundleURL, LangCoreResources.bundle.bundleURL)
    }

    private func applicationFixture() throws -> (URL, Bundle) {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let app = root.appendingPathComponent("ResourceFixture.app")
        try FileManager.default.createDirectory(at: app.appendingPathComponent("Contents/Resources"), withIntermediateDirectories: true)
        let info = ["CFBundleIdentifier": "dev.sdk.resources." + UUID().uuidString, "CFBundlePackageType": "APPL", "CFBundleName": "ResourceFixture"]
        try PropertyListSerialization.data(fromPropertyList: info, format: .xml, options: 0).write(to: app.appendingPathComponent("Contents/Info.plist"))
        return (root, try XCTUnwrap(Bundle(url: app)))
    }
}
#endif
