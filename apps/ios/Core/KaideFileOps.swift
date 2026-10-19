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
    public static func readFile(at path: String, maxBytes: Int = 100_000) -> FileToolResult {
        let expandedPath = resolvePath(path)
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

    public static func writeFile(at path: String, content: String) -> FileToolResult {
        let expandedPath = resolvePath(path)
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

    public static func editFile(at path: String, oldText: String, newText: String) -> FileToolResult {
        let expandedPath = resolvePath(path)
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

    public static func listDirectory(at path: String) -> [String] {
        let expandedPath = resolvePath(path)
        let fm = FileManager.default
        return (try? fm.contentsOfDirectory(atPath: expandedPath)) ?? []
    }

    public static func resolvePath(_ path: String) -> String {
        if path.hasPrefix("~") {
            let home = NSHomeDirectory()
            return path.replacingOccurrences(of: "~", with: home, range: path.startIndex..<path.index(after: path.startIndex))
        }
        return (path as NSString).standardizingPath
    }
}
