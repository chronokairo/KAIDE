import SwiftUI

public struct KaideMessageRow: View {
    public let turn: KaideTurn
    @AppStorage("kaide_always_show_thinking") private var alwaysShowThinking: Bool = false
    @State private var showReasoning: Bool = false

    public init(turn: KaideTurn) {
        self.turn = turn
    }

    private var isThinkingVisible: Bool {
        showReasoning || alwaysShowThinking
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if turn.role == "user" {
                userPromptRow
            } else if turn.role == "tool" {
                ClaudeCodeToolCard(turn: turn)
            } else {
                assistantCard
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 4)
    }

    // MARK: - Prompt do Usuário (Claude Code CLI: ❯ prompt)

    private var userPromptRow: some View {
        HStack(alignment: .top, spacing: 10) {
            Text("❯")
                .font(.system(size: 15, weight: .black, design: .monospaced))
                .foregroundColor(KaideTheme.accent)
                .padding(.top, 1)

            Text(LocalizedStringKey(turn.content))
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(KaideTheme.textPrimary)
                .fixedSize(horizontal: false, vertical: true)

            Spacer()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(KaideTheme.surfaceElevated.opacity(0.85))
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(KaideTheme.accent.opacity(0.35), lineWidth: 1)
        )
    }

    // MARK: - Resposta do Assistente (Claude Code Markdown + Thinking)

    private var assistantCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Bloco de Raciocínio (Claude Code Thinking Process)
            if let reasoning = turn.reasoning, !reasoning.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Button(action: { withAnimation(.easeInOut(duration: 0.2)) { showReasoning.toggle() } }) {
                        HStack(spacing: 6) {
                            Image(systemName: isThinkingVisible ? "chevron.down" : "chevron.right")
                                .font(.system(size: 10, weight: .bold))
                            Image(systemName: "brain")
                                .font(.system(size: 11))
                            Text("Thinking Process")
                                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                            Spacer()
                        }
                        .foregroundColor(KaideTheme.textMuted)
                    }

                    if isThinkingVisible {
                        HStack(alignment: .top, spacing: 8) {
                            Rectangle()
                                .fill(KaideTheme.accent.opacity(0.35))
                                .frame(width: 2)

                            Text(reasoning)
                                .font(.system(size: 12, design: .monospaced))
                                .foregroundColor(KaideTheme.textSecondary)
                                .lineSpacing(2)
                                .padding(.vertical, 4)
                        }
                        .padding(.leading, 4)
                    }
                }
                .padding(8)
                .background(KaideTheme.surface.opacity(0.7))
                .cornerRadius(8)
            }

            // Conteúdo principal renderizado em Markdown Rico
            if !turn.content.isEmpty {
                KaideMarkdownView(markdown: turn.content)
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(KaideTheme.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(KaideTheme.border, lineWidth: 1)
                    )
                    .cornerRadius(10)
            }

            // Rodapé de Métricas / Tokens (Claude Code Stats Footer)
            if let metrics = turn.metrics {
                HStack(spacing: 6) {
                    Circle()
                        .fill(KaideTheme.accent)
                        .frame(width: 6, height: 6)
                    Text(metrics.model)
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundColor(KaideTheme.textSecondary)
                    Text("·")
                        .foregroundColor(KaideTheme.textMuted)
                    Text(metrics.formattedSummary)
                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                        .foregroundColor(KaideTheme.textMuted)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(KaideTheme.surfaceElevated.opacity(0.7))
                .cornerRadius(6)
            }
        }
    }
}

// MARK: - Claude Code Tool Execution Card (┌─ │ └─)

public struct ClaudeCodeToolCard: View {
    public let turn: KaideTurn
    @State private var isExpanded: Bool = false
    @State private var copied: Bool = false

    public init(turn: KaideTurn) {
        self.turn = turn
    }

    private var toolName: String {
        turn.toolName ?? "tool"
    }

    private var paramSnippet: String? {
        guard let args = turn.toolArgs, !args.isEmpty else { return nil }
        if let data = args.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            if let cmd = json["command"] as? String {
                return cmd
            }
            if let path = json["path"] as? String {
                return (path as NSString).lastPathComponent
            }
            if let query = json["query"] as? String {
                return query
            }
        }
        let trimmed = args.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.count < 30 { return trimmed }
        return String(trimmed.prefix(27)) + "..."
    }

    private var isError: Bool {
        turn.isError ?? (turn.content.lowercased().contains("erro") || turn.content.lowercased().contains("failed"))
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header: ┌─ [Icon] ToolName (args)
            Button(action: { withAnimation(.easeInOut(duration: 0.15)) { isExpanded.toggle() } }) {
                HStack(spacing: 6) {
                    Image(systemName: iconForTool(toolName))
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(KaideTheme.accent)

                    Text(displayName(toolName))
                        .font(.system(size: 12, weight: .bold, design: .monospaced))
                        .foregroundColor(KaideTheme.textPrimary)

                    if let param = paramSnippet {
                        Text("(\(param))")
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundColor(KaideTheme.textMuted)
                            .lineLimit(1)
                    }

                    Spacer()

                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(KaideTheme.textMuted)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 7)
                .background(KaideTheme.surfaceElevated)
            }

            // Body: │ output com linha de árvore à esquerda
            HStack(alignment: .top, spacing: 8) {
                Rectangle()
                    .fill(KaideTheme.accent.opacity(0.45))
                    .frame(width: 2)
                    .padding(.leading, 10)

                VStack(alignment: .leading, spacing: 4) {
                    if isExpanded || turn.content.count <= 180 {
                        ScrollView(.horizontal, showsIndicators: false) {
                            Text(turn.content.isEmpty ? "(saída vazia)" : turn.content)
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundColor(KaideTheme.textSecondary)
                                .lineSpacing(2)
                                .padding(6)
                        }
                    } else {
                        Text(turn.content.prefix(180) + "...\n(toque para expandir)")
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundColor(KaideTheme.textMuted)
                            .padding(6)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.black.opacity(0.45))
                .cornerRadius(6)
                .padding(.trailing, 6)
                .padding(.vertical, 4)
            }
            .background(KaideTheme.surfaceElevated)

            // Footer: └─ Status + Copiar
            HStack(spacing: 6) {
                Image(systemName: isError ? "xmark.circle.fill" : "checkmark.circle.fill")
                    .font(.system(size: 10))
                    .foregroundColor(isError ? KaideTheme.error : KaideTheme.success)

                Text(isError ? "Falhou" : "Concluído")
                    .font(.system(size: 10, weight: .semibold, design: .monospaced))
                    .foregroundColor(isError ? KaideTheme.error : KaideTheme.success)

                Spacer()

                Button(action: {
                    UIPasteboard.general.string = turn.content
                    copied = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                        copied = false
                    }
                }) {
                    HStack(spacing: 3) {
                        Image(systemName: copied ? "checkmark" : "doc.on.doc")
                            .font(.system(size: 9))
                        Text(copied ? "Copiado!" : "Copiar")
                            .font(.system(size: 9, weight: .medium))
                    }
                    .foregroundColor(copied ? KaideTheme.success : KaideTheme.textMuted)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(KaideTheme.surfaceElevated.opacity(0.9))
        }
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(KaideTheme.border.opacity(0.8), lineWidth: 1)
        )
    }

    private func displayName(_ name: String) -> String {
        switch name {
        case "bash", "coding_command": return "Bash"
        case "read_file", "coding_read_file": return "Read File"
        case "write_file", "coding_create_file": return "Write File"
        case "edit_file", "coding_replace_file": return "Edit File"
        case "apply_patch": return "Apply Patch"
        case "code_analyze_repo": return "Analyze Repo"
        case "code_review_diff": return "Review Diff"
        case "code_debug": return "Debug"
        default: return name
        }
    }

    private func iconForTool(_ name: String) -> String {
        switch name {
        case "bash", "coding_command": return "terminal"
        case "read_file", "coding_read_file": return "doc.text"
        case "write_file", "coding_create_file": return "doc.badge.plus"
        case "edit_file", "coding_replace_file": return "pencil.line"
        case "apply_patch": return "bandage"
        case "code_analyze_repo": return "folder.badge.gearshape"
        case "code_review_diff": return "doc.text.magnifyingglass"
        case "code_debug": return "ant"
        default: return "gearshape"
        }
    }
}

// MARK: - Suíte de Tipos de Callout (GitHub / Claude Style)

public enum CalloutType: String {
    case note = "NOTE"
    case tip = "TIP"
    case important = "IMPORTANT"
    case warning = "WARNING"
    case caution = "CAUTION"

    public var title: String {
        switch self {
        case .note: return "Nota"
        case .tip: return "Dica"
        case .important: return "Importante"
        case .warning: return "Atenção"
        case .caution: return "Cuidado"
        }
    }

    public var icon: String {
        switch self {
        case .note: return "info.circle.fill"
        case .tip: return "lightbulb.fill"
        case .important: return "exclamationmark.circle.fill"
        case .warning: return "exclamationmark.triangle.fill"
        case .caution: return "octagon.fill"
        }
    }

    public var color: Color {
        switch self {
        case .note: return Color(red: 0.35, green: 0.65, blue: 1.0)
        case .tip: return KaideTheme.success
        case .important: return Color(red: 0.75, green: 0.50, blue: 1.0)
        case .warning: return KaideTheme.warning
        case .caution: return KaideTheme.error
        }
    }
}

public struct KaideCalloutView: View {
    public let type: CalloutType
    public let text: String

    public var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Rectangle()
                .fill(type.color)
                .frame(width: 3)

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 5) {
                    Image(systemName: type.icon)
                        .font(.system(size: 11, weight: .bold))
                    Text(type.title.uppercased())
                        .font(.system(size: 11, weight: .black, design: .monospaced))
                }
                .foregroundColor(type.color)

                Text(LocalizedStringKey(text))
                    .font(.system(size: 13))
                    .foregroundColor(KaideTheme.textPrimary)
                    .lineSpacing(2)
            }
            .padding(.vertical, 6)
            .padding(.trailing, 8)
        }
        .background(type.color.opacity(0.08))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(type.color.opacity(0.35), lineWidth: 1)
        )
        .padding(.vertical, 2)
    }
}

// MARK: - Renderizador Nativo de Tabelas Markdown (com Scroll Horizontal)

public struct KaideTableView: View {
    public let headers: [String]
    public let rows: [[String]]

    public var body: some View {
        ScrollView(.horizontal, showsIndicators: true) {
            VStack(alignment: .leading, spacing: 0) {
                // Linha de Cabeçalho
                HStack(spacing: 0) {
                    ForEach(Array(headers.enumerated()), id: \.offset) { idx, header in
                        Text(header)
                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                            .foregroundColor(KaideTheme.accent)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 8)
                            .frame(minWidth: 100, alignment: .leading)

                        if idx < headers.count - 1 {
                            Rectangle()
                                .fill(KaideTheme.border)
                                .frame(width: 1)
                        }
                    }
                }
                .background(KaideTheme.surfaceElevated)

                Divider().background(KaideTheme.border)

                // Linhas de Dados (Zebra Striped)
                ForEach(Array(rows.enumerated()), id: \.offset) { rIdx, row in
                    HStack(spacing: 0) {
                        ForEach(0..<headers.count, id: \.self) { cIdx in
                            let cell = cIdx < row.count ? row[cIdx] : ""
                            Text(LocalizedStringKey(cell))
                                .font(.system(size: 12))
                                .foregroundColor(KaideTheme.textPrimary)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .frame(minWidth: 100, alignment: .leading)

                            if cIdx < headers.count - 1 {
                                Rectangle()
                                    .fill(KaideTheme.border.opacity(0.4))
                                    .frame(width: 1)
                            }
                        }
                    }
                    .background(rIdx % 2 == 0 ? Color.black.opacity(0.25) : KaideTheme.surface.opacity(0.35))

                    if rIdx < rows.count - 1 {
                        Divider().background(KaideTheme.border.opacity(0.3))
                    }
                }
            }
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(KaideTheme.border, lineWidth: 1)
            )
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Renderizador Completo de Markdown Rico (Tabelas, Callouts, Checklists, Math)

public struct KaideMarkdownView: View {
    public let markdown: String

    public init(markdown: String) {
        self.markdown = markdown
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(Array(parseElements().enumerated()), id: \.offset) { _, element in
                renderElement(element)
            }
        }
    }

    @ViewBuilder
    private func renderElement(_ element: MarkdownElement) -> some View {
        switch element {
        case .heading(let level, let text):
            Text(LocalizedStringKey(text))
                .font(.system(size: headingSize(level), weight: .bold))
                .foregroundColor(level == 3 ? KaideTheme.accent : KaideTheme.textPrimary)
                .padding(.top, 4)

        case .quote(let text):
            HStack(alignment: .top, spacing: 8) {
                Rectangle()
                    .fill(KaideTheme.accent)
                    .frame(width: 3)
                Text(LocalizedStringKey(text))
                    .font(.system(size: 13))
                    .foregroundColor(KaideTheme.textSecondary)
                    .italic()
            }
            .padding(.vertical, 2)

        case .callout(let type, let text):
            KaideCalloutView(type: type, text: text)

        case .task(let checked, let text):
            HStack(alignment: .top, spacing: 8) {
                Image(systemName: checked ? "checkmark.square.fill" : "square")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(checked ? KaideTheme.accent : KaideTheme.textMuted)
                    .padding(.top, 2)

                Text(LocalizedStringKey(text))
                    .font(.system(size: 14))
                    .foregroundColor(checked ? KaideTheme.textMuted : KaideTheme.textPrimary)
                    .strikethrough(checked, color: KaideTheme.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.vertical, 2)

        case .bullet(let text):
            HStack(alignment: .top, spacing: 6) {
                Text("•")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(KaideTheme.accent)
                Text(LocalizedStringKey(text))
                    .font(.system(size: 14))
                    .foregroundColor(KaideTheme.textPrimary)
                    .fixedSize(horizontal: false, vertical: true)
            }

        case .numbered(let number, let text):
            HStack(alignment: .top, spacing: 6) {
                Text(number)
                    .font(.system(size: 13, weight: .bold, design: .monospaced))
                    .foregroundColor(KaideTheme.accent)
                Text(LocalizedStringKey(text))
                    .font(.system(size: 14))
                    .foregroundColor(KaideTheme.textPrimary)
                    .fixedSize(horizontal: false, vertical: true)
            }

        case .table(let headers, let rows):
            KaideTableView(headers: headers, rows: rows)

        case .math(let formula):
            HStack(spacing: 8) {
                Text("∫")
                    .font(.system(size: 15, weight: .bold, design: .serif))
                    .foregroundColor(KaideTheme.accent)
                ScrollView(.horizontal, showsIndicators: false) {
                    Text(formula)
                        .font(.system(size: 13, design: .monospaced))
                        .foregroundColor(KaideTheme.textPrimary)
                        .italic()
                }
            }
            .padding(10)
            .background(Color.black.opacity(0.4))
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(KaideTheme.border, lineWidth: 1)
            )

        case .code(let lang, let code):
            KaideCodeBlockView(lang: lang, code: code)

        case .horizontalRule:
            Divider().background(KaideTheme.border)

        case .paragraph(let text):
            Text(LocalizedStringKey(text))
                .font(.system(size: 14))
                .foregroundColor(KaideTheme.textPrimary)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func headingSize(_ level: Int) -> CGFloat {
        switch level {
        case 1: return 18
        case 2: return 16
        case 3: return 15
        default: return 14
        }
    }

    private enum MarkdownElement {
        case heading(level: Int, text: String)
        case quote(String)
        case callout(type: CalloutType, text: String)
        case task(checked: Bool, text: String)
        case bullet(String)
        case numbered(number: String, text: String)
        case table(headers: [String], rows: [[String]])
        case math(String)
        case code(lang: String, code: String)
        case horizontalRule
        case paragraph(String)
    }

    private func parseElements() -> [MarkdownElement] {
        var elements: [MarkdownElement] = []
        let parts = markdown.components(separatedBy: "```")

        for i in 0..<parts.count {
            let part = parts[i]
            if i % 2 == 1 {
                // Bloco de código fenced
                var lines = part.components(separatedBy: "\n")
                var lang = ""
                if let first = lines.first {
                    lang = first.trimmingCharacters(in: .whitespacesAndNewlines)
                    lines.removeFirst()
                }
                let code = lines.joined(separator: "\n").trimmingCharacters(in: .newlines)
                elements.append(.code(lang: lang, code: code))
            } else {
                // Texto markdown estruturado
                let lines = part.components(separatedBy: "\n")
                var paragraphBuffer: [String] = []

                func flushParagraph() {
                    let joined = paragraphBuffer.joined(separator: " ").trimmingCharacters(in: .whitespacesAndNewlines)
                    if !joined.isEmpty {
                        elements.append(.paragraph(joined))
                    }
                    paragraphBuffer.removeAll()
                }

                var idx = 0
                while idx < lines.count {
                    let line = lines[idx]
                    let trimmed = line.trimmingCharacters(in: .whitespaces)

                    if trimmed.isEmpty {
                        flushParagraph()
                        idx += 1
                        continue
                    }

                    // Detecção de Tabela Markdown
                    if trimmed.contains("|") && idx + 1 < lines.count && isTableSeparator(lines[idx + 1]) {
                        flushParagraph()
                        let headers = splitTableRow(trimmed)
                        idx += 2 // pula o cabeçalho e a linha separadora |---|---|
                        var rows: [[String]] = []
                        while idx < lines.count {
                            let rowLine = lines[idx].trimmingCharacters(in: .whitespaces)
                            if rowLine.contains("|") && !rowLine.isEmpty {
                                rows.append(splitTableRow(rowLine))
                                idx += 1
                            } else {
                                break
                            }
                        }
                        elements.append(.table(headers: headers, rows: rows))
                        continue
                    }

                    // Detecção de Callout Alerts (> [!NOTE], > [!TIP], etc.)
                    if trimmed.hasPrefix("> [!") && trimmed.contains("]") {
                        flushParagraph()
                        let calloutRaw = trimmed.dropFirst(4).prefix(while: { $0 != "]" }).uppercased()
                        let type = CalloutType(rawValue: String(calloutRaw)) ?? .note
                        var bodyLines: [String] = []
                        idx += 1
                        while idx < lines.count {
                            let nextTrimmed = lines[idx].trimmingCharacters(in: .whitespaces)
                            if nextTrimmed.hasPrefix("> ") {
                                bodyLines.append(String(nextTrimmed.dropFirst(2)))
                                idx += 1
                            } else if nextTrimmed == ">" {
                                bodyLines.append("\n")
                                idx += 1
                            } else {
                                break
                            }
                        }
                        let bodyText = bodyLines.joined(separator: " ").trimmingCharacters(in: .whitespacesAndNewlines)
                        elements.append(.callout(type: type, text: bodyText))
                        continue
                    }

                    // Detecção de Task Lists / Checklists (- [ ] e - [x])
                    if trimmed.hasPrefix("- [ ] ") || trimmed.hasPrefix("* [ ] ") {
                        flushParagraph()
                        elements.append(.task(checked: false, text: String(trimmed.dropFirst(6))))
                        idx += 1
                        continue
                    }
                    if trimmed.hasPrefix("- [x] ") || trimmed.hasPrefix("- [X] ") || trimmed.hasPrefix("* [x] ") || trimmed.hasPrefix("* [X] ") {
                        flushParagraph()
                        elements.append(.task(checked: true, text: String(trimmed.dropFirst(6))))
                        idx += 1
                        continue
                    }

                    // Detecção de Bloco Matemático ($$ ... $$)
                    if trimmed.hasPrefix("$$") && trimmed.hasSuffix("$$") && trimmed.count > 4 {
                        flushParagraph()
                        let formula = String(trimmed.dropFirst(2).dropLast(2)).trimmingCharacters(in: .whitespaces)
                        elements.append(.math(formula))
                        idx += 1
                        continue
                    }

                    // Cabeçalhos (#, ##, ###, ####)
                    if trimmed.hasPrefix("#### ") {
                        flushParagraph()
                        elements.append(.heading(level: 4, text: String(trimmed.dropFirst(5))))
                        idx += 1
                    } else if trimmed.hasPrefix("### ") {
                        flushParagraph()
                        elements.append(.heading(level: 3, text: String(trimmed.dropFirst(4))))
                        idx += 1
                    } else if trimmed.hasPrefix("## ") {
                        flushParagraph()
                        elements.append(.heading(level: 2, text: String(trimmed.dropFirst(3))))
                        idx += 1
                    } else if trimmed.hasPrefix("# ") {
                        flushParagraph()
                        elements.append(.heading(level: 1, text: String(trimmed.dropFirst(2))))
                        idx += 1
                    } else if trimmed.hasPrefix("> ") {
                        flushParagraph()
                        elements.append(.quote(String(trimmed.dropFirst(2))))
                        idx += 1
                    } else if trimmed.hasPrefix("- ") || trimmed.hasPrefix("* ") {
                        flushParagraph()
                        elements.append(.bullet(String(trimmed.dropFirst(2))))
                        idx += 1
                    } else if trimmed == "---" || trimmed == "***" || trimmed == "___" {
                        flushParagraph()
                        elements.append(.horizontalRule)
                        idx += 1
                    } else if let dotIndex = trimmed.firstIndex(of: "."),
                              dotIndex != trimmed.startIndex,
                              let num = Int(trimmed[..<dotIndex]),
                              trimmed.index(after: dotIndex) < trimmed.endIndex,
                              trimmed[trimmed.index(after: dotIndex)] == " " {
                        flushParagraph()
                        let afterSpace = trimmed.index(dotIndex, offsetBy: 2)
                        let text = String(trimmed[afterSpace...])
                        elements.append(.numbered(number: "\(num).", text: text))
                        idx += 1
                    } else {
                        paragraphBuffer.append(trimmed)
                        idx += 1
                    }
                }
                flushParagraph()
            }
        }
        return elements
    }

    private func splitTableRow(_ line: String) -> [String] {
        var raw = line.components(separatedBy: "|")
        if let first = raw.first, first.trimmingCharacters(in: .whitespaces).isEmpty {
            raw.removeFirst()
        }
        if let last = raw.last, last.trimmingCharacters(in: .whitespaces).isEmpty {
            raw.removeLast()
        }
        return raw.map { $0.trimmingCharacters(in: .whitespaces) }
    }

    private func isTableSeparator(_ line: String) -> Bool {
        let clean = line.replacingOccurrences(of: "|", with: "")
                        .replacingOccurrences(of: ":", with: "")
                        .replacingOccurrences(of: "-", with: "")
                        .replacingOccurrences(of: " ", with: "")
        return clean.isEmpty && line.contains("-")
    }
}

// MARK: - Bloco de Código com Sintaxe Diff e Copiar (Claude Code Editor)

public struct KaideCodeBlockView: View {
    public let lang: String
    public let code: String
    @State private var copied: Bool = false

    public init(lang: String, code: String) {
        self.lang = lang
        self.code = code
    }

    private var isDiff: Bool {
        let lower = lang.lowercased()
        return lower == "diff" || lower == "patch"
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header do bloco de código
            HStack {
                Text(lang.isEmpty ? "CÓDIGO" : lang.uppercased())
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .foregroundColor(KaideTheme.accent)

                Spacer()

                Button(action: {
                    UIPasteboard.general.string = code
                    copied = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                        copied = false
                    }
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: copied ? "checkmark" : "doc.on.doc")
                            .font(.system(size: 10))
                        Text(copied ? "Copiado!" : "Copiar")
                            .font(.system(size: 10, weight: .semibold))
                    }
                    .foregroundColor(copied ? KaideTheme.success : KaideTheme.textMuted)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Color(red: 0.10, green: 0.11, blue: 0.13))

            Divider().background(KaideTheme.border.opacity(0.6))

            // Corpo: Renderização com Destaque de Diff ou Monospace Normal
            ScrollView(.horizontal, showsIndicators: false) {
                if isDiff {
                    VStack(alignment: .leading, spacing: 1) {
                        ForEach(Array(code.components(separatedBy: "\n").enumerated()), id: \.offset) { _, line in
                            diffLineView(line)
                        }
                    }
                    .padding(.vertical, 8)
                } else {
                    Text(code)
                        .font(.system(size: 12, design: .monospaced))
                        .foregroundColor(KaideTheme.textPrimary)
                        .lineSpacing(2)
                        .padding(10)
                }
            }
            .background(Color(red: 0.07, green: 0.08, blue: 0.09))
        }
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(KaideTheme.border.opacity(0.8), lineWidth: 1)
        )
    }

    @ViewBuilder
    private func diffLineView(_ line: String) -> some View {
        if line.hasPrefix("+") {
            HStack(spacing: 0) {
                Text(line)
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundColor(KaideTheme.success)
                Spacer()
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 1)
            .background(KaideTheme.success.opacity(0.12))
        } else if line.hasPrefix("-") {
            HStack(spacing: 0) {
                Text(line)
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundColor(KaideTheme.error)
                Spacer()
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 1)
            .background(KaideTheme.error.opacity(0.12))
        } else if line.hasPrefix("@@") {
            HStack(spacing: 0) {
                Text(line)
                    .font(.system(size: 11, weight: .bold, design: .monospaced))
                    .foregroundColor(Color(red: 0.45, green: 0.75, blue: 1.0))
                Spacer()
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 1)
            .background(Color.blue.opacity(0.08))
        } else {
            Text(line)
                .font(.system(size: 11, design: .monospaced))
                .foregroundColor(KaideTheme.textSecondary)
                .padding(.horizontal, 8)
                .padding(.vertical, 1)
        }
    }
}
