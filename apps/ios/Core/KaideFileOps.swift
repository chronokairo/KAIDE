import Foundation

public struct FileToolResult: Codable {
    public let ok: Bool
    public let path: String
    public let content: String?
    public let bytes: Int?
    public let error: String?

    public init(ok: Bool, path: String, content: String? = nil, bytes: Int? = nil, error: String? = nil) {
        self.ok = ok
        self.path = path
        self.content = content
        self.bytes = bytes
        self.error = error
    }
}

public enum KaideFileOps {
    public static func readFile(at path: String, maxBytes: Int = 100_000, root: String? = nil) -> FileToolResult {
        guard let expandedPath = resolveGuarded(path, root: root) else {
            return outsideRootResult(path, root: root)
        }
        let fm = FileManager.default

        guard fm.fileExists(atPath: expandedPath) else {
            return FileToolResult(ok: false, path: path, error: "Arquivo não encontrado: \(path)")
        }

        var isDir: ObjCBool = false
        if fm.fileExists(atPath: expandedPath, isDirectory: &isDir), isDir.boolValue {
            return FileToolResult(ok: false, path: path, error: "O caminho informado é um diretório, não um arquivo.")
        }

        guard let handle = FileHandle(forReadingAtPath: expandedPath) else {
            return FileToolResult(ok: false, path: path, error: "Não foi possível abrir o arquivo para leitura.")
        }
        defer { try? handle.close() }

        let data = handle.readData(ofLength: maxBytes + 1)
        if data.count > maxBytes {
            return FileToolResult(ok: false, path: path, error: "Arquivo maior que o limite de \(maxBytes) bytes. Use comandos shell para leitura paginada.")
        }

        guard let text = String(data: data, encoding: .utf8) ?? String(data: data, encoding: .ascii) else {
            return FileToolResult(ok: false, path: path, error: "O arquivo não contém texto codificado em UTF-8 válido.")
        }

        return FileToolResult(ok: true, path: path, content: text, bytes: data.count)
    }

    public static func writeFile(at path: String, content: String, root: String? = nil) -> FileToolResult {
        guard let expandedPath = resolveGuarded(path, root: root) else {
            return outsideRootResult(path, root: root)
        }
        let url = URL(fileURLWithPath: expandedPath)
        let parentDir = url.deletingLastPathComponent()

        do {
            try FileManager.default.createDirectory(at: parentDir, withIntermediateDirectories: true)
            let data = Data(content.utf8)
            try data.write(to: url, options: .atomic)
            return FileToolResult(ok: true, path: path, bytes: data.count)
        } catch {
            return FileToolResult(ok: false, path: path, error: "Falha ao gravar arquivo: \(error.localizedDescription)")
        }
    }

    public static func editFile(at path: String, oldText: String, newText: String, root: String? = nil) -> FileToolResult {
        guard let expandedPath = resolveGuarded(path, root: root) else {
            return outsideRootResult(path, root: root)
        }
        let url = URL(fileURLWithPath: expandedPath)

        guard oldText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false else {
            return FileToolResult(ok: false, path: path, error: "old_text não pode ser vazio.")
        }

        guard FileManager.default.fileExists(atPath: expandedPath) else {
            return FileToolResult(ok: false, path: path, error: "Arquivo não encontrado: \(path)")
        }

        do {
            let original = try String(contentsOf: url, encoding: .utf8)
            let occurrences = original.components(separatedBy: oldText).count - 1

            if occurrences == 0 {
                return FileToolResult(ok: false, path: path, error: "old_text não foi encontrado no arquivo informado.")
            } else if occurrences > 1 {
                return FileToolResult(ok: false, path: path, error: "old_text é ambíguo (encontrado \(occurrences) vezes). Forneça mais contexto de linhas ao redor para ser único.")
            }

            guard let range = original.range(of: oldText) else {
                return FileToolResult(ok: false, path: path, error: "Falha ao localizar trecho para substituição.")
            }

            var updated = original
            updated.replaceSubrange(range, with: newText)

            let data = Data(updated.utf8)
            try data.write(to: url, options: .atomic)

            return FileToolResult(ok: true, path: path, bytes: data.count)
        } catch {
            return FileToolResult(ok: false, path: path, error: "Erro na edição do arquivo: \(error.localizedDescription)")
        }
    }

    public static func listDirectory(at path: String = ".", root: String? = nil) -> [String] {
        guard let expandedPath = resolveGuarded(path.isEmpty ? "." : path, root: root) else {
            return []
        }
        let fm = FileManager.default
        return (try? fm.contentsOfDirectory(atPath: expandedPath)) ?? []
    }

    /// Caminho absoluto, resolvido contra a raiz do projeto ativo.
    public static func resolvePath(_ path: String) -> String {
        resolve(path, root: ProjectStore.shared.rootPath)
    }

    /// Resolve e valida contenção na raiz. `nil` quando o caminho escapa do projeto.
    public static func resolveGuarded(_ path: String, root: String? = nil) -> String? {
        let rootPath = root ?? ProjectStore.shared.rootPath
        let resolved = resolve(path, root: rootPath)
        return Workspace.contains(resolved, root: rootPath) ? resolved : nil
    }

    private static func resolve(_ path: String, root: String) -> String {
        let trimmed = path.isEmpty ? "." : path
        if trimmed == "~" { return root }
        if trimmed.hasPrefix("~/") {
            let relative = String(trimmed.dropFirst(2))
            return ((root as NSString).appendingPathComponent(relative) as NSString).standardizingPath
        }
        if trimmed.hasPrefix("/") {
            return (trimmed as NSString).standardizingPath
        }
        return ((root as NSString).appendingPathComponent(trimmed) as NSString).standardizingPath
    }

    private static func outsideRootResult(_ path: String, root: String?) -> FileToolResult {
        let rootPath = root ?? ProjectStore.shared.rootPath
        return FileToolResult(
            ok: false,
            path: path,
            error: "Caminho fora do projeto ativo (\(path)). A raiz permitida é \(rootPath). Use caminhos relativos ou dentro da pasta do projeto."
        )
    }
}
