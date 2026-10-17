<script setup lang="ts">
import { useGameStore } from '../stores/game'

const game = useGameStore()
</script>

<template>
  <div class="pad">
    <div class="digits">
      <button
        v-for="d in 9"
        :key="d"
        type="button"
        :disabled="game.digitCounts[d]! >= 9"
        @click="game.input(d)"
      >
        {{ d }}
      </button>
    </div>
    <div class="actions">
      <button type="button" :disabled="!game.history.length" @click="game.undo()">Ångra</button>
      <button type="button" @click="game.erase()">Sudda</button>
      <button
        type="button"
        :aria-pressed="game.notesMode"
        @click="game.notesMode = !game.notesMode"
      >
        Anteckningar: {{ game.notesMode ? 'på' : 'av' }}
      </button>
      <button type="button" @click="game.fillAllNotes()">Fyll i kandidater</button>
      <button type="button" :disabled="game.isSolved" @click="game.requestHint()">Tips</button>
    </div>
  </div>
</template>

<style scoped>
.pad {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: min(100%, 34rem);
}
.digits {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 0.25rem;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.digits button {
  font-size: 1.3rem;
  padding: 0.5rem 0;
}
</style>
