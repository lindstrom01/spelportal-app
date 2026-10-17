import { computed, ref, shallowRef } from 'vue'
import { emptyGrid } from '../logic/board'
import { analyzeGrid } from '../logic/analyze'
import type { Grid } from '../logic/types'
import { imageFileToImageData, scanSudoku } from '../vision/scan'

export type ScanStatus = 'idle' | 'scanning' | 'review' | 'error'

/** Cells read with lower confidence than this are flagged for the user to double-check. */
const LOW_CONFIDENCE = 75

export function useScanner() {
  const status = ref<ScanStatus>('idle')
  const progress = ref('')
  const error = ref('')
  const grid = ref<Grid>(emptyGrid())
  const confidence = ref<number[]>([])
  const preview = shallowRef<ImageData | null>(null)
  const outlineFound = ref(true)

  const analysis = computed(() => analyzeGrid(grid.value))
  const uncertain = computed(
    () => new Set(confidence.value.flatMap((c, i) => (c < LOW_CONFIDENCE ? [i] : []))),
  )

  async function scanFile(file: File) {
    status.value = 'scanning'
    error.value = ''
    progress.value = 'Letar efter rutnätet…'
    try {
      const image = await imageFileToImageData(file)
      const result = await scanSudoku(image, (stage, done, total) => {
        progress.value =
          stage === 'detect'
            ? 'Letar efter rutnätet…'
            : `Läser siffror… ${done}/${total} (första gången laddas språkdata ned)`
      })
      grid.value = result.grid
      confidence.value = result.confidence
      preview.value = result.preview
      outlineFound.value = result.outlineFound
      status.value = 'review'
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Något gick fel vid inläsningen.'
      status.value = 'error'
    }
  }

  /** Edit a cell in the review grid; a manual edit clears its "uncertain" flag. */
  function setCell(index: number, digit: number) {
    grid.value[index] = digit
    confidence.value[index] = 100
  }

  function reset() {
    status.value = 'idle'
    error.value = ''
    grid.value = emptyGrid()
    confidence.value = []
    preview.value = null
  }

  return {
    status,
    progress,
    error,
    grid,
    preview,
    outlineFound,
    analysis,
    uncertain,
    scanFile,
    setCell,
    reset,
  }
}
