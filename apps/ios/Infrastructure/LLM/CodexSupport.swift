import Foundation

public enum CodexError: LocalizedError {
    case notAuthenticated
    case http(Int, String)
    case invalidResponse(String)
    case authorizationPending
    case loginExpired

    public var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "Nenhuma conta Codex conectada. Entre com ChatGPT nas Configurações."
        case .http(let code, let body):
            return "Erro Codex (\(code)): \(body)"
        case .invalidResponse(let detail):
            return "Resposta inesperada do Codex: \(detail)"
        case .authorizationPending:
            return "Aguardando autorização no navegador."
        case .loginExpired:
            return "O código expirou. Gere um novo."
        }
    }
}

/// Endpoints e utilitários HTTP compartilhados pelos adapters do Codex
/// (auth device code + chat Responses API). Sem duplicação de URL/JSON/erro.
enum CodexEndpoints {
    static let clientID = "app_EMoamEEZ73f0CkXaXp7hrann"
    static let authBase = URL(string: "https://auth.openai.com")!
    static let deviceCodeURL = URL(string: "https://auth.openai.com/api/accounts/deviceauth/usercode")!
    static let deviceTokenURL = URL(string: "https://auth.openai.com/api/accounts/deviceauth/token")!
    static let tokenURL = URL(string: "https://auth.openai.com/oauth/token")!
    static let deviceCallback = "https://auth.openai.com/deviceauth/callback"
    static let verificationURL = URL(string: "https://auth.openai.com/codex/device")!
    static let responsesURL = URL(string: "https://chatgpt.com/backend-api/codex/responses")!
}

enum CodexHTTP {
    static func postJSON(_ url: URL, body: [String: Any], timeout: TimeInterval = 30) async throws -> [String: Any] {
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = timeout
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)

        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw CodexError.invalidResponse("corpo não é JSON")
        }
        return json
    }

    static func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else {
            throw CodexError.invalidResponse("resposta sem HTTP")
        }
        guard (200..<300).contains(http.statusCode) else {
            let body = String(data: data, encoding: .utf8) ?? ""
            throw CodexError.http(http.statusCode, String(body.prefix(500)))
        }
    }

    /// Lê claims de um JWT sem validar assinatura (uso local: email/account id/exp).
    static func jwtPayload(_ token: String) -> [String: Any] {
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
