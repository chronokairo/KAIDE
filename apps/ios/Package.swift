// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Kaide",
    platforms: [.iOS(.v15), .macOS(.v12)],
    products: [
        .executable(name: "kaide", targets: ["KaideCLI"]),
        .library(name: "KaideCore", targets: ["KaideCore"]),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "KaideCore",
            path: "Core"
        ),
        .executableTarget(
            name: "KaideCLI",
            dependencies: ["KaideCore"],
            path: "CLI"
        ),
    ]
)
