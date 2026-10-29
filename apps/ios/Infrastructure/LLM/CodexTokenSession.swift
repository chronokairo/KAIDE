import Foundation

public struct CodexSessionTokens: Codable {
    public var accessToken: String
    public var refreshToken: String
    public var idToken: String?
    public var accountId: String?
    public var email: String?
    public var expiresAt: Date?
}

/// Gerencia o ciclo de vida, persistência segura (Keychain) e renovação automática
/// dos tokens OAuth do Codex (compartilhado entre AuthAdapter e ChatAdapter).
public final class CodexTokenSession {
    private let secrets: SecretStorePort
    private let storageKey = "codex.oauth.tokens.v1"
    private let lock = NSLock()
    private var cached: CodexSessionTokens?

    public init(secrets: SecretStorePort) {
        self.secrets = secrets
    }

    public var isAuthenticated: Bool {
        (try? load()) != nil
    }

    public var accountEmail: String? {
        (try? load())?.email
    }

    public func load() throws -> CodexSessionTokens {
        lock.lock()
        defer { lock.unlock() }

        if let cached = cached { return cached }

        guard let data = secrets.data(for: storageKey),
              let tokens = try? JSONDecoder().decode(CodexSessionTokens.self, from: data) else {
            throw CodexError.notAuthenticated
        }
        cached = tokens
        return tokens
    }

    public func save(_ tokens: CodexSessionTokens) throws {
        lock.lock()
        defer { lock.unlock() }
        cached = tokens

        let data = try JSONEncoder().encode(tokens)
        try secrets.setData(data, for: storageKey)
    }

    public func clear() {
        lock.lock()
        defer { lock.unlock() }
        cached = nil
        try? secrets.setData(nil, for: storageKey)
    }

    /// Retorna um access token válido, renovando via refresh_token se estiver próximo de expirar.
    public func validTokens() async throws -> CodexSessionTokens {
        var tokens = try load()
        if let expires = tokens.expiresAt, expires.timeIntervalSinceNow < 120 {
            tokens = try await refresh(tokens)
        }
        return tokens
    }

    private func refresh(_ tokens: CodexSessionTokens) async throws -> CodexSessionTokens {
        var body: [String: Any] = [
            "grant_type": "refresh_token",
            "refresh_token": tokens.refreshToken,
            "client_id": CodexEndpoints.clientID,
        ]
        if !tokens.refreshToken.isEmpty {
            body["scope"] = "openid profile email offline_access"
        }

        let json = try await CodexHTTP.postJSON(CodexEndpoints.tokenURL, body: body)
        var updated = try parseTokens(json, fallback: tokens)
        if updated.refreshToken.isEmpty {
            updated.refreshToken = tokens.refreshToken
        }
        try save(updated)
        return updated
    }

    public func parseTokens(_ json: [String: Any], fallback: CodexSessionTokens? = nil) throws -> CodexSessionTokens {
        guard let access = json["access_token"] as? String, !access.isEmpty else {
            throw CodexError.invalidResponse("access_token ausente")
        }
        let refresh = (json["refresh_token"] as? String) ?? fallback?.refreshToken ?? ""
        let idToken = (json["id_token"] as? String) ?? fallback?.idToken

        var accountId = fallback?.accountId
        var email = fallback?.email
        var expiresAt = Date().addingTimeInterval(3600)

        if let idToken = idToken {
            let claims = CodexHTTP.jwtPayload(idToken)
            if let auth = claims["https://api.openai.com/auth"] as? [String: Any] {
                accountId = (auth["chatgpt_account_id"] as? String) ?? accountId
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

        return CodexSessionTokens(
            accessToken: access,
            refreshToken: refresh,
            idToken: idToken,
            accountId: accountId,
            email: email,
            expiresAt: expiresAt
        )
    }
}
