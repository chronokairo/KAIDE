import Foundation

public struct NIMMessage: Codable {
    public let role: String
    public let content: String?
    public let toolCalls: [NIMToolCall]?
    public let toolCallId: String?

    enum CodingKeys: String, CodingKey {
        case role, content
        case toolCalls = "tool_calls"
        case toolCallId = "tool_call_id"
    }

    public init(role: String, content: String?, toolCalls: [NIMToolCall]? = nil, toolCallId: String? = nil) {
        self.role = role
        self.content = content
        self.toolCalls = toolCalls
        self.toolCallId = toolCallId
    }
}

public struct NIMToolCall: Codable, Identifiable {
    public let id: String
    public let type: String
    public let function: NIMFunctionCall

    public init(id: String, type: String = "function", function: NIMFunctionCall) {
        self.id = id
        self.type = type
        self.function = function
    }
}

public struct NIMFunctionCall: Codable {
    public let name: String
    public let arguments: String

    public init(name: String, arguments: String) {
        self.name = name
        self.arguments = arguments
    }
}

public struct NIMTool: Codable {
    public let type: String
    public let function: NIMFunctionDef

    public init(name: String, description: String, parameters: [String: AnyCodable]) {
        self.type = "function"
        self.function = NIMFunctionDef(name: name, description: description, parameters: parameters)
    }
}

public struct NIMFunctionDef: Codable {
    public let name: String
    public let description: String
    public let parameters: [String: AnyCodable]

    public init(name: String, description: String, parameters: [String: AnyCodable]) {
        self.name = name
        self.description = description
        self.parameters = parameters
    }
}

// AnyCodable simplificado para schemas JSON sem dependência externa
public enum AnyCodable: Codable {
    case string(String)
    case int(Int)
    case double(Double)
    case bool(Bool)
    case array([AnyCodable])
    case object([String: AnyCodable])
    case null

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() { self = .null }
        else if let b = try? container.decode(Bool.self) { self = .bool(b) }
        else if let i = try? container.decode(Int.self) { self = .int(i) }
        else if let d = try? container.decode(Double.self) { self = .double(d) }
        else if let s = try? container.decode(String.self) { self = .string(s) }
        else if let arr = try? container.decode([AnyCodable].self) { self = .array(arr) }
        else if let dict = try? container.decode([String: AnyCodable].self) { self = .object(dict) }
        else { self = .null }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let s): try container.encode(s)
        case .int(let i): try container.encode(i)
        case .double(let d): try container.encode(d)
        case .bool(let b): try container.encode(b)
        case .array(let a): try container.encode(a)
        case .object(let o): try container.encode(o)
        case .null: try container.encodeNil()
        }
    }
}

public struct NIMUsage: Codable, Equatable {
    public let promptTokens: Int
    public let completionTokens: Int
    public let totalTokens: Int
    public let reasoningTokens: Int?

    enum CodingKeys: String, CodingKey {
        case promptTokens = "prompt_tokens"
        case completionTokens = "completion_tokens"
        case totalTokens = "total_tokens"
        case completionTokensDetails = "completion_tokens_details"
    }

    enum DetailsCodingKeys: String, CodingKey {
        case reasoningTokens = "reasoning_tokens"
    }

    public init(promptTokens: Int, completionTokens: Int, totalTokens: Int, reasoningTokens: Int? = nil) {
        self.promptTokens = promptTokens
        self.completionTokens = completionTokens
        self.totalTokens = totalTokens
        self.reasoningTokens = reasoningTokens
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.promptTokens = try container.decodeIfPresent(Int.self, forKey: .promptTokens) ?? 0
        self.completionTokens = try container.decodeIfPresent(Int.self, forKey: .completionTokens) ?? 0
        self.totalTokens = try container.decodeIfPresent(Int.self, forKey: .totalTokens) ?? (promptTokens + completionTokens)

        if let details = try? container.nestedContainer(keyedBy: DetailsCodingKeys.self, forKey: .completionTokensDetails) {
            self.reasoningTokens = try details.decodeIfPresent(Int.self, forKey: .reasoningTokens)
        } else {
            self.reasoningTokens = nil
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(promptTokens, forKey: .promptTokens)
        try container.encode(completionTokens, forKey: .completionTokens)
        try container.encode(totalTokens, forKey: .totalTokens)
        if let r = reasoningTokens {
            var details = container.nestedContainer(keyedBy: DetailsCodingKeys.self, forKey: .completionTokensDetails)
            try details.encode(r, forKey: .reasoningTokens)
        }
    }
}

public struct NIMChatResponse {
    public let content: String
    public let reasoning: String
    public let toolCalls: [NIMToolCall]
    public let usage: NIMUsage?
    public let latencySeconds: Double

    public init(
        content: String,
        reasoning: String,
        toolCalls: [NIMToolCall],
        usage: NIMUsage? = nil,
        latencySeconds: Double = 0.0
    ) {
        self.content = content
        self.reasoning = reasoning
        self.toolCalls = toolCalls
        self.usage = usage
        self.latencySeconds = latencySeconds
    }
}

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
        messages: [NIMMessage],
        tools: [NIMTool]? = nil,
        model: String,
        temperature: Double = 0.2,
        maxTokens: Int = 4096
    ) async throws -> NIMChatResponse {
        guard let key = getAPIKey() else { throw NIMError.missingAPIKey }
        guard let url = URL(string: "\(baseURL)/chat/completions") else { throw NIMError.invalidURL }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
        req.timeoutInterval = 120

        struct RequestBody: Encodable {
            let model: String
            let messages: [NIMMessage]
            let temperature: Double
            let maxTokens: Int
            let tools: [NIMTool]?
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
                    let toolCalls: [NIMToolCall]?

                    enum CodingKeys: String, CodingKey {
                        case role, content
                        case reasoningContent = "reasoning_content"
                        case toolCalls = "tool_calls"
                    }
                }
                let message: Message
            }
            let choices: [Choice]
            let usage: NIMUsage?
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

        return NIMChatResponse(
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
