import { describe, expect, it } from 'vitest'
import { bit, emptyGrid } from '../../board'
import { generatePuzzle } from '../../generator'
import { DIFFICULTIES } from '../../types'
import { applyHint, createState, findHint, solveWithTechniques } from '../index'
import { xWing } from '../intersections'

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Classic puzzle that is solvable with singles only
const EASY =
  '530070000600195000098000060800060003400803001700020006060000280000419005000080079'.padEnd(
    81,
    '0',
  )
const parse = (s: string) => [...s].map(Number)

describe('techniques', () => {
  it('solves a singles-only puzzle completely', () => {
    const result = solveWithTechniques(parse(EASY))
    expect(result.solved).toBe(true)
    expect(result.hints.every((h) => h.technique.endsWith('Single'))).toBe(true)
  })

  it('finds no hint on an empty grid', () => {
    expect(findHint(createState(emptyGrid()))).toBeNull()
  })

  it('finds a naked pair and eliminates from the rest of the unit', () => {
    const state = createState(emptyGrid())
    state.cands[0] = bit(1) | bit(2)
    state.cands[1] = bit(1) | bit(2)
    const hint = findHint(state)!
    expect(hint.technique).toBe('nakedPair')
    applyHint(state, hint)
    expect(state.cands[2]! & (bit(1) | bit(2))).toBe(0)
  })

  it('finds an X-Wing', () => {
    const state = createState(emptyGrid())
    state.cands.fill(0)
    // Digit 7 in columns 0 and 4 of rows 0 and 3, plus an extra candidate in column 0 of row 5.
    for (const c of [0, 4, 27, 31, 45]) state.cands[c] = bit(7)
    const hint = xWing.find(state)!
    expect(hint.eliminations).toEqual([{ cell: 45, digit: 7 }])
  })

  for (const level of DIFFICULTIES) {
    it(`only gives sound hints on ${level} puzzles`, () => {
      const rng = seeded(7)
      for (let n = 0; n < 5; n++) {
        const { puzzle, solution } = generatePuzzle(level, rng)
        const state = createState(puzzle)
        for (let hint = findHint(state); hint; hint = findHint(state)) {
          const sound =
            hint.placements.every((p) => solution[p.cell] === p.digit) &&
            hint.eliminations.every((e) => solution[e.cell] !== e.digit)
          expect(sound).toBe(true)
          applyHint(state, hint)
        }
      }
    })
  }
})
