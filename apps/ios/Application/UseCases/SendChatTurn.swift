import Foundation

public enum ChatUseCaseError: LocalizedError {
    case providerUnavailable(LLMProvider)
    case notConfigured(LLMProvider)

    public var errorDescription: String? {
        switch self {
        case .providerUnavailable(let provider):
            return "Provedor \(provider.title) indisponível."
        case .notConfigured(let provider):
            return "Provedor \(provider.title) sem credenciais. Entre com ChatGPT nas Configurações."
        }
    }
}

/// Caso de uso: enviar um turno de conversa e receber a resposta do provedor ativo.
///
/// Centraliza a resolução de provedor (seleção explícita → fallback configurado),
/// evitando que UI/agente conheçam clientes concretos. Também implementa
/// `ChatCompletionPort`, então compactação de contexto e métricas usam o mesmo caminho.
public struct SendChatTurn: ChatCompletionPort {
    private let providers: [LLMProvider: ChatCompletionPort]
    private let preferences: ProviderPreferencesPort
    private let fallbackOrder: [LLMProvider]

    public init(
        providers: [LLMProvider: ChatCompletionPort],
        preferences: ProviderPreferencesPort,
        fallbackOrder: [LLMProvider] = [.codex, .nim]
    ) {
        self.providers = providers
        self.preferences = preferences
        self.fallbackOrder = fallbackOrder
    }

    public func activeProvider() -> LLMProvider {
        if let selected = preferences.selectedProvider,
           let port = providers[selected],
           port.isConfigured {
            return selected
        }

        for provider in fallbackOrder {
            if providers[provider]?.isConfigured == true {
                return provider
            }
        }

        return preferences.selectedProvider ?? fallbackOrder.first ?? .codex
    }

    public var isConfigured: Bool {
        providers.values.contains { $0.isConfigured }
    }

    public func complete(
        messages: [ChatMessage],
        tools: [ChatTool]?,
        model: String,
        temperature: Double,
        maxTokens: Int
    ) async throws -> ChatReply {
        let provider = activeProvider()
        guard let port = providers[provider] else {
            throw ChatUseCaseError.providerUnavailable(provider)
        }
        guard port.isConfigured else {
            throw ChatUseCaseError.notConfigured(provider)
        }
        return try await port.complete(
            messages: messages,
            tools: tools,
            model: model,
            temperature: temperature,
            maxTokens: maxTokens
        )
    }

    public func availableModels(refresh: Bool = false) async throws -> [String] {
        let provider = activeProvider()
        guard let port = providers[provider], port.isConfigured else {
            return provider.staticModelCatalog
        }
        let models = try await port.availableModels(refresh: refresh)
        return models.isEmpty ? provider.staticModelCatalog : models
    }
}
