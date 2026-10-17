import { BOXES, COLS, ROWS, bit, boxOf, cellName, colOf, rowOf } from '../board'
import type { Elimination, Technique } from './types'

const lines = [...ROWS, ...COLS]

/**
 * Locked candidates. If all spots for a digit in a box lie on one line (pointing), the digit can be
 * removed from the rest of that line. If all spots in a line lie in one box (claiming), the digit can
 * be removed from the rest of that box.
 */
function lockedCandidates(kind: 'pointing' | 'claiming'): Technique {
  const name = kind === 'pointing' ? 'Pekande par' : 'Låsta kandidater'
  return {
    id: kind,
    name,
    find({ cands }) {
      const sources = kind === 'pointing' ? BOXES : lines
      for (const source of sources) {
        for (let digit = 1; digit <= 9; digit++) {
          const spots = source.filter((c) => cands[c]! & bit(digit))
          if (spots.length < 2) continue

          const first = spots[0]!
          let target: readonly number[] | undefined
          if (kind === 'pointing') {
            if (spots.every((c) => rowOf(c) === rowOf(first))) target = ROWS[rowOf(first)]
            else if (spots.every((c) => colOf(c) === colOf(first))) target = COLS[colOf(first)]
          } else if (spots.every((c) => boxOf(c) === boxOf(first))) {
            target = BOXES[boxOf(first)]
          }
          if (!target) continue

          const eliminations: Elimination[] = target
            .filter((c) => !spots.includes(c) && cands[c]! & bit(digit))
            .map((cell) => ({ cell, digit }))
          if (eliminations.length === 0) continue

          const where = spots.map(cellName).join(', ')
          const message =
            kind === 'pointing'
              ? `I rutan kan ${digit} bara stå i ${where}, som ligger på samma linje. Därför kan ${digit} strykas från resten av den linjen utanför rutan.`
              : `På linjen kan ${digit} bara stå i ${where}, som ligger i samma ruta. Därför kan ${digit} strykas från resten av rutan.`
          return { technique: kind, name, cells: spots, placements: [], eliminations, message }
        }
      }
      return null
    },
  }
}

export const pointing = lockedCandidates('pointing')
export const claiming = lockedCandidates('claiming')

/** X-Wing: a digit confined to the same two crossing lines in two parallel lines. */
export const xWing: Technique = {
  id: 'xWing',
  name: 'X-Wing',
  find({ cands }) {
    const orientations = [
      { base: ROWS, cover: COLS, coverIndex: colOf, label: ['rader', 'kolumner'] },
      { base: COLS, cover: ROWS, coverIndex: rowOf, label: ['kolumner', 'rader'] },
    ] as const
    for (const { base, cover, coverIndex, label } of orientations) {
      for (let digit = 1; digit <= 9; digit++) {
        const perLine = base.map((line) => line.filter((c) => cands[c]! & bit(digit)))
        for (let a = 0; a < 9; a++) {
          const lineA = perLine[a]!
          if (lineA.length !== 2) continue
          for (let b = a + 1; b < 9; b++) {
            const lineB = perLine[b]!
            if (lineB.length !== 2) continue
            if (coverIndex(lineA[0]!) !== coverIndex(lineB[0]!)) continue
            if (coverIndex(lineA[1]!) !== coverIndex(lineB[1]!)) continue

            const corners = [...lineA, ...lineB]
            const eliminations: Elimination[] = []
            for (const idx of [coverIndex(lineA[0]!), coverIndex(lineA[1]!)]) {
              for (const c of cover[idx]!) {
                if (!corners.includes(c) && cands[c]! & bit(digit)) {
                  eliminations.push({ cell: c, digit })
                }
              }
            }
            if (eliminations.length === 0) continue
            return {
              technique: 'xWing',
              name: 'X-Wing',
              cells: corners,
              placements: [],
              eliminations,
              message: `${digit} kan bara stå i två celler i vardera av två ${label[0]} (${corners.map(cellName).join(', ')}), och cellerna ligger i samma två ${label[1]}. ${digit} måste därför ligga i två av hörnen, så den kan strykas från resten av dessa ${label[1]}.`,
            }
          }
        }
      }
    }
    return null
  },
}
