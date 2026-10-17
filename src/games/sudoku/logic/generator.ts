import { CELLS, emptyGrid } from './board'
import { shuffle, type Rng } from '@/shared/random'
import { countSolutions, solveAll } from './solver'
import type { Difficulty, Puzzle } from './types'

/** Target number of given digits per difficulty. Fewer clues => harder. */
export const CLUES: Record<Difficulty, number> = {
  easy: 40,
  medium: 33,
  hard: 28,
  expert: 24,
}

export function generatePuzzle(difficulty: Difficulty, rng: Rng = Math.random): Puzzle {
  const solution = solveAll(emptyGrid(), 1, rng)[0]!
  const puzzle = solution.slice()
  let clues = CELLS

  // Remove cells in random order, keeping only removals that preserve a unique solution.
  const order = shuffle(
    Array.from({ length: CELLS }, (_, i) => i),
    rng,
  )
  for (const i of order) {
    if (clues <= CLUES[difficulty]) break
    const value = puzzle[i]!
    puzzle[i] = 0
    if (countSolutions(puzzle, 2) === 1) clues--
    else puzzle[i] = value
  }

  return { puzzle, solution, difficulty }
}
