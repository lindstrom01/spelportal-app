<script setup lang="ts">
import { useTemplateRef, watch } from 'vue'
import { useGameStore } from '../stores/game'
import { useScanner } from '../composables/useScanner'

const open = defineModel<boolean>({ required: true })

const game = useGameStore()
const scanner = useScanner()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const previewCanvas = useTemplateRef<HTMLCanvasElement>('previewCanvas')

watch(open, (isOpen) => {
  if (isOpen && !dialog.value?.open) {
    scanner.reset()
    dialog.value?.showModal()
  } else if (!isOpen && dialog.value?.open) {
    dialog.value.close()
  }
})

watch([() => scanner.preview.value, previewCanvas], ([img, canvas]) => {
  if (!img || !canvas) return
  canvas.width = img.width
  canvas.height = img.height
  canvas.getContext('2d')!.putImageData(img, 0, 0)
})

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) void scanner.scanFile(file)
}

function onCellInput(index: number, e: Event) {
  const input = e.target as HTMLInputElement
  const digit = /[1-9]/.exec(input.value)?.[0]
  scanner.setCell(index, digit ? Number(digit) : 0)
  input.value = digit ?? ''
}

function start() {
  if (game.loadPuzzle(scanner.grid.value)) open.value = false
}
</script>

<template>
  <dialog ref="dialog" class="scan" @close="open = false">
    <header>
      <h2>Skanna sudoku från bild</h2>
      <button type="button" aria-label="Stäng" @click="open = false">✕</button>
    </header>

    <section v-if="scanner.status.value === 'idle'">
      <p>Ta ett foto av sudokut eller välj en bild. Rutnätet ska synas hela och vara väl belyst.</p>
      <input type="file" accept="image/*" @change="onFile" />
    </section>

    <section v-else-if="scanner.status.value === 'scanning'" role="status">
      <p>{{ scanner.progress.value }}</p>
    </section>

    <section v-else-if="scanner.status.value === 'error'">
      <p class="bad">{{ scanner.error.value }}</p>
      <button type="button" @click="scanner.reset()">Försök igen</button>
    </section>

    <section v-else class="review">
      <p v-if="!scanner.outlineFound.value" class="warn">
        Ingen ram hittades i bilden, så hela bilden användes. Beskär gärna bilden runt rutnätet.
      </p>
      <p>
        Kontrollera siffrorna mot bilden och rätta fel. <span class="legend">Gult</span> = osäker
        avläsning, <span class="legend red">rött</span> = krockar med en annan siffra.
      </p>
      <div class="side-by-side">
        <canvas ref="previewCanvas" class="preview" aria-label="Rättad bild av rutnätet" />
        <div class="grid" role="group" aria-label="Inläst sudoku">
          <input
            v-for="(v, i) in scanner.grid.value"
            :key="i"
            :value="v || ''"
            :class="{
              uncertain: scanner.uncertain.value.has(i),
              conflict: scanner.analysis.value.conflicts.has(i),
              'br-col': i % 9 === 2 || i % 9 === 5,
              'br-row': Math.floor(i / 9) === 2 || Math.floor(i / 9) === 5,
            }"
            inputmode="numeric"
            maxlength="1"
            :aria-label="`Rad ${Math.floor(i / 9) + 1}, kolumn ${(i % 9) + 1}`"
            @input="onCellInput(i, $event)"
            @focus="($event.target as HTMLInputElement).select()"
          />
        </div>
      </div>

      <p v-if="scanner.analysis.value.conflicts.size" class="bad">
        Några siffror krockar. Rätta de röda cellerna.
      </p>
      <p v-else-if="scanner.analysis.value.solutions === 0" class="bad">
        Sudokut saknar lösning. Någon siffra är troligen felläst eller saknas.
      </p>
      <p v-else-if="scanner.analysis.value.solutions === 2" class="bad">
        Sudokut har flera lösningar, så det saknas troligen siffror. Jämför med bilden.
      </p>
      <p v-else class="ok">
        Sudokut ser korrekt ut ({{ scanner.analysis.value.givens }} givna siffror).
      </p>

      <div class="buttons">
        <button type="button" :disabled="!scanner.analysis.value.playable" @click="start">
          Starta spel
        </button>
        <button type="button" @click="scanner.reset()">Skanna en annan bild</button>
      </div>
    </section>
  </dialog>
</template>

<style scoped>
.scan {
  width: min(95vw, 56rem);
  border: 1px solid var(--grid-line);
  border-radius: 10px;
  padding: 1rem;
  background: var(--cell-bg);
  color: #111827;
}
.scan::backdrop {
  background: rgb(0 0 0 / 0.5);
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
h2 {
  margin: 0;
  font-size: 1.2rem;
}
.side-by-side {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-start;
}
.preview {
  width: min(100%, 24rem);
  aspect-ratio: 1;
  border: 1px solid var(--grid-line);
}
.grid {
  display: grid;
  grid-template-columns: repeat(9, 2.4rem);
  gap: 1px;
  background: var(--grid-line);
  border: 3px solid var(--box-line);
}
.grid input {
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  border: 0;
  border-radius: 0;
  text-align: center;
  font-size: 1.3rem;
  background: var(--cell-bg);
  color: var(--given-color);
}
.grid input.uncertain {
  background: #fff3b0;
}
.grid input.conflict {
  background: #ffc9c9;
  color: var(--error-color);
}
.br-col {
  margin-right: 2px;
}
.br-row {
  margin-bottom: 2px;
}
.legend {
  background: #fff3b0;
  padding: 0 0.3rem;
}
.legend.red {
  background: #ffc9c9;
}
.bad {
  color: var(--error-color);
}
.warn {
  color: #92400e;
}
.ok {
  color: var(--ok-color);
}
.buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
</style>
