import SwiftUI

public struct KaideSessionsView: View {
    @ObservedObject var agent: KaideAgent
    @Environment(\.presentationMode) var presentationMode
    @State private var sessions: [SessionMeta] = []

    public init(agent: KaideAgent) {
        self.agent = agent
    }

    public var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                if sessions.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "clock.arrow.circlepath")
                            .font(.system(size: 36))
                            .foregroundColor(KaideTheme.textMuted)
                        Text("Nenhuma sessão gravada")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(KaideTheme.textSecondary)
                        Text("Suas conversas do Kaide são gravadas automaticamente em formato JSONL (Rollout) persistente.")
                            .font(.system(size: 12))
                            .foregroundColor(KaideTheme.textMuted)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 30)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List {
                        ForEach(sessions) { s in
                            Button(action: {
                                agent.resumeSession(id: s.id)
                                presentationMode.wrappedValue.dismiss()
                            }) {
                                sessionRow(s)
                            }
                            .listRowBackground(KaideTheme.surface)
                        }
                        .onDelete(perform: deleteSessions)
                    }
                    .listStyle(PlainListStyle())
                }
            }
            .background(KaideTheme.background.edgesIgnoringSafeArea(.all))
            .navigationBarTitle("Histórico de Sessões", displayMode: .inline)
            .navigationBarItems(
                leading: Button(action: {
                    agent.newSession()
                    presentationMode.wrappedValue.dismiss()
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: "plus")
                        Text("Novo")
                    }
                    .foregroundColor(KaideTheme.accent)
                },
                trailing: Button("Fechar") {
                    presentationMode.wrappedValue.dismiss()
                }
                .foregroundColor(KaideTheme.accent)
            )
            .onAppear(perform: loadSessions)
        }
    }

    private func sessionRow(_ s: SessionMeta) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(s.title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(s.id == agent.currentSessionId ? KaideTheme.accent : KaideTheme.textPrimary)
                    .lineLimit(1)
                Spacer()
                if s.id == agent.currentSessionId {
                    Text("ATIVA")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(KaideTheme.background)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2)
                        .background(KaideTheme.accent)
                        .cornerRadius(4)
                }
            }

            HStack(spacing: 8) {
                Text(formatDate(s.updatedAt))
                    .font(.system(size: 11))
                    .foregroundColor(KaideTheme.textMuted)
                Text("•")
                    .foregroundColor(KaideTheme.border)
                Text("\(s.turnCount) turno(s)")
                    .font(.system(size: 11))
                    .foregroundColor(KaideTheme.textMuted)
                if s.totalTokens > 0 {
                    Text("•")
                        .foregroundColor(KaideTheme.border)
                    Text("\(s.totalTokens) tokens")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(KaideTheme.textMuted)
                }
            }
        }
        .padding(.vertical, 4)
    }

    private func loadSessions() {
        sessions = SessionPersistence.shared.listSessions()
    }

    private func deleteSessions(at offsets: IndexSet) {
        for index in offsets {
            let session = sessions[index]
            SessionPersistence.shared.deleteSession(sessionId: session.id)
            if agent.currentSessionId == session.id {
                agent.newSession()
            }
        }
        sessions.remove(atOffsets: offsets)
    }

    private func formatDate(_ date: Date) -> String {
        let fmt = DateFormatter()
        fmt.dateStyle = .short
        fmt.timeStyle = .short
        return fmt.string(from: date)
    }
}
