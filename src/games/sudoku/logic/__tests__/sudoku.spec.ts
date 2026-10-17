import { describe, expect, it } from 'vitest'
import { computeCandidates, emptyGrid, findConflicts, maskToDigits } from '../board'
import { CLUES, generatePuzzle } from '../generator'
import { countSolutions, solve } from '../solver'
import { DIFFICULTIES } from '../types'

// Small deterministic PRNG (mulberry32)
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('solver', () => {
  it('solves an empty grid to a valid full grid', () => {
    const s = solve(emptyGrid())!
    expect(s.every((v) => v >= 1 && v <= 9)).toBe(true)
    expect(findConflicts(s).size).toBe(0)
  })

  it('rejects a grid with conflicting givens', () => {
    const g = emptyGrid()
    g[0] = 5
    g[1] = 5
    expect(solve(g)).toBeNull()
  })

  it('detects multiple solutions', () => {
    expect(countSolutions(emptyGrid(), 2)).toBe(2)
  })
})

describe('generator', () => {
  for (const level of DIFFICULTIES) {
    it(`generates a unique-solution ${level} puzzle`, () => {
      const { puzzle, solution } = generatePuzzle(level, seeded(42))
      expect(countSolutions(puzzle, 2)).toBe(1)
      expect(solve(puzzle)).toEqual(solution)
      const clues = puzzle.filter((v) => v !== 0).length
      expect(clues).toBeGreaterThanOrEqual(CLUES[level])
      expect(clues).toBeLessThanOrEqual(CLUES[level] + 4)
      expect(puzzle.every((v, i) => v === 0 || v === solution[i])).toBe(true)
    })
  }
})

describe('candidates', () => {
  it('excludes digits used by peers', () => {
    const g = emptyGrid()
    g[1] = 3
    g[9] = 4
    expect(maskToDigits(computeCandidates(g)[0]!)).toEqual([1, 2, 5, 6, 7, 8, 9])
  })
})
