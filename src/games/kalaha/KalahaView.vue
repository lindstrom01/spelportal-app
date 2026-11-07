<script setup lang="ts">
import { computed, ref } from 'vue'
import { kalaha } from './rules'

const state = ref(kalaha.initialState())
const outcome = computed(() => kalaha.outcome(state.value))
const status = computed(() => {
  if (outcome.value && 'winner' in outcome.value) return `Spelare ${outcome.value.winner + 1} vann!`
  if (outcome.value) return 'Oavgjort!'
  return `Spelare ${state.value.turn + 1}:s tur`
})
function play(pit: number) {
  if (kalaha.isLegal(state.value, pit)) state.value = kalaha.applyMove(state.value, pit)
}
function restart() {
  state.value = kalaha.initialState()
}
</script>

<template>
  <main class="game">
    <h1>Kalaha</h1>
    <p class="status" role="status">{{ status }}</p>
    <div class="board" aria-label="Kalaha-bräde">
      <div class="store">
        <small>Spelare 2</small><strong>{{ state.pits[13] }}</strong>
      </div>
      <div class="pits">
        <div class="row">
          <button
            v-for="pit in [12, 11, 10, 9, 8, 7]"
            :key="pit"
            class="pit"
            :disabled="!kalaha.isLegal(state, pit)"
            :aria-label="`Spelare 2, grop ${13 - pit}, ${state.pits[pit]} stenar`"
            @click="play(pit)"
          >
            {{ state.pits[pit] }}
          </button>
        </div>
        <div class="row">
          <button
            v-for="pit in [0, 1, 2, 3, 4, 5]"
            :key="pit"
            class="pit"
            :disabled="!kalaha.isLegal(state, pit)"
            :aria-label="`Spelare 1, grop ${pit + 1}, ${state.pits[pit]} stenar`"
            @click="play(pit)"
          >
            {{ state.pits[pit] }}
          </button>
        </div>
      </div>
      <div class="store">
        <small>Spelare 1</small><strong>{{ state.pits[6] }}</strong>
      </div>
    </div>
    <div class="actions"><button @click="restart">Ny omgång</button></div>
    <p class="note">
      Sista stenen i din Kalaha ger ett extradrag. Landar den i en tom egen grop tar du den och
      stenarna mittemot.
    </p>
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
  grid-template-columns: 4.5rem minmax(18rem, 34rem) 4.5rem;
  align-items: stretch;
  gap: 0.65rem;
  padding: 1rem;
  border: 8px solid #78350f;
  border-radius: 3rem;
  background: #b45309;
  box-shadow: 0 8px 18px #0003;
}
.store {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  border-radius: 2rem;
  background: #fef3c7;
  text-align: center;
}
.store strong {
  font-size: 1.7rem;
}
.pits {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  gap: 0.7rem;
}
.row {
  display: flex;
  justify-content: space-around;
  gap: 0.35rem;
}
.pit {
  width: min(11vw, 4rem);
  aspect-ratio: 1;
  border: 0;
  border-radius: 50%;
  background: #fef3c7;
  color: #78350f;
  font-size: 1.2rem;
  font-weight: 800;
  box-shadow: inset 0 4px 8px #0002;
}
.pit:not(:disabled) {
  cursor: pointer;
}
.status {
  font-weight: 700;
}
.note {
  max-width: 32rem;
  text-align: center;
  color: #475569;
}
.actions {
  display: flex;
  gap: 0.5rem;
}
@media (max-width: 520px) {
  .board {
    grid-template-columns: 3rem minmax(14rem, 1fr) 3rem;
    gap: 0.3rem;
    padding: 0.5rem;
    border-width: 5px;
  }
  .store {
    font-size: 0.7rem;
  }
  .pit {
    width: min(11vw, 2.7rem);
    font-size: 0.9rem;
  }
}
</style>
