import SwiftUI

public struct KaideMainView: View {
    @StateObject private var agent = KaideAgent()
    @State private var inputText: String = ""
    @State private var showSettings: Bool = false
    @State private var showTerminal: Bool = false
    @State private var showSessions: Bool = false
    @State private var showChess: Bool = false

    public init() {}

    public var body: some View {
        VStack(spacing: 0) {
            headerBar
            quickActionBar
            Divider().background(KaideTheme.border)
            messageList
            Divider().background(KaideTheme.border)
            bottomBar
        }
        .background(KaideTheme.background.edgesIgnoringSafeArea(.all))
        .onTapGesture {
            dismissKeyboard()
        }
        .sheet(isPresented: $showSettings) {
            KaideSettingsView(agent: agent)
        }
        .sheet(isPresented: $showTerminal) {
            KaideTerminalView()
        }
        .sheet(isPresented: $showSessions) {
            KaideSessionsView(agent: agent)
        }
        .sheet(isPresented: $showChess) {
            KaideChessView()
        }
        .onAppear {
            if agent.history.isEmpty, let latest = SessionPersistence.shared.latestSessionId() {
                agent.resumeSession(id: latest)
            }
        }
    }

    private func dismissKeyboard() {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }

    // MARK: - Header Bar

    private var headerBar: some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text("Kaide")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(KaideTheme.textPrimary)
                    Text("IDE")
                        .font(.system(size: 10, weight: .heavy))
                        .foregroundColor(KaideTheme.background)
                        .padding(.horizontal, 4)
                        .padding(.vertical, 2)
                        .background(KaideTheme.accent)
                        .cornerRadius(4)
                }
                Text("NVIDIA NIM • Darwin Native")
                    .font(.system(size: 11))
                    .foregroundColor(KaideTheme.textMuted)
            }

            Spacer()

            // Status do agente
            if agent.isRunning {
                HStack(spacing: 5) {
                    ProgressView()
                        .scaleEffect(0.7)
                    Text(agent.status.label)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(KaideTheme.accent)
                        .lineLimit(1)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(KaideTheme.surfaceElevated)
                .cornerRadius(12)
            }

            Button(action: { showChess = true }) {
                Image(systemName: "checkerboard.rectangle")
                    .font(.system(size: 15))
                    .foregroundColor(KaideTheme.accent)
                    .padding(8)
                    .background(KaideTheme.surface)
                    .cornerRadius(8)
            }

            Button(action: { showSessions = true }) {
                Image(systemName: "clock.arrow.circlepath")
                    .font(.system(size: 15))
                    .foregroundColor(KaideTheme.textSecondary)
                    .padding(8)
                    .background(KaideTheme.surface)
                    .cornerRadius(8)
            }

            Button(action: { showTerminal = true }) {
                Image(systemName: "terminal")
                    .font(.system(size: 15))
                    .foregroundColor(KaideTheme.textSecondary)
                    .padding(8)
                    .background(KaideTheme.surface)
                    .cornerRadius(8)
            }

            Button(action: { showSettings = true }) {
                Image(systemName: "gearshape")
                    .font(.system(size: 15))
                    .foregroundColor(KaideTheme.textSecondary)
                    .padding(8)
                    .background(KaideTheme.surface)
                    .cornerRadius(8)
            }
        }
        .padding(.horizontal, 14)
        .padding(.top, 8)
        .padding(.bottom, 6)
    }

    // MARK: - Barra de Ações Rápidas (Claude Code CLI Quick Bar)

    private var quickActionBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                quickButton(title: "♟️ Xadrez", icon: "checkerboard.rectangle") {
                    showChess = true
                }
                quickButton(title: "Novo Chat", icon: "plus.bubble") {
                    agent.newSession()
                }
                quickButton(title: "Sessões", icon: "clock.arrow.circlepath") {
                    showSessions = true
                }
                quickButton(title: "Analisar Repo", icon: "folder") {
                    sendAction("Analise este repositório com code_analyze_repo e resuma sua arquitetura e arquivos.")
                }
                quickButton(title: "Git Status", icon: "arrow.triangle.branch") {
                    sendAction("Execute `git status -s` no bash e resuma o estado das alterações.")
                }
                quickButton(title: "Revisar Diff", icon: "doc.text.magnifyingglass") {
                    sendAction("Execute `git diff` e faça uma revisão de código identificando possíveis problemas.")
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 6)
        }
    }

    private func quickButton(title: String, icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 11))
                Text(title)
                    .font(.system(size: 11, weight: .medium))
            }
            .foregroundColor(KaideTheme.textSecondary)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(KaideTheme.surface)
            .cornerRadius(14)
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(KaideTheme.border.opacity(0.8), lineWidth: 1)
            )
        }
        .disabled(agent.isRunning)
    }

    // MARK: - Lista de Mensagens

    private var messageList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                if agent.history.isEmpty {
                    emptyState
                } else {
                    LazyVStack(spacing: 8) {
                        ForEach(agent.history) { turn in
                            KaideMessageRow(turn: turn)
                                .id(turn.id)
                        }
                    }
                    .padding(.vertical, 10)
                }
            }
            .simultaneousGesture(
                DragGesture().onChanged { _ in
                    dismissKeyboard()
                }
            )
            .onChange(of: agent.history.count) { _ in
                if let last = agent.history.last {
                    withAnimation {
                        proxy.scrollTo(last.id, anchor: .bottom)
                    }
                }
            }
        }
    }

    // MARK: - Empty State (Claude Code Style)

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "cpu")
                .font(.system(size: 44))
                .foregroundColor(KaideTheme.accent)

            VStack(spacing: 6) {
                HStack(spacing: 6) {
                    Text("Kaide")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(KaideTheme.textPrimary)
                    Text("AGENT")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(KaideTheme.background)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2)
                        .background(KaideTheme.accent)
                        .cornerRadius(4)
                }

                Text("Assistente autônomo de engenharia de software para iPhone.\nAlimentado exclusivamente pela nuvem NVIDIA NIM.")
                    .font(.system(size: 13))
                    .foregroundColor(KaideTheme.textSecondary)
                    .multilineTextAlignment(.center)
            }

            // Pill do modelo ativo
            HStack(spacing: 6) {
                Circle()
                    .fill(KaideTheme.accent)
                    .frame(width: 6, height: 6)
                Text(agent.selectedModel)
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .foregroundColor(KaideTheme.textMuted)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(KaideTheme.surfaceElevated)
            .cornerRadius(12)

            // Dicas de comandos rápidos
            VStack(alignment: .leading, spacing: 6) {
                Text("Comandos e atalhos:")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(KaideTheme.textMuted)

                HStack(spacing: 8) {
                    Text("`/chess`")
                    Text("`/status`")
                    Text("`/diff`")
                    Text("`/help`")
                }
                .font(.system(size: 11, weight: .semibold, design: .monospaced))
                .foregroundColor(KaideTheme.accent)
            }
            .padding(12)
            .background(KaideTheme.surface)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(KaideTheme.border.opacity(0.6), lineWidth: 1)
            )
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 40)
        .padding(.horizontal, 24)
    }

    // MARK: - Barra Inferior (Claude Code Prompt Input)

    private var bottomBar: some View {
        VStack(spacing: 0) {
            // Banner de execução com botão de parar
            if agent.isRunning {
                HStack(spacing: 8) {
                    ProgressView()
                        .scaleEffect(0.7)
                    Text(agent.status.label)
                        .font(.system(size: 11, weight: .semibold, design: .monospaced))
                        .foregroundColor(KaideTheme.accent)
                        .lineLimit(1)
                    Spacer()
                    Button(action: { agent.stop() }) {
                        Text("Parar")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(KaideTheme.error)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(KaideTheme.error.opacity(0.15))
                            .cornerRadius(6)
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 6)
                .background(KaideTheme.surfaceElevated)
                Divider().background(KaideTheme.border)
            }

            // Input prompt: ❯ [texto] [ação]
            HStack(spacing: 8) {
                HStack(spacing: 6) {
                    Text("❯")
                        .font(.system(size: 16, weight: .black, design: .monospaced))
                        .foregroundColor(KaideTheme.accent)
                        .padding(.leading, 8)

                    TextField("Instrução ou comando (/chess, /help)...", text: $inputText, onCommit: sendCurrent)
                        .font(.system(size: 14))
                        .foregroundColor(KaideTheme.textPrimary)
                        .padding(.vertical, 9)
                }
                .background(KaideTheme.surface)
                .cornerRadius(18)
                .overlay(
                    RoundedRectangle(cornerRadius: 18)
                        .stroke(KaideTheme.border, lineWidth: 1)
                )

                if agent.isRunning {
                    Button(action: { agent.stop() }) {
                        Image(systemName: "stop.circle.fill")
                            .font(.system(size: 28))
                            .foregroundColor(KaideTheme.error)
                    }
                } else {
                    Button(action: sendCurrent) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: 28))
                            .foregroundColor(canSend ? KaideTheme.accent : KaideTheme.textMuted)
                    }
                    .disabled(!canSend)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(KaideTheme.surfaceElevated)
        }
    }

    private var canSend: Bool {
        !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !agent.isRunning
    }

    private func sendCurrent() {
        let trimmed = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        // Suporte nativo a Slash Commands
        if trimmed == "/chess" {
            inputText = ""
            dismissKeyboard()
            showChess = true
            return
        }
        if trimmed == "/clear" || trimmed == "/new" {
            inputText = ""
            dismissKeyboard()
            agent.newSession()
            return
        }
        if trimmed == "/terminal" {
            inputText = ""
            dismissKeyboard()
            showTerminal = true
            return
        }
        if trimmed == "/settings" {
            inputText = ""
            dismissKeyboard()
            showSettings = true
            return
        }
        if trimmed == "/sessions" {
            inputText = ""
            dismissKeyboard()
            showSessions = true
            return
        }
        if trimmed == "/status" {
            inputText = ""
            dismissKeyboard()
            sendAction("Execute `git status -s` no bash e resuma o estado.")
            return
        }
        if trimmed == "/diff" {
            inputText = ""
            dismissKeyboard()
            sendAction("Execute `git diff` no bash e faça uma revisão técnica.")
            return
        }
        if trimmed == "/help" {
            inputText = ""
            dismissKeyboard()
            let helpTurn = KaideTurn(
                role: "assistant",
                content: """
                ### Comandos Rápidos do Kaide (Claude Code Style):
                - `/chess` — Abre o tabuleiro de Xadrez nativo para iOS (portado de `lu4nn3ry/chess`)
                - `/clear` — Limpa o histórico e inicia uma nova sessão
                - `/terminal` — Abre o terminal Darwin nativo
                - `/sessions` — Visualiza e retoma sessões salvas
                - `/settings` — Configurações, modelos NIM dinâmicos e opções
                - `/status` — Executa `git status -s` no repositório
                - `/diff` — Executa `git diff` e analisa as alterações
                """
            )
            agent.history.append(helpTurn)
            return
        }

        guard !agent.isRunning else { return }
        inputText = ""
        dismissKeyboard()
        Task {
            await agent.prompt(trimmed)
        }
    }

    private func sendAction(_ text: String) {
        guard !agent.isRunning else { return }
        dismissKeyboard()
        Task {
            await agent.prompt(text)
        }
    }
}
