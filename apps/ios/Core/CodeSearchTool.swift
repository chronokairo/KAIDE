import Foundation

public struct SearchMatch: Codable, Identifiable {
    public var id: String { "\(file):\(line)" }
    public let file: String
    public let line: Int
    public let snippet: String
}

public struct CodeSearchResult: Codable {
    public let query: String
    public let totalMatches: Int
    public let matches: [SearchMatch]
    public let error: String?
}

/// Ferramenta nativa de busca rápida por arquivos e texto no repositório (estilo code_search / grep)
public enum CodeSearchTool {

    private static let ignoredDirs: Set<String> = [
        ".git", ".build", ".swiftpm", "Pods", "node_modules", "Artifacts", ".vscode", "DerivedData"
    ]

    private static let textExtensions: Set<String> = [
        "swift", "m", "h", "c", "cpp", "py", "js", "ts", "tsx", "jsx",
        "json", "md", "txt", "sh", "yml", "yaml", "plist", "css", "html"
    ]

    /// Busca arquivos pelo nome ou extensão
    public static func findFiles(rootPath: String = ".", pattern: String, maxResults: Int = 50) -> [String] {
        let fm = FileManager.default
        let root = rootPath.isEmpty ? "." : rootPath
        var results: [String] = []

        let pat = pattern.lowercased()
        guard let enumerator = fm.enumerator(atPath: root) else { return [] }

        while let item = enumerator.nextObject() as? String {
            let comps = item.components(separatedBy: "/")
            if comps.contains(where: { ignoredDirs.contains($0) }) {
                continue
            }
            if item.lowercased().contains(pat) {
                results.append(item)
                if results.count >= maxResults { break }
            }
        }
        return results
    }

    /// Busca ocorrências de texto ou regex dentro de arquivos
    public static func searchContent(
        rootPath: String = ".",
        query: String,
        isRegex: Bool = false,
        maxResults: Int = 40
    ) -> CodeSearchResult {
        guard !query.isEmpty else {
            return CodeSearchResult(query: query, totalMatches: 0, matches: [], error: "Consulta vazia")
        }

        let fm = FileManager.default
        let root = rootPath.isEmpty ? "." : rootPath
        var matches: [SearchMatch] = []

        var regex: NSRegularExpression? = nil
        if isRegex {
            do {
                regex = try NSRegularExpression(pattern: query, options: [.caseInsensitive])
            } catch {
                return CodeSearchResult(query: query, totalMatches: 0, matches: [], error: "Regex inválido: \(error.localizedDescription)")
            }
        }

        guard let enumerator = fm.enumerator(atPath: root) else {
            return CodeSearchResult(query: query, totalMatches: 0, matches: [], error: "Caminho não encontrado")
        }

        while let item = enumerator.nextObject() as? String {
            let comps = item.components(separatedBy: "/")
            if comps.contains(where: { ignoredDirs.contains($0) }) {
                continue
            }

            let ext = (item as NSString).pathExtension.lowercased()
            guard textExtensions.contains(ext) else { continue }

            let fullPath = URL(fileURLWithPath: root).appendingPathComponent(item).path
            guard let content = try? String(contentsOfFile: fullPath, encoding: .utf8) else { continue }

            let lines = content.components(separatedBy: "\n")
            for (idx, line) in lines.enumerated() {
                let hit: Bool
                if let r = regex {
                    hit = r.firstMatch(in: line, options: [], range: NSRange(location: 0, length: line.utf16.count)) != nil
                } else {
                    hit = line.localizedCaseInsensitiveContains(query)
                }

                if hit {
                    matches.append(SearchMatch(
                        file: item,
                        line: idx + 1,
                        snippet: line.trimmingCharacters(in: .whitespaces)
                    ))
                    if matches.count >= maxResults { break }
                }
            }

            if matches.count >= maxResults { break }
        }

        return CodeSearchResult(query: query, totalMatches: matches.count, matches: matches, error: nil)
    }
}
