// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "OpenUI",
    platforms: [
        .macOS(.v13),
        .iOS(.v16)
    ],
    products: [
        // Products define the executables and libraries a package produces, making them visible to other packages.
        .library(
            name: "OpenUILang",
            targets: ["OpenUILang"]),
        .library(
            name: "OpenUISwiftUI",
            targets: ["OpenUISwiftUI"]),
        .executable(
            name: "SwiftUIChat",
            targets: ["SwiftUIChat"])
    ],
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .target(
            name: "OpenUILang"),
        .target(
            name: "OpenUISwiftUI",
            dependencies: ["OpenUILang"]),
        .executableTarget(
            name: "SwiftUIChat",
            dependencies: ["OpenUILang", "OpenUISwiftUI"]),
        .testTarget(
            name: "OpenUILangTests",
            dependencies: ["OpenUILang"])
    ]
)
