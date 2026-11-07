export const CATEGORIES = [
  { id: 'ones', label: 'Ettor', group: 'Övre' },
  { id: 'twos', label: 'Tvåor', group: 'Övre' },
  { id: 'threes', label: 'Treor', group: 'Övre' },
  { id: 'fours', label: 'Fyror', group: 'Övre' },
  { id: 'fives', label: 'Femmor', group: 'Övre' },
  { id: 'sixes', label: 'Sexor', group: 'Övre' },
  { id: 'pair', label: 'Ett par', group: 'Nedre' },
  { id: 'twoPairs', label: 'Två par', group: 'Nedre' },
  { id: 'threeKind', label: 'Tretal', group: 'Nedre' },
  { id: 'fourKind', label: 'Fyrtal', group: 'Nedre' },
  { id: 'smallStraight', label: 'Liten stege', group: 'Nedre' },
  { id: 'largeStraight', label: 'Stor stege', group: 'Nedre' },
  { id: 'fullHouse', label: 'Kåk', group: 'Nedre' },
  { id: 'chance', label: 'Chans', group: 'Nedre' },
  { id: 'yatzy', label: 'Yatzy', group: 'Nedre' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']
export type ScoreCard = Partial<Record<CategoryId, number>>

export function scoreCategory(dice: number[], category: CategoryId): number {
  const counts = Array.from({ length: 7 }, (_, face) => dice.filter((die) => die === face).length)
  const sum = dice.reduce((total, die) => total + die, 0)
  switch (category) {
    case 'ones':
    case 'twos':
    case 'threes':
    case 'fours':
    case 'fives':
    case 'sixes': {
      const face = CATEGORIES.findIndex((entry) => entry.id === category) + 1
      return counts[face]! * face
    }
    case 'pair':
      for (let face = 6; face >= 1; face--) if (counts[face]! >= 2) return face * 2
      return 0
    case 'twoPairs': {
      const pairs = counts
        .flatMap((count, face) => (count >= 2 ? [face] : []))
        .filter((face) => face > 0)
      return pairs.length >= 2 ? (pairs.at(-1)! + pairs.at(-2)!) * 2 : 0
    }
    case 'threeKind':
      for (let face = 6; face >= 1; face--) if (counts[face]! >= 3) return face * 3
      return 0
    case 'fourKind':
      for (let face = 6; face >= 1; face--) if (counts[face]! >= 4) return face * 4
      return 0
    case 'smallStraight':
      return [1, 2, 3, 4, 5].every((face) => counts[face] === 1) ? 15 : 0
    case 'largeStraight':
      return [2, 3, 4, 5, 6].every((face) => counts[face] === 1) ? 20 : 0
    case 'fullHouse': {
      const groups = counts.filter((count) => count > 0).sort((a, b) => a - b)
      return groups.length === 2 && groups[0] === 2 && groups[1] === 3 ? sum : 0
    }
    case 'chance':
      return sum
    case 'yatzy':
      return counts.some((count) => count === 5) ? 50 : 0
  }
}

export function totalScore(scoreCard: ScoreCard): number {
  const upper = CATEGORIES.slice(0, 6).reduce((sum, { id }) => sum + (scoreCard[id] ?? 0), 0)
  const lower = CATEGORIES.slice(6).reduce((sum, { id }) => sum + (scoreCard[id] ?? 0), 0)
  return upper + lower + (upper >= 63 ? 50 : 0)
}
