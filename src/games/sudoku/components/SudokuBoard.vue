<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { PEERS } from '../logic/board'
import SudokuCell from './SudokuCell.vue'

const game = useGameStore()

const peerSet = computed(() => (game.selected === null ? null : new Set(PEERS[game.selected])))
const selectedValue = computed(() => (game.selected === null ? 0 : game.values[game.selected]!))

/** Cells the current hint changes are "targets"; the rest of its pattern is highlighted too. */
const hintRoles = computed(() => {
  const roles = new Map<number, 'pattern' | 'target'>()
  const hint = game.hint
  if (hint) {
    for (const c of hint.cells) roles.set(c, 'pattern')
    for (const { cell } of [...hint.placements, ...hint.eliminations]) roles.set(cell, 'target')
  }
  return roles
})

function onKeydown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const arrows: Record<string, [number, number]> = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
  }
  const dir = arrows[e.key]
  if (dir) {
    game.move(...dir)
  } else if (/^[1-9]$/.test(e.key)) {
    game.input(Number(e.key))
  } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
    game.erase()
  } else if (e.key === 'n' || e.key === 'N') {
    game.notesMode = !game.notesMode
  } else {
    return
  }
  e.preventDefault()
}
</script>

<template>
  <div
    class="board"
    role="grid"
    aria-label="Sudoku"
    tabindex="0"
    @keydown="onKeydown"
    @focus="game.selected === null && game.select(0)"
  >
    <SudokuCell
      v-for="(value, i) in game.values"
      :key="i"
      :value="value"
      :notes="game.notes[i]!"
      :given="game.isGiven(i)"
      :selected="game.selected === i"
      :related="peerSet?.has(i) ?? false"
      :same-value="selectedValue !== 0 && value === selectedValue"
      :conflict="game.conflicts.has(i)"
      :hint-role="hintRoles.get(i) ?? null"
      :class="{
        'br-col': i % 9 === 2 || i % 9 === 5,
        'br-row': Math.floor(i / 9) === 2 || Math.floor(i / 9) === 5,
      }"
      @click="game.select(i)"
    />
  </div>
</template>

<style scoped>
.board {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 1px;
  width: min(100%, 34rem);
  background: var(--grid-line);
  border: 3px solid var(--box-line);
  outline: none;
}
.board:focus-visible {
  box-shadow: 0 0 0 3px var(--selected-outline);
}
/* Thicker lines between 3x3 boxes */
.br-col {
  margin-right: 2px;
}
.br-row {
  margin-bottom: 2px;
}
</style>
