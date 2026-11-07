import { describe, expect, it } from 'vitest'
import { HOLES, solitaire } from '../rules'

describe('peg solitaire rules', () => {
  it('starts with 32 pegs on a 33-hole board', () => {
    const state = solitaire.initialState()
    expect(HOLES.filter(Boolean)).toHaveLength(33)
    expect(state.pegs.filter(Boolean)).toHaveLength(32)
    expect(state.pegs[24]).toBe(false)
  })

  it('jumps over and removes a peg', () => {
    const state = solitaire.initialState()
    const move = solitaire.legalMoves(state)[0]!
    const next = solitaire.applyMove(state, move)
    expect(next.pegs.filter(Boolean)).toHaveLength(31)
    expect(next.pegs[move.from]).toBe(false)
    expect(next.pegs[move.to]).toBe(true)
  })
})
