import Foundation

public final class CodexChatAdapter: ChatCompletionPort {
    private let session: CodexTokenSession

    public init(session: CodexTokenSession) {
        self.session = session
    }

    public var isConfigured: Bool {
        session.isAuthenticated
    }

    public func complete(
        messages: [ChatMessage],
        tools: [ChatTool]?,
        model: String,
        temperature: Double,
        maxTokens: Int
    ) async throws -> ChatReply {
        let start = Date()
        let tokens = try await session.validTokens()

        var (bytes, response) = try await send(
            tokens: tokens,
            messages: messages,
            tools: tools ?? [],
            model: model
        )

        guard let http = response as? HTTPURLResponse else {
            throw CodexError.invalidResponse("resposta sem HTTP")
        }

        var content = ""
        var reasoning = ""
        var toolCalls: [ChatToolCall] = []
        var usage: TokenUsage?

        for try await line in bytes.lines {
            guard line.hasPrefix("data:") else { continue }
            let payload = String(line.dropFirst(5)).trimmingCharacters(in: .whitespaces)
            if payload.isEmpty || payload == "[DONE]" { continue }
            guard let json = try? JSONSerialization.jsonObject(with: Data(payload.utf8)) as? [String: Any] else {
                continue
            }

            let type = json["type"] as? String ?? ""
            switch type {
            case "response.output_text.delta":
                if let delta = json["delta"] as? String { content += delta }

            case "response.reasoning_summary_text.delta", "response.reasoning_text.delta":
                if let delta = json["delta"] as? String { reasoning += delta }

            case "response.output_item.done":
                guard let item = json["item"] as? [String: Any],
                      (item["type"] as? String) == "function_call" else { continue }
                let callId = (item["call_id"] as? String) ?? (item["id"] as? String) ?? UUID().uuidString
                let name = item["name"] as? String ?? ""
                let arguments = (item["arguments"] as? String) ?? "{}"
                if !name.isEmpty {
                    toolCalls.append(ChatToolCall(id: callId, function: ChatFunctionCall(name: name, arguments: arguments)))
                }

            case "response.completed":
                if let responseObject = json["response"] as? [String: Any],
                   let rawUsage = responseObject["usage"] as? [String: Any] {
                    let input = rawUsage["input_tokens"] as? Int ?? 0
                    let output = rawUsage["output_tokens"] as? Int ?? 0
                    let total = rawUsage["total_tokens"] as? Int ?? (input + output)
                    let details = rawUsage["output_tokens_details"] as? [String: Any]
                    usage = TokenUsage(
                        promptTokens: input,
                        completionTokens: output,
                        totalTokens: total,
                        reasoningTokens: details?["reasoning_tokens"] as? Int
                    )
                }

            case "error", "response.failed":
                let message = (json["message"] as? String)
                    ?? ((json["error"] as? [String: Any])?["message"] as? String)
                    ?? payload
                throw CodexError.invalidResponse(message)

            default:
                break
            }
        }

        return ChatReply(
            content: content,
            reasoning: reasoning,
            toolCalls: toolCalls,
            usage: usage,
            latencySeconds: Date().timeIntervalSince(start)
        )
    }

    public func availableModels(refresh: Bool = false) async throws -> [String] {
        LLMProvider.codex.staticModelCatalog
    }

    private func send(
        tokens: CodexSessionTokens,
        messages: [ChatMessage],
        tools: [ChatTool],
        model: String
    ) async throws -> (URLSession.AsyncBytes, URLResponse) {
        let (instructions, input) = buildInput(from: messages)

        var body: [String: Any] = [
            "model": resolveModel(model),
            "instructions": instructions,
            "input": input,
            "tool_choice": "auto",
            "parallel_tool_calls": false,
            "store": false,
            "stream": true,
            "include": ["reasoning.encrypted_content"],
            "reasoning": ["effort": "medium", "summary": "auto"],
        ]

        if !tools.isEmpty {
            body["tools"] = tools.map { tool -> [String: Any] in
                [
                    "type": "function",
                    "name": tool.function.name,
                    "description": tool.function.description,
                    "parameters": JSONValueEncoder.object(from: tool.function.parameters),
                    "strict": false,
                ]
            }
        }

        var request = URLRequest(url: CodexEndpoints.responsesURL)
        request.httpMethod = "POST"
        request.timeoutInterval = 300
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(tokens.accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("responses=experimental", forHTTPHeaderField: "OpenAI-Beta")
        request.setValue("codex_cli_rs", forHTTPHeaderField: "originator")
        request.setValue(UUID().uuidString, forHTTPHeaderField: "session_id")
        if let accountId = tokens.accountId, !accountId.isEmpty {
            request.setValue(accountId, forHTTPHeaderField: "chatgpt-account-id")
        }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        return try await URLSession.shared.bytes(for: request)
    }

    private func resolveModel(_ model: String) -> String {
        let catalog = LLMProvider.codex.staticModelCatalog
        if catalog.contains(model) { return model }
        if model.isEmpty || model.contains("/") { return LLMProvider.codex.defaultModel }
        return model
    }

    private func buildInput(from messages: [ChatMessage]) -> (String, [[String: Any]]) {
        var instructionsParts: [String] = []
        var items: [[String: Any]] = []

        for message in messages {
            switch message.role {
            case "system", "developer":
                if let content = message.content, !content.isEmpty {
                    instructionsParts.append(content)
                }

            case "assistant":
                if let content = message.content, !content.isEmpty {
                    items.append([
                        "type": "message",
                        "role": "assistant",
                        "content": [["type": "output_text", "text": content]],
                    ])
                }
                for call in message.toolCalls ?? [] {
                    items.append([
                        "type": "function_call",
                        "call_id": call.id,
                        "name": call.function.name,
                        "arguments": call.function.arguments,
                    ])
                }

            case "tool":
                items.append([
                    "type": "function_call_output",
                    "call_id": message.toolCallId ?? "",
                    "output": message.content ?? "",
                ])

            default:
                items.append([
                    "type": "message",
                    "role": "user",
                    "content": [["type": "input_text", "text": message.content ?? ""]],
                ])
            }
        }

        return (instructionsParts.joined(separator: "\n\n"), items)
    }
}
