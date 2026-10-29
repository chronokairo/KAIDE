import SwiftUI
import UniformTypeIdentifiers

/// Tela de Projetos: pasta raiz do agente (interna ou escolhida no app Arquivos).
public struct KaideProjectsView: View {
    @Environment(\.presentationMode) private var presentationMode

    @State private var projects: [KaideProject] = ProjectStore.shared.projects
    @State private var activeID: String? = ProjectStore.shared.activeProjectID
    @State private var showNewProjectAlert = false
    @State private var newProjectName = ""
    @State private var showFolderImporter = false
    @State private var errorMessage: String?

    public init() {}

    public var body: some View {
        NavigationView {
            List {
                Section {
                    if projects.isEmpty {
                        Text("Nenhum projeto ainda. Crie uma pasta do app ou adicione uma pasta do Arquivos.")
                            .font(.system(size: 13))
                            .foregroundColor(KaideTheme.textMuted)
                    }

                    ForEach(projects) { project in
                        Button(action: { activate(project) }) {
                            projectRow(project)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                    .onDelete(perform: deleteProjects)
                } header: {
                    Text("Projetos")
                }

                Section {
                    Button(action: {
                        newProjectName = ""
                        showNewProjectAlert = true
                    }) {
                        Label("Novo projeto (pasta do app)", systemImage: "folder.badge.plus")
                    }

                    Button(action: { showFolderImporter = true }) {
                        Label("Adicionar pasta do Arquivos", systemImage: "folder")
                    }

                    if activeID != nil {
                        Button(role: .destructive, action: {
                            ProjectStore.shared.setActive(nil)
                            refresh()
                        }) {
                            Label("Desativar projeto", systemImage: "xmark.circle")
                        }
                    }
                } footer: {
                    Text("O agente só lê e escreve dentro da pasta do projeto ativo. Sem projeto ativo, a raiz é a pasta do próprio app (Documents).")
                        .font(.system(size: 11))
                }
            }
            .listStyle(InsetGroupedListStyle())
            .navigationTitle("Projetos")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Concluir") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
        .navigationViewStyle(StackNavigationViewStyle())
        .alert("Novo projeto", isPresented: $showNewProjectAlert) {
            TextField("Nome do projeto", text: $newProjectName)
            Button("Criar", action: createProject)
            Button("Cancelar", role: .cancel) {}
        } message: {
            Text("A pasta será criada em Documents/Kaide/projects.")
        }
        .fileImporter(
            isPresented: $showFolderImporter,
            allowedContentTypes: [.folder],
            allowsMultipleSelection: false
        ) { result in
            handleImport(result)
        }
        .alert("Erro", isPresented: Binding(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("OK", role: .cancel) { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
    }

    // MARK: - Linha

    private func projectRow(_ project: KaideProject) -> some View {
        HStack(spacing: 10) {
            Image(systemName: project.isExternal ? "folder.fill" : "folder")
                .font(.system(size: 15))
                .foregroundColor(project.id == activeID ? KaideTheme.accent : KaideTheme.textSecondary)

            VStack(alignment: .leading, spacing: 2) {
                Text(project.name)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(KaideTheme.textPrimary)
                Text(project.path)
                    .font(.system(size: 10, design: .monospaced))
                    .foregroundColor(KaideTheme.textMuted)
                    .lineLimit(1)
                    .truncationMode(.middle)
            }

            Spacer()

            if project.id == activeID {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(KaideTheme.accent)
            }
        }
        .padding(.vertical, 2)
    }

    // MARK: - Ações

    private func refresh() {
        projects = ProjectStore.shared.projects
        activeID = ProjectStore.shared.activeProjectID
    }

    private func activate(_ project: KaideProject) {
        ProjectStore.shared.setActive(project.id)
        refresh()
    }

    private func createProject() {
        do {
            try ProjectStore.shared.createProject(name: newProjectName)
            refresh()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func deleteProjects(at offsets: IndexSet) {
        for index in offsets {
            ProjectStore.shared.delete(projects[index].id)
        }
        refresh()
    }

    private func handleImport(_ result: Result<[URL], Error>) {
        switch result {
        case .success(let urls):
            guard let url = urls.first else { return }
            do {
                try ProjectStore.shared.importProject(name: nil, url: url)
                refresh()
            } catch {
                errorMessage = error.localizedDescription
            }
        case .failure(let error):
            errorMessage = error.localizedDescription
        }
    }
}
