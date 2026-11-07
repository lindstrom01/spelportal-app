import { describe, expect, it } from 'vitest'
import { checkers } from '../rules'

describe('checkers rules', () => {
  it('starts with twelve pieces per side and legal moves for the first player', () => {
    const state = checkers.initialState()
    expect(state.board.filter((piece) => piece === 1)).toHaveLength(12)
    expect(state.board.filter((piece) => piece === 2)).toHaveLength(12)
    expect(checkers.legalMoves(state).length).toBeGreaterThan(0)
  })

  it('requires captures and promotes a piece that reaches the back row', () => {
    const state = {
      board: Array.from({ length: 32 }, (_, i) => (i === 5 ? 2 : i === 9 ? 1 : 0)) as (
        0 | 1 | 2 | 3 | 4
      )[],
      turn: 0 as const,
    }
    const [move] = checkers.legalMoves(state)
    expect(move?.captures).toEqual([5])
    const next = checkers.applyMove(state, move!)
    expect(next.board[0]).toBe(3)
    expect(next.turn).toBe(1)
  })
})
