const files = import.meta.glob<string>('@/assets/cards/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const RANK_CODES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

export const cardBackUrl: string | undefined = files['/src/assets/cards/back.svg']

/** URL of the SVG for a card, e.g. rank 12 of hearts -> QH.svg. */
export function cardImageUrl(rank: number, suit: string): string | undefined {
  return files[`/src/assets/cards/${RANK_CODES[rank - 1]}${suit}.svg`]
}
