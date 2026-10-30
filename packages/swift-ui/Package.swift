// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "swift-ui",
    defaultLocalization: "en",
  platforms: [.macOS(.v13), .iOS(.v16)],
  products: [
    .library(name: "OpenUISwiftUI", targets: ["OpenUISwiftUI"]),
    ],
    dependencies: [
        .package(path: "../swift-lang"),
        .package(url: "https://github.com/gonzalezreal/swift-markdown-ui", exact: "2.4.1"),
    ],
    targets: [
        .target(
            name: "OpenUISwiftUI",
            dependencies: [
                .product(name: "OpenUILang", package: "swift-lang"),
                .product(name: "MarkdownUI", package: "swift-markdown-ui"),
            ],
            resources: [.process("Resources")],
            swiftSettings: [.swiftLanguageMode(.v5)]
        ),
        .testTarget(
            name: "OpenUISwiftUITests",
            dependencies: ["OpenUISwiftUI"],
            swiftSettings: [.swiftLanguageMode(.v5)]
        ),
    ]
)
