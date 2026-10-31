// swift-tools-version: 6.0
import PackageDescription

// Remote SwiftPM entry point. Targets reuse the monorepo sources and resources;
// packages/swift-lang and packages/swift-ui remain local development entry points.
let package = Package(
    name: "openui",
    defaultLocalization: "en",
    platforms: [.macOS(.v13), .iOS(.v16)],
    products: [
        .library(name: "OpenUILang", targets: ["OpenUILang"]),
        .library(name: "OpenUISwiftUI", targets: ["OpenUISwiftUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/gonzalezreal/swift-markdown-ui", exact: "2.4.1"),
    ],
    targets: [
        .target(
            name: "COpenUIRegExp",
            path: "packages/swift-lang/Sources/COpenUIRegExp",
            exclude: ["README.md", "VENDOR.json", "vendor/LICENSE"],
            sources: ["Bridge.c", "RegExpEngine.c", "UnicodeEngine.c"],
            publicHeadersPath: "include"
        ),
        .target(
            name: "OpenUILang",
            dependencies: ["COpenUIRegExp"],
            path: "packages/swift-lang/Sources/OpenUILang",
            resources: [.copy("Resources/lang-core.js"), .copy("Resources/core-manifest.json"), .copy("Resources/THIRD-PARTY-NOTICES.txt")],
            swiftSettings: [.swiftLanguageMode(.v5)]
        ),
        .target(
            name: "OpenUISwiftUI",
            dependencies: ["OpenUILang", .product(name: "MarkdownUI", package: "swift-markdown-ui")],
            path: "packages/swift-ui/Sources/OpenUISwiftUI",
            resources: [.process("Resources")],
            swiftSettings: [.swiftLanguageMode(.v5)]
        ),
        .testTarget(
            name: "OpenUILangTests",
            dependencies: ["OpenUILang"],
            path: "packages/swift-lang/Tests/OpenUILangTests",
            resources: [.copy("Fixtures")],
            swiftSettings: [.swiftLanguageMode(.v5)]
        ),
        .testTarget(
            name: "OpenUISwiftUITests",
            dependencies: ["OpenUISwiftUI"],
            path: "packages/swift-ui/Tests/OpenUISwiftUITests",
            swiftSettings: [.swiftLanguageMode(.v5)]
        ),
    ]
)
