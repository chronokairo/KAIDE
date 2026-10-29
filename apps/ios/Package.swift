// swift-tools-version: 5.9
import PackageDescription

// Convenção xtool (build iOS no Linux/WSL):
// produto LIBRARY + xtool.yml (bundleID + infoPath), com @main na library
// (App/KaideApp.swift). O app (App + UI) e o motor (Core) formam UM módulo
// Swift — igual ao build_kaide.py, que compila as três pastas juntas — então
// o target do app engloba os três diretórios e não há target "KaideCore"
// separado (SwiftPM não permite fontes sobrepostas entre targets).
let package = Package(
    name: "Kaide",
    platforms: [.iOS(.v15), .macOS(.v12)],
    products: [
        .executable(name: "kaide", targets: ["KaideCLI"]),
        .library(name: "Kaide", targets: ["KaideApp"]),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "KaideApp",
            path: ".",
            exclude: [
                "CLI",
                "Tests",
                "xtool",
                "App/Info.plist",
                "App/entitlements.plist",
                "App/AppIcon.png",
                "App/AppIcon60x60@2x.png",
                "build_kaide.py",
                "build_wsl_xtool.sh",
                "entitlements_cli.plist",
                "sync_device.py",
                "README.md",
                "Package.swift",
                ".env.example",
            ]
        ),
        .executableTarget(
            name: "KaideCLI",
            dependencies: ["KaideApp"],
            path: "CLI"
        ),
    ]
)
