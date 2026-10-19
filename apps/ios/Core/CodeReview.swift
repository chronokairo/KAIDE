import Foundation

public struct CodeReviewFinding: Codable, Identifiable {
    public var id: String { "\(file):\(line):\(rule)" }
    public let file: String
    public let line: Int
    public let severity: String // "error", "warning", "suggestion"
    public let rule: String
    public let message: String
    public let suggestion: String?

    public init(file: String, line: Int, severity: String, rule: String, message: String, suggestion: String?) {
        self.file = file
        self.line = line
        self.severity = severity
        self.rule = rule
        self.message = message
        self.suggestion = suggestion
    }
}

public struct CodeReviewSummary: Codable {
    public let title: String
    public let summary: String
    public let score: Int // 0 a 100
    public let findings: [CodeReviewFinding]
    public let approved: Bool

    public init(title: String, summary: String, score: Int, findings: [CodeReviewFinding], approved: Bool) {
        self.title = title
        self.summary = summary
        self.score = score
        self.findings = findings
        self.approved = approved
    }

    public var formattedText: String {
        var out = "### \(title)\n\(summary)\n**Aprovado:** \(approved ? "Sim ✅" : "Não ❌") (Score: \(score)/100)\n"
        if !findings.isEmpty {
            out += "\n**Apontamentos:**\n"
            for f in findings {
                out += "- [\(f.severity.uppercased())] `\(f.file):\(f.line)` (\(f.rule)): \(f.message)\n"
                if let s = f.suggestion { out += "  💡 *Sugestão:* \(s)\n" }
            }
        }
        return out
    }
}

public enum CodeReview {
    public static func reviewDiff(_ diffText: String) -> CodeReviewSummary {
        var findings: [CodeReviewFinding] = []
        let lines = diffText.components(separatedBy: "\n")
        var currentFile = ""
        var lineNum = 0

        for line in lines {
            if line.hasPrefix("+++ b/") {
                currentFile = String(line.dropFirst(6))
                lineNum = 0
                continue
            }
            if line.hasPrefix("+") && !line.hasPrefix("+++") {
                lineNum += 1
                let addedContent = String(line.dropFirst())

                // 1. Checagens de credenciais / segredos expostos
                if addedContent.contains("password") || addedContent.contains("secret") || addedContent.contains("apikey") || addedContent.contains("AKIA") {
                    if !addedContent.contains("Keychain") && !addedContent.contains("UserDefaults") && !addedContent.contains("ProcessInfo") && !addedContent.contains("getenv") {
                        findings.append(CodeReviewFinding(
                            file: currentFile,
                            line: lineNum,
                            severity: "error",
                            rule: "Security/SecretLeak",
                            message: "Possível credencial ou segredo em texto claro adicionado.",
                            suggestion: "Utilize Keychain ou variáveis de ambiente para armazenar chaves e senhas."
                        ))
                    }
                }

                // 2. Segurança no Swift (force cast / force unwrap)
                if addedContent.contains("try!") || addedContent.contains("as!") {
                    findings.append(CodeReviewFinding(
                        file: currentFile,
                        line: lineNum,
                        severity: "warning",
                        rule: "Safety/ForceCastOrTry",
                        message: "Uso de desempacotamento forçado (try! / as!) pode causar crash em tempo de execução.",
                        suggestion: "Substitua por try? ou do-catch com tratamento gracioso de falha."
                    ))
                }

                // 3. Confiabilidade: fatalError em código de produção
                if addedContent.contains("fatalError(") && !currentFile.contains("Test") {
                    findings.append(CodeReviewFinding(
                        file: currentFile,
                        line: lineNum,
                        severity: "warning",
                        rule: "Reliability/FatalError",
                        message: "fatalError encerra imediatamente a execução do app.",
                        suggestion: "Lance um erro tipado ou retorne um valor padrão seguro."
                    ))
                }
            }
        }

        let score = max(0, 100 - (findings.filter { $0.severity == "error" }.count * 30) - (findings.filter { $0.severity == "warning" }.count * 10))
        let approved = findings.filter { $0.severity == "error" }.isEmpty && score >= 70
        let summary = "Revisão Kaide concluída: \(findings.count) apontamentos encontrados. Score de qualidade: \(score)/100."

        return CodeReviewSummary(
            title: "Revisão Automática de Código",
            summary: summary,
            score: score,
            findings: findings,
            approved: approved
        )
    }
}
