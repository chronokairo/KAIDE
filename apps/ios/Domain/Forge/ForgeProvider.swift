import Foundation

/// Provedores de forge suportados via token pessoal (HTTPS, sem shell).
public enum ForgeProvider: String, CaseIterable, Identifiable, Codable {
    case github
    case gitlab

    public var id: String { rawValue }

    public var title: String {
        switch self {
        case .github: return "GitHub"
        case .gitlab: return "GitLab"
        }
    }

    public var tokenHint: String {
        switch self {
        case .github: return "github_pat_… (fine-grained: contents, pull requests)"
        case .gitlab: return "glpat-… (api / read_repository + write_repository)"
        }
    }

    public var secretKey: String {
        "forge.\(rawValue).token"
    }
}

public struct ForgeAccount: Equatable {
    public let provider: ForgeProvider
    public let login: String
    public let name: String?

    public init(provider: ForgeProvider, login: String, name: String? = nil) {
        self.provider = provider
        self.login = login
        self.name = name
    }
}
