import Foundation

public struct ToolExecutionResult {
    public let text: String
    public let isError: Bool

    public init(text: String, isError: Bool = false) {
        self.text = text
        self.isError = isError
    }
}

public enum KaideTools {
    public static func definitions() -> [NIMTool] {
        [
            NIMTool(
                name: "bash",
                description: "Executa comandos shell no sistema local Darwin (rootless iOS/iPhone). Use para compilar, rodar testes, git, listar arquivos ou executar ferramentas de terminal.",
                parameters: [
                    "type": .string("object"),
                    "properties": .object([
                        "command": .object([
                            "type": .string("string"),
                            "description": .string("O comando shell exato a ser executado.")
                        ])
                    ]),
                    "required": .array([.string("command")])
                ]
            ),
            NIMTool(
                name: "read_file",
                description: "Lê o conteúdo em texto UTF-8 de um arquivo a partir de um caminho absoluto ou relativo.",
                parameters: [
                    "type": .string("object"),
                    "properties": .object([
                        "path": .object([
                            "type": .string("string"),
                            "description": .string("Caminho do arquivo a ser lido.")
                        ])
                    ]),
                    "required": .array([.string("path")])
                ]
            ),
            NIMTool(
                name: "write_file",
                description: "Cria um novo arquivo ou substitui completamente o conteúdo de um arquivo existente de forma atômica.",
                parameters: [
                    "type": .string("object"),
                    "properties": .object([
                        "path": .object([
                            "type": .string("string"),
                            "description": .string("Caminho do arquivo.")
                        ]),
                        "content": .object([
                            "type": .string("string"),
                            "description": .string("Conteúdo completo a ser escrito.")
                        ])
                    ]),
                    "required": .array([.string("path"), .string("content")])
                ]
            ),
            NIMTool(
                name: "edit_file",
                description: "Edita um trecho exato e único de um arquivo. O texto old_text deve ocorrer exatamente UMA vez no arquivo.",
                parameters: [
                    "type": .string("object"),
                    "properties": .object([
                        "path": .object([
                            "type": .string("string"),
                            "description": .string("Caminho do arquivo a editar.")
                        ]),
                        "old_text": .object([
                            "type": .string("string"),
                            "description": .string("Trecho anterior único e exato a ser substituído.")
                        ]),
                        "new_text": .object([
                            "type": .string("string"),
                            "description": .string("Novo texto de substituição.")
                        ])
                    ]),
                    "required": .array([.string("path"), .string("old_text"), .string("new_text")])
                ]
            ),
            NIMTool(
                name: "apply_patch",
                description: "Aplica alterações atômicas a um ou mais arquivos. Suporta formato de diff unificado do Git (diff --git / --- a/ / +++ b/ / @@) e envelope do Codex (*** Begin Patch / *** Update File: / *** Add File: / *** Delete File:).",
                parameters: [
                    "type": .string("object"),
                    "properties": .object([
                        "patch": .object([
                            "type": .string("string"),
                            "description": .string("O conteúdo textual completo do patch a ser aplicado.")
                        ]),
                        "root": .object([
                            "type": .string("string"),
                            "description": .string("Diretório raiz relativo do projeto (padrão '.').")
                        ])
                    ]),
                    "required": .array([.string("patch")])
                ]
            ),
            NIMTool(
                name: "code_analyze_repo",
                description: "Realiza inventário do repositório, contando arquivos, linhas, linguagens detectadas e módulos.",
                parameters: [
                    "type": .string("object"),
                    "properties": .object([
                        "path": .object([
                            "type": .string("string"),
                            "description": .string("Caminho raiz do repositório (padrão '.').")
                        ]),
                        "depth": .object([
                            "type": .string("string"),
                            "description": .string("Profundidade máxima de pastas (padrão '4').")
                        ])
                    ])
                ]
            ),
            NIMTool(
                name: "code_review_diff",
                description: "Analisa um diff git para detectar vazamento de credenciais, force unwraps perigosos e boas práticas.",
                parameters: [
                    "type": .string("object"),
                    "properties": .object([
                        "diff": .object([
                            "type": .string("string"),
                            "description": .string("Texto do diff a ser revisado.")
                        ])
                    ]),
                    "required": .array([.string("diff")])
                ]
            ),
            NIMTool(
                name: "code_debug",
                description: "Analisa uma mensagem de erro ou stack trace e sugere hipóteses de correção.",
                parameters: [
                    "type": .string("object"),
                    "properties": .object([
                        "error_log": .object([
                            "type": .string("string"),
                            "description": .string("Log de erro ou stack trace.")
                        ]),
                        "code": .object([
                            "type": .string("string"),
                            "description": .string("Trecho de código relevante.")
                        ]),
                        "language": .object([
                            "type": .string("string"),
                            "description": .string("Linguagem de programação (ex: 'Swift', 'Python').")
                        ])
                    ]),
                    "required": .array([.string("error_log")])
                ]
            ),
            NIMTool(
                name: "code_search",
                description: "Busca arquivos por nome ou ocorrências de texto/regex dentro do código no repositório com números de linha.",
                parameters: [
                    "type": .string("object"),
                    "properties": .object([
                        "query": .object([
                            "type": .string("string"),
                            "description": .string("Termo de busca, nome de arquivo ou expressão regular.")
                        ]),
                        "path": .object([
                            "type": .string("string"),
                            "description": .string("Diretório raiz de busca (padrão '.').")
                        ]),
                        "is_regex": .object([
                            "type": .string("string"),
                            "description": .string("Se 'true', trata query como expressão regular NSRegularExpression.")
                        ]),
                        "find_files_only": .object([
                            "type": .string("string"),
                            "description": .string("Se 'true', busca apenas nomes de arquivos e pastas.")
                        ])
                    ]),
                    "required": .array([.string("query")])
                ]
            ),
            NIMTool(
                name: "git_worktree",
                description: "Gerencia worktrees do Git para trabalhar em branches isoladas sem sujar a árvore de trabalho principal.",
                parameters: [
                    "type": .string("object"),
                    "properties": .object([
                        "action": .object([
                            "type": .string("string"),
                            "description": .string("Ação a executar: 'list', 'create' ou 'remove'.")
                        ]),
                        "task_name": .object([
                            "type": .string("string"),
                            "description": .string("Nome curto da tarefa/branch para criação de worktree (obrigatório se action='create').")
                        ]),
                        "worktree_path": .object([
                            "type": .string("string"),
                            "description": .string("Caminho da worktree a ser removida (obrigatório se action='remove').")
                        ])
                    ]),
                    "required": .array([.string("action")])
                ]
            ),
            NIMTool(
                name: "skill_info",
                description: "Consulta e lê as instruções completas de uma habilidade especializada (Skill) disponível no ambiente.",
                parameters: [
                    "type": .string("object"),
                    "properties": .object([
                        "name": .object([
                            "type": .string("string"),
                            "description": .string("Nome da skill a ser consultada.")
                        ])
                    ]),
                    "required": .array([.string("name")])
                ]
            )
        ]
    }

    public static func execute(name: String, rawArgs: String, tracker: TurnDiffTracker? = nil) async -> ToolExecutionResult {
        let argsDict = parseArgs(rawArgs)

        switch name {
        case "bash", "coding_command":
            let cmd = argsDict["command"] ?? ""
            guard !cmd.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                return ToolExecutionResult(text: "Erro: comando não informado.", isError: true)
            }

            let safety = CommandSafety.classify(cmd)
            do {
                let result = try await LocalShell.exec(command: cmd, currentDirectory: ProjectStore.shared.rootPath)
                var out = ""
                if case .needsApproval(let reason) = safety {
                    out += "[Aviso de Segurança: \(reason)]\n"
                }
                out += "Exit Code: \(result.exitStatus)\n"
                if !result.stdout.isEmpty {
                    out += "STDOUT:\n\(result.stdout)\n"
                }
                if !result.stderr.isEmpty {
                    out += "STDERR:\n\(result.stderr)\n"
                }
                return ToolExecutionResult(text: out.trimmingCharacters(in: .whitespacesAndNewlines), isError: !result.isSuccess)
            } catch {
                return ToolExecutionResult(text: "Erro ao executar bash: \(error.localizedDescription)", isError: true)
            }

        case "read_file", "coding_read_file":
            let path = argsDict["path"] ?? ""
            let result = KaideFileOps.readFile(at: path)
            if result.ok, let content = result.content {
                return ToolExecutionResult(text: content)
            } else {
                return ToolExecutionResult(text: result.error ?? "Falha ao ler arquivo.", isError: true)
            }

        case "write_file", "coding_create_file":
            let path = argsDict["path"] ?? ""
            let content = argsDict["content"] ?? ""
            let prev = (try? String(contentsOfFile: KaideFileOps.resolvePath(path), encoding: .utf8)) ?? ""
            let result = KaideFileOps.writeFile(at: path, content: content)
            if result.ok {
                tracker?.recordChange(path: path, oldContent: prev, newContent: content)
                return ToolExecutionResult(text: "Arquivo gravado com sucesso (\(result.bytes ?? 0) bytes) em \(path)")
            } else {
                return ToolExecutionResult(text: result.error ?? "Falha ao gravar arquivo.", isError: true)
            }

        case "edit_file", "coding_replace_file":
            let path = argsDict["path"] ?? ""
            let oldText = argsDict["old_text"] ?? ""
            let newText = argsDict["new_text"] ?? ""
            let prev = (try? String(contentsOfFile: KaideFileOps.resolvePath(path), encoding: .utf8)) ?? ""
            let result = KaideFileOps.editFile(at: path, oldText: oldText, newText: newText)
            if result.ok {
                let updated = (try? String(contentsOfFile: KaideFileOps.resolvePath(path), encoding: .utf8)) ?? ""
                tracker?.recordChange(path: path, oldContent: prev, newContent: updated)
                return ToolExecutionResult(text: "Edição aplicada com sucesso (\(result.bytes ?? 0) bytes gravados) em \(path)")
            } else {
                return ToolExecutionResult(text: "Falha na edição: \(result.error ?? "")", isError: true)
            }

        case "apply_patch":
            let patch = argsDict["patch"] ?? ""
            let root = argsDict["root"] ?? ProjectStore.shared.rootPath
            do {
                let applier = ApplyPatch()
                let patchedFiles = try applier.apply(patch, root: root)
                for f in patchedFiles {
                    if let oldC = f.oldContent, let newC = f.newContent {
                        tracker?.recordChange(path: f.path, oldContent: oldC, newContent: newC)
                    } else if f.kind == .add, let newC = f.newContent {
                        tracker?.recordChange(path: f.path, oldContent: "", newContent: newC)
                    } else if f.kind == .delete, let oldC = f.oldContent {
                        tracker?.recordChange(path: f.path, oldContent: oldC, newContent: "")
                    }
                }
                var summary = "Patch aplicado com sucesso a \(patchedFiles.count) arquivo(s):\n"
                for f in patchedFiles {
                    summary += " - [\(f.kind.rawValue)] \(f.path) (+\(f.linesAdded), -\(f.linesRemoved))\n"
                }
                return ToolExecutionResult(text: summary.trimmingCharacters(in: .whitespacesAndNewlines))
            } catch {
                return ToolExecutionResult(text: "Falha ao aplicar patch: \(error.localizedDescription)", isError: true)
            }

        case "code_analyze_repo":
            let path = argsDict["path"] ?? ProjectStore.shared.rootPath
            let depth = Int(argsDict["depth"] ?? "4") ?? 4
            let result = RepoAnalysis.analyze(at: path, depth: depth)
            return ToolExecutionResult(text: result.summaryFormatted)

        case "code_review_diff":
            let diff = argsDict["diff"] ?? ""
            let result = CodeReview.reviewDiff(diff)
            return ToolExecutionResult(text: result.formattedText)

        case "code_debug":
            let errorLog = argsDict["error_log"] ?? ""
            let code = argsDict["code"] ?? ""
            let lang = argsDict["language"] ?? "Swift"
            let result = CodeDebugger.debugCode(code: code, errorLog: errorLog, language: lang)
            return ToolExecutionResult(text: result)

        case "code_search":
            let query = argsDict["query"] ?? ""
            let path = argsDict["path"] ?? ProjectStore.shared.rootPath
            let isRegex = (argsDict["is_regex"] ?? "").lowercased() == "true"
            let filesOnly = (argsDict["find_files_only"] ?? "").lowercased() == "true"

            if filesOnly {
                let files = CodeSearchTool.findFiles(rootPath: path, pattern: query)
                if files.isEmpty {
                    return ToolExecutionResult(text: "Nenhum arquivo encontrado com o padrão: '\(query)'")
                }
                let out = "Arquivos encontrados (\(files.count)):\n" + files.map { "  - \($0)" }.joined(separator: "\n")
                return ToolExecutionResult(text: out)
            } else {
                let res = CodeSearchTool.searchContent(rootPath: path, query: query, isRegex: isRegex)
                if let err = res.error {
                    return ToolExecutionResult(text: "Erro na busca: \(err)", isError: true)
                }
                if res.matches.isEmpty {
                    return ToolExecutionResult(text: "Nenhuma ocorrência encontrada para: '\(query)'")
                }
                var out = "Resultados da busca por '\(query)' (\(res.totalMatches) ocorrências):\n"
                for m in res.matches {
                    out += "[\(m.file):\(m.line)] \(m.snippet)\n"
                }
                return ToolExecutionResult(text: out.trimmingCharacters(in: .whitespacesAndNewlines))
            }

        case "git_worktree":
            let action = (argsDict["action"] ?? "list").lowercased()
            switch action {
            case "list":
                let wts = WorktreeManager.listWorktrees()
                if wts.isEmpty {
                    return ToolExecutionResult(text: "Nenhuma worktree adicional configurada.")
                }
                var out = "Worktrees ativas (\(wts.count)):\n"
                for w in wts {
                    out += " - [\(w.branch)] \(w.path) (commit: \(w.commit)\(w.isLocked ? ", locked" : ""))\n"
                }
                return ToolExecutionResult(text: out.trimmingCharacters(in: .whitespacesAndNewlines))
            case "create":
                let task = argsDict["task_name"] ?? "task"
                let res = WorktreeManager.createWorktree(taskName: task)
                if res.success {
                    return ToolExecutionResult(text: "Worktree isolada criada com sucesso!\nCaminho: \(res.worktreePath)\nBranch: \(res.branch)")
                } else {
                    return ToolExecutionResult(text: res.error ?? "Falha ao criar worktree", isError: true)
                }
            case "remove":
                let p = argsDict["worktree_path"] ?? ""
                guard !p.isEmpty else {
                    return ToolExecutionResult(text: "Erro: worktree_path é obrigatório para remoção.", isError: true)
                }
                let res = WorktreeManager.removeWorktree(worktreePath: p)
                return ToolExecutionResult(text: res.message, isError: !res.success)
            default:
                return ToolExecutionResult(text: "Ação de worktree inválida: \(action). Use 'list', 'create' ou 'remove'.", isError: true)
            }

        case "skill_info":
            let name = argsDict["name"] ?? ""
            if let skill = SkillManager.shared.getSkill(named: name) {
                let out = """
                ### Skill: \(skill.name)
                **Descrição:** \(skill.description)
                **Origem:** \(skill.sourcePath)

                \(skill.instructions)
                """
                return ToolExecutionResult(text: out)
            } else {
                return ToolExecutionResult(text: "Skill '\(name)' não encontrada.", isError: true)
            }

        default:
            return ToolExecutionResult(text: "Ferramenta desconhecida: \(name)", isError: true)
        }
    }

    private static func parseArgs(_ raw: String) -> [String: String] {
        guard let data = raw.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return [:]
        }
        var dict: [String: String] = [:]
        for (k, v) in json {
            if let s = v as? String {
                dict[k] = s
            } else if let num = v as? NSNumber {
                dict[k] = num.stringValue
            } else if let b = v as? Bool {
                dict[k] = b ? "true" : "false"
            }
        }
        return dict
    }
}
