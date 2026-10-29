import Foundation

/// Um "projeto" do Kaide é uma pasta raiz: o agente só lê/escreve dentro dela.
///
/// Duas origens:
/// - `isExternal == false`: pasta criada pelo app em `Documents/Kaide/projects/<slug>`.
/// - `isExternal == true`: pasta escolhida no app Arquivos via `UIDocumentPicker`
///   (guardamos um security-scoped bookmark em `bookmark`).
public struct KaideProject: Codable, Identifiable, Equatable {
    public let id: String
    public var name: String
    public var path: String
    public var bookmark: Data?
    public var isExternal: Bool
    public let createdAt: Date

    public init(
        id: String = UUID().uuidString,
        name: String,
        path: String,
        bookmark: Data? = nil,
        isExternal: Bool = false,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.path = path
        self.bookmark = bookmark
        self.isExternal = isExternal
        self.createdAt = createdAt
    }

    /// Nome → slug seguro para filesystem (sem acento, sem espaço).
    public static func slug(_ name: String) -> String {
        let lowered = name
            .lowercased()
            .folding(options: .diacriticInsensitive, locale: Locale(identifier: "en_US_POSIX"))
        var out = ""
        for scalar in lowered.unicodeScalars {
            let keep = CharacterSet.alphanumerics.contains(scalar) || scalar == "-" || scalar == "_"
            out.unicodeScalars.append(keep ? scalar : "-")
        }
        let slug = out.split(separator: "-").map(String.init).joined(separator: "-")
        return slug.isEmpty ? "projeto" : slug
    }
}

public enum WorkspaceError: LocalizedError {
    case outsideRoot(path: String, root: String)
    case projectNotFound
    case invalidName
    case bookmarkFailed(String)

    public var errorDescription: String? {
        switch self {
        case .outsideRoot(let path, let root):
            return "Caminho fora do projeto ativo (\(path)). A raiz é \(root)."
        case .projectNotFound:
            return "Projeto não encontrado."
        case .invalidName:
            return "Nome de projeto inválido."
        case .bookmarkFailed(let detail):
            return "Não foi possível acessar a pasta escolhida: \(detail)"
        }
    }
}

/// Guard de caminho: normaliza, resolve symlinks e garante contenção na raiz.
public enum Workspace {
    public static func canonical(_ path: String) -> String {
        URL(fileURLWithPath: path)
            .standardizedFileURL
            .resolvingSymlinksInPath()
            .path
    }

    public static func contains(_ path: String, root: String) -> Bool {
        let rootCanonical = canonical(root)
        let pathCanonical = canonical(path)
        if pathCanonical == rootCanonical { return true }
        return pathCanonical.hasPrefix(rootCanonical.hasSuffix("/") ? rootCanonical : rootCanonical + "/")
    }
}

/// Persistência simples (JSON) dos projetos + projeto ativo.
public final class ProjectStore {
    public static let shared = ProjectStore()

    private let fileManager = FileManager.default
    private let lock = NSLock()
    private var scopedURL: URL?

    public private(set) var projects: [KaideProject] = []
    public private(set) var activeProjectID: String?

    public init() {
        reload()
    }

    // MARK: - Caminhos

    public var documentsDirectory: URL {
        if let url = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first {
            return url
        }
        return URL(fileURLWithPath: NSHomeDirectory()).appendingPathComponent("Documents")
    }

    public var projectsRoot: URL {
        documentsDirectory.appendingPathComponent("Kaide/projects", isDirectory: true)
    }

    private var storageDirectory: URL {
        let base = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? URL(fileURLWithPath: NSHomeDirectory()).appendingPathComponent("Library/Application Support")
        return base.appendingPathComponent("Kaide", isDirectory: true)
    }

    private var storageFile: URL {
        storageDirectory.appendingPathComponent("projects.json")
    }

    /// Raiz efetiva usada pelas tools: projeto ativo ou `Documents` (container).
    public var rootPath: String {
        if let project = activeProject {
            return project.path
        }
        return documentsDirectory.path
    }

    public var activeProject: KaideProject? {
        guard let id = activeProjectID else { return nil }
        return projects.first { $0.id == id }
    }

    // MARK: - CRUD

    @discardableResult
    public func createProject(name: String) throws -> KaideProject {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw WorkspaceError.invalidName }

        try fileManager.createDirectory(at: projectsRoot, withIntermediateDirectories: true)
        let slug = KaideProject.slug(trimmed)
        let dir = uniqueDirectory(base: projectsRoot, slug: slug)
        try fileManager.createDirectory(at: dir, withIntermediateDirectories: true)

        let project = KaideProject(name: trimmed, path: dir.path)
        projects.append(project)
        setActive(project.id)
        return project
    }

    /// Adiciona uma pasta externa (app Arquivos) com security-scoped bookmark.
    @discardableResult
    public func importProject(name: String?, url: URL) throws -> KaideProject {
        let accessing = url.startAccessingSecurityScopedResource()
        defer { if accessing { url.stopAccessingSecurityScopedResource() } }

        let bookmark: Data
        do {
            bookmark = try url.bookmarkData(options: [], includingResourceValuesForKeys: nil, relativeTo: nil)
        } catch {
            throw WorkspaceError.bookmarkFailed(error.localizedDescription)
        }

        let displayName = (name?.trimmingCharacters(in: .whitespacesAndNewlines)).flatMap { $0.isEmpty ? nil : $0 }
            ?? url.lastPathComponent
        let project = KaideProject(
            name: displayName.isEmpty ? "Projeto" : displayName,
            path: url.path,
            bookmark: bookmark,
            isExternal: true
        )
        projects.removeAll { Workspace.canonical($0.path) == Workspace.canonical(project.path) }
        projects.append(project)
        setActive(project.id)
        return project
    }

    public func delete(_ projectID: String) {
        guard let project = projects.first(where: { $0.id == projectID }) else { return }
        if activeProjectID == projectID {
            setActive(nil)
        }
        if !project.isExternal {
            try? fileManager.removeItem(atPath: project.path)
        }
        projects.removeAll { $0.id == projectID }
        persist()
    }

    public func setActive(_ projectID: String?) {
        lock.lock()
        defer { lock.unlock() }

        if let url = scopedURL {
            url.stopAccessingSecurityScopedResource()
            scopedURL = nil
        }

        activeProjectID = projectID

        if let project = projects.first(where: { $0.id == projectID }), project.isExternal, let data = project.bookmark {
            var stale = false
            if let url = try? URL(resolvingBookmarkData: data, options: [], relativeTo: nil, bookmarkDataIsStale: &stale) {
                if url.startAccessingSecurityScopedResource() {
                    scopedURL = url
                }
            }
        }

        persist()
    }

    // MARK: - Persistência

    public func reload() {
        guard let data = try? Data(contentsOf: storageFile) else {
            projects = []
            activeProjectID = nil
            return
        }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        if let state = try? decoder.decode(ProjectStoreState.self, from: data) {
            projects = state.projects
            activeProjectID = state.activeProjectID
            if activeProjectID != nil, let project = activeProject, project.isExternal, let bookmark = project.bookmark {
                var stale = false
                if let url = try? URL(resolvingBookmarkData: bookmark, options: [], relativeTo: nil, bookmarkDataIsStale: &stale),
                   url.startAccessingSecurityScopedResource() {
                    scopedURL = url
                }
            }
        }
    }

    private func persist() {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        guard let data = try? encoder.encode(ProjectStoreState(projects: projects, activeProjectID: activeProjectID)) else {
            return
        }
        try? fileManager.createDirectory(at: storageDirectory, withIntermediateDirectories: true)
        try? data.write(to: storageFile, options: .atomic)
    }

    private func uniqueDirectory(base: URL, slug: String) -> URL {
        var candidate = base.appendingPathComponent(slug, isDirectory: true)
        var suffix = 2
        while fileManager.fileExists(atPath: candidate.path) {
            candidate = base.appendingPathComponent("\(slug)-\(suffix)", isDirectory: true)
            suffix += 1
        }
        return candidate
    }
}

private struct ProjectStoreState: Codable {
    var projects: [KaideProject]
    var activeProjectID: String?
}
