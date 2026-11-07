import { describe, expect, it } from 'vitest'
import { connectFour } from '../rules'

describe('Connect Four rules', () => {
  it('drops pieces to the bottom and detects a vertical win', () => {
    let state = connectFour.initialState()
    for (const column of [0, 1, 0, 1, 0, 1, 0]) state = connectFour.applyMove(state, column)
    expect(state.board.slice(35, 42)).toEqual([0, 1, null, null, null, null, null])
    expect(connectFour.outcome(state)).toEqual({ winner: 0 })
  })

  it('rejects a full column', () => {
    let state = connectFour.initialState()
    for (let i = 0; i < 6; i++) state = connectFour.applyMove(state, 0)
    expect(connectFour.isLegal(state, 0)).toBe(false)
  })
})
