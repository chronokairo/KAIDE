import Foundation

/// Metadados descritivos de uma sessão persistente do Kaide
public struct SessionMeta: Codable, Identifiable, Equatable {
    public let id: String
    public let createdAt: Date
    public var updatedAt: Date
    public var title: String
    public var model: String
    public var cwd: String
    public var projectId: String?
    public var turnCount: Int
    public var totalTokens: Int

    public init(
        id: String = UUID().uuidString,
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        title: String,
        model: String,
        cwd: String = FileManager.default.currentDirectoryPath,
        projectId: String? = nil,
        turnCount: Int = 0,
        totalTokens: Int = 0
    ) {
        self.id = id
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.title = title
        self.model = model
        self.cwd = cwd
        self.projectId = projectId
        self.turnCount = turnCount
        self.totalTokens = totalTokens
    }
}

/// Registro individual em formato JSONL (Rollout) compatível com persistência de sessões
public enum SessionRolloutRecord: Codable {
    case meta(SessionMeta)
    case turn(KaideTurn)

    enum CodingKeys: String, CodingKey {
        case type, payload
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        switch type {
        case "meta", "session_meta":
            let meta = try container.decode(SessionMeta.self, forKey: .payload)
            self = .meta(meta)
        case "turn":
            let turn = try container.decode(KaideTurn.self, forKey: .payload)
            self = .turn(turn)
        default:
            // Fallback tolerante para turns gravados diretamente
            let turn = try container.decode(KaideTurn.self, forKey: .payload)
            self = .turn(turn)
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .meta(let meta):
            try container.encode("meta", forKey: .type)
            try container.encode(meta, forKey: .payload)
        case .turn(let turn):
            try container.encode("turn", forKey: .type)
            try container.encode(turn, forKey: .payload)
        }
    }
}

/// Gerenciador nativo de persistência de sessões em disco (.jsonl append-only)
public final class SessionPersistence {
    public static let shared = SessionPersistence()

    private let fileManager = FileManager.default

    public init() {}

    /// Diretório canônico para gravação de sessões no iOS / Darwin
    public var sessionsDirectory: URL {
        let paths: [URL] = [
            fileManager.urls(for: .documentDirectory, in: .userDomainMask).first?.appendingPathComponent("Kaide/sessions"),
            URL(fileURLWithPath: "/var/mobile/Documents/Kaide/sessions"),
            URL(fileURLWithPath: NSHomeDirectory()).appendingPathComponent(".kaide/sessions"),
            URL(fileURLWithPath: "/tmp/kaide/sessions")
        ].compactMap { $0 }

        for dir in paths {
            if fileManager.fileExists(atPath: dir.path) {
                return dir
            }
            if (try? fileManager.createDirectory(at: dir, withIntermediateDirectories: true)) != nil {
                return dir
            }
        }

        return URL(fileURLWithPath: "/tmp/kaide_sessions")
    }

    /// Cria uma nova sessão com metadados e grava o registro de abertura
    public func createSession(title: String, model: String, cwd: String = ".") -> SessionMeta {
        let dateFmt = DateFormatter()
        dateFmt.dateFormat = "yyyyMMdd_HHmmss"
        let timestamp = dateFmt.string(from: Date())
        let shortId = UUID().uuidString.prefix(6)
        let id = "session_\(timestamp)_\(shortId)"

        let resolvedCwd = (cwd == ".") ? ProjectStore.shared.rootPath : cwd
        let meta = SessionMeta(
            id: id,
            createdAt: Date(),
            updatedAt: Date(),
            title: title.isEmpty ? "Nova Conversa" : title,
            model: model,
            cwd: resolvedCwd,
            projectId: ProjectStore.shared.activeProjectID,
            turnCount: 0,
            totalTokens: 0
        )

        let fileURL = sessionsDirectory.appendingPathComponent("\(id).jsonl")
        if let line = encodeLine(.meta(meta)) {
            try? line.write(to: fileURL, atomically: true, encoding: .utf8)
        }

        return meta
    }

    /// Adiciona incrementalmente um turno à sessão ativa
    public func appendTurn(sessionId: String, turn: KaideTurn) {
        let fileURL = sessionsDirectory.appendingPathComponent("\(sessionId).jsonl")
        guard let line = encodeLine(.turn(turn)) else { return }

        if let handle = try? FileHandle(forWritingTo: fileURL) {
            handle.seekToEndOfFile()
            if let data = line.data(using: .utf8) {
                handle.write(data)
            }
            try? handle.close()
        } else {
            // Se o arquivo não existia, cria-o
            try? line.write(to: fileURL, atomically: true, encoding: .utf8)
        }
    }

    /// Atualiza os metadados de uma sessão (título, tokens, data de atualização)
    public func updateMeta(meta: SessionMeta) {
        let fileURL = sessionsDirectory.appendingPathComponent("\(meta.id).jsonl")
        guard fileManager.fileExists(atPath: fileURL.path) else { return }

        // Recarrega todos os turns existentes
        guard let (_, turns) = loadSession(sessionId: meta.id) else { return }

        var output = ""
        if let metaLine = encodeLine(.meta(meta)) {
            output += metaLine
        }
        for t in turns {
            if let turnLine = encodeLine(.turn(t)) {
                output += turnLine
            }
        }
        try? output.write(to: fileURL, atomically: true, encoding: .utf8)
    }

    /// Carrega uma sessão completa do disco
    public func loadSession(sessionId: String) -> (meta: SessionMeta, turns: [KaideTurn])? {
        let fileURL = sessionsDirectory.appendingPathComponent("\(sessionId).jsonl")
        guard let content = try? String(contentsOf: fileURL, encoding: .utf8) else {
            return nil
        }

        let lines = content.components(separatedBy: "\n").filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
        var meta: SessionMeta? = nil
        var turns: [KaideTurn] = []

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        for line in lines {
            guard let data = line.data(using: .utf8) else { continue }
            if let record = try? decoder.decode(SessionRolloutRecord.self, from: data) {
                switch record {
                case .meta(let m):
                    meta = m
                case .turn(let t):
                    turns.append(t)
                }
            } else if let directTurn = try? decoder.decode(KaideTurn.self, from: data) {
                turns.append(directTurn)
            }
        }

        let resolvedMeta = meta ?? SessionMeta(
            id: sessionId,
            createdAt: Date(),
            updatedAt: Date(),
            title: turns.first(where: { $0.role == "user" })?.content.prefix(32).description ?? "Sessão Recuperada",
            model: NIMClient.defaultModel,
            cwd: fileManager.currentDirectoryPath,
            turnCount: turns.count,
            totalTokens: 0
        )

        return (resolvedMeta, turns)
    }

    /// Lista todas as sessões salvas em disco ordenadas pela data da última modificação
    public func listSessions() -> [SessionMeta] {
        guard let files = try? fileManager.contentsOfDirectory(atPath: sessionsDirectory.path) else {
            return []
        }

        var sessions: [SessionMeta] = []
        for file in files where file.hasSuffix(".jsonl") {
            let sessionId = (file as NSString).deletingPathExtension
            if let (meta, turns) = loadSession(sessionId: sessionId) {
                var updated = meta
                updated.turnCount = turns.count
                updated.totalTokens = turns.compactMap { $0.metrics?.totalTokens }.reduce(0, +)
                sessions.append(updated)
            }
        }

        return sessions.sorted { $0.updatedAt > $1.updatedAt }
    }

    /// Remove o arquivo de uma sessão
    public func deleteSession(sessionId: String) {
        let fileURL = sessionsDirectory.appendingPathComponent("\(sessionId).jsonl")
        try? fileManager.removeItem(at: fileURL)
    }

    /// Retorna o ID da sessão mais recente
    public func latestSessionId() -> String? {
        listSessions().first?.id
    }

    // MARK: - Helpers Privados

    private func encodeLine(_ record: SessionRolloutRecord) -> String? {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        guard let data = try? encoder.encode(record),
              let str = String(data: data, encoding: .utf8) else {
            return nil
        }
        return str + "\n"
    }
}
