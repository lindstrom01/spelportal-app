import type { Mask } from './cells'

export interface DigitReading {
  digit: number
  /** 0-100 as reported by Tesseract. */
  confidence: number
}

export interface DigitRecognizer {
  read: (digit: Mask) => Promise<DigitReading | null>
  dispose: () => Promise<void>
}

const CANVAS_SIZE = 96
const DIGIT_HEIGHT = 56

/** Draw the digit black-on-white, centred, with a generous border: what Tesseract likes best. */
export function renderDigit(digit: Mask): HTMLCanvasElement {
  const small = document.createElement('canvas')
  small.width = digit.width
  small.height = digit.height
  const sctx = small.getContext('2d')!
  const img = sctx.createImageData(digit.width, digit.height)
  for (let i = 0; i < digit.data.length; i++) {
    const v = digit.data[i] ? 0 : 255
    img.data.set([v, v, v, 255], i * 4)
  }
  sctx.putImageData(img, 0, 0)

  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  const scale = DIGIT_HEIGHT / digit.height
  const w = Math.min(CANVAS_SIZE - 8, digit.width * scale)
  const h = digit.height * scale
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(small, (CANVAS_SIZE - w) / 2, (CANVAS_SIZE - h) / 2, w, h)
  return canvas
}

/** Tesseract.js runs in a worker and fetches its language data from a CDN the first time. */
export async function createDigitRecognizer(): Promise<DigitRecognizer> {
  const { createWorker, PSM } = await import('tesseract.js')
  const worker = await createWorker('eng')

  // The digit whitelist is usually the most accurate, but for some glyphs Tesseract returns nothing
  // with it, so fall back to other settings in turn.
  const DIGITS = '123456789'
  const attempts = [
    { tessedit_char_whitelist: DIGITS, tessedit_pageseg_mode: PSM.SINGLE_CHAR },
    { tessedit_char_whitelist: '', tessedit_pageseg_mode: PSM.SINGLE_CHAR },
    { tessedit_char_whitelist: DIGITS, tessedit_pageseg_mode: PSM.SINGLE_BLOCK },
  ]
  let current = -1
  const use = async (n: number) => {
    if (current === n) return
    await worker.setParameters(attempts[n]!)
    current = n
  }

  return {
    async read(digit) {
      const canvas = renderDigit(digit)
      for (let n = 0; n < attempts.length; n++) {
        await use(n)
        const { data } = await worker.recognize(canvas)
        const match = /[1-9]/.exec(data.text)
        if (match) return { digit: Number(match[0]), confidence: data.confidence }
      }
      return null
    },
    dispose: async () => {
      await worker.terminate()
    },
  }
}
