import Foundation

public enum NIMError: LocalizedError {
    case missingAPIKey
    case invalidURL
    case httpError(Int, String)
    case emptyResponse
    case decodingError(String)

    public var errorDescription: String? {
        switch self {
        case .missingAPIKey:
            return "Chave de API do NVIDIA NIM não encontrada. Configure via `NVIDIA_API_KEY` ou em Configurações do Kaide."
        case .invalidURL:
            return "URL do endpoint NVIDIA NIM inválida."
        case .httpError(let code, let msg):
            return "Erro NVIDIA NIM (\(code)): \(msg)"
        case .emptyResponse:
            return "Nenhuma resposta retornada pelo modelo NVIDIA NIM."
        case .decodingError(let msg):
            return "Falha ao decodificar resposta do NVIDIA NIM: \(msg)"
        }
    }
}

public final class NIMClient {
    public static let shared = NIMClient()
    public static let defaultModel = "z-ai/glm-5.3"
    public let baseURL = "https://integrate.api.nvidia.com/v1"

    private let cacheKeyModels = "kaide_cached_models_list"
    private let cacheKeyTimestamp = "kaide_cached_models_time"
    private let cacheTTL: TimeInterval = 24 * 3600 // 24 horas de cache

    public init() {}

    public func getAPIKey() -> String? {
        if let key = UserDefaults.standard.string(forKey: "kaide_nvidia_key"), !key.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return key.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        if let envKey = ProcessInfo.processInfo.environment["NVIDIA_API_KEY"], !envKey.isEmpty {
            return envKey.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        if let envKey2 = ProcessInfo.processInfo.environment["NIM_API_KEY"], !envKey2.isEmpty {
            return envKey2.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        return nil
    }

    public func saveAPIKey(_ key: String) {
        UserDefaults.standard.set(key.trimmingCharacters(in: .whitespacesAndNewlines), forKey: "kaide_nvidia_key")
    }

    /// Retorna a lista de modelos dinâmica com cache local de 24 horas
    public func getModels(forceRefresh: Bool = false) async throws -> [String] {
        if !forceRefresh {
            let cachedTime = UserDefaults.standard.double(forKey: cacheKeyTimestamp)
            let elapsed = Date().timeIntervalSince1970 - cachedTime
            if elapsed < cacheTTL, let cached = UserDefaults.standard.stringArray(forKey: cacheKeyModels), !cached.isEmpty {
                return cached
            }
        }

        do {
            let models = try await fetchModelsFromAPI()
            if !models.isEmpty {
                UserDefaults.standard.set(models, forKey: cacheKeyModels)
                UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: cacheKeyTimestamp)
                return models
            }
        } catch {
            // Em caso de falha de conexão, fallback seguro para o cache anterior se disponível
            if let cached = UserDefaults.standard.stringArray(forKey: cacheKeyModels), !cached.isEmpty {
                return cached
            }
            throw error
        }

        return []
    }

    /// Consulta dinâmica ao endpoint /models da NVIDIA
    private func fetchModelsFromAPI() async throws -> [String] {
        guard let key = getAPIKey() else { throw NIMError.missingAPIKey }
        guard let url = URL(string: "\(baseURL)/models") else { throw NIMError.invalidURL }

        var req = URLRequest(url: url)
        req.timeoutInterval = 20
        req.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw NIMError.httpError(-1, "Resposta inválida do servidor.")
        }
        guard http.statusCode == 200 else {
            let msg = String(data: data, encoding: .utf8) ?? "Erro \(http.statusCode)"
            throw NIMError.httpError(http.statusCode, msg)
        }

        struct ModelList: Decodable {
            struct ModelItem: Decodable { let id: String }
            let data: [ModelItem]
        }

        let list = try JSONDecoder().decode(ModelList.self, from: data)
        return list.data
            .map { $0.id }
            .filter { id in
                let lower = id.lowercased()
                return !lower.contains("embed") && !lower.contains("rerank") && !lower.contains("reward") && !lower.contains("guard") && !lower.contains("safety") && !lower.contains("clip") && !lower.contains("parse")
            }
            .sorted()
    }

    public func clearModelsCache() {
        UserDefaults.standard.removeObject(forKey: cacheKeyModels)
        UserDefaults.standard.removeObject(forKey: cacheKeyTimestamp)
    }

    public func complete(
        messages: [ChatMessage],
        tools: [ChatTool]? = nil,
        model: String,
        temperature: Double = 0.2,
        maxTokens: Int = 4096
    ) async throws -> ChatReply {
        guard let key = getAPIKey() else { throw NIMError.missingAPIKey }
        guard let url = URL(string: "\(baseURL)/chat/completions") else { throw NIMError.invalidURL }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
        req.timeoutInterval = 120

        struct RequestBody: Encodable {
            let model: String
            let messages: [ChatMessage]
            let temperature: Double
            let maxTokens: Int
            let tools: [ChatTool]?
            let toolChoice: String?

            enum CodingKeys: String, CodingKey {
                case model, messages, temperature, tools
                case maxTokens = "max_tokens"
                case toolChoice = "tool_choice"
            }
        }

        let body = RequestBody(
            model: model,
            messages: messages,
            temperature: temperature,
            maxTokens: maxTokens,
            tools: (tools?.isEmpty == false) ? tools : nil,
            toolChoice: (tools?.isEmpty == false) ? "auto" : nil
        )

        req.httpBody = try JSONEncoder().encode(body)

        let startTime = Date()
        var rateLimitWaitSeconds: Double = 1.0
        let maxAttempts = 6
        var currentAttempt = 0

        while currentAttempt < maxAttempts {
            currentAttempt += 1

            let (data, response) = try await URLSession.shared.data(for: req)
            let latency = Date().timeIntervalSince(startTime)

            guard let http = response as? HTTPURLResponse else {
                throw NIMError.httpError(-1, "Resposta inválida.")
            }

            // Resiliência de rate limit: só aumenta 1+seg a cada rate
            if http.statusCode == 429 {
                try await Task.sleep(nanoseconds: UInt64(rateLimitWaitSeconds * 1_000_000_000))
                rateLimitWaitSeconds += 1.0
                continue
            }

            guard http.statusCode == 200 else {
                let msg = String(data: data, encoding: .utf8) ?? "Erro \(http.statusCode)"
                throw NIMError.httpError(http.statusCode, msg)
            }

        struct ReplyBody: Decodable {
            struct Choice: Decodable {
                struct Message: Decodable {
                    let role: String
                    let content: String?
                    let reasoningContent: String?
                    let toolCalls: [ChatToolCall]?

                    enum CodingKeys: String, CodingKey {
                        case role, content
                        case reasoningContent = "reasoning_content"
                        case toolCalls = "tool_calls"
                    }
                }
                let message: Message
            }
            let choices: [Choice]
            let usage: TokenUsage?
        }

        let reply = try JSONDecoder().decode(ReplyBody.self, from: data)
        guard let firstChoice = reply.choices.first else {
            throw NIMError.emptyResponse
        }

        let rawContent = firstChoice.message.content ?? ""
        var reasoning = firstChoice.message.reasoningContent ?? ""

        // Extrai blocos <think>...</think> se existirem no corpo do texto
        let (cleanText, extracted) = extractThinking(from: rawContent)
        if !extracted.isEmpty {
            reasoning = reasoning.isEmpty ? extracted : "\(reasoning)\n\n\(extracted)"
        }

        return ChatReply(
            content: cleanText,
            reasoning: reasoning,
            toolCalls: firstChoice.message.toolCalls ?? [],
            usage: reply.usage,
            latencySeconds: latency
        )
    }

    throw NIMError.httpError(429, "Limite de requisições excedido após múltiplas tentativas.")
}

    private func extractThinking(from text: String) -> (cleanContent: String, extractedReasoning: String) {
        var content = text
        var reasoning = ""
        let patterns = [
            "(?s)<think>(.*?)</think>",
            "(?s)<thought>(.*?)</thought>"
        ]
        for pat in patterns {
            if let regex = try? NSRegularExpression(pattern: pat, options: []) {
                let nsString = content as NSString
                let matches = regex.matches(in: content, options: [], range: NSRange(location: 0, length: nsString.length))
                for match in matches.reversed() {
                    if match.numberOfRanges > 1 {
                        let thoughtRange = match.range(at: 1)
                        let thoughtText = nsString.substring(with: thoughtRange).trimmingCharacters(in: .whitespacesAndNewlines)
                        if !thoughtText.isEmpty {
                            reasoning = reasoning.isEmpty ? thoughtText : "\(thoughtText)\n\n\(reasoning)"
                        }
                    }
                    content = (content as NSString).replacingCharacters(in: match.range, with: "").trimmingCharacters(in: .whitespacesAndNewlines)
                }
            }
        }
        return (content, reasoning)
    }
}
