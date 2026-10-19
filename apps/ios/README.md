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

2. **Estética Claude Code Desktop / CLI:**
   - Prompt do usuário no formato terminal `❯ comando`.
   - Cards de execução de ferramentas em árvore (`┌─ │ └─`) com visualização de argumentos e status de conclusão.
   - Renderização rica de Markdown: tabelas com scroll horizontal e zebra striping, GitHub callouts (`[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`), checklists (`- [ ]`, `- [x]`), blocos matemáticos (`$$ ... $$`) e realce de sintaxe diff.
   - Rodapé com métricas de inferência minimalistas (`modelo · latência · tokens · custo`).
   - Esconder teclado interativo ao tocar ou arrastar a lista de mensagens.

3. **Execução Dual:**
   - **App SwiftUI (`Kaide.app`):** Interface IDE móvel completa com chat inteligente, terminal Darwin integrado, visualização de raciocínio e histórico de sessões persistidas.
   - **CLI Darwin (`kaide`):** Binário de linha de comando autônomo para NewTerm / SSH, com suporte a comandos one-shot (`kaide "instrução"`), modo interativo REPL, inspeção de repositório (`kaide analyze`), revisão de diff (`kaide diff`), aplicação atômica de patches (`kaide patch`) e catálogo de modelos (`kaide models`).

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
│   └── AgentsMdManager.swift
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
