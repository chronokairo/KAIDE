import Foundation

/// Provedores de IA do app (domínio puro, sem SDK/rede).
///
/// - `codex`: ChatGPT/Codex via OAuth device code (mesmo backend do Codex CLI e
///   do opencode 2.2+). Usa a assinatura ChatGPT, sem chave de API.
/// - `nim`: endpoint compatível com OpenAI + chave de API. Mantido como
///   fallback funcional, mas fora da interface.
public enum LLMProvider: String, CaseIterable, Identifiable, Codable {
    case codex
    case nim

    public var id: String { rawValue }

    public var title: String {
        switch self {
        case .codex: return "Codex (ChatGPT)"
        case .nim: return "Endpoint compatível com OpenAI"
        }
    }

    public var shortTitle: String {
        switch self {
        case .codex: return "Codex"
        case .nim: return "API"
        }
    }

    public var defaultModel: String {
        switch self {
        case .codex: return "gpt-5.1-codex"
        case .nim: return "z-ai/glm-5.3"
        }
    }

    /// Catálogo estático quando o provedor não expõe listagem dinâmica.
    public var staticModelCatalog: [String] {
        switch self {
        case .codex:
            return [
                "gpt-5.1-codex",
                "gpt-5.1-codex-max",
                "gpt-5.1-codex-mini",
                "gpt-5.1",
                "gpt-5-codex",
            ]
        case .nim:
            return []
        }
    }
}
