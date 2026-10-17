import { PEERS, bit, computeCandidates } from '../board'
import type { Grid } from '../types'
import { claiming, pointing, xWing } from './intersections'
import { hiddenSingle, nakedSingle } from './singles'
import { hiddenPair, hiddenTriple, nakedPair, nakedTriple } from './subsets'
import type { Hint, Technique, TechniqueState } from './types'

export type * from './types'

/** Ordered from simplest to hardest; the first applicable technique wins. */
export const TECHNIQUES: readonly Technique[] = [
  nakedSingle,
  hiddenSingle,
  nakedPair,
  pointing,
  claiming,
  hiddenPair,
  nakedTriple,
  hiddenTriple,
  xWing,
]

/**
 * Build technique state from the grid. `eliminated` holds candidates that earlier hints have already
 * ruled out but that plain row/column/box logic would still allow.
 */
export function createState(values: Grid, eliminated?: readonly number[]): TechniqueState {
  const cands = computeCandidates(values).map((m, i) => m & ~(eliminated?.[i] ?? 0))
  return { values: values.slice(), cands }
}

export function findHint(state: TechniqueState): Hint | null {
  for (const technique of TECHNIQUES) {
    const hint = technique.find(state)
    if (hint) return hint
  }
  return null
}

/** Apply a hint to the state in place. */
export function applyHint(state: TechniqueState, hint: Hint): void {
  for (const { cell, digit } of hint.placements) {
    state.values[cell] = digit
    state.cands[cell] = 0
    for (const p of PEERS[cell]!) state.cands[p]! &= ~bit(digit)
  }
  for (const { cell, digit } of hint.eliminations) state.cands[cell]! &= ~bit(digit)
}

/** Solve as far as the techniques allow. Returns the hints used and the resulting grid. */
export function solveWithTechniques(values: Grid): {
  hints: Hint[]
  values: Grid
  solved: boolean
} {
  const state = createState(values)
  const hints: Hint[] = []
  for (let hint = findHint(state); hint; hint = findHint(state)) {
    applyHint(state, hint)
    hints.push(hint)
  }
  return { hints, values: state.values, solved: state.values.every((v) => v !== 0) }
}
