import type { Rng } from '@/shared/random'
import { createDeck, flip, isRed, suitIndex, type Card } from './cards'

export type Variant = 'klondike' | 'yukon'

export type PileRef =
  { pile: 'waste' } | { pile: 'foundation'; index: number } | { pile: 'tableau'; index: number }

export type PileMove =
  | { type: 'draw' }
  | { type: 'recycle' }
  | { type: 'move'; from: PileRef; count: number; to: PileRef }

export interface PileState {
  variant: Variant
  stock: Card[]
  waste: Card[]
  /** Indexed by suit: S, H, D, C. */
  foundations: Card[][]
  tableau: Card[][]
  drawCount: 1 | 3
}

const emptyFoundations = () => [[], [], [], []] as Card[][]

export function dealKlondike(rng?: Rng, drawCount: 1 | 3 = 1): PileState {
  const deck = createDeck(rng)
  const tableau: Card[][] = []
  for (let i = 0; i < 7; i++) {
    const cards = deck.splice(0, i + 1)
    cards[i] = flip(cards[i]!, true)
    tableau.push(cards)
  }
  return {
    variant: 'klondike',
    stock: deck,
    waste: [],
    foundations: emptyFoundations(),
    tableau,
    drawCount,
  }
}

export function dealYukon(rng?: Rng): PileState {
  const deck = createDeck(rng)
  const tableau: Card[][] = []
  for (let i = 0; i < 7; i++) {
    const down = deck.splice(0, i)
    const up = deck.splice(0, i === 0 ? 1 : 5).map((c) => flip(c, true))
    tableau.push([...down, ...up])
  }
  return {
    variant: 'yukon',
    stock: deck,
    waste: [],
    foundations: emptyFoundations(),
    tableau,
    drawCount: 1,
  }
}

const sourceOf = (s: PileState, ref: PileRef): Card[] | undefined =>
  ref.pile === 'waste'
    ? s.waste
    : ref.pile === 'foundation'
      ? s.foundations[ref.index]
      : s.tableau[ref.index]

const isStackable = (below: Card, onto: Card) =>
  isRed(below) !== isRed(onto) && onto.rank === below.rank - 1

/** The cards a move would pick up, or null when the move is not legal. */
function pickUp(s: PileState, move: Extract<PileMove, { type: 'move' }>): Card[] | null {
  const { from, to, count } = move
  const source = sourceOf(s, from)
  const dest = sourceOf(s, to)
  if (!source || !dest || to.pile === 'waste' || !Number.isInteger(count) || count < 1) return null
  if (from.pile === to.pile && 'index' in from && 'index' in to && from.index === to.index)
    return null
  if (count > source.length || (from.pile !== 'tableau' && count !== 1)) return null
  const moved = source.slice(-count)
  if (!moved.every((c) => c.faceUp)) return null
  if (s.variant === 'klondike') {
    for (let i = 1; i < moved.length; i++) if (!isStackable(moved[i - 1]!, moved[i]!)) return null
  }
  const first = moved[0]!
  if (to.pile === 'tableau') {
    const top = dest.at(-1)
    if (!top) return first.rank === 13 ? moved : null
    return top.faceUp && isStackable(top, first) ? moved : null
  }
  if (count !== 1 || to.index !== suitIndex(first.suit)) return null
  const top = dest.at(-1)
  return first.rank === (top ? top.rank + 1 : 1) ? moved : null
}

export function applyPileMove(s: PileState, move: PileMove): PileState | null {
  const next: PileState = {
    ...s,
    stock: [...s.stock],
    waste: [...s.waste],
    foundations: s.foundations.map((p) => [...p]),
    tableau: s.tableau.map((p) => [...p]),
  }
  if (move.type === 'draw') {
    if (s.variant !== 'klondike' || s.stock.length === 0) return null
    const drawn = next.stock.splice(-s.drawCount).reverse()
    next.waste.push(...drawn.map((c) => flip(c, true)))
    return next
  }
  if (move.type === 'recycle') {
    if (s.variant !== 'klondike' || s.stock.length > 0 || s.waste.length === 0) return null
    next.stock = next.waste.reverse().map((c) => flip(c, false))
    next.waste = []
    return next
  }
  const moved = pickUp(s, move)
  if (!moved) return null
  sourceOf(next, move.from)!.splice(-move.count)
  sourceOf(next, move.to)!.push(...moved)
  if (move.from.pile === 'tableau') {
    const pile = next.tableau[move.from.index]!
    const top = pile.at(-1)
    if (top && !top.faceUp) pile[pile.length - 1] = flip(top, true)
  }
  return next
}

export const isPileWon = (s: PileState) => s.foundations.every((f) => f.length === 13)

/** A move that sends the top card of the given pile to its foundation, if possible. */
export function foundationMoveFor(s: PileState, from: PileRef): PileMove | null {
  const top = sourceOf(s, from)?.at(-1)
  if (!top || from.pile === 'foundation') return null
  const move: PileMove = {
    type: 'move',
    from,
    count: 1,
    to: { pile: 'foundation', index: suitIndex(top.suit) },
  }
  return pickUp(s, move) ? move : null
}
