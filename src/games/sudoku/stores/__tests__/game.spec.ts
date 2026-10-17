import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGameStore } from '../game'

describe('game store hints', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('applying hints repeatedly never introduces mistakes', () => {
    const game = useGameStore()
    game.newGame('medium')
    for (let n = 0; n < 200 && !game.isSolved; n++) {
      game.requestHint()
      if (!game.hint) break
      game.applyCurrentHint()
      expect(game.mistakes).toEqual([])
    }
  })

  it('refuses to hint while the board contains a mistake', () => {
    const game = useGameStore()
    game.newGame('easy')
    const cell = game.values.findIndex((v) => v === 0)
    game.select(cell)
    game.input(game.solution[cell]! === 1 ? 2 : 1)
    game.requestHint()
    expect(game.hint).toBeNull()
    expect(game.hintMessage).toContain('felaktiga')
  })

  it('undo restores the state before an applied hint', () => {
    const game = useGameStore()
    game.newGame('easy')
    const before = game.values.slice()
    game.requestHint()
    game.applyCurrentHint()
    game.undo()
    expect(game.values).toEqual(before)
  })
})
