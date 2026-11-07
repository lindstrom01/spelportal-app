import type { Outcome, PlayerId } from '@/core/boardgame/types'

export interface KalahaState {
  pits: number[]
  turn: PlayerId
}
const ownPits = (player: PlayerId) => (player === 0 ? [0, 1, 2, 3, 4, 5] : [7, 8, 9, 10, 11, 12])

function finishIfEmpty(pits: number[], turn: PlayerId): KalahaState | null {
  const firstEmpty = ownPits(0).every((i) => pits[i] === 0)
  const secondEmpty = ownPits(1).every((i) => pits[i] === 0)
  if (!firstEmpty && !secondEmpty) return null
  for (const i of ownPits(0)) {
    pits[6] = pits[6]! + pits[i]!
    pits[i] = 0
  }
  for (const i of ownPits(1)) {
    pits[13] = pits[13]! + pits[i]!
    pits[i] = 0
  }
  return { pits, turn }
}

export const kalaha = {
  initialState: (): KalahaState => ({ pits: Array(14).fill(4), turn: 0 }),
  legalMoves(state: KalahaState) {
    return ownPits(state.turn).filter((i) => state.pits[i]! > 0)
  },
  isLegal(state: KalahaState, pit: number) {
    return Number.isInteger(pit) && kalaha.legalMoves(state).includes(pit) && !kalaha.outcome(state)
  },
  applyMove(state: KalahaState, pit: number): KalahaState {
    if (!kalaha.isLegal(state, pit)) throw new Error('Illegal Kalaha move')
    const pits = state.pits.slice()
    let stones = pits[pit]!
    pits[pit] = 0
    let at = pit
    while (stones > 0) {
      at = (at + 1) % 14
      if ((state.turn === 0 && at === 13) || (state.turn === 1 && at === 6)) continue
      pits[at] = pits[at]! + 1
      stones--
    }
    let turn = state.turn
    if (at !== (state.turn === 0 ? 6 : 13)) {
      const own = state.turn === 0 ? at >= 0 && at <= 5 : at >= 7 && at <= 12
      if (own && pits[at] === 1 && pits[state.turn === 0 ? 12 - at : 12 - at]! > 0) {
        const opposite = 12 - at
        const store = state.turn === 0 ? 6 : 13
        pits[store] = pits[store]! + pits[opposite]! + 1
        pits[opposite] = 0
        pits[at] = 0
      }
      turn = (1 - turn) as PlayerId
    }
    return finishIfEmpty(pits, turn) ?? { pits, turn }
  },
  outcome(state: KalahaState): Outcome {
    if (
      state.pits.slice(0, 6).every((n) => n === 0) ||
      state.pits.slice(7, 13).every((n) => n === 0)
    ) {
      if (state.pits[6] === state.pits[13]) return { draw: true }
      return { winner: state.pits[6]! > state.pits[13]! ? 0 : 1 }
    }
    return null
  },
}
