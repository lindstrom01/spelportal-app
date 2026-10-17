import type { Grid } from './types'

export const SIZE = 9
export const CELLS = 81

export const filledArray = (length: number, value = 0): number[] =>
  Array.from({ length }, () => value)
export const emptyGrid = (): number[] => filledArray(CELLS)

export const rowOf = (i: number) => Math.floor(i / SIZE)
export const colOf = (i: number) => i % SIZE
export const boxOf = (i: number) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3)

const range = (n: number) => Array.from({ length: n }, (_, i) => i)
const cellsWhere = (pred: (i: number) => boolean) => range(CELLS).filter(pred)

export const ROWS: readonly (readonly number[])[] = range(9).map((r) =>
  cellsWhere((i) => rowOf(i) === r),
)
export const COLS: readonly (readonly number[])[] = range(9).map((c) =>
  cellsWhere((i) => colOf(i) === c),
)
export const BOXES: readonly (readonly number[])[] = range(9).map((b) =>
  cellsWhere((i) => boxOf(i) === b),
)
export const UNITS: readonly (readonly number[])[] = [...ROWS, ...COLS, ...BOXES]

/** Human-readable cell name, e.g. "R1K4" = row 1, column 4. */
export const cellName = (i: number) => `R${rowOf(i) + 1}K${colOf(i) + 1}`

/** For each cell, the indices of all other cells sharing a row, column or box. */
export const PEERS: readonly (readonly number[])[] = Array.from({ length: CELLS }, (_, i) => {
  const peers: number[] = []
  for (let j = 0; j < CELLS; j++) {
    if (j !== i && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i))) {
      peers.push(j)
    }
  }
  return peers
})

/** Bit mask helpers: digit d (1-9) is represented by bit (1 << d). */
export const bit = (d: number) => 1 << d
export const ALL_DIGITS_MASK = 0b1111111110

export function maskToDigits(mask: number): number[] {
  const out: number[] = []
  for (let d = 1; d <= 9; d++) if (mask & bit(d)) out.push(d)
  return out
}

export function popCount(mask: number): number {
  let n = 0
  for (; mask; mask &= mask - 1) n++
  return n
}

/** Digits that are still possible in each cell, given only the filled cells of the grid. */
export function computeCandidates(grid: Grid): number[] {
  return grid.map((v, i) => {
    if (v !== 0) return 0
    let mask = ALL_DIGITS_MASK
    for (const p of PEERS[i]!) {
      const pv = grid[p]!
      if (pv !== 0) mask &= ~bit(pv)
    }
    return mask
  })
}

/** Indices of filled cells that clash with a peer holding the same digit. */
export function findConflicts(grid: Grid): Set<number> {
  const conflicts = new Set<number>()
  for (let i = 0; i < CELLS; i++) {
    const v = grid[i]!
    if (v === 0) continue
    if (PEERS[i]!.some((p) => grid[p] === v)) conflicts.add(i)
  }
  return conflicts
}
