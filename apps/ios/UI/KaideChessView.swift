import SwiftUI

public struct KaideChessView: View {
    @StateObject private var engine = ChessEngine()
    @Environment(\.presentationMode) var presentationMode
    @State private var showPromoDialog: Bool = false

    public init() {}

    public var body: some View {
        NavigationView {
            VStack(spacing: 12) {
                topStatusBar
                capturedBar(pieces: engine.capturedBlack, title: "Capturadas pelas Pretas")
                chessBoard
                capturedBar(pieces: engine.capturedWhite, title: "Capturadas pelas Brancas")
                bottomControlBar
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(KaideTheme.background.edgesIgnoringSafeArea(.all))
            .navigationBarTitle("Xadrez Kaide", displayMode: .inline)
            .navigationBarItems(
                leading: Button(action: { engine.newGame() }) {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.clockwise")
                        Text("Novo")
                    }
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(KaideTheme.accent)
                },
                trailing: Button("Fechar") {
                    presentationMode.wrappedValue.dismiss()
                }
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(KaideTheme.accent)
            )
            .actionSheet(isPresented: $showPromoDialog) {
                ActionSheet(
                    title: Text("Promoção de Peão"),
                    message: Text("Escolha a peça para promover seu peão:"),
                    buttons: [
                        .default(Text("Rainha (♕)")) { engine.choosePromotion(.queen) },
                        .default(Text("Torre (♖)")) { engine.choosePromotion(.rook) },
                        .default(Text("Bispo (♗)")) { engine.choosePromotion(.bishop) },
                        .default(Text("Cavalo (♘)")) { engine.choosePromotion(.knight) },
                        .cancel()
                    ]
                )
            }
            .onChange(of: engine.pendingPromotion != nil) { isPromoting in
                if isPromoting {
                    showPromoDialog = true
                }
            }
        }
    }

    // MARK: - Status Bar

    private var topStatusBar: some View {
        HStack {
            HStack(spacing: 6) {
                Circle()
                    .fill(engine.turn == .white ? Color.white : Color.black)
                    .frame(width: 12, height: 12)
                    .overlay(Circle().stroke(KaideTheme.border, lineWidth: 1))
                Text(engine.statusDescription)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(engine.isCheckmate ? KaideTheme.error : (engine.isCheck ? KaideTheme.warning : KaideTheme.textPrimary))
            }
            Spacer()
            if let last = engine.lastMove {
                Text("Último: \(last.piece.type.symbol(color: last.piece.color)) \(last.from.algebraic) → \(last.to.algebraic)")
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundColor(KaideTheme.textMuted)
            }
        }
        .padding(10)
        .background(KaideTheme.surfaceElevated)
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(KaideTheme.border, lineWidth: 1)
        )
    }

    // MARK: - Peças Capturadas

    private func capturedBar(pieces: [ChessPiece], title: String) -> some View {
        HStack(spacing: 4) {
            if pieces.isEmpty {
                Text(title)
                    .font(.system(size: 11))
                    .foregroundColor(KaideTheme.textMuted.opacity(0.6))
            } else {
                ForEach(Array(pieces.enumerated()), id: \.offset) { _, p in
                    Text(p.type.symbol(color: p.color))
                        .font(.system(size: 16))
                        .foregroundColor(p.color == .white ? Color.white : KaideTheme.textSecondary)
                }
            }
            Spacer()
        }
        .frame(height: 22)
        .padding(.horizontal, 6)
    }

    // MARK: - Tabuleiro

    private var chessBoard: some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            let cellSize = size / 8.0

            VStack(spacing: 0) {
                ForEach(0..<8, id: \.self) { r in
                    HStack(spacing: 0) {
                        ForEach(0..<8, id: \.self) { c in
                            squareView(row: r, col: c, size: cellSize)
                        }
                    }
                }
            }
            .frame(width: size, height: size)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(KaideTheme.border, lineWidth: 2)
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        }
    }

    private func squareView(row: Int, col: Int, size: CGFloat) -> some View {
        let sq = ChessSquare(row, col)
        let isLight = (row + col) % 2 == 0
        let isSelected = engine.selectedSquare == sq
        let isLegal = engine.legalMoves.contains(sq)
        let isLastFrom = engine.lastMove?.from == sq
        let isLastTo = engine.lastMove?.to == sq

        let baseColor = isLight ? Color(red: 0.22, green: 0.25, blue: 0.29) : Color(red: 0.13, green: 0.15, blue: 0.18)

        return ZStack {
            Rectangle()
                .fill(baseColor)

            // Destaque da última jogada
            if isLastFrom || isLastTo {
                Rectangle()
                    .fill(KaideTheme.accent.opacity(0.25))
            }

            // Destaque de seleção ativa
            if isSelected {
                Rectangle()
                    .stroke(KaideTheme.accent, lineWidth: 2)
                    .background(KaideTheme.accent.opacity(0.2))
            }

            // Peça
            if let piece = engine.board[row][col] {
                Text(piece.type.symbol(color: piece.color))
                    .font(.system(size: size * 0.72))
                    .foregroundColor(piece.color == .white ? Color.white : Color(red: 0.95, green: 0.65, blue: 0.15))
                    .shadow(color: Color.black.opacity(0.4), radius: 1, x: 0, y: 1)
            }

            // Indicador de movimento legal
            if isLegal {
                if engine.board[row][col] != nil {
                    // Captura: anel ao redor
                    Circle()
                        .stroke(KaideTheme.accent, lineWidth: 3)
                        .frame(width: size * 0.8, height: size * 0.8)
                } else {
                    // Quadrado vazio: ponto no centro
                    Circle()
                        .fill(KaideTheme.accent.opacity(0.75))
                        .frame(width: size * 0.28, height: size * 0.28)
                }
            }
        }
        .frame(width: size, height: size)
        .contentShape(Rectangle())
        .onTapGesture {
            engine.selectSquare(sq)
        }
    }

    // MARK: - Barra de Controles

    private var bottomControlBar: some View {
        HStack(spacing: 12) {
            Button(action: { engine.undoMove() }) {
                HStack(spacing: 6) {
                    Image(systemName: "arrow.uturn.backward")
                    Text("Desfazer")
                }
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(KaideTheme.textPrimary)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(KaideTheme.surfaceElevated)
                .cornerRadius(10)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(KaideTheme.border, lineWidth: 1)
                )
            }

            Spacer()

            Button(action: { engine.newGame() }) {
                HStack(spacing: 6) {
                    Image(systemName: "arrow.clockwise")
                    Text("Nova Partida")
                }
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(KaideTheme.accent)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(KaideTheme.surfaceElevated)
                .cornerRadius(10)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(KaideTheme.accent.opacity(0.4), lineWidth: 1)
                )
            }
        }
        .padding(.top, 4)
    }
}
