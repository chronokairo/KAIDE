import Foundation

/// Registrador de diffs unificados durante um turno do agente Kaide.
/// Baseado na arquitetura do TurnDiffTracker do Codex.
public final class TurnDiffTracker {
    public struct FileChange: Sendable, Codable {
        public let path: String
        public let oldContent: String
        public let newContent: String

        public init(path: String, oldContent: String, newContent: String) {
            self.path = path
            self.oldContent = oldContent
            self.newContent = newContent
        }
    }

    private var changes: [String: FileChange] = [:]

    public init() {}

    public func recordChange(path: String, oldContent: String, newContent: String) {
        let existingOld = changes[path]?.oldContent ?? oldContent
        changes[path] = FileChange(path: path, oldContent: existingOld, newContent: newContent)
    }

    public var hasChanges: Bool { !changes.isEmpty }

    public func reset() {
        changes.removeAll()
    }

    /// Gera um diff unificado no formato Git padrão para todos os arquivos alterados
    public func generateUnifiedDiff() -> String {
        guard !changes.isEmpty else { return "" }

        var output: [String] = []
        for path in changes.keys.sorted() {
            guard let change = changes[path] else { continue }
            let diff = computeDiff(path: path, old: change.oldContent, new: change.newContent)
            if !diff.isEmpty {
                output.append(diff)
            }
        }
        return output.joined(separator: "\n\n")
    }

    private func computeDiff(path: String, old: String, new: String) -> String {
        let oldLines = old.components(separatedBy: "\n")
        let newLines = new.components(separatedBy: "\n")

        var diffLines: [String] = [
            "--- a/\(path)",
            "+++ b/\(path)",
            "@@ -1,\(max(1, oldLines.count)) +1,\(max(1, newLines.count)) @@"
        ]

        // Diferenciação linear simplificada
        let maxLines = max(oldLines.count, newLines.count)
        for i in 0..<maxLines {
            let o = i < oldLines.count ? oldLines[i] : nil
            let n = i < newLines.count ? newLines[i] : nil

            if let o = o, let n = n {
                if o == n {
                    diffLines.append(" \(o)")
                } else {
                    diffLines.append("-\(o)")
                    diffLines.append("+\(n)")
                }
            } else if let o = o {
                diffLines.append("-\(o)")
            } else if let n = n {
                diffLines.append("+\(n)")
            }
        }

        return diffLines.joined(separator: "\n")
    }
}
