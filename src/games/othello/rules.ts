import type { GameRules, Outcome, PlayerId } from '@/core/boardgame/types'

export const SIZE = 8
/** 0 = black (moves first), 1 = white. */
export type Disc = PlayerId | null

export interface OthelloState {
  board: Disc[]
  turn: PlayerId
  /** Set when neither player can move. */
  over: boolean
}

/** A move is the board index 0..63 (row * 8 + col). */
export type OthelloMove = number

const DIRS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
]

/** Indices of discs that would be flipped if `player` played at `index`. */
export function flips(board: readonly Disc[], index: number, player: PlayerId): number[] {
  if (board[index] !== null) return []
  const r0 = Math.floor(index / SIZE)
  const c0 = index % SIZE
  const result: number[] = []
  for (const [dr, dc] of DIRS) {
    const line: number[] = []
    let r = r0 + dr
    let c = c0 + dc
    while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r * SIZE + c] === 1 - player) {
      line.push(r * SIZE + c)
      r += dr
      c += dc
    }
    if (line.length && r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r * SIZE + c] === player) {
      result.push(...line)
    }
  }
  return result
}

export function movesFor(board: readonly Disc[], player: PlayerId): number[] {
  const moves: number[] = []
  for (let i = 0; i < SIZE * SIZE; i++) if (flips(board, i, player).length) moves.push(i)
  return moves
}

export function score(board: readonly Disc[]): [number, number] {
  let black = 0
  let white = 0
  for (const d of board) {
    if (d === 0) black++
    else if (d === 1) white++
  }
  return [black, white]
}

export const othello: GameRules<OthelloState, OthelloMove> = {
  initialState() {
    const board: Disc[] = Array<Disc>(SIZE * SIZE).fill(null)
    board[3 * SIZE + 3] = 1
    board[3 * SIZE + 4] = 0
    board[4 * SIZE + 3] = 0
    board[4 * SIZE + 4] = 1
    return { board, turn: 0, over: false }
  },
  currentPlayer: (s) => s.turn,
  legalMoves: (s) => (s.over ? [] : movesFor(s.board, s.turn)),
  isLegal: (s, move) => !s.over && flips(s.board, move, s.turn).length > 0,
  applyMove(s, move) {
    const toFlip = flips(s.board, move, s.turn)
    if (!toFlip.length || s.over) throw new Error(`Illegal move ${move}`)
    const board = s.board.slice()
    board[move] = s.turn
    for (const i of toFlip) board[i] = s.turn
    // A player without moves passes; if neither can move the game is over.
    const opponent = (1 - s.turn) as PlayerId
    if (movesFor(board, opponent).length) return { board, turn: opponent, over: false }
    if (movesFor(board, s.turn).length) return { board, turn: s.turn, over: false }
    return { board, turn: opponent, over: true }
  },
  outcome(s): Outcome {
    if (!s.over) return null
    const [black, white] = score(s.board)
    if (black === white) return { draw: true }
    return { winner: black > white ? 0 : 1 }
  },
}

// Corners are valuable, squares next to them are dangerous.
const WEIGHTS = [
  100, -20, 10, 5, 5, 10, -20, 100,
  -20, -50, -2, -2, -2, -2, -50, -20,
  10, -2, -1, -1, -1, -1, -2, 10,
  5, -2, -1, -1, -1, -1, -2, 5,
  5, -2, -1, -1, -1, -1, -2, 5,
  10, -2, -1, -1, -1, -1, -2, 10,
  -20, -50, -2, -2, -2, -2, -50, -20,
  100, -20, 10, 5, 5, 10, -20, 100,
]

/** Positional heuristic from `me`'s point of view, kept within roughly ±90. */
export function heuristic(s: OthelloState, me: PlayerId): number {
  let total = 0
  for (let i = 0; i < s.board.length; i++) {
    const d = s.board[i]
    if (d === me) total += WEIGHTS[i]!
    else if (d !== null) total -= WEIGHTS[i]!
  }
  const mobility = movesFor(s.board, me).length - movesFor(s.board, (1 - me) as PlayerId).length
  return Math.max(-90, Math.min(90, total / 4 + mobility * 2))
}
