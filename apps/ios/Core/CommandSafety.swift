import Foundation

/// Classificador de segurança de comandos shell baseado no padrão Codex.
/// Identifica se um comando é puramente de leitura (.safe) ou se introduz mutações no sistema (.needsApproval).
public enum CommandSafetyCategory: Sendable, Equatable {
    case safe
    case needsApproval(reason: String)

    public var isSafe: Bool {
        if case .safe = self { return true }
        return false
    }
}

public enum CommandSafety {
    /// Comandos conhecidos de leitura estrita (somente exibição de dados)
    private static let safePrograms: Set<String> = [
        "cat", "cd", "cut", "echo", "expr", "false", "grep", "head", "id",
        "ls", "nl", "paste", "pwd", "rev", "seq", "stat", "tail", "tr",
        "true", "uname", "uniq", "wc", "which", "whoami", "file", "date"
    ]

    /// Subcomandos git puramente de leitura
    private static let safeGitSubcommands: Set<String> = [
        "status", "log", "diff", "show", "branch"
    ]

    /// Analisa uma linha de comando shell
    public static func classify(_ command: String) -> CommandSafetyCategory {
        let trimmed = command.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return .safe }

        // Checagens de segurança básicas: redirecionamento de escrita
        if trimmed.contains(">") || trimmed.contains(">>") {
            return .needsApproval(reason: "Comando contém redirecionamento de arquivo (> ou >>)")
        }

        // Divide comandos encadeados por &&, || ou ;
        let parts = trimmed.components(separatedBy: CharacterSet(charactersIn: ";\n"))
        for part in parts {
            let subParts = part.components(separatedBy: "&&")
            for sub in subParts {
                let orParts = sub.components(separatedBy: "||")
                for item in orParts {
                    let cat = classifySingle(item.trimmingCharacters(in: .whitespacesAndNewlines))
                    if !cat.isSafe { return cat }
                }
            }
        }

        return .safe
    }

    private static func classifySingle(_ command: String) -> CommandSafetyCategory {
        guard !command.isEmpty else { return .safe }

        // Separa argumentos respeitando espaços simples
        let tokens = command.split(separator: " ").map(String.init)
        guard let program = tokens.first else { return .safe }

        let programName = (program as NSString).lastPathComponent

        // Git command checks
        if programName == "git" {
            guard tokens.count > 1 else { return .safe }
            let subcommand = tokens[1]
            if safeGitSubcommands.contains(subcommand) {
                // Checa opções inseguras como --output
                for arg in tokens.dropFirst(2) {
                    if arg.hasPrefix("--output") {
                        return .needsApproval(reason: "Git com flag de escrita --output")
                    }
                }
                return .safe
            } else {
                return .needsApproval(reason: "Subcomando git mutável: \(subcommand)")
            }
        }

        if safePrograms.contains(programName) {
            return .safe
        }

        return .needsApproval(reason: "Programa com potencial efeito colateral: \(programName)")
    }
}
