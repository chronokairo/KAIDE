import Foundation
import Security

public struct CodexTokens: Codable {
    public var accessToken: String
    public var refreshToken: String
    public var idToken: String?
    public var accountId: String?
    public var email: String?
    public var expiresAt: Date?
}

public struct CodexDeviceLogin {
    public let deviceAuthID: String
    public let userCode: String
    public let verificationURL: URL
    public let interval: TimeInterval
}


/// Cliente ChatGPT/Codex (mesmo backend do Codex CLI e do opencode 2.2+):
/// login por device code (OAuth) e chat via Responses API com streaming SSE.
public final class CodexClient: ChatClient {
    public static let shared = CodexClient()
    public static let defaultModel = "gpt-5.1-codex"
    public static let availableModelIDs = [
        "gpt-5.1-codex",
        "gpt-5.1-codex-max",
        "gpt-5.1-codex-mini",
        "gpt-5.1",
        "gpt-5-codex",
    ]

    private static let clientID = "app_EMoamEEZ73f0CkXaXp7hrann"
    private static let authBase = "https://auth.openai.com"
    private static let backendURL = URL(string: "https://chatgpt.com/backend-api/codex/responses")!
    private static let deviceCallback = "https://auth.openai.com/deviceauth/callback"
    public static let deviceVerificationURL = URL(string: "https://auth.openai.com/codex/device")!

    private let keychainService = "com.chronokairo.kaide.codex"
    private let keychainAccount = "oauth"
    private let lock = NSLock()
    private var cachedTokens: CodexTokens?

    public init() {}

    // MARK: - Estado

    public var isAuthenticated: Bool {
        (try? loadTokens()) != nil
    }

    public var accountEmail: String? {
        (try? loadTokens())?.email
    }

    public var accountID: String? {
        (try? loadTokens())?.accountId
    }

    public func signOut() {
        lock.lock()
        defer { lock.unlock() }
        cachedTokens = nil
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccount,
        ]
        SecItemDelete(query as CFDictionary)
    }

    // MARK: - Login por device code

    public func startDeviceLogin() async throws -> CodexDeviceLogin {
        var request = URLRequest(url: URL(string: "\(Self.authBase)/api/accounts/deviceauth/usercode")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30
        request.httpBody = try JSONSerialization.data(withJSONObject: ["client_id": Self.clientID])

        let (data, response) = try await URLSession.shared.data(for: request)
        try Self.validate(response: response, data: data)

        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw CodexError.invalidResponse("resposta do device code não é JSON")
        }

        let deviceAuthID = (json["device_auth_id"] as? String) ?? (json["deviceAuthId"] as? String) ?? ""
        let userCode = (json["user_code"] as? String) ?? (json["usercode"] as? String) ?? ""
        guard !deviceAuthID.isEmpty, !userCode.isEmpty else {
            throw CodexError.invalidResponse("device_auth_id/user_code ausentes")
        }

        let intervalRaw = json["interval"]
        var interval: TimeInterval = 5
        if let number = intervalRaw as? NSNumber {
            interval = number.doubleValue
        } else if let text = intervalRaw as? String, let parsed = Double(text) {
            interval = parsed
        }

        return CodexDeviceLogin(
            deviceAuthID: deviceAuthID,
            userCode: userCode,
            verificationURL: Self.deviceVerificationURL,
            interval: max(interval, 3)
        )
    }

    /// Aguarda o usuário aprovar no navegador e devolve os tokens.
    public func awaitLogin(_ login: CodexDeviceLogin, timeout: TimeInterval = 600) async throws -> CodexTokens {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            try await Task.sleep(nanoseconds: UInt64(login.interval * 1_000_000_000))
            do {
                let tokens = try await pollDeviceLogin(login)
                try save(tokens)
                return tokens
            } catch CodexError.authorizationPending {
                continue
            }
        }
        throw CodexError.loginExpired
    }

    private func pollDeviceLogin(_ login: CodexDeviceLogin) async throws -> CodexTokens {
        var request = URLRequest(url: URL(string: "\(Self.authBase)/api/accounts/deviceauth/token")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "device_auth_id": login.deviceAuthID,
            "user_code": login.userCode,
        ])

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw CodexError.invalidResponse("resposta inválida")
        }
        if http.statusCode == 403 || http.statusCode == 404 || http.statusCode == 428 {
            throw CodexError.authorizationPending
        }
        try Self.validate(response: response, data: data)

        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let code = (json["authorization_code"] as? String) ?? (json["authorizationCode"] as? String),
              !code.isEmpty else {
            throw CodexError.authorizationPending
        }
        let verifier = (json["code_verifier"] as? String) ?? (json["codeVerifier"] as? String) ?? ""

        return try await exchange(authorizationCode: code, codeVerifier: verifier)
    }

    private func exchange(authorizationCode: String, codeVerifier: String) async throws -> CodexTokens {
        var body: [String: Any] = [
            "grant_type": "authorization_code",
            "code": authorizationCode,
            "redirect_uri": Self.deviceCallback,
            "client_id": Self.clientID,
        ]
        if !codeVerifier.isEmpty {
            body["code_verifier"] = codeVerifier
        }

        let json = try await postToken(body)
        return try tokens(from: json)
    }

    private func refresh(_ tokens: CodexTokens) async throws -> CodexTokens {
        var body: [String: Any] = [
            "grant_type": "refresh_token",
            "refresh_token": tokens.refreshToken,
            "client_id": Self.clientID,
        ]
        if tokens.refreshToken.isEmpty == false {
            body["scope"] = "openid profile email offline_access"
        }

        let json = try await postToken(body)
        var updated = try self.tokens(from: json, fallback: tokens)
        if updated.refreshToken.isEmpty {
            updated.refreshToken = tokens.refreshToken
        }
        try save(updated)
        return updated
    }

    private func postToken(_ body: [String: Any]) async throws -> [String: Any] {
        var request = URLRequest(url: URL(string: "\(Self.authBase)/oauth/token")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        try Self.validate(response: response, data: data)
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw CodexError.invalidResponse("token endpoint não retornou JSON")
        }
        return json
    }

    private func tokens(from json: [String: Any], fallback: CodexTokens? = nil) throws -> CodexTokens {
        guard let access = json["access_token"] as? String, !access.isEmpty else {
            throw CodexError.invalidResponse("access_token ausente")
        }
        let refresh = (json["refresh_token"] as? String) ?? fallback?.refreshToken ?? ""
        let idToken = (json["id_token"] as? String) ?? fallback?.idToken

        var accountId = fallback?.accountId
        var email = fallback?.email
        var expiresAt = Date().addingTimeInterval(3600)

        if let idToken = idToken {
            let claims = Self.decodeJWTPayload(idToken)
            if let auth = claims["https://api.openai.com/auth"] as? [String: Any] {
                accountId = (auth["chatgpt_account_id"] as? String) ?? accountId
                if let plan = auth["chatgpt_plan_type"] as? String {
                    email = email ?? Self.decodeJWTPayload(access)["email"] as? String
                    _ = plan
                }
            }
            email = (claims["email"] as? String) ?? email
            if let exp = claims["exp"] as? Double {
                expiresAt = Date(timeIntervalSince1970: exp)
            } else if let exp = claims["exp"] as? Int {
                expiresAt = Date(timeIntervalSince1970: Double(exp))
            }
        }

        if let expires = json["expires_in"] as? Int {
            expiresAt = Date().addingTimeInterval(Double(expires))
        }

        return CodexTokens(
            accessToken: access,
            refreshToken: refresh,
            idToken: idToken,
            accountId: accountId,
            email: email,
            expiresAt: expiresAt
        )
    }

    // MARK: - Chat (Responses API)

    public func complete(
        messages: [ChatMessage],
        tools: [ChatTool]? = nil,
        model: String,
        temperature: Double = 0.2,
        maxTokens: Int = 4096
    ) async throws -> ChatReply {
        let start = Date()
        var tokens = try await validTokens()

        var (bytes, response) = try await send(
            tokens: tokens,
            messages: messages,
            tools: tools ?? [],
            model: model
        )

        if let http = response as? HTTPURLResponse, http.statusCode == 401 {
            tokens = try await refresh(tokens)
            (bytes, response) = try await send(
                tokens: tokens,
                messages: messages,
                tools: tools ?? [],
                model: model
            )
        }

        guard let http = response as? HTTPURLResponse else {
            throw CodexError.invalidResponse("resposta inválida")
        }
        guard http.statusCode == 200 else {
            var body = ""
            for try await line in bytes.lines {
                body += line
                if body.count > 2000 { break }
            }
            throw CodexError.http(http.statusCode, body.isEmpty ? "sem corpo" : body)
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

    public func getModels(forceRefresh: Bool = false) async throws -> [String] {
        Self.availableModelIDs
    }

    // MARK: - Request

    private func send(
        tokens: CodexTokens,
        messages: [ChatMessage],
        tools: [ChatTool],
        model: String
    ) async throws -> (URLSession.AsyncBytes, URLResponse) {
        let (instructions, input) = Self.buildInput(from: messages)

        var body: [String: Any] = [
            "model": Self.resolveModel(model),
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

        var request = URLRequest(url: Self.backendURL)
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

    private static func resolveModel(_ model: String) -> String {
        if availableModelIDs.contains(model) { return model }
        if model.isEmpty || model.contains("/") { return defaultModel }
        return model
    }

    private static func buildInput(from messages: [ChatMessage]) -> (String, [[String: Any]]) {
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

    // MARK: - Tokens

    private func validTokens() async throws -> CodexTokens {
        var tokens = try loadTokens()
        if let expires = tokens.expiresAt, expires.timeIntervalSinceNow < 120 {
            tokens = try await refresh(tokens)
        }
        return tokens
    }

    private func loadTokens() throws -> CodexTokens {
        lock.lock()
        defer { lock.unlock() }
        if let cached = cachedTokens { return cached }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccount,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data,
              let tokens = try? JSONDecoder().decode(CodexTokens.self, from: data) else {
            throw CodexError.notAuthenticated
        }
        cachedTokens = tokens
        return tokens
    }

    private func save(_ tokens: CodexTokens) throws {
        lock.lock()
        defer { lock.unlock() }
        cachedTokens = tokens

        let data = try JSONEncoder().encode(tokens)
        let base: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccount,
        ]
        let status = SecItemUpdate(base as CFDictionary, [kSecValueData as String: data] as CFDictionary)
        if status == errSecItemNotFound {
            var attributes = base
            attributes[kSecValueData as String] = data
            attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
            let addStatus = SecItemAdd(attributes as CFDictionary, nil)
            guard addStatus == errSecSuccess else {
                throw CodexError.invalidResponse("falha ao salvar tokens (Keychain \(addStatus))")
            }
        } else if status != errSecSuccess {
            throw CodexError.invalidResponse("falha ao atualizar tokens (Keychain \(status))")
        }
    }

    // MARK: - Helpers

    private static func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else {
            throw CodexError.invalidResponse("resposta sem HTTP")
        }
        guard (200..<300).contains(http.statusCode) else {
            let body = String(data: data, encoding: .utf8) ?? ""
            throw CodexError.http(http.statusCode, String(body.prefix(500)))
        }
    }

    private static func decodeJWTPayload(_ token: String) -> [String: Any] {
        let parts = token.split(separator: ".")
        guard parts.count >= 2 else { return [:] }
        var payload = String(parts[1])
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        while payload.count % 4 != 0 {
            payload += "="
        }
        guard let data = Data(base64Encoded: payload),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return [:]
        }
        return json
    }
}
