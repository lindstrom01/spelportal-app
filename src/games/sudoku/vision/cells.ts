/** An ink mask: one byte per pixel, 1 = dark (digit/line), 0 = paper. */
export interface Mask {
  data: Uint8Array
  width: number
  height: number
}

export interface CellImage {
  index: number
  /** True when the cell holds no digit. */
  blank: boolean
  /** Tight crop around the digit; null for blank cells. */
  digit: Mask | null
}

/** Share of the cell edge ignored on each side, to drop remnants of the grid lines. */
const MARGIN = 0.12
/** Ink must span at least this share of the cell height to count as a digit (rejects specks). */
const MIN_HEIGHT_SHARE = 0.25
const MIN_INK_PIXELS = 12

/**
 * Split a square, perspective-corrected ink mask into 81 cells and crop the digit in each one.
 * Pure function so it can be tested without a browser.
 */
export function extractCells(ink: Mask): CellImage[] {
  const cellSize = ink.width / 9
  const margin = Math.round(cellSize * MARGIN)
  const cells: CellImage[] = []

  for (let index = 0; index < 81; index++) {
    const x0 = Math.round((index % 9) * cellSize) + margin
    const y0 = Math.round(Math.floor(index / 9) * cellSize) + margin
    const x1 = Math.round(((index % 9) + 1) * cellSize) - margin
    const y1 = Math.round((Math.floor(index / 9) + 1) * cellSize) - margin

    let minX = x1
    let minY = y1
    let maxX = x0 - 1
    let maxY = y0 - 1
    let count = 0
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        if (ink.data[y * ink.width + x]) {
          count++
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }

    const height = maxY - minY + 1
    if (count < MIN_INK_PIXELS || height < cellSize * MIN_HEIGHT_SHARE) {
      cells.push({ index, blank: true, digit: null })
      continue
    }

    const width = maxX - minX + 1
    const data = new Uint8Array(width * height)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        data[y * width + x] = ink.data[(minY + y) * ink.width + minX + x]!
      }
    }
    cells.push({ index, blank: false, digit: { data, width, height } })
  }
  return cells
}
