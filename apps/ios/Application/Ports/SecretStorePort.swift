import Foundation

/// Porta de saída para segredos (tokens/credenciais).
/// Nada de segredo em UserDefaults: o adapter de produção usa Keychain.
public protocol SecretStorePort {
    func data(for key: String) -> Data?
    func setData(_ data: Data?, for key: String) throws
}

public extension SecretStorePort {
    func string(for key: String) -> String? {
        guard let data = data(for: key) else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func setString(_ value: String?, for key: String) throws {
        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines)
        if let trimmed = trimmed, !trimmed.isEmpty {
            try setData(Data(trimmed.utf8), for: key)
        } else {
            try setData(nil, for: key)
        }
    }
}
