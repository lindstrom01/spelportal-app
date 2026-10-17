<script setup lang="ts">
import { computed } from 'vue'
import { cellName } from '../logic/board'
import { useGameStore } from '../stores/game'

const game = useGameStore()

const canApply = computed(
  () => !!game.hint && (game.hint.placements.length > 0 || game.hint.eliminations.length > 0),
)
const effects = computed(() => {
  const h = game.hint
  if (!h) return []
  return [
    ...h.placements.map((p) => `Skriv ${p.digit} i ${cellName(p.cell)}`),
    ...h.eliminations.map((e) => `Stryk ${e.digit} i ${cellName(e.cell)}`),
  ]
})
</script>

<template>
  <section v-if="game.hint || game.hintMessage" class="hint-panel" aria-live="polite">
    <template v-if="game.hint">
      <h2>{{ game.hint.name }}</h2>
      <p>{{ game.hint.message }}</p>
      <ul>
        <li v-for="e in effects" :key="e">{{ e }}</li>
      </ul>
      <div class="buttons">
        <button v-if="canApply" type="button" @click="game.applyCurrentHint()">Tillämpa</button>
        <button type="button" @click="game.clearHint()">Stäng</button>
      </div>
    </template>
    <template v-else>
      <p>{{ game.hintMessage }}</p>
      <button type="button" @click="game.clearHint()">Stäng</button>
    </template>
  </section>
</template>

<style scoped>
.hint-panel {
  width: min(100%, 34rem);
  padding: 0.75rem 1rem;
  border: 1px solid var(--hint-line);
  border-radius: 8px;
  background: var(--hint-bg);
}
h2 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
}
p {
  margin: 0.25rem 0;
}
ul {
  margin: 0.25rem 0;
  padding-left: 1.2rem;
}
.buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
</style>
