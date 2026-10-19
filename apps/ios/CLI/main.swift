import Foundation

@main
struct KaideCLI {
    static func main() async {
        let args = Array(CommandLine.arguments.dropFirst())

        if args.contains("--help") || args.contains("-h") {
            printHelp()
            return
        }

        if let keyIdx = args.firstIndex(of: "--key"), keyIdx + 1 < args.count {
            let key = args[keyIdx + 1]
            NIMClient.shared.saveAPIKey(key)
            print("[+] Chave NVIDIA NIM salva com sucesso.")
            return
        }

        if args.first == "models" {
            await listModels()
            return
        }

        if args.first == "agents" {
            let list = CustomAgentManager.shared.availableAgents
            let active = CustomAgentManager.shared.activeAgent.name
            print("[+] Subagentes disponíveis (\(list.count)):")
            for a in list {
                let m = a.name == active ? " (ativo)" : ""
                print("  - \(a.name)\(m): \(a.description)")
            }
            return
        }

        if args.first == "skills" {
            let skills = SkillManager.shared.availableSkills
            if skills.isEmpty {
                print("[-] Nenhuma skill encontrada em .kaide/skills/ ou .copilot/skills/.")
            } else {
                print("[+] Skills disponíveis (\(skills.count)):")
                for s in skills {
                    print("  - \(s.name): \(s.description) (\(s.sourcePath))")
                }
            }
            return
        }

        if args.first == "search" {
            guard args.count > 1 else {
                print("[-] Uso: kaide search <termo> [caminho]")
                return
            }
            let q = args[1]
            let p = args.count > 2 ? args[2] : "."
            let res = CodeSearchTool.searchContent(rootPath: p, query: q)
            print("[+] Resultados para '\(q)' (\(res.totalMatches) ocorrências):")
            for m in res.matches {
                print("  [\(m.file):\(m.line)] \(m.snippet)")
            }
            return
        }

        if args.first == "worktrees" {
            let wts = WorktreeManager.listWorktrees()
            print("[+] Worktrees ativas (\(wts.count)):")
            for w in wts {
                print("  - [\(w.branch)] \(w.path) (commit: \(w.commit))")
            }
            return
        }

        if args.first == "sessions" {
            listSessions()
            return
        }

        if args.first == "patch" {
            if args.count > 1 {
                let patchFile = args[1]
                applyPatchFile(path: patchFile)
            } else {
                print("[-] Informe o arquivo de patch: kaide patch <arquivo.diff>")
            }
            return
        }

        if args.first == "analyze" {
            let targetPath = args.count > 1 ? args[1] : "."
            let depth = args.count > 2 ? (Int(args[2]) ?? 4) : 4
            let result = RepoAnalysis.analyze(at: targetPath, depth: depth)
            print(result.summaryFormatted)
            return
        }

        if args.first == "diff" {
            let diffText: String
            if args.count > 1 {
                let file = args[1]
                diffText = (try? String(contentsOfFile: file, encoding: .utf8)) ?? ""
            } else {
                let shell = try? await LocalShell.exec(command: "git diff")
                diffText = shell?.stdout ?? ""
            }
            if diffText.isEmpty {
                print("[-] Nenhum diff detectado para revisar.")
            } else {
                let review = CodeReview.reviewDiff(diffText)
                print(review.formattedText)
            }
            return
        }

        var customModel: String? = nil
        var resumeSessionId: String? = nil
        var remainingArgs = args

        if let aIdx = remainingArgs.firstIndex(of: "--agent"), aIdx + 1 < remainingArgs.count {
            let personaName = remainingArgs[aIdx + 1]
            if CustomAgentManager.shared.switchAgent(name: personaName) {
                print("[+] Subagente ativado: \(CustomAgentManager.shared.activeAgent.name)")
            } else {
                print("[-] Subagente '\(personaName)' não encontrado.")
            }
            remainingArgs.remove(at: aIdx + 1)
            remainingArgs.remove(at: aIdx)
        }

        if let mIdx = remainingArgs.firstIndex(of: "--model"), mIdx + 1 < remainingArgs.count {
            customModel = remainingArgs[mIdx + 1]
            remainingArgs.remove(at: mIdx + 1)
            remainingArgs.remove(at: mIdx)
        }

        if let rIdx = remainingArgs.firstIndex(of: "--resume"), rIdx + 1 < remainingArgs.count {
            resumeSessionId = remainingArgs[rIdx + 1]
            remainingArgs.remove(at: rIdx + 1)
            remainingArgs.remove(at: rIdx)
        } else if remainingArgs.first == "resume", remainingArgs.count > 1 {
            resumeSessionId = remainingArgs[1]
            remainingArgs.removeSubrange(0...1)
        } else if remainingArgs.contains("--continue") || remainingArgs.first == "continue" {
            if let cIdx = remainingArgs.firstIndex(of: "--continue") {
                remainingArgs.remove(at: cIdx)
            } else if remainingArgs.first == "continue" {
                remainingArgs.removeFirst()
            }
            resumeSessionId = SessionPersistence.shared.latestSessionId()
            if resumeSessionId == nil {
                print("[*] Nenhuma sessão anterior encontrada para continuar. Iniciando nova sessão.")
            }
        }

        let agent = KaideAgent()
        if let m = customModel {
            agent.selectedModel = m
        }

        if let sid = resumeSessionId {
            await MainActor.run {
                agent.resumeSession(id: sid)
            }
            print("[+] Sessão retomada: \(sid) (\(agent.history.count) mensagens no histórico)")
        }

        if !remainingArgs.isEmpty {
            let promptText = remainingArgs.joined(separator: " ")
            await runOneShot(agent: agent, prompt: promptText)
        } else {
            await runInteractive(agent: agent)
        }
    }

    static func printHelp() {
        print("""
        Kaide — Agent Coding Nativo (NVIDIA NIM)
        Uso:
          kaide "sua instrução"                 Executa uma instrução autônoma (one-shot)
          kaide                                 Inicia sessão interativa (REPL)
          kaide continue                        Continua a sessão mais recente gravada
          kaide resume <id_da_sessao>           Retoma uma sessão específica do disco
          kaide sessions                        Lista histórico de sessões persistidas (.jsonl)
          kaide agents                          Lista subagentes especializados (.copilot/agents)
          kaide skills                          Lista habilidades disponíveis (.copilot/skills)
          kaide search <termo> [path]           Busca no repositório por arquivos ou texto
          kaide worktrees                       Lista branches e worktrees isoladas
          kaide patch <arquivo.diff>            Aplica um patch Git/Codex atômico
          kaide analyze [caminho] [prof]        Inventaria arquivos e módulos
          kaide diff [arquivo_diff]             Revisa alterações e aponta riscos
          kaide models                          Lista modelos disponíveis no NVIDIA NIM
          kaide --agent <nome>                  Define o subagente ativo para a execução
          kaide --key <nvapi-...>               Configura a chave do NVIDIA NIM
          kaide --model <nome_modelo>           Define o modelo ativo para a execução
        """)
    }

    static func listModels() async {
        do {
            print("[*] Consultando catálogo de modelos NVIDIA NIM (Cache 24h)...")
            let models = try await NIMClient.shared.getModels(forceRefresh: true)
            print("[+] Modelos disponíveis (\(models.count)):")
            for m in models {
                print("  - \(m)")
            }
        } catch {
            print("[-] Erro: \(error.localizedDescription)")
        }
    }

    static func listSessions() {
        let list = SessionPersistence.shared.listSessions()
        if list.isEmpty {
            print("[-] Nenhuma sessão salva encontrada.")
            return
        }
        print("[+] Sessões encontradas (\(list.count)):")
        let fmt = DateFormatter()
        fmt.dateStyle = .short
        fmt.timeStyle = .medium
        for s in list {
            let tokensStr = s.totalTokens > 0 ? " | \(s.totalTokens) tokens" : ""
            print("  [\(s.id)] \(fmt.string(from: s.updatedAt))")
            print("    \"\(s.title)\" (\(s.turnCount) turnos\(tokensStr), mod: \(s.model))\n")
        }
    }

    static func applyPatchFile(path: String) {
        guard let content = try? String(contentsOfFile: path, encoding: .utf8) else {
            print("[-] Falha ao ler arquivo de patch em: \(path)")
            return
        }
        do {
            let applier = ApplyPatch()
            let applied = try applier.apply(content, root: ".")
            print("[+] Patch aplicado com sucesso a \(applied.count) arquivo(s):")
            for f in applied {
                print("  - [\(f.kind.rawValue)] \(f.path) (+\(f.linesAdded), -\(f.linesRemoved))")
            }
        } catch {
            print("[-] Erro ao aplicar patch: \(error.localizedDescription)")
        }
    }

    static func runOneShot(agent: KaideAgent, prompt: String) async {
        print("[Kaide] Modelo: \(agent.selectedModel)")
        print("[Kaide] Processando: \"\(prompt)\"")
        await agent.prompt(prompt)

        for turn in agent.history where turn.role != "user" {
            if turn.role == "tool" {
                print("\n[Tool: \(turn.toolName ?? "")]\n\(turn.content)")
            } else if turn.role == "assistant" {
                if let reasoning = turn.reasoning {
                    print("\n[Raciocínio NIM]:\n\(reasoning)")
                }
                if !turn.content.isEmpty {
                    print("\n[Kaide]:\n\(turn.content)")
                }
                if let metrics = turn.metrics {
                    print("\n[\(metrics.formattedSummary)]")
                }
            }
        }
    }

    static func runInteractive(agent: KaideAgent) async {
        print("=== Kaide Agent Coding Terminal (NVIDIA NIM) ===")
        print("Modelo ativo: \(agent.selectedModel)")
        if let sid = agent.currentSessionId {
            print("Sessão ativa: \(sid)")
        }
        print("Comandos rápidos: 'sair', 'nova', 'metricas', 'status'.\n")

        while true {
            print("kaide> ", terminator: "")
            fflush(stdout)

            guard let line = readLine()?.trimmingCharacters(in: .whitespacesAndNewlines), !line.isEmpty else {
                continue
            }

            if line.lowercased() == "sair" || line.lowercased() == "exit" || line.lowercased() == "quit" {
                print("Até logo!")
                break
            }

            if line.lowercased() == "nova" || line.lowercased() == "new" {
                await MainActor.run {
                    agent.newSession()
                }
                print("[+] Nova sessão iniciada.")
                continue
            }

            let prevCount = agent.history.count
            await agent.prompt(line)

            for i in prevCount..<agent.history.count {
                let turn = agent.history[i]
                if turn.role == "tool" {
                    print("\n[⚙ \(turn.toolName ?? "tool")] \(turn.content)")
                } else if turn.role == "assistant" {
                    if let reasoning = turn.reasoning {
                        print("\n[🧠 Raciocínio]:\n\(reasoning)")
                    }
                    if !turn.content.isEmpty {
                        print("\n\(turn.content)")
                    }
                    if let metrics = turn.metrics {
                        print("[\(metrics.formattedSummary)]\n")
                    }
                }
            }
        }
    }
}
