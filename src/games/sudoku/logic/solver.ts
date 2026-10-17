import { shuffle, type Rng } from '@/shared/random'
import { ALL_DIGITS_MASK, CELLS, PEERS, bit, filledArray, popCount } from './board'
import type { Grid } from './types'

/**
 * Backtracking solver with bitmask candidates and "fewest candidates first" cell choice.
 * Returns up to `limit` solutions. If `rng` is given, digits are tried in random order
 * (used by the generator to build random full grids).
 */
export function solveAll(grid: Grid, limit = 2, rng?: Rng): Grid[] {
  const g = grid.slice()
  // counts[i][d] = number of peers of cell i holding digit d (counters allow cheap undo).
  const counts = Array.from({ length: CELLS }, () => filledArray(10))
  const solutions: Grid[] = []

  const place = (i: number, d: number) => {
    g[i] = d
    for (const p of PEERS[i]!) counts[p]![d]!++
  }
  const unplace = (i: number, d: number) => {
    g[i] = 0
    for (const p of PEERS[i]!) counts[p]![d]!--
  }
  const candidates = (i: number) => {
    let m = ALL_DIGITS_MASK
    for (let d = 1; d <= 9; d++) if (counts[i]![d]! > 0) m &= ~bit(d)
    return m
  }

  for (let i = 0; i < CELLS; i++) {
    const d = grid[i]!
    if (d !== 0) {
      if (counts[i]![d]! > 0) return [] // given digits already conflict
      place(i, d)
    }
  }

  const search = (): void => {
    let best = -1
    let bestMask = 0
    let bestCount = 10
    for (let i = 0; i < CELLS; i++) {
      if (g[i] !== 0) continue
      const m = candidates(i)
      const c = popCount(m)
      if (c < bestCount) {
        best = i
        bestMask = m
        bestCount = c
        if (c <= 1) break
      }
    }
    if (best === -1) {
      solutions.push(g.slice())
      return
    }
    if (bestCount === 0) return

    const digits: number[] = []
    for (let d = 1; d <= 9; d++) if (bestMask & bit(d)) digits.push(d)
    if (rng) shuffle(digits, rng)

    for (const d of digits) {
      place(best, d)
      search()
      unplace(best, d)
      if (solutions.length >= limit) return
    }
  }

  search()
  return solutions
}

export const solve = (grid: Grid): Grid | null => solveAll(grid, 1)[0] ?? null

export const countSolutions = (grid: Grid, limit = 2): number => solveAll(grid, limit).length
