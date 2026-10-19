import Foundation

/// Gerenciador de AGENTS.md baseado no padrão upstream do Codex.
/// Realiza busca hierárquica a partir do diretório atual (cwd) até a raiz do repositório (.git).
public struct AgentsMdManager: Sendable {
    public static let defaultFilename = "AGENTS.md"
    public static let overrideFilename = "AGENTS.override.md"
    public static let maxBytes = 32_768 // 32 KiB

    public let cwd: String

    public init(cwd: String = FileManager.default.currentDirectoryPath) {
        self.cwd = cwd
    }

    /// Localiza caminhos de AGENTS.md caminhando da raiz do projeto (.git) até o diretório atual
    public func findAgentsMdPaths() -> [String] {
        let fm = FileManager.default
        let standardizedCwd = ((cwd as NSString).resolvingSymlinksInPath as NSString).standardizingPath

        // 1. Caminha para cima para encontrar a raiz do repositório (.git)
        var projectRoot: String?
        var cursor = standardizedCwd
        while true {
            let gitMarker = (cursor as NSString).appendingPathComponent(".git")
            if fm.fileExists(atPath: gitMarker) {
                projectRoot = cursor
                break
            }
            let parent = (cursor as NSString).deletingLastPathComponent
            if parent == cursor || parent.isEmpty { break }
            cursor = parent
        }

        // 2. Coleta diretórios da raiz até cwd
        var searchDirs: [String] = []
        if let root = projectRoot {
            var dirs: [String] = []
            var c = standardizedCwd
            while true {
                dirs.append(c)
                if c == root { break }
                let parent = (c as NSString).deletingLastPathComponent
                if parent == c || parent.isEmpty { break }
                c = parent
            }
            searchDirs = dirs.reversed()
        } else {
            searchDirs = [standardizedCwd]
        }

        // 3. Em cada diretório, busca AGENTS.override.md e depois AGENTS.md
        var foundPaths: [String] = []
        for dir in searchDirs {
            for filename in [Self.overrideFilename, Self.defaultFilename] {
                let candidate = (dir as NSString).appendingPathComponent(filename)
                if fm.fileExists(atPath: candidate) && !foundPaths.contains(candidate) {
                    foundPaths.append(candidate)
                    break // override substitui o default naquele nível
                }
            }
        }

        return foundPaths
    }

    /// Carrega as instruções consolidadas de AGENTS.md dos diretórios relevantes
    public func loadInstructions() -> String? {
        let paths = findAgentsMdPaths()
        guard !paths.isEmpty else { return nil }

        var sections: [String] = []
        var totalBytes = 0

        for path in paths {
            guard let raw = try? String(contentsOfFile: path, encoding: .utf8) else { continue }
            let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmed.isEmpty else { continue }

            let bytes = trimmed.utf8.count
            if totalBytes + bytes > Self.maxBytes {
                let remaining = max(0, Self.maxBytes - totalBytes)
                let truncated = String(trimmed.utf8.prefix(remaining)) ?? ""
                sections.append("<!-- Arquivo: \(path) (truncado) -->\n" + truncated)
                break
            } else {
                sections.append("<!-- Arquivo: \(path) -->\n" + trimmed)
                totalBytes += bytes
            }
        }

        guard !sections.isEmpty else { return nil }

        return """
        # Diretrizes do Projeto (AGENTS.md)
        As regras a seguir foram carregadas diretamente dos arquivos AGENTS.md do repositório atual e devem ser estritamente respeitadas pelo Kaide:

        \(sections.joined(separator: "\n\n---\n\n"))
        """
    }
}
