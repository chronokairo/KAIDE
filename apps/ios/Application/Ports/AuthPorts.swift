import Foundation

public struct CodexDeviceChallenge {
    public let userCode: String
    public let verificationURL: URL
    public let interval: TimeInterval

    public init(userCode: String, verificationURL: URL, interval: TimeInterval) {
        self.userCode = userCode
        self.verificationURL = verificationURL
        self.interval = interval
    }
}

/// Porta de saída para autenticação OAuth do Codex (device code).
public protocol CodexAuthPort {
    var isAuthenticated: Bool { get }
    var accountEmail: String? { get }

    func startDeviceLogin() async throws -> CodexDeviceChallenge

    /// Aguarda a aprovação no navegador e persiste as credenciais.
    func awaitLogin(_ challenge: CodexDeviceChallenge) async throws

    func signOut()
}

/// Porta de saída para validação de token de forge (GitHub/GitLab).
public protocol ForgeAuthPort {
    func verify(provider: ForgeProvider, token: String) async throws -> ForgeAccount
}

/// Porta de saída para preferências do usuário (provedor ativo).
public protocol ProviderPreferencesPort {
    var selectedProvider: LLMProvider? { get set }
}
