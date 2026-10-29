import Foundation

// MARK: - Domain puro (LLM)
//
// Tipos de conversa, tools e resposta usados por TODOS os provedores.
// Sem rede, Keychain, SwiftUI ou SDK: apenas Foundation para Codable.

public struct ChatMessage: Codable {
    public let role: String
    public let content: String?
    public let toolCalls: [ChatToolCall]?
    public let toolCallId: String?

    enum CodingKeys: String, CodingKey {
        case role, content
        case toolCalls = "tool_calls"
        case toolCallId = "tool_call_id"
    }

    public init(role: String, content: String?, toolCalls: [ChatToolCall]? = nil, toolCallId: String? = nil) {
        self.role = role
        self.content = content
        self.toolCalls = toolCalls
        self.toolCallId = toolCallId
    }
}

public struct ChatToolCall: Codable, Identifiable {
    public let id: String
    public let type: String
    public let function: ChatFunctionCall

    public init(id: String, type: String = "function", function: ChatFunctionCall) {
        self.id = id
        self.type = type
        self.function = function
    }
}

public struct ChatFunctionCall: Codable {
    public let name: String
    public let arguments: String

    public init(name: String, arguments: String) {
        self.name = name
        self.arguments = arguments
    }
}

public struct ChatTool: Codable {
    public let type: String
    public let function: ChatFunctionDef

    public var name: String {
        function.name
    }

    public init(name: String, description: String, parameters: [String: AnyCodable]) {
        self.type = "function"
        self.function = ChatFunctionDef(name: name, description: description, parameters: parameters)
    }
}

public struct ChatFunctionDef: Codable {
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

public struct TokenUsage: Codable, Equatable {
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

public struct ChatReply {
    public let content: String
    public let reasoning: String
    public let toolCalls: [ChatToolCall]
    public let usage: TokenUsage?
    public let latencySeconds: Double

    public init(
        content: String,
        reasoning: String,
        toolCalls: [ChatToolCall],
        usage: TokenUsage? = nil,
        latencySeconds: Double = 0.0
    ) {
        self.content = content
        self.reasoning = reasoning
        self.toolCalls = toolCalls
        self.usage = usage
        self.latencySeconds = latencySeconds
    }
}
