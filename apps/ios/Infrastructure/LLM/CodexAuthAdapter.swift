import Foundation

public final class CodexAuthAdapter: CodexAuthPort {
    private let session: CodexTokenSession

    public init(session: CodexTokenSession) {
        self.session = session
    }

    public var isAuthenticated: Bool {
        session.isAuthenticated
    }

    public var accountEmail: String? {
        session.accountEmail
    }

    public func startDeviceLogin() async throws -> CodexDeviceChallenge {
        let json = try await CodexHTTP.postJSON(
            CodexEndpoints.deviceCodeURL,
            body: ["client_id": CodexEndpoints.clientID]
        )

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

        // Armazena temporariamente no UserDefault / state se necessário, mas aqui a sessão lida
        // Passamos o deviceAuthID via closure ou state na app se precisar, mas o challenge
        // guarda o userCode e a verificação é feita polled enviando deviceAuthID.
        // Como o desafio expõe apenas userCode/URL, guardamos o deviceAuthID estaticamente ou na sessão.
        CodexDevicePollingState.shared.activeDeviceAuthID = deviceAuthID

        return CodexDeviceChallenge(
            userCode: userCode,
            verificationURL: CodexEndpoints.verificationURL,
            interval: max(interval, 3)
        )
    }

    public func awaitLogin(_ challenge: CodexDeviceChallenge) async throws {
        guard let deviceAuthID = CodexDevicePollingState.shared.activeDeviceAuthID else {
            throw CodexError.invalidResponse("deviceAuthID não encontrado para polling")
        }

        let deadline = Date().addingTimeInterval(600)
        while Date() < deadline {
            try await Task.sleep(nanoseconds: UInt64(challenge.interval * 1_000_000_000))
            do {
                let json = try await CodexHTTP.postJSON(
                    CodexEndpoints.deviceTokenURL,
                    body: [
                        "device_auth_id": deviceAuthID,
                        "user_code": challenge.userCode,
                    ]
                )
                guard let code = (json["authorization_code"] as? String) ?? (json["authorizationCode"] as? String),
                      !code.isEmpty else {
                    continue
                }
                let verifier = (json["code_verifier"] as? String) ?? (json["codeVerifier"] as? String) ?? ""
                let tokens = try await exchange(authCode: code, verifier: verifier)
                try session.save(tokens)
                CodexDevicePollingState.shared.activeDeviceAuthID = nil
                return
            } catch let error as CodexError {
                if case .http(let code, _) = error, code == 403 || code == 404 || code == 428 {
                    continue
                }
                throw error
            }
        }
        throw CodexError.loginExpired
    }

    private func exchange(authCode: String, verifier: String) async throws -> CodexSessionTokens {
        var body: [String: Any] = [
            "grant_type": "authorization_code",
            "code": authCode,
            "redirect_uri": CodexEndpoints.deviceCallback,
            "client_id": CodexEndpoints.clientID,
        ]
        if !verifier.isEmpty {
            body["code_verifier"] = verifier
        }
        let json = try await CodexHTTP.postJSON(CodexEndpoints.tokenURL, body: body)
        return try session.parseTokens(json)
    }

    public func signOut() {
        session.clear()
    }
}

private final class CodexDevicePollingState {
    static let shared = CodexDevicePollingState()
    var activeDeviceAuthID: String?
}
