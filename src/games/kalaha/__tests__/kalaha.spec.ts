import { describe, expect, it } from 'vitest'
import { kalaha } from '../rules'

describe('Kalaha rules', () => {
  it('starts with four stones in every pit', () => {
    expect(kalaha.initialState().pits).toEqual(Array(14).fill(4))
  })

  it('grants an extra turn when the last stone lands in the store', () => {
    const state = kalaha.initialState()
    state.pits[0] = 6
    const next = kalaha.applyMove(state, 0)
    expect(next.turn).toBe(0)
    expect(next.pits[6]).toBe(5)
  })

  it('rejects empty pits', () => {
    const state = kalaha.initialState()
    state.pits[0] = 0
    expect(kalaha.isLegal(state, 0)).toBe(false)
  })
})
