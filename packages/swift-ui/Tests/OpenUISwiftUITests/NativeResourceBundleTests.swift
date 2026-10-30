#if os(macOS)
import Foundation
import XCTest
@testable import OpenUISwiftUI

final class NativeResourceBundleTests: XCTestCase {
    func testPackagedLocalizationTakesPriorityWithoutEvaluatingSwiftPMFallback() throws {
        let (root, host) = try applicationFixture()
        defer { try? FileManager.default.removeItem(at: root) }
        let expected = try XCTUnwrap(host.resourceURL).appendingPathComponent("swift-ui_OpenUISwiftUI.bundle")
        try FileManager.default.copyItem(at: NativeControlResources.bundle.bundleURL, to: expected)
        var usedFallback = false
        let selected = NativeControlResources.resolve(in: host) {
            usedFallback = true
            return NativeControlResources.bundle
        }
        XCTAssertFalse(usedFallback, "A packaged app must not depend on a development build directory")
        XCTAssertEqual(selected.bundleURL.resolvingSymlinksInPath(), expected.resolvingSymlinksInPath())
        XCTAssertNotNil(selected.url(forResource: "upstream-catalog", withExtension: "json"), "The full standard catalog must ship inside the app resource bundle")
        let language = try XCTUnwrap(Bundle.preferredLocalizations(from: selected.localizations, forPreferences: ["zh-Hans"]).first)
        let folder = try XCTUnwrap(selected.path(forResource: language, ofType: "lproj"))
        let localized = try XCTUnwrap(Bundle(path: folder))
        XCTAssertEqual(localized.localizedString(forKey: "Start date", value: nil, table: nil), "开始日期")
    }

    func testMissingPackagedLocalizationUsesSwiftPMFallback() throws {
        let (root, host) = try applicationFixture()
        defer { try? FileManager.default.removeItem(at: root) }
        var usedFallback = false
        let selected = NativeControlResources.resolve(in: host) {
            usedFallback = true
            return NativeControlResources.bundle
        }
        XCTAssertTrue(usedFallback)
        XCTAssertEqual(selected.bundleURL, NativeControlResources.bundle.bundleURL)
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
