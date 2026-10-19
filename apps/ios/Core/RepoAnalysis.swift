import Foundation

public struct RepoFileStat: Codable, Identifiable {
    public var id: String { path }
    public let path: String
    public let lines: Int
    public let language: String
    public let sizeBytes: Int

    public init(path: String, lines: Int, language: String, sizeBytes: Int) {
        self.path = path
        self.lines = lines
        self.language = language
        self.sizeBytes = sizeBytes
    }
}

public struct RepoAnalysisResult: Codable {
    public let rootPath: String
    public let totalFiles: Int
    public let totalLines: Int
    public let languages: [String: Int]
    public let coreModules: [String]
    public let architectureStyle: String
    public let warnings: [String]

    public init(rootPath: String, totalFiles: Int, totalLines: Int, languages: [String: Int], coreModules: [String], architectureStyle: String, warnings: [String]) {
        self.rootPath = rootPath
        self.totalFiles = totalFiles
        self.totalLines = totalLines
        self.languages = languages
        self.coreModules = coreModules
        self.architectureStyle = architectureStyle
        self.warnings = warnings
    }

    public var summaryFormatted: String {
        var out = """
        # Análise do Repositório (Kaide)
        - **Caminho:** \(rootPath)
        - **Total de Arquivos:** \(totalFiles)
        - **Total de Linhas:** \(totalLines)
        - **Módulos Detectados:** \(coreModules.isEmpty ? "Nenhum" : coreModules.joined(separator: ", "))
        - **Arquitetura Heurística:** \(architectureStyle)
        - **Linguagens:** \(languages.map { "\($0.key) (\($0.value))" }.sorted().joined(separator: ", "))
        """
        if !warnings.isEmpty {
            out += "\n\n**Avisos:**\n" + warnings.map { "- \($0)" }.joined(separator: "\n")
        }
        return out
    }
}

public enum RepoAnalysis {
    public static func analyze(at basePath: String = ".", depth: Int = 4) -> RepoAnalysisResult {
        let fm = FileManager.default
        let root = basePath.isEmpty ? "." : basePath
        var totalFiles = 0
        var totalLines = 0
        var langCounts: [String: Int] = [:]
        var modules: Set<String> = []
        var warnings: [String] = []

        let enumerator = fm.enumerator(atPath: root)
        while let file = enumerator?.nextObject() as? String {
            if file.contains(".git/") || file.contains(".build/") || file.contains("Pods/") || file.contains(".xcodeproj/") || file.contains("Artifacts/") || file.contains("artifacts/") {
                continue
            }
            let components = file.components(separatedBy: "/")
            if components.count > depth { continue }
            if components.count >= 2 {
                modules.insert(components[0])
            }

            let ext = (file as NSString).pathExtension.lowercased()
            let lang = languageFor(extension: ext)
            guard !lang.isEmpty else { continue }

            totalFiles += 1
            langCounts[lang, default: 0] += 1

            let fullPath = (root as NSString).appendingPathComponent(file)
            if let data = try? Data(contentsOf: URL(fileURLWithPath: fullPath)),
               let content = String(data: data, encoding: .utf8) {
                totalLines += content.components(separatedBy: "\n").count
            }
        }

        var style = "Indeterminado"
        if modules.contains("Features") && modules.contains("Core") {
            style = "Core + Features Modular"
        } else if modules.contains("Views") && modules.contains("Models") {
            style = "MVVM / MVC Padrão"
        } else if modules.contains("Sources") {
            style = "Swift Package Standard"
        }

        if totalFiles > 50 && modules.isEmpty {
            warnings.append("Estrutura plana sem divisão clara de diretórios de módulos.")
        }

        return RepoAnalysisResult(
            rootPath: root,
            totalFiles: totalFiles,
            totalLines: totalLines,
            languages: langCounts,
            coreModules: Array(modules).sorted(),
            architectureStyle: style,
            warnings: warnings
        )
    }

    public static func languageFor(extension ext: String) -> String {
        switch ext {
        case "swift": return "Swift"
        case "py": return "Python"
        case "js", "jsx": return "JavaScript"
        case "ts", "tsx": return "TypeScript"
        case "sh", "bash": return "Shell"
        case "json": return "JSON"
        case "md": return "Markdown"
        case "html", "htm": return "HTML"
        case "css": return "CSS"
        case "c", "h", "m": return "C/ObjC"
        case "cpp", "hpp": return "C++"
        case "yml", "yaml": return "YAML"
        case "plist": return "Plist"
        default: return ""
        }
    }
}
