import { shuffle, type Rng } from '@/shared/random'

export const SUITS = ['S', 'H', 'D', 'C'] as const
export type Suit = (typeof SUITS)[number]

export interface Card {
  suit: Suit
  /** 1 = ace … 13 = king */
  rank: number
  faceUp: boolean
}

export const suitIndex = (suit: Suit) => SUITS.indexOf(suit)
export const isRed = (card: Card) => card.suit === 'H' || card.suit === 'D'
export const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
const RANK_LABELS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export const rankLabel = (rank: number) => RANK_LABELS[rank - 1]!

export const flip = (card: Card, faceUp: boolean): Card => ({ ...card, faceUp })

/** A shuffled 52-card deck, all face down. */
export function createDeck(rng: Rng = Math.random): Card[] {
  const deck = SUITS.flatMap((suit) =>
    Array.from({ length: 13 }, (_, i): Card => ({ suit, rank: i + 1, faceUp: false })),
  )
  return shuffle(deck, rng)
}
