import SwiftUI

public struct KaideTerminalView: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var command: String = ""
    @State private var outputHistory: [String] = []
    @State private var isRunning: Bool = false

    public init() {}

    public var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(Array(outputHistory.enumerated()), id: \.offset) { _, line in
                            Text(line)
                                .font(.system(size: 12, design: .monospaced))
                                .foregroundColor(line.hasPrefix("$") ? KaideTheme.accent : KaideTheme.textSecondary)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                    .padding(12)
                }
                .background(Color.black)

                Divider()

                HStack(spacing: 8) {
                    Text("$")
                        .font(.system(size: 14, weight: .bold, design: .monospaced))
                        .foregroundColor(KaideTheme.accent)

                    TextField("Comando shell...", text: $command, onCommit: executeCommand)
                        .font(.system(size: 14, design: .monospaced))
                        .foregroundColor(KaideTheme.textPrimary)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)

                    if isRunning {
                        ProgressView()
                    } else {
                        Button(action: executeCommand) {
                            Image(systemName: "arrow.up.circle.fill")
                                .font(.system(size: 24))
                                .foregroundColor(KaideTheme.accent)
                        }
                    }
                }
                .padding(10)
                .background(KaideTheme.surface)
            }
            .navigationTitle("Terminal Darwin")
            .navigationBarItems(
                leading: Button("Limpar") { outputHistory.removeAll() },
                trailing: Button("Fechar") { presentationMode.wrappedValue.dismiss() }
            )
            .onAppear {
                if outputHistory.isEmpty {
                    outputHistory.append("Kaide Shell Darwin v1.0 — Rootless iOS Terminal")
                    outputHistory.append("Digite comandos como `uname -a`, `git status`, `ls -la`")
                }
            }
        }
    }

    private func executeCommand() {
        let cmd = command.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cmd.isEmpty, !isRunning else { return }

        outputHistory.append("$ \(cmd)")
        command = ""
        isRunning = true

        Task {
            do {
                let res = try await LocalShell.exec(command: cmd)
                await MainActor.run {
                    if !res.stdout.isEmpty {
                        outputHistory.append(res.stdout)
                    }
                    if !res.stderr.isEmpty {
                        outputHistory.append("[STDERR] \(res.stderr)")
                    }
                    outputHistory.append("[Processo finalizou com código \(res.exitStatus)]")
                    isRunning = false
                }
            } catch {
                await MainActor.run {
                    outputHistory.append("[ERRO] \(error.localizedDescription)")
                    isRunning = false
                }
            }
        }
    }
}
