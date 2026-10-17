import type { GameRules, Outcome, PlayerId } from '@/core/boardgame/types'

export type Mark = PlayerId | null

export interface TicTacToeState {
  board: Mark[]
  next: PlayerId
}

export type TicTacToeMove = number

export const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const

export function winningLine(board: Mark[]): readonly number[] | null {
  for (const line of LINES) {
    const first = board[line[0]]
    if (first !== null && first === board[line[1]] && first === board[line[2]]) return line
  }
  return null
}

export const ticTacToe: GameRules<TicTacToeState, TicTacToeMove> = {
  initialState: () => ({ board: Array.from<Mark>({ length: 9 }).fill(null), next: 0 }),
  currentPlayer: (s) => s.next,
  legalMoves: (s) =>
    ticTacToe.outcome(s) ? [] : s.board.flatMap((mark, i) => (mark === null ? [i] : [])),
  isLegal: (s, move) =>
    Number.isInteger(move) && s.board[move] === null && ticTacToe.outcome(s) === null,
  applyMove(s, move) {
    const board = s.board.slice()
    board[move] = s.next
    return { board, next: s.next === 0 ? 1 : 0 }
  },
  outcome(s): Outcome {
    const line = winningLine(s.board)
    if (line) return { winner: s.board[line[0]!] as PlayerId }
    return s.board.every((m) => m !== null) ? { draw: true } : null
  },
}
