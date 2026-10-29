import Foundation
import Security

/// Provedores de forge suportados via token pessoal (sem shell, via HTTPS).

public enum ForgeTokenError: LocalizedError {
    case missingToken
    case invalidResponse
    case unauthorized
    case keychain(OSStatus)

    public var errorDescription: String? {
        switch self {
        case .missingToken:
            return "Nenhum token configurado."
        case .invalidResponse:
            return "Resposta inválida do servidor."
        case .unauthorized:
            return "Token inválido ou sem permissão (401/403)."
        case .keychain(let status):
            return "Falha no Keychain (status \(status))."
        }
    }
}

/// Tokens de forge guardados no Keychain (nunca em UserDefaults, nunca no bundle).
public enum ForgeTokenStore {
    private static let service = "com.chronokairo.kaide.forge"

    public static func token(for provider: ForgeProvider) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: provider.rawValue,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data,
              let token = String(data: data, encoding: .utf8),
              !token.isEmpty else {
            return nil
        }
        return token
    }

    public static func save(_ token: String, for provider: ForgeProvider) throws {
        let trimmed = token.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            delete(for: provider)
            return
        }

        let base: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: provider.rawValue,
        ]

        let status = SecItemUpdate(base as CFDictionary, [kSecValueData as String: Data(trimmed.utf8)] as CFDictionary)
        if status == errSecItemNotFound {
            var attributes = base
            attributes[kSecValueData as String] = Data(trimmed.utf8)
            attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
            let addStatus = SecItemAdd(attributes as CFDictionary, nil)
            guard addStatus == errSecSuccess else { throw ForgeTokenError.keychain(addStatus) }
        } else if status != errSecSuccess {
            throw ForgeTokenError.keychain(status)
        }
    }

    public static func delete(for provider: ForgeProvider) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: provider.rawValue,
        ]
        SecItemDelete(query as CFDictionary)
    }

    public static func hasToken(for provider: ForgeProvider) -> Bool {
        token(for: provider) != nil
    }
}

/// Validação mínima do token (quem é o dono) sem shell, só HTTPS.
public enum ForgeClient {
    public struct Account: Equatable {
        public let provider: ForgeProvider
        public let login: String
        public let name: String?
    }

    public static func verify(provider: ForgeProvider, token: String) async throws -> Account {
        let trimmed = token.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw ForgeTokenError.missingToken }

        let urlString: String
        var request: URLRequest
        switch provider {
        case .github:
            urlString = "https://api.github.com/user"
            guard let url = URL(string: urlString) else { throw ForgeTokenError.invalidResponse }
            request = URLRequest(url: url)
            request.setValue("Bearer \(trimmed)", forHTTPHeaderField: "Authorization")
            request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
            request.setValue("Kaide-iOS", forHTTPHeaderField: "User-Agent")
        case .gitlab:
            urlString = "https://gitlab.com/api/v4/user"
            guard let url = URL(string: urlString) else { throw ForgeTokenError.invalidResponse }
            request = URLRequest(url: url)
            request.setValue(trimmed, forHTTPHeaderField: "PRIVATE-TOKEN")
            request.setValue("Kaide-iOS", forHTTPHeaderField: "User-Agent")
        }
        request.timeoutInterval = 20

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw ForgeTokenError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            if http.statusCode == 401 || http.statusCode == 403 { throw ForgeTokenError.unauthorized }
            throw ForgeTokenError.invalidResponse
        }

        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw ForgeTokenError.invalidResponse
        }
        let login = (json["login"] as? String) ?? (json["username"] as? String) ?? "desconhecido"
        let name = json["name"] as? String
        return Account(provider: provider, login: login, name: name)
    }
}
