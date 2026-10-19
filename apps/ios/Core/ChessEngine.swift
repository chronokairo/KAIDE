import Foundation

/// Tipos e cores de peças do xadrez
public enum ChessColor: String, Codable, Sendable {
    case white = "w"
    case black = "b"

    public var opposite: ChessColor {
        self == .white ? .black : .white
    }

    public var name: String {
        self == .white ? "Brancas" : "Pretas"
    }
}

public enum ChessPieceType: String, Codable, CaseIterable, Sendable {
    case king = "k"
    case queen = "q"
    case rook = "r"
    case bishop = "b"
    case knight = "n"
    case pawn = "p"

    public var unicodeWhite: String {
        switch self {
        case .king: return "♔"
        case .queen: return "♕"
        case .rook: return "♖"
        case .bishop: return "♗"
        case .knight: return "♘"
        case .pawn: return "♙"
        }
    }

    public var unicodeBlack: String {
        switch self {
        case .king: return "♚"
        case .queen: return "♛"
        case .rook: return "♜"
        case .bishop: return "♝"
        case .knight: return "♞"
        case .pawn: return "♟"
        }
    }

    public func symbol(color: ChessColor) -> String {
        color == .white ? unicodeWhite : unicodeBlack
    }
}

public struct ChessPiece: Codable, Equatable, Sendable {
    public let type: ChessPieceType
    public let color: ChessColor

    public init(type: ChessPieceType, color: ChessColor) {
        self.type = type
        self.color = color
    }
}

public struct ChessSquare: Hashable, Codable, Sendable {
    public let row: Int // 0..7 (0 = topo / pretas, 7 = base / brancas)
    public let col: Int // 0..7 (0 = a, 7 = h)

    public init(_ row: Int, _ col: Int) {
        self.row = row
        self.col = col
    }

    public var algebraic: String {
        let files = ["a", "b", "c", "d", "e", "f", "g", "h"]
        let rank = 8 - row
        guard col >= 0 && col < 8 else { return "??" }
        return "\(files[col])\(rank)"
    }
}

public struct ChessMove: Codable, Equatable, Sendable {
    public let from: ChessSquare
    public let to: ChessSquare
    public let piece: ChessPiece
    public let capturedPiece: ChessPiece?
    public let isPromotion: Bool
    public let promotionChoice: ChessPieceType?
    public let isCastling: Bool
    public let isEnPassant: Bool

    public init(
        from: ChessSquare,
        to: ChessSquare,
        piece: ChessPiece,
        capturedPiece: ChessPiece? = nil,
        isPromotion: Bool = false,
        promotionChoice: ChessPieceType? = nil,
        isCastling: Bool = false,
        isEnPassant: Bool = false
    ) {
        self.from = from
        self.to = to
        self.piece = piece
        self.capturedPiece = capturedPiece
        self.isPromotion = isPromotion
        self.promotionChoice = promotionChoice
        self.isCastling = isCastling
        self.isEnPassant = isEnPassant
    }
}

/// Motor de regras do xadrez portado fielmente de lu4nn3ry/chess
public final class ChessEngine: ObservableObject {
    @Published public private(set) var board: [[ChessPiece?]]
    @Published public private(set) var turn: ChessColor
    @Published public private(set) var selectedSquare: ChessSquare?
    @Published public private(set) var legalMoves: [ChessSquare] = []
    @Published public private(set) var lastMove: ChessMove?
    @Published public private(set) var capturedWhite: [ChessPiece] = []
    @Published public private(set) var capturedBlack: [ChessPiece] = []
    @Published public private(set) var isCheck: Bool = false
    @Published public private(set) var isCheckmate: Bool = false
    @Published public private(set) var isStalemate: Bool = false
    @Published public private(set) var pendingPromotion: (from: ChessSquare, to: ChessSquare)? = nil

    private var castlingRights: [String: Bool] = ["wK": true, "wQ": true, "bK": true, "bQ": true]
    private var enPassantSquare: ChessSquare? = nil

    private struct Snapshot {
        let board: [[ChessPiece?]]
        let turn: ChessColor
        let castlingRights: [String: Bool]
        let enPassantSquare: ChessSquare?
        let capturedWhite: [ChessPiece]
        let capturedBlack: [ChessPiece]
        let lastMove: ChessMove?
    }

    private var historySnapshots: [Snapshot] = []

    public init() {
        self.board = Array(repeating: Array(repeating: nil, count: 8), count: 8)
        self.turn = .white
        newGame()
    }

    public func newGame() {
        var b: [[ChessPiece?]] = Array(repeating: Array(repeating: nil, count: 8), count: 8)
        let backRank: [ChessPieceType] = [.rook, .knight, .bishop, .queen, .king, .bishop, .knight, .rook]

        for c in 0..<8 {
            b[0][c] = ChessPiece(type: backRank[c], color: .black)
            b[1][c] = ChessPiece(type: .pawn, color: .black)
            b[6][c] = ChessPiece(type: .pawn, color: .white)
            b[7][c] = ChessPiece(type: backRank[c], color: .white)
        }

        self.board = b
        self.turn = .white
        self.selectedSquare = nil
        self.legalMoves = []
        self.lastMove = nil
        self.capturedWhite = []
        self.capturedBlack = []
        self.castlingRights = ["wK": true, "wQ": true, "bK": true, "bQ": true]
        self.enPassantSquare = nil
        self.isCheck = false
        self.isCheckmate = false
        self.isStalemate = false
        self.pendingPromotion = nil
        self.historySnapshots = []
    }

    public var statusDescription: String {
        if isCheckmate {
            return "XEQUE-MATE! \(turn == .white ? "Pretas" : "Brancas") venceram."
        }
        if isStalemate {
            return "EMPATE por Afogamento (Stalemate)."
        }
        if isCheck {
            return "XEQUE contra as \(turn.name)!"
        }
        return "Vez das \(turn.name)"
    }

    // MARK: - Toque e Seleção

    public func selectSquare(_ sq: ChessSquare) {
        guard !isCheckmate && !isStalemate else { return }

        // Se já está promovendo, ignora cliques
        if pendingPromotion != nil { return }

        // Se clicou em um destino legal selecionado previamente
        if let sel = selectedSquare, legalMoves.contains(sq) {
            executeMove(from: sel, to: sq)
            return
        }

        // Se clicou em uma peça da vez
        if let piece = board[sq.row][sq.col], piece.color == turn {
            selectedSquare = sq
            legalMoves = generateLegalMoves(for: sq, inBoard: board, turnColor: turn)
        } else {
            selectedSquare = nil
            legalMoves = []
        }
    }

    public func choosePromotion(_ type: ChessPieceType) {
        guard let promo = pendingPromotion else { return }
        completeMove(from: promo.from, to: promo.to, promotionPiece: type)
        pendingPromotion = nil
    }

    public func undoMove() {
        guard let prev = historySnapshots.popLast() else { return }
        self.board = prev.board
        self.turn = prev.turn
        self.castlingRights = prev.castlingRights
        self.enPassantSquare = prev.enPassantSquare
        self.capturedWhite = prev.capturedWhite
        self.capturedBlack = prev.capturedBlack
        self.lastMove = prev.lastMove
        self.selectedSquare = nil
        self.legalMoves = []
        self.pendingPromotion = nil
        self.isCheck = isInCheck(color: turn, board: board)
        self.isCheckmate = false
        self.isStalemate = false
    }

    // MARK: - Execução de Jogada

    private func executeMove(from: ChessSquare, to: ChessSquare) {
        guard let piece = board[from.row][from.col] else { return }

        // Verifica promoção de peão
        let promoRow = piece.color == .white ? 0 : 7
        if piece.type == .pawn && to.row == promoRow {
            pendingPromotion = (from, to)
            return
        }

        completeMove(from: from, to: to, promotionPiece: nil)
    }

    private func completeMove(from: ChessSquare, to: ChessSquare, promotionPiece: ChessPieceType?) {
        guard let piece = board[from.row][from.col] else { return }

        // Salva snapshot para Undo
        historySnapshots.append(Snapshot(
            board: board,
            turn: turn,
            castlingRights: castlingRights,
            enPassantSquare: enPassantSquare,
            capturedWhite: capturedWhite,
            capturedBlack: capturedBlack,
            lastMove: lastMove
        ))

        var isCastling = false
        var isEnPassant = false
        var captured = board[to.row][to.col]

        // Roque
        if piece.type == .king && abs(to.col - from.col) == 2 {
            isCastling = true
            if to.col == 6 { // Roque Curto
                let rook = board[from.row][7]
                board[from.row][7] = nil
                board[from.row][5] = rook
            } else if to.col == 2 { // Roque Longo
                let rook = board[from.row][0]
                board[from.row][0] = nil
                board[from.row][3] = rook
            }
        }

        // En Passant
        if piece.type == .pawn, let ep = enPassantSquare, to == ep {
            isEnPassant = true
            let capturedRow = piece.color == .white ? to.row + 1 : to.row - 1
            captured = board[capturedRow][to.col]
            board[capturedRow][to.col] = nil
        }

        // Atualiza Direitos de Roque
        if piece.type == .king {
            if piece.color == .white {
                castlingRights["wK"] = false
                castlingRights["wQ"] = false
            } else {
                castlingRights["bK"] = false
                castlingRights["bQ"] = false
            }
        }
        if piece.type == .rook {
            if from.row == 7 && from.col == 0 { castlingRights["wQ"] = false }
            if from.row == 7 && from.col == 7 { castlingRights["wK"] = false }
            if from.row == 0 && from.col == 0 { castlingRights["bQ"] = false }
            if from.row == 0 && from.col == 7 { castlingRights["bK"] = false }
        }

        // Define quadrado En Passant para próximo lance
        if piece.type == .pawn && abs(to.row - from.row) == 2 {
            let midRow = (from.row + to.row) / 2
            enPassantSquare = ChessSquare(midRow, from.col)
        } else {
            enPassantSquare = nil
        }

        // Move a peça
        board[from.row][from.col] = nil
        if let promo = promotionPiece {
            board[to.row][to.col] = ChessPiece(type: promo, color: piece.color)
        } else {
            board[to.row][to.col] = piece
        }

        // Registra captura
        if let cap = captured {
            if turn == .white {
                capturedWhite.append(cap)
            } else {
                capturedBlack.append(cap)
            }
        }

        let moveRecord = ChessMove(
            from: from,
            to: to,
            piece: piece,
            capturedPiece: captured,
            isPromotion: promotionPiece != nil,
            promotionChoice: promotionPiece,
            isCastling: isCastling,
            isEnPassant: isEnPassant
        )
        self.lastMove = moveRecord

        // Troca de turno
        turn = turn.opposite
        selectedSquare = nil
        legalMoves = []

        // Verifica Xeque, Mate e Afogamento
        isCheck = isInCheck(color: turn, board: board)
        let hasMoves = hasAnyLegalMoves(forColor: turn, inBoard: board)
        if !hasMoves {
            if isCheck {
                isCheckmate = true
            } else {
                isStalemate = true
            }
        }
    }

    // MARK: - Regras de Movimento

    private func inBounds(_ r: Int, _ c: Int) -> Bool {
        r >= 0 && r < 8 && c >= 0 && c < 8
    }

    private func attacksFrom(board: [[ChessPiece?]], r: Int, c: Int) -> [ChessSquare] {
        guard let piece = board[r][c] else { return [] }
        var result: [ChessSquare] = []

        switch piece.type {
        case .pawn:
            let dir = piece.color == .white ? -1 : 1
            for dc in [-1, 1] {
                let nr = r + dir, nc = c + dc
                if inBounds(nr, nc) { result.append(ChessSquare(nr, nc)) }
            }
        case .knight:
            let deltas = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]]
            for d in deltas {
                let nr = r + d[0], nc = c + d[1]
                if inBounds(nr, nc) { result.append(ChessSquare(nr, nc)) }
            }
        case .king:
            for dr in -1...1 {
                for dc in -1...1 {
                    if dr == 0 && dc == 0 { continue }
                    let nr = r + dr, nc = c + dc
                    if inBounds(nr, nc) { result.append(ChessSquare(nr, nc)) }
                }
            }
        case .rook:
            result.append(contentsOf: rayMoves(board: board, r: r, c: c, dirs: [[1,0],[-1,0],[0,1],[0,-1]]))
        case .bishop:
            result.append(contentsOf: rayMoves(board: board, r: r, c: c, dirs: [[1,1],[1,-1],[-1,1],[-1,-1]]))
        case .queen:
            result.append(contentsOf: rayMoves(board: board, r: r, c: c, dirs: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]))
        }

        return result
    }

    private func rayMoves(board: [[ChessPiece?]], r: Int, c: Int, dirs: [[Int]]) -> [ChessSquare] {
        var squares: [ChessSquare] = []
        for d in dirs {
            var nr = r + d[0], nc = c + d[1]
            while inBounds(nr, nc) {
                squares.append(ChessSquare(nr, nc))
                if board[nr][nc] != nil { break }
                nr += d[0]
                nc += d[1]
            }
        }
        return squares
    }

    private func isSquareAttacked(board: [[ChessPiece?]], row: Int, col: Int, byColor: ChessColor) -> Bool {
        for r in 0..<8 {
            for c in 0..<8 {
                if let p = board[r][c], p.color == byColor {
                    let atks = attacksFrom(board: board, r: r, c: c)
                    if atks.contains(where: { $0.row == row && $0.col == col }) {
                        return true
                    }
                }
            }
        }
        return false
    }

    private func findKing(color: ChessColor, board: [[ChessPiece?]]) -> ChessSquare? {
        for r in 0..<8 {
            for c in 0..<8 {
                if let p = board[r][c], p.type == .king && p.color == color {
                    return ChessSquare(r, c)
                }
            }
        }
        return nil
    }

    private func isInCheck(color: ChessColor, board: [[ChessPiece?]]) -> Bool {
        guard let king = findKing(color: color, board: board) else { return false }
        return isSquareAttacked(board: board, row: king.row, col: king.col, byColor: color.opposite)
    }

    private func generateLegalMoves(for sq: ChessSquare, inBoard: [[ChessPiece?]], turnColor: ChessColor) -> [ChessSquare] {
        guard let piece = inBoard[sq.row][sq.col], piece.color == turnColor else { return [] }
        var legal: [ChessSquare] = []
        let r = sq.row, c = sq.col

        // Movimentos básicos de acordo com a peça
        if piece.type == .pawn {
            let dir = piece.color == .white ? -1 : 1
            let startRow = piece.color == .white ? 6 : 1

            // 1 passo à frente
            if inBounds(r + dir, c) && inBoard[r + dir][c] == nil {
                legal.append(ChessSquare(r + dir, c))
                // 2 passos do início
                if r == startRow && inBoard[r + 2 * dir][c] == nil {
                    legal.append(ChessSquare(r + 2 * dir, c))
                }
            }
            // Captura nas diagonais
            for dc in [-1, 1] {
                let nr = r + dir, nc = c + dc
                if inBounds(nr, nc) {
                    if let enemy = inBoard[nr][nc], enemy.color != piece.color {
                        legal.append(ChessSquare(nr, nc))
                    } else if let ep = enPassantSquare, ep.row == nr && ep.col == nc {
                        legal.append(ChessSquare(nr, nc))
                    }
                }
            }
        } else {
            let candidates = attacksFrom(board: inBoard, r: r, c: c)
            for cand in candidates {
                if let target = inBoard[cand.row][cand.col] {
                    if target.color != piece.color { legal.append(cand) }
                } else {
                    legal.append(cand)
                }
            }
        }

        // Roque para o Rei
        if piece.type == .king {
            let rank = piece.color == .white ? 7 : 0
            if r == rank && c == 4 && !isInCheck(color: piece.color, board: inBoard) {
                let kRight = piece.color == .white ? "wK" : "bK"
                let qRight = piece.color == .white ? "wQ" : "bQ"

                // Roque Curto
                if castlingRights[kRight] == true &&
                    inBoard[rank][5] == nil && inBoard[rank][6] == nil &&
                    !isSquareAttacked(board: inBoard, row: rank, col: 5, byColor: piece.color.opposite) &&
                    !isSquareAttacked(board: inBoard, row: rank, col: 6, byColor: piece.color.opposite) {
                    legal.append(ChessSquare(rank, 6))
                }

                // Roque Longo
                if castlingRights[qRight] == true &&
                    inBoard[rank][1] == nil && inBoard[rank][2] == nil && inBoard[rank][3] == nil &&
                    !isSquareAttacked(board: inBoard, row: rank, col: 2, byColor: piece.color.opposite) &&
                    !isSquareAttacked(board: inBoard, row: rank, col: 3, byColor: piece.color.opposite) {
                    legal.append(ChessSquare(rank, 2))
                }
            }
        }

        // Filtra lances que deixariam o próprio rei em xeque
        return legal.filter { target in
            var testBoard = inBoard
            testBoard[target.row][target.col] = testBoard[r][c]
            testBoard[r][c] = nil
            return !isInCheck(color: piece.color, board: testBoard)
        }
    }

    private func hasAnyLegalMoves(forColor: ChessColor, inBoard: [[ChessPiece?]]) -> Bool {
        for r in 0..<8 {
            for c in 0..<8 {
                if let p = inBoard[r][c], p.color == forColor {
                    let moves = generateLegalMoves(for: ChessSquare(r, c), inBoard: inBoard, turnColor: forColor)
                    if !moves.isEmpty { return true }
                }
            }
        }
        return false
    }
}
