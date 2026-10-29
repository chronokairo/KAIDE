# Kaide iOS & Darwin CLI (`apps/ios`)

Suíte de Agent Coding autônomo nativo em **Swift 5 / SwiftUI** para iPhone (iOS 15+, SoC A10 Fusion ou superior), ambiente rootless (Dopamine / TrollStore) e terminal Darwin.

---

## Recursos & Arquitetura

1. **Exclusividade NVIDIA NIM:**
   - Suporte exclusivo à infraestrutura de inferência NVIDIA NIM (`https://integrate.api.nvidia.com/v1`).
   - Modelo padrão configurado: **`z-ai/glm-5.3`**.
   - Catálogo de modelos 100% dinâmico com cache local de 24 horas (`NIMClient.swift`).
   - Resiliência com backoff progressivo incremental (`+1s` a cada HTTP 429).
   - Extração de raciocínio profundo (`<think>`, `reasoning_content`) e tokens de raciocínio.

2. **Estética Claude Code Desktop / CLI & Paridade GitHub Copilot:**
   - Prompt do usuário no formato terminal `❯ comando`.
   - Cards de execução de ferramentas em árvore (`┌─ │ └─`) com visualização de argumentos e status de conclusão.
   - Renderização rica de Markdown: tabelas com scroll horizontal e zebra striping, GitHub callouts (`[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`), checklists (`- [ ]`, `- [x]`), blocos matemáticos (`$$ ... $$`) e realce de sintaxe diff.
   - Rodapé com métricas de inferência minimalistas (`modelo · latência · tokens · custo`).
   - Suporte completo a **Subagentes Customizados** (`.copilot/agents` / `.agent.md`) e **Skills Especializadas** (`.copilot/skills` / `SKILL.md`).
   - Compactação e sintetização de histórico (`/compact`), busca de símbolos (`/search` / `code_search`) e branches isoladas (`/worktrees`).
   - Esconder teclado interativo ao tocar ou arrastar a lista de mensagens.

3. **Execução Dual:**
   - **App SwiftUI (`Kaide.app`):** Interface IDE móvel completa com chat inteligente, terminal Darwin integrado, visualização de raciocínio, seletor de subagentes e histórico de sessões persistidas.
   - **CLI Darwin (`kaide`):** Binário de linha de comando autônomo para NewTerm / SSH, com suporte a comandos one-shot (`kaide "instrução"`), modo interativo REPL, subagentes (`kaide agents`, `kaide --agent <nome>`), skills (`kaide skills`), busca (`kaide search`), inspeção de repositório (`kaide analyze`), revisão de diff (`kaide diff`), aplicação de patches (`kaide patch`) e catálogo de modelos (`kaide models`).

---

## Estrutura de Arquivos

```text
apps/ios/
├── App/                 # Bundle SwiftUI, Info.plist, entitlements e ícones
│   ├── KaideApp.swift
│   ├── Info.plist
│   ├── entitlements.plist
│   └── AppIcon*.png
├── CLI/                 # Ponto de entrada do executável Darwin
│   └── main.swift
├── Core/                # Motor do agente, ferramentas Darwin e persistência
│   ├── KaideAgent.swift
│   ├── NIMClient.swift
│   ├── KaideTools.swift
│   ├── KaideFileOps.swift
│   ├── LocalShell.swift
│   ├── ApplyPatch.swift
│   ├── CodeReview.swift
│   ├── CodeDebugger.swift
│   ├── RepoAnalysis.swift
│   ├── CommandSafety.swift
│   ├── SessionPersistence.swift
│   ├── TurnMetrics.swift
│   ├── TurnDiffTracker.swift
│   ├── AgentsMdManager.swift
│   ├── CustomAgentManager.swift
│   ├── SkillManager.swift
│   ├── CodeSearchTool.swift
│   ├── WorktreeManager.swift
│   └── ContextCompactor.swift
├── UI/                  # Telas e componentes SwiftUI
│   ├── KaideMainView.swift
│   ├── KaideMessageRow.swift
│   ├── KaideSettingsView.swift
│   ├── KaideTerminalView.swift
│   ├── KaideSessionsView.swift
│   └── KaideTheme.swift
├── Package.swift        # Manifesto Swift Package Manager
├── build_kaide.py       # Orquestrador de compilação, assinatura e empacotamento
└── .env.example         # Template de configuração de variáveis de ambiente
```

---

### Projetos (pasta raiz do agente)

Cada projeto é uma pasta raiz; as tools de arquivo (`read_file`, `write_file`, `edit_file`, `list_dir`, `apply_patch`, `code_search`, `code_analyze_repo`) só operam dentro dela.

- **Novo projeto (pasta do app):** `Documents/Kaide/projects/<slug>`.
- **Adicionar pasta do Arquivos:** `UIDocumentPicker` + security-scoped bookmark (persistido em `Application Support/Kaide/projects.json`).
- **Sem projeto ativo:** a raiz é `Documents` do container.
- Caminhos fora da raiz são recusados (`Workspace.contains` com `realpath`, bloqueando `..` e symlink para fora).
- `bash` roda com `cwd` na raiz do projeto (quando o ambiente permite spawn).

O `Documents` do app fica visível no app Arquivos (`UIFileSharingEnabled` + `LSSupportsOpeningDocumentsInPlace`).

## Como Compilar e Instalar

No iPhone com toolchain Procursus (ou via SSH / NewTerm):

```bash
# Compilar e instalar tanto o CLI (/var/jb/usr/bin/kaide) quanto o App (TrollStore):
python3 apps/ios/build_kaide.py --cli --app --install

# Apenas o CLI:
python3 apps/ios/build_kaide.py --cli --install

# Apenas o App (.ipa):
python3 apps/ios/build_kaide.py --app --install
```

### Build no WSL (xtool) — três artefatos

```bash
wsl bash -lc "cd /mnt/c/Users/luann/Documents/GitHub/KAIDE/apps/ios && bash build_wsl_xtool.sh release"
```

| Artefato | Assinatura | Instalação | Shell/git |
| --- | --- | --- | --- |
| `Kaide-<v>.ipa` | ad-hoc, **sem entitlements** | sideload (AltStore/SideStore/Sideloadly) | indisponível (sandbox) |
| `Kaide-<v>.tipa` | ad-hoc + `App/entitlements.plist` | TrollStore | disponível |
| `Kaide-<v>.deb` | ad-hoc + `App/entitlements.plist` | Dopamine/Sileo → `/var/jb/Applications/Kaide.app` | disponível |

Instalação manual no Dopamine (Filza/NewTerm):

```bash
cp -R Kaide.app /var/jb/Applications/
uicache -p /var/jb/Applications/Kaide.app
```
