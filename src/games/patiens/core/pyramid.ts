import type { Rng } from '@/shared/random'
import { createDeck, flip, type Card } from './cards'

export type PyramidRef = { pile: 'pyramid'; row: number; col: number } | { pile: 'waste' }

export type PyramidMove =
  { type: 'draw' } | { type: 'recycle' } | { type: 'remove'; refs: PyramidRef[] }

export interface PyramidState {
  /** Row r has r + 1 slots; removed cards are null. */
  pyramid: (Card | null)[][]
  stock: Card[]
  waste: Card[]
  recyclesLeft: number
}

export function dealPyramid(rng?: Rng): PyramidState {
  const deck = createDeck(rng).map((c) => flip(c, true))
  const pyramid = Array.from({ length: 7 }, (_, r): (Card | null)[] => deck.splice(0, r + 1))
  return { pyramid, stock: deck, waste: [], recyclesLeft: 2 }
}

export function isFree(s: PyramidState, row: number, col: number): boolean {
  if (!s.pyramid[row]?.[col]) return false
  if (row === 6) return true
  const below = s.pyramid[row + 1]!
  return below[col] === null && below[col + 1] === null
}

function cardAt(s: PyramidState, ref: PyramidRef): Card | null {
  if (ref.pile === 'waste') return s.waste.at(-1) ?? null
  return isFree(s, ref.row, ref.col) ? s.pyramid[ref.row]![ref.col]! : null
}

export function applyPyramidMove(s: PyramidState, move: PyramidMove): PyramidState | null {
  if (move.type === 'draw') {
    if (s.stock.length === 0) return null
    return { ...s, stock: s.stock.slice(0, -1), waste: [...s.waste, s.stock.at(-1)!] }
  }
  if (move.type === 'recycle') {
    if (s.stock.length > 0 || s.waste.length === 0 || s.recyclesLeft <= 0) return null
    return { ...s, stock: [...s.waste].reverse(), waste: [], recyclesLeft: s.recyclesLeft - 1 }
  }
  const { refs } = move
  if (refs.length < 1 || refs.length > 2) return null
  if (refs.length === 2) {
    const [a, b] = refs as [PyramidRef, PyramidRef]
    if (a.pile === 'waste' && b.pile === 'waste') return null
    if (a.pile === 'pyramid' && b.pile === 'pyramid' && a.row === b.row && a.col === b.col)
      return null
  }
  const cards = refs.map((r) => cardAt(s, r))
  if (cards.some((c) => c === null)) return null
  const sum = cards.reduce((acc, c) => acc + c!.rank, 0)
  if (sum !== 13) return null

  const next: PyramidState = { ...s, pyramid: s.pyramid.map((r) => [...r]), waste: [...s.waste] }
  for (const ref of refs) {
    if (ref.pile === 'waste') next.waste.pop()
    else next.pyramid[ref.row]![ref.col] = null
  }
  return next
}

export const isPyramidWon = (s: PyramidState) =>
  s.pyramid.every((row) => row.every((c) => c === null))

/** True when no draw, recycle or removal is possible and the game is not won. */
export function isPyramidStuck(s: PyramidState): boolean {
  if (isPyramidWon(s)) return false
  if (s.stock.length > 0 || (s.waste.length > 0 && s.recyclesLeft > 0)) return false
  const open: PyramidRef[] = []
  s.pyramid.forEach((row, r) =>
    row.forEach((_, c) => {
      if (isFree(s, r, c)) open.push({ pile: 'pyramid', row: r, col: c })
    }),
  )
  if (s.waste.length > 0) open.push({ pile: 'waste' })
  for (let i = 0; i < open.length; i++) {
    if (applyPyramidMove(s, { type: 'remove', refs: [open[i]!] })) return false
    for (let j = i + 1; j < open.length; j++) {
      if (applyPyramidMove(s, { type: 'remove', refs: [open[i]!, open[j]!] })) return false
    }
  }
  return true
}
