import Foundation

/// Métricas de execução de um turno de inferência do modelo no NVIDIA NIM
public struct TurnMetrics: Codable, Equatable {
    public let promptTokens: Int
    public let completionTokens: Int
    public let totalTokens: Int
    public let reasoningTokens: Int
    public let latencySeconds: Double
    public let estimatedCostUSD: Double
    public let model: String

    public init(
        promptTokens: Int,
        completionTokens: Int,
        totalTokens: Int,
        reasoningTokens: Int,
        latencySeconds: Double,
        estimatedCostUSD: Double,
        model: String
    ) {
        self.promptTokens = promptTokens
        self.completionTokens = completionTokens
        self.totalTokens = totalTokens
        self.reasoningTokens = reasoningTokens
        self.latencySeconds = latencySeconds
        self.estimatedCostUSD = estimatedCostUSD
        self.model = model
    }

    /// Calcula estimativa de métricas e custo em USD com base na precificação do modelo
    public static func compute(model: String, usage: TokenUsage?, latency: Double) -> TurnMetrics {
        let pTokens = usage?.promptTokens ?? 0
        let cTokens = usage?.completionTokens ?? 0
        let tTokens = usage?.totalTokens ?? (pTokens + cTokens)
        let rTokens = usage?.reasoningTokens ?? 0

        let cost = estimateCost(model: model, promptTokens: pTokens, completionTokens: cTokens)

        return TurnMetrics(
            promptTokens: pTokens,
            completionTokens: cTokens,
            totalTokens: tTokens,
            reasoningTokens: rTokens,
            latencySeconds: latency,
            estimatedCostUSD: cost,
            model: model
        )
    }

    /// Estimativa de custo por 1M tokens (NVIDIA NIM / Hosted Models)
    private static func estimateCost(model: String, promptTokens: Int, completionTokens: Int) -> Double {
        let pRate: Double // por 1M tokens de entrada
        let cRate: Double // por 1M tokens de saída

        let lower = model.lowercased()
        if lower.contains("deepseek-r1") {
            pRate = 0.55
            cRate = 2.19
        } else if lower.contains("llama-3.3-70b") {
            pRate = 0.70
            cRate = 0.90
        } else if lower.contains("qwen2.5-coder") || lower.contains("codestral") {
            pRate = 0.30
            cRate = 0.90
        } else if lower.contains("glm") {
            pRate = 0.40
            cRate = 0.80
        } else {
            pRate = 0.50
            cRate = 1.00
        }

        let pCost = (Double(promptTokens) / 1_000_000.0) * pRate
        let cCost = (Double(completionTokens) / 1_000_000.0) * cRate
        return pCost + cCost
    }

    /// Resumo formatado legível (ex: "⚡ 1.2s · 450 tokens · ~$0.0004")
    public var formattedSummary: String {
        let latStr = String(format: "%.1fs", latencySeconds)
        let costStr = String(format: "%.4f", estimatedCostUSD)
        var text = "⚡ \(latStr) · \(totalTokens) tokens"
        if reasoningTokens > 0 {
            text += " (\(reasoningTokens) think)"
        }
        text += " · ~$\(costStr)"
        return text
    }

    /// Detalhes completos para CLI ou diagnósticos
    public var verboseSummary: String {
        let latStr = String(format: "%.2fs", latencySeconds)
        let costStr = String(format: "%.5f", estimatedCostUSD)
        var detail = "Tempo: \(latStr) | Tokens: \(totalTokens) (In: \(promptTokens), Out: \(completionTokens)"
        if reasoningTokens > 0 {
            detail += ", Raciocínio: \(reasoningTokens)"
        }
        detail += ") | Custo estimado: $\(costStr)"
        return detail
    }
}
