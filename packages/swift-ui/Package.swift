// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "swift-ui",
    defaultLocalization: "en",
  platforms: [.macOS(.v13), .iOS(.v16)],
  products: [
    .library(name: "OpenUISwiftUI", targets: ["OpenUISwiftUI"]),
    .library(name: "OpenUIWeb", targets: ["OpenUIWeb"]),
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
        .target(
            name: "OpenUIWeb",
            dependencies: ["OpenUISwiftUI", .product(name: "OpenUILang", package: "swift-lang")],
            resources: [.process("Resources")],
            swiftSettings: [.swiftLanguageMode(.v5)]
        ),
        .testTarget(
            name: "OpenUISwiftUITests",
            dependencies: ["OpenUISwiftUI", "OpenUIWeb"],
            swiftSettings: [.swiftLanguageMode(.v5)]
        ),
    ]
)
