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
          kaide patch <arquivo.diff>            Aplica um patch Git/Codex atômico
          kaide analyze [caminho] [prof]        Inventaria arquivos e módulos
          kaide diff [arquivo_diff]             Revisa alterações e aponta riscos
          kaide models                          Lista modelos disponíveis no NVIDIA NIM
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
