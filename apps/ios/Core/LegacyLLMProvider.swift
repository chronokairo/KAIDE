import Foundation

/// Provedor de IA ativo do app.
///
/// - `codex`: ChatGPT/Codex via OAuth (device code), o mesmo backend usado pelo
///   Codex CLI e pelo opencode 2.2+. Usa a assinatura ChatGPT (Plus/Pro/Team),
///   sem chave de API.
/// - `nim`: endpoint compatível com OpenAI + chave de API (fallback).
public enum LLMProviderKind: String, CaseIterable, Identifiable {
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
        case .codex: return CodexClient.defaultModel
        case .nim: return NIMClient.defaultModel
        }
    }

    private static let storageKey = "kaide_llm_provider"

    public static var stored: LLMProviderKind {
        get {
            let raw = UserDefaults.standard.string(forKey: storageKey) ?? ""
            return LLMProviderKind(rawValue: raw) ?? .codex
        }
        set {
            UserDefaults.standard.set(newValue.rawValue, forKey: storageKey)
        }
    }
}

/// Contrato único consumido pelo agente — cada provider implementa do seu jeito.
public protocol ChatClient {
    func complete(
        messages: [ChatMessage],
        tools: [ChatTool]?,
        model: String,
        temperature: Double,
        maxTokens: Int
    ) async throws -> ChatReply

    func getModels(forceRefresh: Bool) async throws -> [String]
}

/// Converte `AnyCodable` em objetos JSON nativos (para corpo de request).
public enum JSONValueEncoder {
    public static func object(from value: AnyCodable) -> Any {
        switch value {
        case .string(let s): return s
        case .int(let i): return i
        case .double(let d): return d
        case .bool(let b): return b
        case .null: return NSNull()
        case .array(let items): return items.map { object(from: $0) }
        case .object(let dict): return dict.mapValues { object(from: $0) }
        }
    }

    public static func object(from dict: [String: AnyCodable]) -> [String: Any] {
        dict.mapValues { object(from: $0) }
    }
}
