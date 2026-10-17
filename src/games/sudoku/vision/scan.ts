import { emptyGrid } from '../logic/board'
import type { Grid } from '../logic/types'
import { extractCells } from './cells'
import { detectGrid } from './gridDetector'
import { createDigitRecognizer } from './ocr'

export interface ScanResult {
  grid: Grid
  /** Per-cell OCR confidence 0-100; 100 for blank cells. */
  confidence: number[]
  preview: ImageData
  outlineFound: boolean
}

export type ScanProgress = (stage: 'detect' | 'read', done: number, total: number) => void

export async function imageFileToImageData(file: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

export async function scanSudoku(image: ImageData, onProgress?: ScanProgress): Promise<ScanResult> {
  onProgress?.('detect', 0, 1)
  const { ink, preview, outlineFound } = await detectGrid(image)
  const cells = extractCells(ink)
  const filled = cells.filter((c) => !c.blank)

  const grid = emptyGrid()
  const confidence = Array.from({ length: 81 }, () => 100)

  const recognizer = await createDigitRecognizer()
  try {
    let done = 0
    onProgress?.('read', done, filled.length)
    for (const cell of filled) {
      const reading = await recognizer.read(cell.digit!)
      grid[cell.index] = reading?.digit ?? 0
      confidence[cell.index] = reading?.confidence ?? 0
      onProgress?.('read', ++done, filled.length)
    }
  } finally {
    await recognizer.dispose()
  }

  // A digit-looking cell the OCR could not read stays empty but is flagged for the user.
  return { grid, confidence, preview, outlineFound }
}
