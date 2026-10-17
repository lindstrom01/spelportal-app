import { describe, expect, it } from 'vitest'
import { randomAi } from '@/core/boardgame/ai'
import { othello, score } from '../rules'

describe('othello rules', () => {
  it('starts with four discs and four legal moves for black', () => {
    const s = othello.initialState()
    expect(score(s.board)).toEqual([2, 2])
    expect(othello.legalMoves(s).sort((a, b) => a - b)).toEqual([19, 26, 37, 44])
  })

  it('flips discs and passes turn', () => {
    const s = othello.applyMove(othello.initialState(), 19)
    expect(score(s.board)).toEqual([4, 1])
    expect(s.turn).toBe(1)
  })

  it('rejects illegal moves', () => {
    const s = othello.initialState()
    expect(othello.isLegal(s, 0)).toBe(false)
    expect(() => othello.applyMove(s, 0)).toThrow()
  })

  it('random games always terminate with an outcome', () => {
    const ai = randomAi(othello)
    for (let g = 0; g < 20; g++) {
      let s = othello.initialState()
      let n = 0
      while (!othello.outcome(s) && n++ < 100) s = othello.applyMove(s, ai(s))
      expect(othello.outcome(s)).not.toBeNull()
    }
  })
})
