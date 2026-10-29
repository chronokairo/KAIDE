import Foundation

/// Caso de uso: entrar com ChatGPT (Codex) por device code.
public struct LoginWithCodex {
    private let auth: CodexAuthPort

    public init(auth: CodexAuthPort) {
        self.auth = auth
    }

    public var isAuthenticated: Bool {
        auth.isAuthenticated
    }

    public var accountEmail: String? {
        auth.accountEmail
    }

    public func start() async throws -> CodexDeviceChallenge {
        try await auth.startDeviceLogin()
    }

    public func awaitLogin(_ challenge: CodexDeviceChallenge) async throws {
        try await auth.awaitLogin(challenge)
    }

    public func signOut() {
        auth.signOut()
    }
}
