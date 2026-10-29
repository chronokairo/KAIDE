import Foundation

/// Caso de uso: validar e persistir tokens de forge (GitHub/GitLab).
public struct VerifyForgeAccount {
    private let auth: ForgeAuthPort
    private let secrets: SecretStorePort

    public init(auth: ForgeAuthPort, secrets: SecretStorePort) {
        self.auth = auth
        self.secrets = secrets
    }

    public func hasToken(for provider: ForgeProvider) -> Bool {
        secrets.string(for: provider.secretKey) != nil
    }

    public func verifyAndSave(provider: ForgeProvider, token: String) async throws -> ForgeAccount {
        let account = try await auth.verify(provider: provider, token: token)
        try secrets.setString(token, for: provider.secretKey)
        return account
    }

    public func removeToken(for provider: ForgeProvider) throws {
        try secrets.setString(nil, for: provider.secretKey)
    }
}
