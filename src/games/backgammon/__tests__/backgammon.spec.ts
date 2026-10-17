import { describe, expect, it } from 'vitest'
import {
  BAR,
  PASS,
  backgammon,
  greedyAi,
  pipCount,
  randomMoveAi,
  type BackgammonState,
} from '../rules'

const empty = (over: Partial<BackgammonState> = {}): BackgammonState => ({
  points: Array<number>(24).fill(0),
  bar: [0, 0],
  off: [0, 0],
  turn: 0,
  dice: [3, 2],
  seed: 1,
  ...over,
})

describe('backgammon rules', () => {
  it('starts with 15 checkers each and 167 pips', () => {
    const s = backgammon.initialState(42)
    expect(s.points.filter((p) => p > 0).reduce((a, b) => a + b, 0)).toBe(15)
    expect(-s.points.filter((p) => p < 0).reduce((a, b) => a + b, 0)).toBe(15)
    expect(pipCount(s, 0)).toBe(167)
    expect(pipCount(s, 1)).toBe(167)
    expect(backgammon.legalMoves(s).length).toBeGreaterThan(0)
  })

  it('is deterministic for a given seed', () => {
    expect(backgammon.initialState(7).dice).toEqual(backgammon.initialState(7).dice)
  })

  it('hits a blot and sends it to the bar', () => {
    const points = Array<number>(24).fill(0)
    points[10] = 1
    points[8] = -1
    const s = backgammon.applyMove(empty({ points, dice: [2, 1] }), { from: 10, die: 2 })
    expect(s.bar[1]).toBe(1)
    expect(s.points[8]).toBe(1)
  })

  it('cannot land on a blocked point', () => {
    const points = Array<number>(24).fill(0)
    points[10] = 1
    points[8] = -2
    const s = empty({ points, dice: [2] })
    expect(backgammon.isLegal(s, { from: 10, die: 2 })).toBe(false)
  })

  it('must enter from the bar before anything else', () => {
    const points = Array<number>(24).fill(0)
    points[10] = 1
    const moves = backgammon.legalMoves(empty({ points, bar: [1, 0], dice: [3, 2] }))
    expect(moves.every((m) => m.from === BAR)).toBe(true)
  })

  it('bears off only when all checkers are home, with overshoot from the highest point', () => {
    const points = Array<number>(24).fill(0)
    points[3] = 1
    points[1] = 1
    const s = empty({ points, dice: [6] })
    expect(backgammon.isLegal(s, { from: 3, die: 6 })).toBe(true)
    expect(backgammon.isLegal(s, { from: 1, die: 6 })).toBe(false)
    const away = empty({ points: points.map((v, i) => (i === 12 ? 1 : v)), dice: [6] })
    expect(away.points[12]).toBe(1)
    expect(backgammon.legalMoves(away).some((m) => m.from === 3)).toBe(false)
  })

  it('offers a pass when blocked and then hands over the turn', () => {
    const points = Array<number>(24).fill(0)
    points[5] = 1
    for (const i of [0, 1, 2, 3, 4]) points[i] = -2
    const s = empty({ points, dice: [5, 3] })
    expect(backgammon.legalMoves(s)).toEqual([PASS])
    expect(backgammon.applyMove(s, PASS).turn).toBe(1)
  })

  it('uses the larger die when only one can be played', () => {
    const points = Array<number>(24).fill(0)
    points[10] = 1
    points[7] = -2 // blocks 3 after playing 3? 10-3=7 blocked, 10-5=5 free
    points[3] = -2 // second step 5->? blocks 2 after the 5 (5-2=3)
    const s = empty({ points, dice: [5, 3] })
    const moves = backgammon.legalMoves(s)
    expect(moves.map((m) => m.die)).toEqual([5])
  })

  it('random and greedy games finish', () => {
    const ais = [randomMoveAi(), greedyAi()]
    for (let g = 0; g < 3; g++) {
      let s = backgammon.initialState(g + 1)
      let n = 0
      while (!backgammon.outcome(s) && n++ < 5000) s = backgammon.applyMove(s, ais[g % 2]!(s))
      expect(backgammon.outcome(s)).not.toBeNull()
    }
  })
})
