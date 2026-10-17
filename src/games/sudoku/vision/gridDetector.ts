import type { Mask } from './cells'

/** Warped size in pixels; 64 px per cell. */
export const WARP_SIZE = 576
const MAX_INPUT_SIDE = 1600

export interface DetectedGrid {
  /** Ink mask of the straightened grid, WARP_SIZE x WARP_SIZE. */
  ink: Mask
  /** Straightened grayscale picture, for showing next to the review grid. */
  preview: ImageData
  /** False when no grid outline was found and the whole picture was used instead. */
  outlineFound: boolean
}

type Cv = typeof import('@techstark/opencv-js')

let cvPromise: Promise<Cv> | null = null

/** OpenCV.js is large (~13 MB), so it is only loaded the first time a picture is scanned. */
function loadOpenCv(): Promise<Cv> {
  cvPromise ??= import('@techstark/opencv-js').then(async ({ default: mod }) => {
    const m = mod as unknown as Cv | Promise<Cv>
    if (m instanceof Promise) return m
    if ((m as Cv).Mat) return m as Cv
    await new Promise<void>((resolve) => {
      ;(m as unknown as { onRuntimeInitialized: () => void }).onRuntimeInitialized = resolve
    })
    return m as Cv
  })
  return cvPromise
}

/** Order four points as top-left, top-right, bottom-right, bottom-left. */
export function orderCorners(pts: { x: number; y: number }[]) {
  const bySum = [...pts].sort((a, b) => a.x + a.y - (b.x + b.y))
  const byDiff = [...pts].sort((a, b) => a.y - a.x - (b.y - b.x))
  return [bySum[0]!, byDiff[0]!, bySum[3]!, byDiff[3]!]
}

export async function detectGrid(source: ImageData): Promise<DetectedGrid> {
  const cv = await loadOpenCv()
  const toDelete: { delete: () => void }[] = []
  const track = <T extends { delete: () => void }>(m: T): T => (toDelete.push(m), m)

  try {
    let src = track(cv.matFromImageData(source))
    const longest = Math.max(src.cols, src.rows)
    if (longest > MAX_INPUT_SIDE) {
      const scaled = track(new cv.Mat())
      const f = MAX_INPUT_SIDE / longest
      cv.resize(
        src,
        scaled,
        new cv.Size(Math.round(src.cols * f), Math.round(src.rows * f)),
        0,
        0,
        cv.INTER_AREA,
      )
      src = scaled
    }

    const gray = track(new cv.Mat())
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
    const blurred = track(new cv.Mat())
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0)

    // Find the biggest four-cornered outline: that's the puzzle frame.
    const edges = track(new cv.Mat())
    cv.adaptiveThreshold(
      blurred,
      edges,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY_INV,
      11,
      2,
    )
    const contours = track(new cv.MatVector())
    const hierarchy = track(new cv.Mat())
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

    let best: { x: number; y: number }[] | null = null
    let bestArea = src.cols * src.rows * 0.1 // ignore outlines smaller than 10% of the picture
    for (let i = 0; i < contours.size(); i++) {
      const contour = track(contours.get(i))
      const area = cv.contourArea(contour)
      if (area < bestArea) continue
      const approx = track(new cv.Mat())
      cv.approxPolyDP(contour, approx, 0.02 * cv.arcLength(contour, true), true)
      if (approx.rows === 4 && cv.isContourConvex(approx)) {
        best = Array.from({ length: 4 }, (_, k) => ({
          x: approx.data32S[k * 2]!,
          y: approx.data32S[k * 2 + 1]!,
        }))
        bestArea = area
      }
    }

    const corners = best
      ? orderCorners(best)
      : [
          { x: 0, y: 0 },
          { x: src.cols - 1, y: 0 },
          { x: src.cols - 1, y: src.rows - 1 },
          { x: 0, y: src.rows - 1 },
        ]

    const from = track(
      cv.matFromArray(
        4,
        1,
        cv.CV_32FC2,
        corners.flatMap((p) => [p.x, p.y]),
      ),
    )
    const last = WARP_SIZE - 1
    const to = track(cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, last, 0, last, last, 0, last]))
    const transform = track(cv.getPerspectiveTransform(from, to))
    const warped = track(new cv.Mat())
    cv.warpPerspective(blurred, warped, transform, new cv.Size(WARP_SIZE, WARP_SIZE), cv.INTER_AREA)

    // Local threshold copes with uneven lighting and shadows.
    const ink = track(new cv.Mat())
    cv.adaptiveThreshold(warped, ink, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY_INV, 31, 12)

    const mask = new Uint8Array(WARP_SIZE * WARP_SIZE)
    for (let i = 0; i < mask.length; i++) mask[i] = ink.data[i]! > 0 ? 1 : 0

    const rgba = track(new cv.Mat())
    cv.cvtColor(warped, rgba, cv.COLOR_GRAY2RGBA)
    const preview = new ImageData(new Uint8ClampedArray(rgba.data), WARP_SIZE, WARP_SIZE)

    return {
      ink: { data: mask, width: WARP_SIZE, height: WARP_SIZE },
      preview,
      outlineFound: best !== null,
    }
  } finally {
    for (const m of toDelete) m.delete()
  }
}
