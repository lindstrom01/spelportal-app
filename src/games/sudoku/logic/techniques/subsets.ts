import { UNITS, bit, cellName, maskToDigits, popCount } from '../board'
import type { Elimination, Technique, TechniqueId } from './types'

function combinations<T>(items: readonly T[], k: number): T[][] {
  if (k === 0) return [[]]
  const out: T[][] = []
  items.forEach((item, i) => {
    for (const rest of combinations(items.slice(i + 1), k - 1)) out.push([item, ...rest])
  })
  return out
}

const SIZE_NAMES: Record<number, string> = { 2: 'par', 3: 'trio' }
const list = (items: (string | number)[]) => items.join(', ')

/** N cells in a unit whose candidates together are only N digits: those digits can't go elsewhere in the unit. */
function nakedSubset(size: 2 | 3, id: TechniqueId, name: string): Technique {
  return {
    id,
    name,
    find({ values, cands }) {
      for (const unit of UNITS) {
        const open = unit.filter(
          (c) => values[c] === 0 && popCount(cands[c]!) >= 2 && popCount(cands[c]!) <= size,
        )
        for (const group of combinations(open, size)) {
          const union = group.reduce((m, c) => m | cands[c]!, 0)
          if (popCount(union) !== size) continue
          const eliminations: Elimination[] = []
          for (const c of unit) {
            if (group.includes(c)) continue
            for (const digit of maskToDigits(cands[c]! & union))
              eliminations.push({ cell: c, digit })
          }
          if (eliminations.length === 0) continue
          return {
            technique: id,
            name,
            cells: group,
            placements: [],
            eliminations,
            message: `${list(group.map(cellName))} innehåller tillsammans bara siffrorna ${list(maskToDigits(union))} (naket ${SIZE_NAMES[size]}). De siffrorna måste hamna i just de cellerna, så de kan strykas från övriga celler i samma enhet.`,
          }
        }
      }
      return null
    },
  }
}

/** N digits in a unit that only fit in the same N cells: those cells can't hold anything else. */
function hiddenSubset(size: 2 | 3, id: TechniqueId, name: string): Technique {
  return {
    id,
    name,
    find({ cands }) {
      for (const unit of UNITS) {
        const spots = new Map<number, number[]>()
        for (let digit = 1; digit <= 9; digit++) {
          const cells = unit.filter((c) => cands[c]! & bit(digit))
          if (cells.length >= 1 && cells.length <= size) spots.set(digit, cells)
        }
        for (const digits of combinations([...spots.keys()], size)) {
          const cells = [...new Set(digits.flatMap((d) => spots.get(d)!))]
          if (cells.length !== size) continue
          const keep = digits.reduce((m, d) => m | bit(d), 0)
          const eliminations: Elimination[] = []
          for (const c of cells) {
            for (const digit of maskToDigits(cands[c]! & ~keep))
              eliminations.push({ cell: c, digit })
          }
          if (eliminations.length === 0) continue
          return {
            technique: id,
            name,
            cells,
            placements: [],
            eliminations,
            message: `Siffrorna ${list(digits)} kan bara placeras i ${list(cells.map(cellName))} (gömt ${SIZE_NAMES[size]}). Därför kan alla andra kandidater i de cellerna strykas.`,
          }
        }
      }
      return null
    },
  }
}

export const nakedPair = nakedSubset(2, 'nakedPair', 'Naket par')
export const nakedTriple = nakedSubset(3, 'nakedTriple', 'Naken trio')
export const hiddenPair = hiddenSubset(2, 'hiddenPair', 'Gömt par')
export const hiddenTriple = hiddenSubset(3, 'hiddenTriple', 'Gömd trio')
