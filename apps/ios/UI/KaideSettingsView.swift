import SwiftUI

public struct KaideSettingsView: View {
    @ObservedObject var agent: KaideAgent
    @Environment(\.presentationMode) var presentationMode

    @AppStorage("kaide_always_show_thinking") private var alwaysShowThinking: Bool = false
    @State private var apiKey: String = ""
    @State private var availableModels: [String] = []
    @State private var isLoadingModels: Bool = false
    @State private var statusMessage: String? = nil

    // Tokens de forge (Keychain)
    @State private var githubToken: String = ""
    @State private var gitlabToken: String = ""
    @State private var githubStatus: ForgeStatus? = nil
    @State private var gitlabStatus: ForgeStatus? = nil
    @State private var isVerifyingGithub: Bool = false
    @State private var isVerifyingGitlab: Bool = false

    public init(agent: KaideAgent) {
        self.agent = agent
    }

    private struct ForgeStatus {
        let text: String
        let ok: Bool
    }

    public var body: some View {
        NavigationView {
            Form {
                Section(header: Text("NVIDIA NIM Autenticação").foregroundColor(KaideTheme.accent)) {
                    SecureField("Chave de API (nvapi-...)", text: $apiKey)
                        .font(.system(size: 14, design: .monospaced))
                    Button(action: saveKey) {
                        Text("Salvar Chave")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(KaideTheme.accent)
                    }
                }

                Section(header: Text("Modelo Ativo (NVIDIA NIM)").foregroundColor(KaideTheme.accent)) {
                    if availableModels.isEmpty && !isLoadingModels {
                        Text("Nenhum modelo carregado. Toque em 'Carregar Modelos da NVIDIA'.")
                            .font(.system(size: 12))
                            .foregroundColor(KaideTheme.textMuted)
                    } else {
                        Picker("Modelo", selection: $agent.selectedModel) {
                            ForEach(modelsList, id: \.self) { model in
                                Text(model).tag(model)
                            }
                        }
                    }

                    Button(action: { loadModels(forceRefresh: true) }) {
                        HStack {
                            Text(isLoadingModels ? "Consultando catálogo..." : "Atualizar Catálogo (Cache 24h)")
                            if isLoadingModels {
                                Spacer()
                                ProgressView()
                            }
                        }
                    }
                    .disabled(isLoadingModels)
                }

                forgeSection(
                    provider: .github,
                    token: $githubToken,
                    status: githubStatus,
                    isVerifying: isVerifyingGithub
                )

                forgeSection(
                    provider: .gitlab,
                    token: $gitlabToken,
                    status: gitlabStatus,
                    isVerifying: isVerifyingGitlab
                )

                Section(header: Text("Comportamento do Chat").foregroundColor(KaideTheme.accent)) {
                    Toggle("Sempre expandir raciocínio (Thinking)", isOn: $alwaysShowThinking)
                        .font(.system(size: 14))
                }

                Section(header: Text("Sobre o Kaide").foregroundColor(KaideTheme.textMuted)) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Kaide — Agent Coding Nativo")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(KaideTheme.textPrimary)
                        Text("Ambiente: iOS 15+ (sandbox do app).")
                            .font(.system(size: 12))
                            .foregroundColor(KaideTheme.textSecondary)
                        Text("Provider: Exclusivo NVIDIA NIM (integrate.api.nvidia.com).")
                            .font(.system(size: 12))
                            .foregroundColor(KaideTheme.textSecondary)
                        Text("Forge: GitHub e GitLab via token pessoal (HTTPS, sem shell).")
                            .font(.system(size: 12))
                            .foregroundColor(KaideTheme.textSecondary)
                    }
                    .padding(.vertical, 4)
                }

                if let msg = statusMessage {
                    Section {
                        Text(msg)
                            .font(.system(size: 12))
                            .foregroundColor(KaideTheme.warning)
                    }
                }
            }
            .navigationTitle("Configurações Kaide")
            .navigationBarItems(trailing: Button("Fechar") {
                presentationMode.wrappedValue.dismiss()
            })
            .onAppear {
                apiKey = NIMClient.shared.getAPIKey() ?? ""
                githubToken = ForgeTokenStore.token(for: .github) ?? ""
                gitlabToken = ForgeTokenStore.token(for: .gitlab) ?? ""
                loadModels(forceRefresh: false)
            }
        }
    }

    // MARK: - Seção de Forge

    @ViewBuilder
    private func forgeSection(
        provider: ForgeProvider,
        token: Binding<String>,
        status: ForgeStatus?,
        isVerifying: Bool
    ) -> some View {
        Section(header: Text("\(provider.title) (token pessoal)").foregroundColor(KaideTheme.accent)) {
            SecureField(provider.tokenHint, text: token)
                .font(.system(size: 13, design: .monospaced))
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled(true)

            HStack {
                Button("Salvar") {
                    saveForge(provider, token: token.wrappedValue)
                }
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(KaideTheme.accent)

                Spacer()

                Button(isVerifying ? "Testando..." : "Testar Conexão") {
                    verifyForge(provider, token: token.wrappedValue)
                }
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(KaideTheme.accent)
                .disabled(isVerifying)
            }

            if let status = status {
                Text(status.text)
                    .font(.system(size: 12))
                    .foregroundColor(status.ok ? KaideTheme.accent : KaideTheme.warning)
            }
        }
    }

    private var modelsList: [String] {
        var list = availableModels
        if !list.contains(agent.selectedModel) && !agent.selectedModel.isEmpty {
            list.insert(agent.selectedModel, at: 0)
        }
        return list
    }

    private func saveKey() {
        NIMClient.shared.saveAPIKey(apiKey)
        statusMessage = "Chave salva com sucesso."
    }

    private func saveForge(_ provider: ForgeProvider, token: String) {
        do {
            try ForgeTokenStore.save(token, for: provider)
            let trimmed = token.trimmingCharacters(in: .whitespacesAndNewlines)
            setForgeStatus(
                provider,
                ForgeStatus(text: trimmed.isEmpty ? "Token removido." : "Token salvo no Keychain.", ok: true)
            )
        } catch {
            setForgeStatus(provider, ForgeStatus(text: error.localizedDescription, ok: false))
        }
    }

    private func verifyForge(_ provider: ForgeProvider, token: String) {
        let trimmed = token.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            setForgeStatus(provider, ForgeStatus(text: "Informe um token antes de testar.", ok: false))
            return
        }

        setVerifying(provider, true)
        Task {
            do {
                let account = try await ForgeClient.verify(provider: provider, token: trimmed)
                try? ForgeTokenStore.save(trimmed, for: provider)
                await MainActor.run {
                    setVerifying(provider, false)
                    var text = "Conectado como @\(account.login)"
                    if let name = account.name, !name.isEmpty {
                        text += " (\(name))"
                    }
                    setForgeStatus(provider, ForgeStatus(text: text, ok: true))
                }
            } catch {
                await MainActor.run {
                    setVerifying(provider, false)
                    setForgeStatus(provider, ForgeStatus(text: error.localizedDescription, ok: false))
                }
            }
        }
    }

    private func setForgeStatus(_ provider: ForgeProvider, _ status: ForgeStatus) {
        switch provider {
        case .github: githubStatus = status
        case .gitlab: gitlabStatus = status
        }
    }

    private func setVerifying(_ provider: ForgeProvider, _ value: Bool) {
        switch provider {
        case .github: isVerifyingGithub = value
        case .gitlab: isVerifyingGitlab = value
        }
    }

    private func loadModels(forceRefresh: Bool) {
        isLoadingModels = true
        statusMessage = nil
        Task {
            do {
                let models = try await NIMClient.shared.getModels(forceRefresh: forceRefresh)
                await MainActor.run {
                    self.availableModels = models
                    self.isLoadingModels = false
                    if !models.contains(agent.selectedModel), let first = models.first {
                        agent.selectedModel = first
                    }
                    self.statusMessage = forceRefresh ? "Catálogo atualizado (\(models.count) modelos)." : nil
                }
            } catch {
                await MainActor.run {
                    self.isLoadingModels = false
                    self.statusMessage = "Falha ao consultar modelos: \(error.localizedDescription)"
                }
            }
        }
    }
}
