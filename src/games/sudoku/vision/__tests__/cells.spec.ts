import { describe, expect, it } from 'vitest'
import { extractCells, type Mask } from '../cells'

const N = 450 // 50 px per cell

function blankMask(): Mask {
  return { data: new Uint8Array(N * N), width: N, height: N }
}

function fillRect(m: Mask, x: number, y: number, w: number, h: number) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) m.data[j * m.width + i] = 1
}

describe('extractCells', () => {
  it('treats an empty mask as 81 blank cells', () => {
    expect(extractCells(blankMask()).every((c) => c.blank)).toBe(true)
  })

  it('ignores grid lines along the cell edges', () => {
    const m = blankMask()
    for (let k = 0; k <= 9; k++) {
      fillRect(m, Math.min(k * 50, N - 2), 0, 2, N)
      fillRect(m, 0, Math.min(k * 50, N - 2), N, 2)
    }
    expect(extractCells(m).every((c) => c.blank)).toBe(true)
  })

  it('crops the digit tightly in the right cell and ignores specks', () => {
    const m = blankMask()
    fillRect(m, 2 * 50 + 15, 1 * 50 + 10, 20, 30) // cell index 11
    fillRect(m, 5 * 50 + 25, 5 * 50 + 25, 2, 2) // speck in cell 50
    const cells = extractCells(m)
    expect(cells.filter((c) => !c.blank).map((c) => c.index)).toEqual([11])
    expect(cells[11]!.digit).toMatchObject({ width: 20, height: 30 })
  })
})
