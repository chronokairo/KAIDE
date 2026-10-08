# ADR 0027 — TUI "VS Code + Copilot" Side-by-Side Split View, Async Startup & Ollama Resilience

- **Status:** Accepted (2026-09-26)
- **Depende:** ADR 0026 (TUI Edit UX), `microsoft/edit` (`crates/edit/src/buffer/`, `draw_editor.rs`, `fuzzy.rs`), `ckc` (`src/ui/*`, `src/llm/router.rs`)
- **Escopo:** `src/ui/mod.rs`, `src/ui/file_search.rs`, `src/main.rs`, `src/providers/catalog.rs`

## Context

O ChronoKairo CLI (`ckc`) possuía dois comportamentos que limitavam a experiência de desenvolvimento no terminal:
1. **Comportamento Binário do Editor vs Chat:** Quando um arquivo era aberto no editor embutido (`app.editor_file`), o editor tomava 100% da viewport, ocultando completamente o transcript e o chat do agente de IA. O desenvolvedor precisava fechar o editor para conversar com o agente e reabri-lo depois, quebrando o fluxo de trabalho integrado estilo "VS Code + GitHub Copilot".
2. **Gargalo Bloqueante na Inicialização:** Ao iniciar a TUI (`ckc tui`) a partir de workspaces densos (como o home directory `~` contendo `.cache`, `.local`, `.vscode-server` ou drives montados `/mnt/c`), o coletor recursivo `file_search::walk_files` bloqueava a thread principal de interface por dezenas de segundos logo após o `EnterAlternateScreen`, dando a impressão visual de travamento ("tela preta").
3. **Fragilidade de Resolução de Modelo Local:** O comando `build_router` forçava a busca estrita de arquivos GGUF em disco. Caso o modelo estivesse servido via daemon local do Ollama (como `qwen3.5:2b` ou `qwen2.5-coder:3b`), o CLI abortava com `Model not found` em vez de rotear para `LlmClient::Ollama`.

## Decision

### 1. Layout Completo de IDE em 3 Zonas (VS Code + microsoft/edit Inspired)
Ao iniciar a TUI (`ckc`), o terminal exibe imediatamente a arquitetura completa de uma IDE moderna:
- **Top AppBar / MenuBar (Linha 0):** `File Edit View Terminal Help` com badges de status em tempo real: `🤖 ChronoKairo`, modelo ativo (`Model: qwen3.5:2b`), branch git atual (`⎇ main`) e diretório do workspace.
- **Sidebar Esquerda (Explorer, 24% da viewport):** Exibe a árvore e lista de arquivos do workspace (`app.sidebar_items`) com cursor de seleção visual (`› `), ícones de diretório/arquivo (`📁 `/`📄 `) e navegação via setas. Pressionar `Enter` em um arquivo abre-o diretamente no editor de código integrado.
- **Painel Direito Principal (76% da viewport):**
  - **Modo Padrão:** Copilot Agent Chat completo com histórico de mensagens, raciocínio interno (`thinking`), chamadas de ferramentas e diffs.
  - **Modo Split (Arquivo Aberto):** Divide-se horizontalmente em Editor de Código (55%) com sintaxe colorida e Copilot Agent Chat (45%).
- **Prompt Composer Well & Status Footer:** Campo de entrada com prompt `› ` e barra de atalhos e status contextual na base da tela.

### 2. Alternância Fluida de Foco e Comandos Rápidos
- **`Ctrl+E` / `Ctrl+B`:** Alterna ciclicamente o foco entre `Focus::Input` (Copilot Prompt), `Focus::Sidebar` (Navegação de Arquivos) e `Focus::Editor` (Edição de Código). As bordas da janela ativa destacam-se em `Color::Cyan`.
- **Navegação na Sidebar:** Teclas `Up` e `Down` movem a seleção na lista de arquivos. `Enter` carrega o arquivo no editor de código com realce de sintaxe. Digitação casual na sidebar chaveia automaticamente o foco de volta para o composer prompt.
- **`Ctrl+W` / `Esc`:** Fecha o arquivo em edição e restaura o layout em tela cheia para o Copilot.
- **`Ctrl+S`:** Salva o buffer diretamente no disco usando a política de escrita do workspace.
- **Slash Commands `/open <path>` e `/edit <path>`:** Permite abrir arquivos instantaneamente para edição lado a lado diretamente a partir do composer do chat.

### 3. Modo Raw POSIX (`termios`) e Resolução Dinâmica de Dimensões
- **Modo Raw Real (`sys.rs`):** Implementação via syscalls `libc::tcgetattr` e `libc::tcsetattr`, desativando `ICANON` (buffer de linha do kernel) e `ECHO` (eco local do driver tty). Cada tecla pressionada é entregue instantaneamente à aplicação sem artefatos de "caractere único" ou glitch ao apagar com backspace.
- **Dimensões Reais da Viewport:** Emissão de `libc::ioctl(1, libc::TIOCGWINSZ, ...)` no Unix/Linux, eliminando o fallback hardcoded de `(120, 30)` e garantindo que o framebuffer reflita a resolução real do terminal do usuário no WSL2 e Linux.
- **Decodificador de Sequências ANSI & UTF-8 (`event.rs`):** Parser de sequências CSI/SS3 para setas (Up/Down/Left/Right), Home, End, PageUp, PageDown, Delete, Shift+Tab e teclas de função F1-F4, além de recomposição de sequências UTF-8 multibyte.

### 4. Inicialização Assíncrona e Filtro de Diretórios Ocultos
- `file_search::walk_files`:
  - Diretórios ocultos (`name.starts_with('.')`) agora são sumariamente ignorados durante a travessia, evitando entrar em `.cache`, `.local`, `.vscode-server`, `.rustup` e similares.
  - Limite preventivo de 5.000 entradas para indexação de busca rápida.
  - O mapeamento inicial de caminhos para o Quick Open (`Ctrl+P`) foi transferido para uma `thread::spawn` em background, garantindo que o primeiro frame da TUI renderize em < 10ms.

### 5. Roteamento Resiliente com Fallback para Ollama
- Comandos diagnósticos (`check`, `cloud`, `providers`, `models`, `ps`) foram reordenados para executar antes da inicialização do roteador de inferência.
- O `build_router` agora consulta os modelos servidos localmente pelo daemon do Ollama (`providers::catalog::fetch_ollama_models`) e, na ausência de arquivo GGUF manual no disco, faz fallback transparente para `LlmClient::ollama(&cfg.ollama_host)`.

### 6. Refatoração Modular sem Código Duplicado (Inspirado em `microsoft/edit`)
- **Deduplicação de Renderização:** O pipeline de desenho da interface em `src/ui/mod.rs` foi refatorado e decomposto em funções especializadas de renderização pura:
  - `render_appbar(f, app, area)`: MenuBar superior com menus (`[File] [Edit] [AI Agent] [Help]`) e telemetria à direita (`Branch: <branch> | GPU: <gpu>`), com detecção automática de GPU de hardware.
  - `render_statusbar(f, app, area)`: Barra de status estilo VS Code / `microsoft/edit` (`Ln <row>, Col <col> | UTF-8 | <Language> | Model: <model> (Local/Cloud) | Context: <used>k/<max>k`), adaptável dinamicamente à largura do terminal.
  - `render_sidebar(f, app, area)`: Explorer de arquivos do workspace.
  - `render_editor(f, app, area, file)`: Editor de código integrado com números de linha, realce de sintaxe multilinguagem (`syntax.rs`), e sugestão inline de IA (Ghost Text).
  - `render_chat_panel(f, app, area, is_focused)`: Painel do Copilot Agent Chat completamente unificado entre o modo single-panel e o modo split-screen, exibindo telemetria de taxa de geração (`tok/s`).

### 7. Ghost Text & Inline AI Suggestions (Aceitação via Tab)
- **Renderização Inline:** Sugestões inline do agente Copilot são renderizadas como ghost text estilizado (`·[GHOST]`) diretamente no cursor do editor ativo.
- **Contratos de Teclado:**
  - Pressionar `Tab` quando há ghost text ativo insere a sugestão diretamente no cursor do buffer, avança o cursor, marca o buffer como modificado (`dirty`) e limpa a sugestão.
  - Pressionar `Esc` descarta a sugestão de ghost text sem fechar o arquivo em edição.

### 8. Suporte Completo a Mouse e Correção do Vazamento de Sequências CSI (Inspirado em `microsoft/edit`)
- **Protocolo de Mouse SGR 1006 e X10:** Adicionado decodificador de eventos de mouse SGR (`\x1b[<btn;col;rowM`/`m`) e X10 (`\x1b[M Cb Cx Cy`) em `event.rs`, suportando cliques (Down, Up), arrasto (Drag), movimento e rolagem via scroll wheel (ScrollUp, ScrollDown).
- **Prevenção de Vazamento de Caracteres no Composer:** Sequências de controle CSI incompletas agora aguardam os bytes restantes da tty antes de emitir eventos. Sequências CSI completas não mapeadas são drenadas integralmente (`self.pending.drain(..len)`). Isso elimina definitivamente o bug onde mexer no mouse imprimia números, ponto-e-vírgula e colchetes (`<0;35;12M`) no campo de entrada do chat.
- **Roteamento Espacial de Clique e Rolagem:**
  - **AppBar (Linha 0):** Cliques em `[File]`, `[Edit]`, `[AI Agent]` e `[Help]` acionam os respectivos menus e overlays.
  - **Sidebar (Explorer):** Clique com botão esquerdo em um arquivo o seleciona e abre diretamente no editor embutido; scroll wheel rola a lista de arquivos.
  - **Editor de Código:** Clique posiciona o cursor na linha e coluna exatas do clique e foca o editor; scroll wheel rola o buffer verticalmente.
  - **Chat Panel:** Clique foca as mensagens e expande/recolhe blocos de ferramentas/raciocínio; scroll wheel navega pelo histórico da conversa.
  - **Composer Prompt:** Clique foca o input e posiciona o cursor no caractere exato da digitação.

## Consequences

- **Positivas:**
  - Interação por mouse 100% funcional e fluida estilo `microsoft/edit` e VS Code: clique para abrir arquivos na sidebar, clique para posicionar o cursor no código, clique para navegar no chat e rolar com o scroll wheel.
  - Eliminação completa de números, códigos de escape e caracteres de controle vazando no campo de digitação ao mover ou clicar com o mouse.
  - Layout completo de IDE imediato ao digitar `ckc`: AppBar no topo, Sidebar de arquivos à esquerda e Copilot Chat à direita.
  - Barra de status enriquecida com linguagem ativa, codificação UTF-8, modelo local/nuvem e janela de contexto (`Context: 1.2k/4.0k`).
  - Código de renderização 100% deduplicado e modularizado.
  - Suporte a sugestões inline de IA (Ghost Text) com aceitação por `Tab` e descarte por `Esc`.
  - Correção definitiva do bug de digitação e backspace: entrada fluida, sem eco duplicado e sem perda de caracteres.
  - Suporte completo a navegação por teclado e atalhos VS Code (`Ctrl+E`, `Ctrl+B`, `Ctrl+W`, `Ctrl+P`).
  - Inicialização instantânea da TUI em qualquer diretório, sem travamento de tela preta.
  - 510 testes passando com zero regressões.
