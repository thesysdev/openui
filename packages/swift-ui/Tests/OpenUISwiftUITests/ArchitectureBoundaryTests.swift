import Foundation
import XCTest

final class ArchitectureBoundaryTests: XCTestCase {
  private var package: URL {
    URL(fileURLWithPath: #filePath).deletingLastPathComponent()
      .deletingLastPathComponent().deletingLastPathComponent()
  }

  private func swiftSources(_ directory: URL) throws -> [(URL, String)] {
    let files = try XCTUnwrap(FileManager.default.enumerator(at: directory,
      includingPropertiesForKeys: nil))
    return try files.compactMap { value in
      guard let url = value as? URL, url.pathExtension == "swift" else { return nil }
      return (url, try String(contentsOf: url, encoding: .utf8))
    }
  }

  func testLanguageRuntimeDoesNotDependOnNativePresentation() throws {
    let root = package.deletingLastPathComponent().appendingPathComponent("swift-lang")
    for (file, source) in try swiftSources(root.appendingPathComponent("Sources/OpenUILang")) {
      XCTAssertNil(source.range(of: #"(?m)^import\s+(SwiftUI|UIKit|AppKit|OpenUISwiftUI)\b"#,
        options: .regularExpression), file.lastPathComponent)
    }
    let manifest = try String(contentsOf: root.appendingPathComponent("Package.swift"), encoding: .utf8)
    XCTAssertFalse(manifest.contains("OpenUISwiftUI"))
    XCTAssertFalse(manifest.contains("swift-ui"))
  }

  func testComponentsCannotReachJavaScriptCoreOrLanguageBridgeInternals() throws {
    let root = package.appendingPathComponent("Sources/OpenUISwiftUI/Components")
    for (file, source) in try swiftSources(root) {
      XCTAssertNil(source.range(of: #"\b(JSContext|JSValue|JSVirtualMachine|SharedCore)\b|import\s+JavaScriptCore"#,
        options: .regularExpression), file.lastPathComponent)
    }
  }

  func testStandardComponentsCommitAndDispatchThroughTheirContext() throws {
    let root = package.appendingPathComponent("Sources/OpenUISwiftUI/Components")
    for (file, source) in try swiftSources(root) {
      XCTAssertNil(source.range(of: #"\bstate\.(perform|triggerAction|setFieldValue|setState)\s*\("#,
        options: .regularExpression), file.lastPathComponent)
    }
  }

  func testPresentationJavaScriptIsConfinedToTypedInternalAdapters() throws {
    let root = package.appendingPathComponent("Sources/OpenUISwiftUI")
    let bridgeFiles = try swiftSources(root).filter { $0.1.contains("import JavaScriptCore") }
    XCTAssertEqual(Set(bridgeFiles.map { $0.0.lastPathComponent }),
      ["NativeRichText.swift", "NativeCodeSyntax.swift"])
    XCTAssertTrue(bridgeFiles.allSatisfy { $0.0.deletingLastPathComponent().lastPathComponent == "Internal" })
  }
}
