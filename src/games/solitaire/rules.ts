import type { Outcome } from '@/core/boardgame/types'

export const HOLES = Array.from({ length: 49 }, (_, i) => {
  const row = Math.floor(i / 7)
  const col = i % 7
  return (row >= 2 && row <= 4) || (col >= 2 && col <= 4)
})

export interface SolitaireState {
  pegs: boolean[]
}
export interface SolitaireMove {
  from: number
  to: number
}

export const solitaire = {
  initialState(): SolitaireState {
    const pegs = HOLES.slice()
    pegs[24] = false
    return { pegs }
  },
  legalMoves(state: SolitaireState): SolitaireMove[] {
    const moves: SolitaireMove[] = []
    for (let from = 0; from < 49; from++) {
      if (!state.pegs[from]) continue
      const row = Math.floor(from / 7)
      const col = from % 7
      for (const [dr, dc] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        const over = (row + dr!) * 7 + col + dc!
        const to = (row + 2 * dr!) * 7 + col + 2 * dc!
        if (
          row + 2 * dr! >= 0 &&
          row + 2 * dr! < 7 &&
          col + 2 * dc! >= 0 &&
          col + 2 * dc! < 7 &&
          HOLES[over] &&
          HOLES[to] &&
          state.pegs[over] &&
          !state.pegs[to]
        )
          moves.push({ from, to })
      }
    }
    return moves
  },
  isLegal(state: SolitaireState, move: SolitaireMove) {
    return solitaire
      .legalMoves(state)
      .some((candidate) => candidate.from === move.from && candidate.to === move.to)
  },
  applyMove(state: SolitaireState, move: SolitaireMove): SolitaireState {
    if (!solitaire.isLegal(state, move)) throw new Error('Illegal solitaire move')
    const pegs = state.pegs.slice()
    pegs[move.from] = false
    pegs[(move.from + move.to) / 2] = false
    pegs[move.to] = true
    return { pegs }
  },
  outcome(state: SolitaireState): Outcome {
    if (solitaire.legalMoves(state).length > 0) return null
    return state.pegs.filter(Boolean).length === 1 && state.pegs[24]
      ? { winner: 0 }
      : { draw: true }
  },
}
