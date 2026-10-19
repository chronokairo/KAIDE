import Foundation

/// Compactador de contexto e histórico de conversas (estilo /compact do Copilot e Claude Code)
public enum ContextCompactor {

    public static let compactionSystemPrompt = """
    Você é um compactador de contexto de conversas de engenharia de software.
    Receba o histórico de turnos e gere um resumo estruturado de alta densidade técnica com:
    1. Objetivo central e requisitos
    2. Arquivos inspecionados, criados ou modificados
    3. Decisões arquiteturais tomadas e testes executados
    4. Estado atual e pendências
    Mantenha estritamente o formato Markdown com listas diretas. Seja conciso e não omita detalhes técnicos cruciais.
    """

    /// Condensa turnos antigos em um único turno de contexto estruturado
    public static func compact(
        turns: [KaideTurn],
        client: NIMClient,
        model: String,
        preserveLast: Int = 2
    ) async throws -> [KaideTurn] {
        guard turns.count > preserveLast + 1 else {
            return turns
        }

        let sliceToCompact = Array(turns.prefix(turns.count - preserveLast))
        let sliceToPreserve = Array(turns.suffix(preserveLast))

        var historyTranscript = ""
        for (i, t) in sliceToCompact.enumerated() {
            let roleName = t.role.uppercased()
            historyTranscript += "### [Turno \(i + 1) - \(roleName)]\n\(t.content)\n\n"
        }

        let prompt = """
        Histórico para compactação:
        \(historyTranscript)

        Gere o resumo condensado do histórico acima para servir de contexto aos próximos turnos.
        """

        let messages: [NIMMessage] = [
            NIMMessage(role: "system", content: compactionSystemPrompt),
            NIMMessage(role: "user", content: prompt)
        ]

        let response = try await client.complete(
            messages: messages,
            tools: nil,
            model: model,
            temperature: 0.2,
            maxTokens: 1500
        )
        let summaryContent = """
        ### [Contexto Compactado da Sessão Anterior]
        \(response.content)
        """

        var newHistory: [KaideTurn] = [
            KaideTurn(role: "assistant", content: summaryContent, metrics: response.metrics)
        ]
        newHistory.append(contentsOf: sliceToPreserve)

        return newHistory
    }
}
