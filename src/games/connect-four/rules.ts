import type { Outcome, PlayerId } from '@/core/boardgame/types'

export interface ConnectFourState {
  board: (PlayerId | null)[]
  turn: PlayerId
}
export const COLUMNS = 7
export const ROWS = 6

function hasFour(board: ConnectFourState['board'], player: PlayerId) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLUMNS; c++) {
      const i = r * COLUMNS + c
      if (
        board[i] === player &&
        [
          [0, 1],
          [1, 0],
          [1, 1],
          [-1, 1],
        ].some(([dr, dc]) => {
          for (let n = 1; n < 4; n++) {
            const rr = r + dr! * n
            const cc = c + dc! * n
            if (
              rr < 0 ||
              rr >= ROWS ||
              cc < 0 ||
              cc >= COLUMNS ||
              board[rr * COLUMNS + cc] !== player
            )
              return false
          }
          return true
        })
      )
        return true
    }
  }
  return false
}

export const connectFour = {
  initialState: (): ConnectFourState => ({ board: Array(ROWS * COLUMNS).fill(null), turn: 0 }),
  legalMoves(state: ConnectFourState) {
    return Array.from({ length: COLUMNS }, (_, col) => col).filter(
      (col) => state.board[col] === null,
    )
  },
  isLegal(state: ConnectFourState, column: number) {
    return (
      Number.isInteger(column) &&
      column >= 0 &&
      column < COLUMNS &&
      state.board[column] === null &&
      !connectFour.outcome(state)
    )
  },
  applyMove(state: ConnectFourState, column: number): ConnectFourState {
    if (!connectFour.isLegal(state, column)) throw new Error('Illegal Connect Four move')
    const board = state.board.slice()
    for (let row = ROWS - 1; row >= 0; row--) {
      const index = row * COLUMNS + column
      if (board[index] === null) {
        board[index] = state.turn
        break
      }
    }
    return { board, turn: (1 - state.turn) as PlayerId }
  },
  outcome(state: ConnectFourState): Outcome {
    if (hasFour(state.board, 0)) return { winner: 0 }
    if (hasFour(state.board, 1)) return { winner: 1 }
    return state.board.every((cell) => cell !== null) ? { draw: true } : null
  },
}
