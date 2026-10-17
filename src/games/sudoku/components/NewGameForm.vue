<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../stores/game'
import ScanDialog from './ScanDialog.vue'
import { DIFFICULTIES, type Difficulty } from '../logic/types'

const game = useGameStore()
const level = ref<Difficulty>(game.difficulty)
const scanOpen = ref(false)

const labels: Record<Difficulty, string> = {
  easy: 'Lätt',
  medium: 'Medel',
  hard: 'Svår',
  expert: 'Expert',
}
</script>

<template>
  <form class="new-game" @submit.prevent="game.newGame(level)">
    <label>
      Svårighetsgrad
      <select v-model="level">
        <option v-for="d in DIFFICULTIES" :key="d" :value="d">{{ labels[d] }}</option>
      </select>
    </label>
    <button type="submit">Nytt spel</button>
    <button type="button" @click="scanOpen = true">Skanna bild…</button>
    <ScanDialog v-model="scanOpen" />
  </form>
</template>

<style scoped>
.new-game {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}
</style>
