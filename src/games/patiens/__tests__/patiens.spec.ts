import { describe, expect, it } from 'vitest'
import { seededRng } from '@/shared/random'
import type { Card, Suit } from '../core/cards'
import {
  applyPileMove,
  dealKlondike,
  dealYukon,
  foundationMoveFor,
  isPileWon,
  type PileMove,
  type PileState,
} from '../core/pileGame'
import {
  applyPyramidMove,
  dealPyramid,
  isFree,
  isPyramidStuck,
  isPyramidWon,
  type PyramidState,
} from '../core/pyramid'
import { useSolitaire } from '../core/useSolitaire'

const c = (suit: Suit, rank: number, faceUp = true): Card => ({ suit, rank, faceUp })
const count = (s: PileState) =>
  s.stock.length +
  s.waste.length +
  s.foundations.concat(s.tableau).reduce((n, p) => n + p.length, 0)
const empty = (variant: PileState['variant'] = 'klondike'): PileState => ({
  variant,
  stock: [],
  waste: [],
  foundations: [[], [], [], []],
  tableau: Array.from({ length: 7 }, () => []),
  drawCount: 1,
})
const tab = (a: number, b: number, n = 1): PileMove => ({
  type: 'move',
  from: { pile: 'tableau', index: a },
  count: n,
  to: { pile: 'tableau', index: b },
})

describe('deals', () => {
  it('klondike: 52 cards, 28 on the tableau with one face-up card per column', () => {
    const s = dealKlondike(seededRng(1))
    expect(count(s)).toBe(52)
    expect(s.stock).toHaveLength(24)
    s.tableau.forEach((col, i) => {
      expect(col).toHaveLength(i + 1)
      expect(col.filter((x) => x.faceUp)).toHaveLength(1)
      expect(col.at(-1)!.faceUp).toBe(true)
    })
  })

  it('yukon: 52 cards on the tableau, no stock', () => {
    const s = dealYukon(seededRng(2))
    expect(count(s)).toBe(52)
    expect(s.stock).toHaveLength(0)
    expect(s.tableau.map((p) => p.length)).toEqual([1, 6, 7, 8, 9, 10, 11])
    expect(s.tableau[3]!.filter((x) => !x.faceUp)).toHaveLength(3)
  })
})

describe('pile moves', () => {
  it('stacks alternating colours downwards and flips the revealed card', () => {
    const s = empty()
    s.tableau[0] = [c('C', 9, false), c('H', 5)]
    s.tableau[1] = [c('S', 6)]
    const next = applyPileMove(s, tab(0, 1))!
    expect(next.tableau[1]).toHaveLength(2)
    expect(next.tableau[0]![0]!.faceUp).toBe(true)
    expect(s.tableau[1]).toHaveLength(1)
  })

  it('rejects same colour and only allows kings on empty columns', () => {
    const s = empty()
    s.tableau[0] = [c('H', 5)]
    s.tableau[1] = [c('D', 6)]
    s.tableau[2] = [c('S', 12)]
    expect(applyPileMove(s, tab(0, 1))).toBeNull()
    expect(applyPileMove(s, tab(2, 3))).toBeNull()
    s.tableau[2] = [c('S', 13)]
    expect(applyPileMove(s, tab(2, 3))).not.toBeNull()
  })

  it('builds foundations by suit starting with the ace', () => {
    const s = empty()
    s.tableau[0] = [c('H', 2)]
    s.tableau[1] = [c('H', 1)]
    expect(foundationMoveFor(s, { pile: 'tableau', index: 0 })).toBeNull()
    const move = foundationMoveFor(s, { pile: 'tableau', index: 1 })!
    const next = applyPileMove(s, move)!
    expect(next.foundations[1]).toHaveLength(1)
    expect(foundationMoveFor(next, { pile: 'tableau', index: 0 })).not.toBeNull()
  })

  it('draws, recycles the waste and recognises a won game', () => {
    const s = empty()
    s.stock = [c('S', 1, false), c('S', 2, false)]
    const drawn = applyPileMove(applyPileMove(s, { type: 'draw' })!, { type: 'draw' })!
    expect(drawn.waste.map((x) => x.rank)).toEqual([2, 1])
    expect(applyPileMove(drawn, { type: 'draw' })).toBeNull()
    const recycled = applyPileMove(drawn, { type: 'recycle' })!
    expect(recycled.stock.at(-1)).toMatchObject({ rank: 2, faceUp: false })

    const full = empty()
    full.foundations = (['S', 'H', 'D', 'C'] as Suit[]).map((suit) =>
      Array.from({ length: 13 }, (_, i) => c(suit, i + 1)),
    )
    expect(isPileWon(full)).toBe(true)
  })

  it('yukon moves any face-up run regardless of sequence', () => {
    const s = empty('yukon')
    s.tableau[0] = [c('H', 5), c('S', 2), c('C', 9)]
    s.tableau[1] = [c('S', 6)]
    expect(applyPileMove(s, tab(0, 1, 3))!.tableau[1]).toHaveLength(4)
    expect(applyPileMove(s, { type: 'draw' })).toBeNull()
  })
})

describe('pyramid', () => {
  it('deals 28 pyramid cards and 24 stock cards; only the bottom row is free at first', () => {
    const s = dealPyramid(seededRng(3))
    expect(s.pyramid.flat()).toHaveLength(28)
    expect(s.stock).toHaveLength(24)
    expect(isFree(s, 6, 0)).toBe(true)
    expect(isFree(s, 5, 0)).toBe(false)
  })

  const build = (): PyramidState => {
    const pyramid = Array.from({ length: 7 }, (_, r) =>
      Array.from({ length: r + 1 }, () => c('S', 5) as Card | null),
    )
    pyramid[6]![0] = c('H', 6)
    pyramid[6]![1] = c('D', 7)
    pyramid[6]![2] = c('C', 13)
    return { pyramid, stock: [], waste: [], recyclesLeft: 0 }
  }

  it('removes pairs summing to 13 and lone kings, but not covered cards', () => {
    const s = build()
    const pair = applyPyramidMove(s, {
      type: 'remove',
      refs: [
        { pile: 'pyramid', row: 6, col: 0 },
        { pile: 'pyramid', row: 6, col: 1 },
      ],
    })!
    expect(pair.pyramid[6]![0]).toBeNull()
    expect(
      applyPyramidMove(s, { type: 'remove', refs: [{ pile: 'pyramid', row: 6, col: 2 }] }),
    ).not.toBeNull()
    expect(
      applyPyramidMove(s, { type: 'remove', refs: [{ pile: 'pyramid', row: 5, col: 0 }] }),
    ).toBeNull()
    expect(isPyramidWon(s)).toBe(false)
  })

  it('detects a stuck position', () => {
    const s = build()
    s.pyramid = s.pyramid.map((row) => row.map(() => null))
    s.pyramid[6]![0] = c('S', 2)
    s.pyramid[6]![1] = c('S', 3)
    expect(isPyramidStuck(s)).toBe(true)
    s.pyramid[6]![1] = c('S', 11)
    expect(isPyramidStuck(s)).toBe(false)
  })
})

describe('useSolitaire', () => {
  it('supports undo and restart', () => {
    const game = useSolitaire<PileState, PileMove>({
      deal: () => dealKlondike(seededRng(5)),
      apply: applyPileMove,
      isWon: isPileWon,
    })
    const start = game.state.value
    expect(game.play({ type: 'draw' })).toBe(true)
    expect(game.state.value.waste).toHaveLength(1)
    game.undo()
    expect(game.state.value).toBe(start)
    game.play({ type: 'draw' })
    game.restart()
    expect(game.state.value).toBe(start)
    expect(game.canUndo.value).toBe(false)
  })
})
