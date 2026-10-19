import Foundation

/// Representação de uma persona / subagente especializado (estilo .copilot/agents/*.agent.md)
public struct AgentPersona: Identifiable, Codable, Equatable, Sendable {
    public var id: String { name }
    public let name: String
    public let description: String
    public let model: String?
    public let tools: [String]?
    public let systemInstructions: String
    public let sourcePath: String?

    public init(
        name: String,
        description: String,
        model: String? = nil,
        tools: [String]? = nil,
        systemInstructions: String,
        sourcePath: String? = nil
    ) {
        self.name = name
        self.description = description
        self.model = model
        self.tools = tools
        self.systemInstructions = systemInstructions
        self.sourcePath = sourcePath
    }
}

/// Gerenciador de subagentes especializados compatível com .copilot/agents
public final class CustomAgentManager: ObservableObject {
    public static let shared = CustomAgentManager()

    @Published public private(set) var availableAgents: [AgentPersona] = []
    @Published public private(set) var activeAgent: AgentPersona

    public static let defaultPersona = AgentPersona(
        name: "general",
        description: "Engenheiro de software autônomo pleno (padrão Claude Code)",
        model: nil,
        tools: nil,
        systemInstructions: """
        Você é o Kaide, um agente autônomo de engenharia de software da Chronokairo.
        Resolva tarefas de ponta a ponta com rigor de código, testes e passos verificáveis.
        """,
        sourcePath: nil
    )

    public static let builtInPersonas: [AgentPersona] = [
        defaultPersona,
        AgentPersona(
            name: "reviewer",
            description: "Auditor técnico focado em revisão de diffs, segurança e boas práticas",
            model: nil,
            tools: ["read_file", "code_review_diff", "code_analyze_repo"],
            systemInstructions: """
            Você é um revisor de código sênior. Avalie diffs, identifique regressões, vulnerabilidades OWASP e violações de contratos. Forneça feedbacks objetivos e acionáveis.
            """,
            sourcePath: nil
        ),
        AgentPersona(
            name: "debugger",
            description: "Especialista em isolamento de causa-raiz, reprodução de bugs e testes",
            model: nil,
            tools: ["read_file", "code_debug", "bash", "edit_file"],
            systemInstructions: """
            Você é um especialista em debugging. Formule hipóteses claras, valide causa-raiz com logs ou reprodução de falhas e implemente a correção mínima necessária.
            """,
            sourcePath: nil
        ),
        AgentPersona(
            name: "architect",
            description: "Planejador de arquitetura de sistemas, contratos e dependências",
            model: nil,
            tools: ["read_file", "code_analyze_repo"],
            systemInstructions: """
            Você é um arquiteto de software. Analise dependências, módulos, interfaces e padrões arquiteturais. Proponha planos detalhados com rastreabilidade técnica.
            """,
            sourcePath: nil
        )
    ]

    public init() {
        self.activeAgent = Self.defaultPersona
        reloadAgents()
    }

    /// Recarrega agentes customizados de múltiplos diretórios (local, .kaide e .copilot)
    public func reloadAgents(basePath: String = FileManager.default.currentDirectoryPath) {
        var result: [AgentPersona] = Self.builtInPersonas

        let candidateDirs = [
            URL(fileURLWithPath: basePath).appendingPathComponent("agents").path,
            URL(fileURLWithPath: basePath).appendingPathComponent(".kaide/agents").path,
            NSHomeDirectory() + "/.kaide/agents",
            NSHomeDirectory() + "/.copilot/agents"
        ]

        let fm = FileManager.default
        for dir in candidateDirs {
            guard fm.fileExists(atPath: dir) else { continue }
            if let files = try? fm.contentsOfDirectory(atPath: dir) {
                for file in files where file.hasSuffix(".agent.md") {
                    let fullPath = URL(fileURLWithPath: dir).appendingPathComponent(file).path
                    if let content = try? String(contentsOfFile: fullPath, encoding: .utf8),
                       let persona = parseAgentMarkdown(content: content, sourcePath: fullPath) {
                        if !result.contains(where: { $0.name.lowercased() == persona.name.lowercased() }) {
                            result.append(persona)
                        }
                    }
                }
            }
        }

        self.availableAgents = result
    }

    /// Seleciona o agente ativo por nome
    @discardableResult
    public func switchAgent(name: String) -> Bool {
        let clean = name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if let found = availableAgents.first(where: { $0.name.lowercased() == clean }) {
            self.activeAgent = found
            return true
        }
        return false
    }

    /// Parser de arquivo Markdown com Frontmatter YAML simples
    private func parseAgentMarkdown(content: String, sourcePath: String) -> AgentPersona? {
        let lines = content.components(separatedBy: "\n")
        guard lines.count >= 3 && lines[0].trimmingCharacters(in: .whitespaces) == "---" else {
            return nil
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

        guard bodyStartIndex > 0 else { return nil }

        var name = URL(fileURLWithPath: sourcePath).deletingPathExtension().deletingPathExtension().lastPathComponent
        var description = "Agente customizado"
        var model: String? = nil
        var tools: [String]? = nil

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
            case "model":
                model = val
            case "tools":
                let cleanVal = val.trimmingCharacters(in: CharacterSet(charactersIn: "[]"))
                tools = cleanVal.split(separator: ",").map {
                    $0.trimmingCharacters(in: .whitespaces).trimmingCharacters(in: CharacterSet(charactersIn: "\"'"))
                }
            default:
                break
            }
        }

        let body = lines[bodyStartIndex...].joined(separator: "\n").trimmingCharacters(in: .whitespacesAndNewlines)

        return AgentPersona(
            name: name,
            description: description,
            model: model,
            tools: tools,
            systemInstructions: body.isEmpty ? "Agente customizado \(name)" : body,
            sourcePath: sourcePath
        )
    }
}
