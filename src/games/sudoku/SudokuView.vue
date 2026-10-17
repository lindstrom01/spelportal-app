<script setup lang="ts">
import { onMounted } from 'vue'
import ControlPad from './components/ControlPad.vue'
import HintPanel from './components/HintPanel.vue'
import NewGameForm from './components/NewGameForm.vue'
import SudokuBoard from './components/SudokuBoard.vue'
import { useGameStore } from './stores/game'

const game = useGameStore()
// The store outlives the view, so returning from the portal resumes the running game.
onMounted(() => {
  if (!game.hasGame) game.newGame('easy')
})
</script>

<template>
  <main class="app">
    <h1>Sudoku</h1>
    <NewGameForm />
    <SudokuBoard v-if="game.hasGame" />
    <p v-if="game.isSolved" class="solved" role="status">Grattis, du löste sudokut! 🎉</p>
    <ControlPad v-if="game.hasGame" />
    <HintPanel v-if="game.hasGame" />
    <p class="hint">
      Tangentbord: 1–9 skriver, N växlar anteckningar, Backspace suddar, piltangenter flyttar.
    </p>
  </main>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}
.solved {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--ok-color);
}
.hint {
  font-size: 0.85rem;
  opacity: 0.7;
}
</style>
