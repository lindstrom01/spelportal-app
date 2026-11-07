<script setup lang="ts">
import { computed, ref } from 'vue'
import { HOLES, solitaire } from './rules'

const state = ref(solitaire.initialState())
const selected = ref<number | null>(null)
const moves = computed(() => solitaire.legalMoves(state.value))
const destinations = computed(
  () => new Set(moves.value.filter((move) => move.from === selected.value).map((move) => move.to)),
)
const result = computed(() => solitaire.outcome(state.value))
const remaining = computed(() => state.value.pegs.filter(Boolean).length)
const status = computed(() => {
  if (!result.value)
    return `${remaining.value} pinnar kvar${selected.value !== null ? ' – välj en markerad plats' : ''}`
  return result.value && 'winner' in result.value
    ? 'Du klarade det – en pinne kvar i mitten!'
    : `Inga fler drag. ${remaining.value} pinnar kvar.`
})
function choose(index: number) {
  if (!HOLES[index]) return
  const move = moves.value.find(
    (candidate) => candidate.from === selected.value && candidate.to === index,
  )
  if (move) {
    state.value = solitaire.applyMove(state.value, move)
    selected.value = null
  } else if (state.value.pegs[index]) selected.value = index
  else selected.value = null
}
function restart() {
  state.value = solitaire.initialState()
  selected.value = null
}
</script>

<template>
  <main class="game">
    <h1>Solitaire</h1>
    <p class="status" role="status">{{ status }}</p>
    <div class="board" role="grid" aria-label="Solitaire-bräde">
      <button
        v-for="(hole, index) in HOLES"
        :key="index"
        class="hole"
        :class="{ outside: !hole, selected: selected === index, target: destinations.has(index) }"
        :disabled="!hole || !!result"
        :aria-label="`Rad ${Math.floor(index / 7) + 1}, kolumn ${(index % 7) + 1}${state.pegs[index] ? ', pinne' : hole ? ', tom plats' : ', ej spelbar'}`"
        @click="choose(index)"
      >
        <span v-if="hole && state.pegs[index]" class="peg" />
      </button>
    </div>
    <div class="actions"><button @click="restart">Ny omgång</button></div>
    <p class="note">
      Välj en pinne och hoppa över en intilliggande pinne till en tom plats. Den överhoppade pinnen
      tas bort.
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
  grid-template-columns: repeat(7, min(11vw, 3.8rem));
  gap: 0.22rem;
  padding: 0.5rem;
  border-radius: 1rem;
  background: #047857;
}
.hole {
  display: grid;
  place-items: center;
  width: min(11vw, 3.8rem);
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #065f46;
}
.hole.outside {
  visibility: hidden;
}
.hole.selected {
  background: #f59e0b;
}
.hole.target {
  box-shadow: inset 0 0 0 3px #a7f3d0;
}
.peg {
  width: 73%;
  height: 73%;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #bbf7d0, #10b981 75%);
  box-shadow: 0 3px 4px #0006;
}
.note {
  max-width: 30rem;
  text-align: center;
  color: #475569;
}
.status {
  font-weight: 700;
}
.actions {
  display: flex;
  gap: 0.5rem;
}
</style>
