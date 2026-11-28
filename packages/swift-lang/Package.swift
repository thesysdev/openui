// swift-tools-version:6.0
import PackageDescription

let package = Package(
  name: "OpenUI",
  platforms: [.iOS(.v17), .macOS(.v14)],
  products: [
    .library(name: "OpenUILang", targets: ["OpenUILang"]),
    .library(name: "OpenUISwiftUI", targets: ["OpenUISwiftUI"]),
  ],
  targets: [
    .target(name: "OpenUILang"),
    .target(name: "OpenUISwiftUI", dependencies: ["OpenUILang"]),
    .testTarget(
      name: "OpenUILangTests",
      dependencies: ["OpenUILang"],
      resources: [.copy("Fixtures")]
    ),
    .testTarget(
      name: "OpenUISwiftUITests",
      dependencies: ["OpenUISwiftUI"],
      resources: [.copy("Fixtures")]
    ),
  ]
)
