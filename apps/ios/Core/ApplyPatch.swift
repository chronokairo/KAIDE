import Foundation

/// Tipos de alteração resultantes da aplicação de um patch
public struct PatchedFile: Sendable, Equatable {
    public enum Kind: String, Sendable, Codable {
        case add
        case update
        case delete
    }

    public let path: String
    public let kind: Kind
    public let movePath: String?
    public let linesAdded: Int
    public let linesRemoved: Int
    public let oldContent: String?
    public let newContent: String?

    public init(
        path: String,
        kind: Kind,
        movePath: String? = nil,
        linesAdded: Int = 0,
        linesRemoved: Int = 0,
        oldContent: String? = nil,
        newContent: String? = nil
    ) {
        self.path = path
        self.kind = kind
        self.movePath = movePath
        self.linesAdded = linesAdded
        self.linesRemoved = linesRemoved
        self.oldContent = oldContent
        self.newContent = newContent
    }
}

public enum ApplyPatchError: LocalizedError, Equatable {
    case emptyPatch
    case invalidEnvelope(String)
    case unsafePath(String)
    case targetMissing(String)
    case targetExists(String)
    case contextMismatch(String)
    case hunkParseError(String, Int)
    case ioError(String)

    public var errorDescription: String? {
        switch self {
        case .emptyPatch:
            return "O patch fornecido está vazio ou nenhum arquivo foi modificado."
        case .invalidEnvelope(let msg):
            return "Envelope de patch inválido: \(msg)"
        case .unsafePath(let msg):
            return "Caminho inseguro rejeitado (path traversal): \(msg)"
        case .targetMissing(let p):
            return "Arquivo de destino não encontrado: \(p)"
        case .targetExists(let p):
            return "Arquivo de destino já existe para adição: \(p)"
        case .contextMismatch(let msg):
            return "Conflito de contexto ao aplicar hunk: \(msg)"
        case .hunkParseError(let msg, let line):
            return "Erro ao analisar hunk na linha \(line): \(msg)"
        case .ioError(let msg):
            return "Erro de E/S no disco ao aplicar patch: \(msg)"
        }
    }
}

/// Motor nativo de aplicação atômica e tolerante de patches para o Kaide.
/// Suporta tanto o envelope canônico do Codex (*** Begin Patch / *** Update File: / *** Add File:)
/// quanto o formato tradicional Git Unified Diff (diff --git / --- a/ / +++ b/ / @@).
public final class ApplyPatch {
    public init() {}

    // MARK: - Modelos Internos de Parsing

    private struct Hunk {
        var oldStart: Int
        var oldLines: [String]
        var newLines: [String]
    }

    private struct FilePatch {
        var path: String
        var kind: PatchedFile.Kind
        var movePath: String?
        var newFileContent: String?
        var hunks: [Hunk]
    }

    // MARK: - Aplicação Pública

    /// Aplica um patch em texto em relação ao diretório `root`.
    /// Garante validação total em memória antes de qualquer escrita em disco (All-or-Nothing).
    public func apply(_ patchText: String, root: String = ".") throws -> [PatchedFile] {
        let trimmed = patchText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            throw ApplyPatchError.emptyPatch
        }

        let parsedPatches = try parse(trimmed)
        guard !parsedPatches.isEmpty else {
            throw ApplyPatchError.emptyPatch
        }

        let fm = FileManager.default
        let resolvedRoot = KaideFileOps.resolvePath(root)

        // FASE 1: Verificação em memória
        struct PlannedMutation {
            let file: PatchedFile
            let targetPath: String
            let destinationPath: String
            let contentToWrite: String?
            let shouldDelete: Bool
        }

        var planned: [PlannedMutation] = []

        for p in parsedPatches {
            try validateRelativePath(p.path)
            if let move = p.movePath {
                try validateRelativePath(move)
            }

            let fullPath = (resolvedRoot as NSString).appendingPathComponent(p.path)

            switch p.kind {
            case .add:
                let content = p.newFileContent ?? ""
                let linesAdded = content.components(separatedBy: "\n").count
                let patched = PatchedFile(
                    path: p.path,
                    kind: .add,
                    movePath: nil,
                    linesAdded: linesAdded,
                    linesRemoved: 0,
                    oldContent: nil,
                    newContent: content
                )
                planned.append(PlannedMutation(
                    file: patched,
                    targetPath: fullPath,
                    destinationPath: fullPath,
                    contentToWrite: content,
                    shouldDelete: false
                ))

            case .delete:
                guard fm.fileExists(atPath: fullPath) else {
                    throw ApplyPatchError.targetMissing(p.path)
                }
                let oldContent = (try? String(contentsOfFile: fullPath, encoding: .utf8)) ?? ""
                let linesRemoved = oldContent.components(separatedBy: "\n").count
                let patched = PatchedFile(
                    path: p.path,
                    kind: .delete,
                    movePath: nil,
                    linesAdded: 0,
                    linesRemoved: linesRemoved,
                    oldContent: oldContent,
                    newContent: nil
                )
                planned.append(PlannedMutation(
                    file: patched,
                    targetPath: fullPath,
                    destinationPath: fullPath,
                    contentToWrite: nil,
                    shouldDelete: true
                ))

            case .update:
                guard fm.fileExists(atPath: fullPath) else {
                    throw ApplyPatchError.targetMissing(p.path)
                }
                guard let existing = try? String(contentsOfFile: fullPath, encoding: .utf8) else {
                    throw ApplyPatchError.ioError("Falha ao ler conteúdo existente de \(p.path)")
                }

                let (updatedContent, added, removed) = try applyHunks(to: existing, hunks: p.hunks, path: p.path)
                let destPath: String
                if let move = p.movePath {
                    destPath = (resolvedRoot as NSString).appendingPathComponent(move)
                } else {
                    destPath = fullPath
                }

                let patched = PatchedFile(
                    path: p.path,
                    kind: .update,
                    movePath: p.movePath,
                    linesAdded: added,
                    linesRemoved: removed,
                    oldContent: existing,
                    newContent: updatedContent
                )
                planned.append(PlannedMutation(
                    file: patched,
                    targetPath: fullPath,
                    destinationPath: destPath,
                    contentToWrite: updatedContent,
                    shouldDelete: (p.movePath != nil)
                ))
            }
        }

        // FASE 2: Escrita atômica em disco
        var appliedFiles: [PatchedFile] = []

        for m in planned {
            if m.shouldDelete {
                if fm.fileExists(atPath: m.targetPath) {
                    try? fm.removeItem(atPath: m.targetPath)
                }
            }

            if let content = m.contentToWrite {
                let dir = (m.destinationPath as NSString).deletingLastPathComponent
                try? fm.createDirectory(atPath: dir, withIntermediateDirectories: true)
                do {
                    try content.write(toFile: m.destinationPath, atomically: true, encoding: .utf8)
                } catch {
                    throw ApplyPatchError.ioError("Falha ao gravar arquivo em \(m.destinationPath): \(error.localizedDescription)")
                }
            }

            appliedFiles.append(m.file)
        }

        return appliedFiles
    }

    // MARK: - Parsing

    private func parse(_ text: String) throws -> [FilePatch] {
        let lines = text.components(separatedBy: "\n").map { $0.trimmingCharacters(in: .newlines) }

        if text.contains("*** Begin Patch") || text.contains("*** Update File:") || text.contains("*** Add File:") {
            return try parseCodexEnvelope(lines)
        } else {
            return try parseUnifiedDiff(lines)
        }
    }

    /// Analisa patches no formato Codex
    private func parseCodexEnvelope(_ lines: [String]) throws -> [FilePatch] {
        var patches: [FilePatch] = []
        var i = 0

        while i < lines.count {
            let line = lines[i].trimmingCharacters(in: .whitespaces)

            if line == "*** Begin Patch" || line == "*** End Patch" || line.isEmpty {
                i += 1
                continue
            }

            if line.hasPrefix("*** Add File:") {
                let path = line.replacingOccurrences(of: "*** Add File:", with: "").trimmingCharacters(in: .whitespaces)
                i += 1
                var addLines: [String] = []
                while i < lines.count {
                    let cur = lines[i]
                    if cur.hasPrefix("*** ") { break }
                    if cur.hasPrefix("+") {
                        addLines.append(String(cur.dropFirst()))
                    } else {
                        addLines.append(cur)
                    }
                    i += 1
                }
                patches.append(FilePatch(
                    path: path,
                    kind: .add,
                    movePath: nil,
                    newFileContent: addLines.joined(separator: "\n"),
                    hunks: []
                ))
            } else if line.hasPrefix("*** Delete File:") {
                let path = line.replacingOccurrences(of: "*** Delete File:", with: "").trimmingCharacters(in: .whitespaces)
                patches.append(FilePatch(
                    path: path,
                    kind: .delete,
                    movePath: nil,
                    newFileContent: nil,
                    hunks: []
                ))
                i += 1
            } else if line.hasPrefix("*** Update File:") {
                let path = line.replacingOccurrences(of: "*** Update File:", with: "").trimmingCharacters(in: .whitespaces)
                i += 1
                var movePath: String? = nil
                if i < lines.count && lines[i].trimmingCharacters(in: .whitespaces).hasPrefix("*** Move to:") {
                    movePath = lines[i].replacingOccurrences(of: "*** Move to:", with: "").trimmingCharacters(in: .whitespaces)
                    i += 1
                }

                var hunks: [Hunk] = []
                while i < lines.count {
                    let cur = lines[i]
                    if cur.hasPrefix("*** ") { break }

                    if cur.hasPrefix("@@") {
                        let (hunk, nextIdx) = try parseSingleHunk(lines, startIdx: i)
                        hunks.append(hunk)
                        i = nextIdx
                    } else {
                        i += 1
                    }
                }

                patches.append(FilePatch(
                    path: path,
                    kind: .update,
                    movePath: movePath,
                    newFileContent: nil,
                    hunks: hunks
                ))
            } else {
                i += 1
            }
        }

        return patches
    }

    /// Analisa patches no formato Git Unified Diff padrão
    private func parseUnifiedDiff(_ lines: [String]) throws -> [FilePatch] {
        var patches: [FilePatch] = []
        var i = 0

        while i < lines.count {
            let line = lines[i]

            if line.hasPrefix("diff --git") || line.hasPrefix("--- ") {
                var filePath = ""
                if line.hasPrefix("--- ") {
                    let raw = String(line.dropFirst(4)).trimmingCharacters(in: .whitespaces)
                    filePath = cleanGitPath(raw)
                }

                i += 1
                if i < lines.count && lines[i].hasPrefix("+++ ") {
                    let raw = String(lines[i].dropFirst(4)).trimmingCharacters(in: .whitespaces)
                    let p2 = cleanGitPath(raw)
                    if filePath.isEmpty || filePath == "/dev/null" {
                        filePath = p2
                    }
                    i += 1
                }

                guard !filePath.isEmpty, filePath != "/dev/null" else {
                    continue
                }

                var hunks: [Hunk] = []
                while i < lines.count {
                    let cur = lines[i]
                    if cur.hasPrefix("diff --git") || cur.hasPrefix("--- ") {
                        break
                    }
                    if cur.hasPrefix("@@") {
                        let (hunk, nextIdx) = try parseSingleHunk(lines, startIdx: i)
                        hunks.append(hunk)
                        i = nextIdx
                    } else {
                        i += 1
                    }
                }

                patches.append(FilePatch(
                    path: filePath,
                    kind: .update,
                    movePath: nil,
                    newFileContent: nil,
                    hunks: hunks
                ))
            } else {
                i += 1
            }
        }

        return patches
    }

    private func cleanGitPath(_ path: String) -> String {
        var p = path
        if p.hasPrefix("a/") || p.hasPrefix("b/") {
            p = String(p.dropFirst(2))
        }
        return p.trimmingCharacters(in: .whitespaces)
    }

    private func parseSingleHunk(_ lines: [String], startIdx: Int) throws -> (Hunk, Int) {
        _ = lines[startIdx]
        var oldLines: [String] = []
        var newLines: [String] = []
        var idx = startIdx + 1

        while idx < lines.count {
            let l = lines[idx]
            if l.hasPrefix("@@") || l.hasPrefix("*** ") || l.hasPrefix("diff --git") || l.hasPrefix("--- ") {
                break
            }

            if l.hasPrefix("-") {
                oldLines.append(String(l.dropFirst()))
            } else if l.hasPrefix("+") {
                newLines.append(String(l.dropFirst()))
            } else if l.hasPrefix(" ") {
                let context = String(l.dropFirst())
                oldLines.append(context)
                newLines.append(context)
            } else {
                // Linha de contexto sem espaço inicial (tolerância a pequenos desvios do modelo)
                oldLines.append(l)
                newLines.append(l)
            }
            idx += 1
        }

        return (Hunk(oldStart: 0, oldLines: oldLines, newLines: newLines), idx)
    }

    // MARK: - Aplicação de Hunks

    private func applyHunks(to originalText: String, hunks: [Hunk], path: String) throws -> (updated: String, added: Int, removed: Int) {
        var currentText = originalText
        var totalAdded = 0
        var totalRemoved = 0

        for hunk in hunks {
            let targetBlock = hunk.oldLines.joined(separator: "\n")
            let replacementBlock = hunk.newLines.joined(separator: "\n")

            if targetBlock.isEmpty {
                // Inserção no início ou apêndice
                currentText += "\n" + replacementBlock
                totalAdded += hunk.newLines.count
                continue
            }

            // Tentativa 1: Correspondência Exata
            if let range = currentText.range(of: targetBlock) {
                currentText.replaceSubrange(range, with: replacementBlock)
                totalAdded += hunk.newLines.filter { !hunk.oldLines.contains($0) }.count
                totalRemoved += hunk.oldLines.filter { !hunk.newLines.contains($0) }.count
                continue
            }

            // Tentativa 2: Correspondência Tolerante a Espaços em Branco
            let trimmedTarget = hunk.oldLines.map { $0.trimmingCharacters(in: .whitespaces) }.joined(separator: "\n")
            let fileLines = currentText.components(separatedBy: "\n")
            var matched = false

            let windowSize = hunk.oldLines.count
            if fileLines.count >= windowSize {
                for lineIdx in 0...(fileLines.count - windowSize) {
                    let window = fileLines[lineIdx..<(lineIdx + windowSize)]
                    let windowTrimmed = window.map { $0.trimmingCharacters(in: .whitespaces) }.joined(separator: "\n")
                    if windowTrimmed == trimmedTarget {
                        var newLinesList = fileLines
                        newLinesList.replaceSubrange(lineIdx..<(lineIdx + windowSize), with: hunk.newLines)
                        currentText = newLinesList.joined(separator: "\n")
                        matched = true
                        totalAdded += hunk.newLines.count
                        totalRemoved += windowSize
                        break
                    }
                }
            }

            guard matched else {
                let preview = targetBlock.prefix(80)
                throw ApplyPatchError.contextMismatch("Não foi possível localizar o trecho para substituição em '\(path)': \"\(preview)...\"")
            }
        }

        return (currentText, totalAdded, totalRemoved)
    }

    // MARK: - Validação de Segurança

    private func validateRelativePath(_ p: String) throws {
        if p.hasPrefix("/") {
            throw ApplyPatchError.unsafePath("Caminhos absolutos não são permitidos no patch: \(p)")
        }
        let parts = p.split(separator: "/").map(String.init)
        if parts.contains("..") {
            throw ApplyPatchError.unsafePath("Tentativa de escape de diretório detectada (..): \(p)")
        }
        if p.isEmpty {
            throw ApplyPatchError.unsafePath("Caminho vazio.")
        }
    }
}
