import Foundation

public struct GitWorktreeInfo: Identifiable, Codable {
    public var id: String { path }
    public let path: String
    public let commit: String
    public let branch: String
    public let isLocked: Bool
}

/// Gerenciador de Git Worktrees isoladas para sessões de agent coding (estilo .copilot/repos worktrees)
public enum WorktreeManager {

    /// Lista worktrees ativas no repositório
    public static func listWorktrees(repoPath: String = ".") -> [GitWorktreeInfo] {
        let cmd = "cd \"\(repoPath)\" && git worktree list --porcelain"
        let output = LocalShell.runSync(cmd)

        var result: [GitWorktreeInfo] = []
        let blocks = output.components(separatedBy: "\n\n")

        for b in blocks where !b.trimmingCharacters(in: CharacterSet.whitespacesAndNewlines).isEmpty {
            var path = ""
            var commit = ""
            var branch = ""
            var locked = false

            for line in b.components(separatedBy: "\n") {
                let trimmed = line.trimmingCharacters(in: CharacterSet.whitespaces)
                if trimmed.hasPrefix("worktree ") {
                    path = String(trimmed.dropFirst("worktree ".count))
                } else if trimmed.hasPrefix("HEAD ") {
                    commit = String(trimmed.dropFirst("HEAD ".count))
                } else if trimmed.hasPrefix("branch ") {
                    branch = String(trimmed.dropFirst("branch ".count))
                } else if trimmed.hasPrefix("locked") {
                    locked = true
                }
            }

            if !path.isEmpty {
                result.append(GitWorktreeInfo(
                    path: path,
                    commit: String(commit.prefix(8)),
                    branch: branch.replacingOccurrences(of: "refs/heads/", with: ""),
                    isLocked: locked
                ))
            }
        }
        return result
    }

    /// Cria uma nova worktree isolada para o agente executar alterações com segurança
    public static func createWorktree(
        repoPath: String = ".",
        taskName: String,
        baseBranch: String = "HEAD"
    ) -> (success: Bool, worktreePath: String, branch: String, error: String?) {
        let safeTask = taskName.lowercased()
            .replacingOccurrences(of: " ", with: "-")
            .filter { $0.isLetter || $0.isNumber || $0 == "-" }
        let branchName = "kaide/\(safeTask)-\(Int(Date().timeIntervalSince1970))"

        let targetDir: String
        if let base = try? URL(fileURLWithPath: repoPath).resourceValues(forKeys: [.isDirectoryKey]), base.isDirectory == true {
            targetDir = URL(fileURLWithPath: repoPath).appendingPathComponent(".kaide-worktrees/\(safeTask)").path
        } else {
            targetDir = "/var/jb/tmp/kaide-worktrees/\(safeTask)"
        }

        let cmd = "cd \"\(repoPath)\" && mkdir -p \"$(dirname '\(targetDir)')\" && git worktree add -b \"\(branchName)\" \"\(targetDir)\" \"\(baseBranch)\""
        let out = LocalShell.runSync(cmd)

        if FileManager.default.fileExists(atPath: targetDir) {
            return (true, targetDir, branchName, nil)
        } else {
            return (false, targetDir, branchName, "Falha ao criar worktree: \(out)")
        }
    }

    /// Remove a worktree e limpa metadados
    public static func removeWorktree(repoPath: String = ".", worktreePath: String) -> (success: Bool, message: String) {
        let cmd = "cd \"\(repoPath)\" && git worktree remove --force \"\(worktreePath)\""
        let out = LocalShell.runSync(cmd)
        let exists = FileManager.default.fileExists(atPath: worktreePath)
        return (!exists, exists ? out : "Worktree removida com sucesso")
    }
}
