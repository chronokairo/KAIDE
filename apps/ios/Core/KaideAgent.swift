import Foundation
import Combine

public enum KaideAgentStatus: Equatable {
    case idle
    case thinking
    case executingTool(String)
    case completed
    case error(String)

    public var label: String {
        switch self {
        case .idle: return "Pronto"
        case .thinking: return "Raciocinando com NVIDIA NIM..."
        case .executingTool(let tool): return "Executando \(tool)..."
        case .completed: return "Concluído"
        case .error(let err): return "Erro: \(err)"
        }
    }
}

public struct KaideTurn: Identifiable, Codable {
    public let id: String
    public let role: String // "user", "assistant", "tool"
    public var content: String
    public var reasoning: String?
    public var toolName: String?
    public var toolCallId: String?
    public var toolArgs: String?
    public var isError: Bool?
    public var metrics: TurnMetrics?
    public let timestamp: Date

    public init(
        id: String = UUID().uuidString,
        role: String,
        content: String,
        reasoning: String? = nil,
        toolName: String? = nil,
        toolCallId: String? = nil,
        toolArgs: String? = nil,
        isError: Bool? = nil,
        metrics: TurnMetrics? = nil,
        timestamp: Date = Date()
    ) {
        self.id = id
        self.role = role
        self.content = content
        self.reasoning = reasoning
        self.toolName = toolName
        self.toolCallId = toolCallId
        self.toolArgs = toolArgs
        self.isError = isError
        self.metrics = metrics
        self.timestamp = timestamp
    }
}

public final class KaideAgent: ObservableObject {
    @Published public var history: [KaideTurn] = []
    @Published public var status: KaideAgentStatus = .idle
    @Published public var selectedModel: String = UserDefaults.standard.string(forKey: "kaide_selected_model") ?? NIMClient.defaultModel {
        didSet {
            UserDefaults.standard.set(selectedModel, forKey: "kaide_selected_model")
        }
    }
    @Published public var isRunning: Bool = false
    @Published public var currentSessionId: String? = nil

    private let client: NIMClient

    public static let systemPrompt = """
    Você é o Kaide, um agente autônomo de programação (Agent Coding) nativo no iOS (ambiente rootless/Darwin).
    Você suporta exclusivamente a infraestrutura NVIDIA NIM para processamento inteligente.

    Suas capacidades locais incluem:
    - bash: Executa comandos shell no Darwin (compilações, testes, git, árvore de arquivos, diagnósticos).
    - read_file: Lê arquivos do repositório em UTF-8.
    - write_file: Cria ou sobrescreve arquivos atomicamente.
    - edit_file: Substitui trechos únicos de código atomicamente.
    - apply_patch: Aplica patches atômicos em formato de diff unificado do Git ou envelope do Codex (*** Begin Patch / *** Update File: / *** Add File: / *** Delete File:).
    - code_analyze_repo: Mapeia módulos, estrutura e linguagens.
    - code_review_diff: Revisa diffs e aponta riscos de segurança e boas práticas.
    - code_debug: Diagnostica falhas e stack traces.

    Diretrizes operacionais:
    1. Seja objetivo, técnico e direto ao ponto.
    2. Ao fazer alterações, leia o arquivo antes para garantir que o trecho de substituição ou linhas de contexto sejam exatos.
    3. Prefira apply_patch ou edit_file para edições parciais pontuais em arquivos existentes.
    4. Verifique sempre o resultado dos seus comandos após executá-los.
    5. Não invente saídas nem certifique compilações sem executar de fato.
    """

    public init(client: NIMClient = .shared) {
        self.client = client
    }

    @MainActor
    public func prompt(_ userInput: String) async {
        let trimmed = userInput.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        guard !isRunning else { return }

        isRunning = true
        status = .thinking

        // Inicializa ou recupera sessão persistente
        let sid: String
        if let existing = currentSessionId {
            sid = existing
        } else {
            let title = String(trimmed.prefix(32))
            let meta = SessionPersistence.shared.createSession(title: title, model: selectedModel)
            currentSessionId = meta.id
            sid = meta.id
        }

        let userTurn = KaideTurn(role: "user", content: trimmed)
        history.append(userTurn)
        SessionPersistence.shared.appendTurn(sessionId: sid, turn: userTurn)

        do {
            try await runAgentLoop(sessionId: sid)
            if isRunning {
                status = .completed
            }
        } catch {
            if !isRunning {
                status = .idle
                let stopTurn = KaideTurn(role: "assistant", content: "_Execução interrompida pelo usuário._")
                history.append(stopTurn)
                SessionPersistence.shared.appendTurn(sessionId: sid, turn: stopTurn)
            } else {
                status = .error(error.localizedDescription)
                let errTurn = KaideTurn(role: "assistant", content: "Ocorreu um erro: \(error.localizedDescription)")
                history.append(errTurn)
                SessionPersistence.shared.appendTurn(sessionId: sid, turn: errTurn)
            }
        }

        isRunning = false
    }

    @MainActor
    private func runAgentLoop(sessionId: String) async throws {
        let tools = KaideTools.definitions()
        let tracker = TurnDiffTracker()

        var basePrompt = KaideAgent.systemPrompt
        if let agentsDoc = AgentsMdManager().loadInstructions() {
            basePrompt += "\n\n" + agentsDoc
        }

        while isRunning {
            var messages: [NIMMessage] = [
                NIMMessage(role: "system", content: basePrompt)
            ]

            for turn in history {
                if turn.role == "tool" {
                    messages.append(NIMMessage(role: "tool", content: turn.content, toolCallId: turn.toolCallId))
                } else if turn.role == "assistant" {
                    messages.append(NIMMessage(role: "assistant", content: turn.content))
                } else {
                    messages.append(NIMMessage(role: "user", content: turn.content))
                }
            }

            status = .thinking
            let reply = try await client.complete(
                messages: messages,
                tools: tools,
                model: selectedModel,
                temperature: 0.2
            )

            // Calcula métricas de execução deste turno
            let metrics = TurnMetrics.compute(
                model: selectedModel,
                usage: reply.usage,
                latency: reply.latencySeconds
            )

            // Se o modelo trouxe conteúdo textual ou pensamento
            if !reply.content.isEmpty || !reply.reasoning.isEmpty {
                let assistantTurn = KaideTurn(
                    role: "assistant",
                    content: reply.content,
                    reasoning: reply.reasoning.isEmpty ? nil : reply.reasoning,
                    metrics: metrics
                )
                history.append(assistantTurn)
                SessionPersistence.shared.appendTurn(sessionId: sessionId, turn: assistantTurn)
            }

            // Se não houve chamadas de ferramentas, o agente terminou seu raciocínio
            if reply.toolCalls.isEmpty {
                break
            }

            // Executa ferramentas chamadas pelo modelo
            for call in reply.toolCalls {
                guard isRunning else { break }
                status = .executingTool(call.function.name)

                let result = await KaideTools.execute(
                    name: call.function.name,
                    rawArgs: call.function.arguments,
                    tracker: tracker
                )

                let toolTurn = KaideTurn(
                    role: "tool",
                    content: result.text,
                    toolName: call.function.name,
                    toolCallId: call.id,
                    toolArgs: call.function.arguments,
                    isError: result.isError
                )
                history.append(toolTurn)
                SessionPersistence.shared.appendTurn(sessionId: sessionId, turn: toolTurn)
            }
        }

        if tracker.hasChanges {
            let diff = tracker.generateUnifiedDiff()
            if !diff.isEmpty {
                let diffTurn = KaideTurn(
                    role: "assistant",
                    content: "### Resumo de Alterações (Diff Unificado):\n```diff\n\(diff)\n```"
                )
                history.append(diffTurn)
                SessionPersistence.shared.appendTurn(sessionId: sessionId, turn: diffTurn)
            }
        }
    }

    /// Interrompe a execução atual do agente
    @MainActor
    public func stop() {
        isRunning = false
        status = .idle
    }

    /// Retoma uma sessão salva em disco
    @MainActor
    public func resumeSession(id: String) {
        guard let (meta, turns) = SessionPersistence.shared.loadSession(sessionId: id) else { return }
        self.history = turns
        self.currentSessionId = id
        self.selectedModel = meta.model
        self.status = .idle
    }

    /// Inicia uma nova conversa limpa
    @MainActor
    public func newSession() {
        history.removeAll()
        currentSessionId = nil
        status = .idle
    }

    @MainActor
    public func clearHistory() {
        newSession()
    }
}
