import Foundation

/// Porta de saída: qualquer provedor de chat (Codex, NIM, futuro Anthropic…).
/// Consumida pelos casos de uso; implementada por adapters de infraestrutura.
public protocol ChatCompletionPort {
    /// Se o provedor tem credenciais suficientes para ser usado.
    var isConfigured: Bool { get }

    func complete(
        messages: [ChatMessage],
        tools: [ChatTool]?,
        model: String,
        temperature: Double,
        maxTokens: Int
    ) async throws -> ChatReply

    func availableModels(refresh: Bool) async throws -> [String]
}

public extension ChatCompletionPort {
    func complete(messages: [ChatMessage], tools: [ChatTool]?, model: String) async throws -> ChatReply {
        try await complete(
            messages: messages,
            tools: tools,
            model: model,
            temperature: 0.2,
            maxTokens: 4096
        )
    }
}
