import type { Outcome, PlayerId } from '@/core/boardgame/types'

export type Piece = 0 | 1 | 2 | 3 | 4
export interface CheckersState {
  board: Piece[]
  turn: PlayerId
}
export interface CheckersMove {
  from: number
  path: number[]
  captures: number[]
}

const playerOf = (piece: Piece): PlayerId | null =>
  piece === 1 || piece === 3 ? 0 : piece === 2 || piece === 4 ? 1 : null
const king = (piece: Piece) => piece === 3 || piece === 4
const row = (i: number) => Math.floor(i / 4)
const col = (i: number) => (i % 4) * 2 + (row(i) % 2 === 0 ? 1 : 0)
const index = (r: number, c: number) =>
  r < 0 || r > 7 || c < 0 || c > 7 || (r + c) % 2 === 0 ? -1 : r * 4 + Math.floor(c / 2)

function directions(piece: Piece): number[] {
  return king(piece) ? [-1, 1] : [playerOf(piece) === 0 ? -1 : 1]
}

function capturePaths(board: Piece[], start: number, piece: Piece): CheckersMove[] {
  const found: CheckersMove[] = []
  const visit = (at: number, current: Piece, captures: number[], path: number[]) => {
    let extended = false
    for (const dr of directions(current)) {
      for (const dc of [-1, 1]) {
        const over = index(row(at) + dr, col(at) + dc)
        const to = index(row(at) + 2 * dr, col(at) + 2 * dc)
        if (
          over < 0 ||
          to < 0 ||
          board[to] !== 0 ||
          playerOf(board[over]!) !== 1 - playerOf(piece)! ||
          captures.includes(over)
        )
          continue
        extended = true
        const crowned = !king(current) && (playerOf(current) === 0 ? row(to) === 0 : row(to) === 7)
        visit(
          to,
          crowned ? (playerOf(current) === 0 ? 3 : 4) : current,
          [...captures, over],
          [...path, to],
        )
      }
    }
    if (!extended && captures.length) found.push({ from: start, path, captures })
  }
  visit(start, piece, [], [])
  return found
}

function allMoves(state: CheckersState): CheckersMove[] {
  const board = state.board
  const captures: CheckersMove[] = []
  const steps: CheckersMove[] = []
  for (let from = 0; from < board.length; from++) {
    const piece = board[from]!
    if (piece === 0 || playerOf(piece) !== state.turn) continue
    captures.push(...capturePaths(board, from, piece))
    for (const dr of directions(piece)) {
      for (const dc of [-1, 1]) {
        const to = index(row(from) + dr, col(from) + dc)
        if (to >= 0 && board[to] === 0) steps.push({ from, path: [to], captures: [] })
      }
    }
  }
  return captures.length ? captures : steps
}

export const checkers = {
  initialState(): CheckersState {
    const board = Array<Piece>(32).fill(0)
    for (let i = 0; i < 12; i++) board[i] = 2
    for (let i = 20; i < 32; i++) board[i] = 1
    return { board, turn: 0 }
  },
  legalMoves: allMoves,
  isLegal(state: CheckersState, move: CheckersMove) {
    return allMoves(state).some(
      (candidate) =>
        candidate.from === move.from &&
        candidate.path.length === move.path.length &&
        candidate.path.every((at, i) => at === move.path[i]),
    )
  },
  applyMove(state: CheckersState, move: CheckersMove): CheckersState {
    if (!checkers.isLegal(state, move)) throw new Error('Illegal checkers move')
    const board = state.board.slice()
    let piece = board[move.from]!
    board[move.from] = 0
    for (const captured of move.captures) board[captured] = 0
    const to = move.path.at(-1)!
    if (piece === 1 && row(to) === 0) piece = 3
    if (piece === 2 && row(to) === 7) piece = 4
    board[to] = piece
    return { board, turn: (1 - state.turn) as PlayerId }
  },
  outcome(state: CheckersState): Outcome {
    if (state.board.every((piece) => piece === 0 || playerOf(piece) !== state.turn)) {
      return { winner: (1 - state.turn) as PlayerId }
    }
    if (allMoves(state).length === 0) return { winner: (1 - state.turn) as PlayerId }
    return null
  },
}

export { col as checkersColumn, row as checkersRow }
