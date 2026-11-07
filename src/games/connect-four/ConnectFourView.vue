<script setup lang="ts">
import { computed, ref } from 'vue'
import { connectFour, COLUMNS } from './rules'

const state = ref(connectFour.initialState())
const outcome = computed(() => connectFour.outcome(state.value))
const status = computed(() => {
  if (outcome.value && 'winner' in outcome.value) return `Spelare ${outcome.value.winner + 1} vann!`
  if (outcome.value) return 'Oavgjort!'
  return `Spelare ${state.value.turn + 1}:s tur`
})
function play(column: number) {
  if (connectFour.isLegal(state.value, column))
    state.value = connectFour.applyMove(state.value, column)
}
function restart() {
  state.value = connectFour.initialState()
}
</script>

<template>
  <main class="game">
    <h1>Fyra i rad</h1>
    <p class="status" role="status">{{ status }}</p>
    <div class="board" role="grid" aria-label="Fyra i rad-bräde">
      <button
        v-for="column in COLUMNS"
        :key="`drop-${column}`"
        class="drop"
        :disabled="!connectFour.isLegal(state, column - 1)"
        :aria-label="`Släpp i kolumn ${column}`"
        @click="play(column - 1)"
      >
        ↓
      </button>
      <button
        v-for="(cell, index) in state.board"
        :key="index"
        class="cell"
        :class="cell === 0 ? 'red' : cell === 1 ? 'yellow' : ''"
        :aria-label="`Rad ${Math.floor(index / COLUMNS) + 1}, kolumn ${(index % COLUMNS) + 1}${cell === null ? ', tom' : `, spelare ${cell + 1}`}`"
        disabled
      />
    </div>
    <div class="actions"><button @click="restart">Ny omgång</button></div>
  </main>
</template>

<style scoped>
.game {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}
.board {
  display: grid;
  grid-template-columns: repeat(7, min(11vw, 4rem));
  gap: 0.32rem;
  padding: 0.6rem;
  border-radius: 1rem;
  background: #2563eb;
  box-shadow: 0 6px 14px #0003;
}
.board > span,
.drop {
  width: min(11vw, 4rem);
  height: 1.8rem;
}
.drop {
  padding: 0;
  border: 0;
  background: transparent;
  color: white;
  font-size: 1.4rem;
  font-weight: 800;
}
.cell {
  width: min(11vw, 4rem);
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #dbeafe;
  box-shadow: inset 0 3px 5px #0003;
}
.cell.red {
  background: radial-gradient(circle at 35% 30%, #fca5a5, #dc2626 75%);
}
.cell.yellow {
  background: radial-gradient(circle at 35% 30%, #fef08a, #eab308 75%);
}
.status {
  font-weight: 700;
}
.actions {
  display: flex;
  gap: 0.5rem;
}
</style>
