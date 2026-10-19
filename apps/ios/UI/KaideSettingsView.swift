import SwiftUI

public struct KaideSettingsView: View {
    @ObservedObject var agent: KaideAgent
    @Environment(\.presentationMode) var presentationMode

    @AppStorage("kaide_always_show_thinking") private var alwaysShowThinking: Bool = false
    @State private var apiKey: String = ""
    @State private var availableModels: [String] = []
    @State private var isLoadingModels: Bool = false
    @State private var statusMessage: String? = nil

    public init(agent: KaideAgent) {
        self.agent = agent
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

                Section(header: Text("Comportamento do Chat").foregroundColor(KaideTheme.accent)) {
                    Toggle("Sempre expandir raciocínio (Thinking)", isOn: $alwaysShowThinking)
                        .font(.system(size: 14))
                }

                Section(header: Text("Sobre o Kaide").foregroundColor(KaideTheme.textMuted)) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Kaide — Agent Coding Nativo")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(KaideTheme.textPrimary)
                        Text("Ambiente: iOS 15+ Rootless / TrollStore / Darwin.")
                            .font(.system(size: 12))
                            .foregroundColor(KaideTheme.textSecondary)
                        Text("Provider: Exclusivo NVIDIA NIM (integrate.api.nvidia.com).")
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
                loadModels(forceRefresh: false)
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
