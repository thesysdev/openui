// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "swift-lang",
  platforms: [.macOS(.v13), .iOS(.v16)],
  products: [
    .library(name: "OpenUILang", targets: ["OpenUILang"])
  ],
    targets: [
        .target(name: "COpenUIRegExp", exclude: ["README.md", "VENDOR.json", "vendor/LICENSE"],
                sources: ["Bridge.c", "RegExpEngine.c", "UnicodeEngine.c"], publicHeadersPath: "include"),
        .target(
            name: "OpenUILang",
            dependencies: ["COpenUIRegExp"],
            resources: [.copy("Resources/lang-core.js"), .copy("Resources/core-manifest.json"), .copy("Resources/THIRD-PARTY-NOTICES.txt")],
            swiftSettings: [.swiftLanguageMode(.v5)]
        ),
        .testTarget(
            name: "OpenUILangTests",
            dependencies: ["OpenUILang"],
            resources: [.copy("Fixtures")],
            swiftSettings: [.swiftLanguageMode(.v5)]
        ),
    ]
)
