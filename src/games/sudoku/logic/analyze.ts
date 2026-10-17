import { CELLS, SIZE, findConflicts } from './board'
import { countSolutions } from './solver'
import type { Grid } from './types'

export interface GridAnalysis {
  conflicts: Set<number>
  givens: number
  /** 0 = unsolvable, 1 = unique solution, 2 = more than one solution. */
  solutions: 0 | 1 | 2
  /** True when the grid can be played: no conflicts and exactly one solution. */
  playable: boolean
}

/** Check a hand-entered or scanned grid before it is turned into a game. */
export function analyzeGrid(grid: Grid): GridAnalysis {
  const conflicts = findConflicts(grid)
  const givens = grid.filter((v) => v !== 0).length
  const solutions = conflicts.size > 0 ? 0 : (countSolutions(grid, 2) as 0 | 1 | 2)
  return { conflicts, givens, solutions, playable: conflicts.size === 0 && solutions === 1 }
}

export function isValidGrid(grid: Grid): boolean {
  return grid.length === CELLS && grid.every((v) => Number.isInteger(v) && v >= 0 && v <= SIZE)
}
