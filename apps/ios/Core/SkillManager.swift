import Foundation

/// Representação de uma Skill especializada (compatível com .copilot/skills/*/SKILL.md)
public struct KaideSkill: Identifiable, Codable, Equatable, Sendable {
    public var id: String { name }
    public let name: String
    public let description: String
    public let instructions: String
    public let sourcePath: String

    public init(name: String, description: String, instructions: String, sourcePath: String) {
        self.name = name
        self.description = description
        self.instructions = instructions
        self.sourcePath = sourcePath
    }
}

/// Gerenciador de Skills em runtime para Kaide
public final class SkillManager: ObservableObject {
    public static let shared = SkillManager()

    @Published public private(set) var availableSkills: [KaideSkill] = []

    public init() {
        reloadSkills()
    }

    /// Varre diretórios de skills conhecidos
    public func reloadSkills(basePath: String = FileManager.default.currentDirectoryPath) {
        var found: [KaideSkill] = []
        let fm = FileManager.default

        let candidateRoots = [
            URL(fileURLWithPath: basePath).appendingPathComponent("skills").path,
            URL(fileURLWithPath: basePath).appendingPathComponent(".kaide/skills").path,
            NSHomeDirectory() + "/.kaide/skills",
            NSHomeDirectory() + "/.copilot/skills"
        ]

        for root in candidateRoots {
            guard fm.fileExists(atPath: root) else { continue }
            guard let subdirs = try? fm.contentsOfDirectory(atPath: root) else { continue }

            for sub in subdirs {
                let skillMdPath = URL(fileURLWithPath: root).appendingPathComponent(sub).appendingPathComponent("SKILL.md").path
                if fm.fileExists(atPath: skillMdPath),
                   let content = try? String(contentsOfFile: skillMdPath, encoding: .utf8),
                   let skill = parseSkill(content: content, fallbackName: sub, path: skillMdPath) {
                    if !found.contains(where: { $0.name.lowercased() == skill.name.lowercased() }) {
                        found.append(skill)
                    }
                }
            }
        }

        self.availableSkills = found
    }

    /// Retorna catálogo formatado para injeção no prompt do sistema
    public func promptCatalogSummary() -> String {
        guard !availableSkills.isEmpty else { return "" }
        var result = "\n### Habilidades Especializadas (Skills Ativas no Ambiente):\n"
        for s in availableSkills {
            result += "- **\(s.name)**: \(s.description)\n"
        }
        result += "\nSe o usuário solicitar uma tarefa coberta por uma dessas habilidades, aplique as instruções da respectiva skill.\n"
        return result
    }

    /// Busca o conteúdo completo de uma skill
    public func getSkill(named name: String) -> KaideSkill? {
        let clean = name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return availableSkills.first { $0.name.lowercased() == clean }
    }

    private func parseSkill(content: String, fallbackName: String, path: String) -> KaideSkill? {
        let lines = content.components(separatedBy: "\n")
        guard lines.count >= 3 && lines[0].trimmingCharacters(in: .whitespaces) == "---" else {
            return KaideSkill(
                name: fallbackName,
                description: "Skill \(fallbackName)",
                instructions: content,
                sourcePath: path
            )
        }

        var frontmatterLines: [String] = []
        var bodyStartIndex = 0
        for i in 1..<lines.count {
            if lines[i].trimmingCharacters(in: .whitespaces) == "---" {
                bodyStartIndex = i + 1
                break
            }
            frontmatterLines.append(lines[i])
        }

        var name = fallbackName
        var description = "Instruções especializadas"

        for fLine in frontmatterLines {
            let parts = fLine.split(separator: ":", maxSplits: 1).map { String($0).trimmingCharacters(in: .whitespaces) }
            guard parts.count == 2 else { continue }
            let key = parts[0].lowercased()
            var val = parts[1]
            if (val.hasPrefix("\"") && val.hasSuffix("\"")) || (val.hasPrefix("'") && val.hasSuffix("'")) {
                val = String(val.dropFirst().dropLast())
            }

            switch key {
            case "name":
                name = val
            case "description":
                description = val
            default:
                break
            }
        }

        let body = bodyStartIndex > 0
            ? lines[bodyStartIndex...].joined(separator: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
            : content

        return KaideSkill(
            name: name,
            description: description,
            instructions: body,
            sourcePath: path
        )
    }
}
