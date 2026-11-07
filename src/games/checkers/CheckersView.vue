<script setup lang="ts">
import { computed, ref } from 'vue'
import { checkers, type CheckersMove } from './rules'

const state = ref(checkers.initialState())
const selected = ref<number | null>(null)
const result = computed(() => checkers.outcome(state.value))
const moves = computed(() => checkers.legalMoves(state.value))
const selectedMoves = computed(() => moves.value.filter((move) => move.from === selected.value))
const captureRequired = computed(() => moves.value.some((move) => move.captures.length > 0))
const status = computed(() => {
  if (result.value && 'winner' in result.value) return `Spelare ${result.value.winner + 1} vann!`
  if (result.value) return 'Oavgjort.'
  return `Spelare ${state.value.turn + 1}:s tur${captureRequired.value ? ' – slag är obligatoriskt' : ''}`
})

function choose(square: number) {
  const move = selectedMoves.value.find((candidate) => candidate.path.at(-1) === square)
  if (move) {
    state.value = checkers.applyMove(state.value, move)
    selected.value = null
    return
  }
  if (moves.value.some((candidate) => candidate.from === square)) {
    selected.value = square
    return
  }
  selected.value = null
}

function restart() {
  state.value = checkers.initialState()
  selected.value = null
}

function pieceLabel(piece: number) {
  if (piece === 0) return ''
  return `${piece === 1 || piece === 3 ? 'Spelare 1' : 'Spelare 2'}${piece > 2 ? ', kung' : ''}`
}

const destinations = computed(
  () => new Set(selectedMoves.value.map((move: CheckersMove) => move.path.at(-1)!)),
)
</script>

<template>
  <main class="game checkers">
    <h1>Dam</h1>
    <p class="status" role="status">{{ status }}</p>
    <div class="board" role="grid" aria-label="Dambräde">
      <template v-for="square in 64" :key="square">
        <button
          v-if="(Math.floor((square - 1) / 8) + ((square - 1) % 8)) % 2 === 1"
          class="square dark"
          :class="{
            selected:
              selected === Math.floor((square - 1) / 8) * 4 + Math.floor(((square - 1) % 8) / 2),
            target: destinations.has(
              Math.floor((square - 1) / 8) * 4 + Math.floor(((square - 1) % 8) / 2),
            ),
          }"
          :aria-label="`Rad ${Math.floor((square - 1) / 8) + 1}, kolumn ${((square - 1) % 8) + 1}${pieceLabel(state.board[Math.floor((square - 1) / 8) * 4 + Math.floor(((square - 1) % 8) / 2)]!) ? ', ' + pieceLabel(state.board[Math.floor((square - 1) / 8) * 4 + Math.floor(((square - 1) % 8) / 2)]!) : ''}`"
          @click="choose(Math.floor((square - 1) / 8) * 4 + Math.floor(((square - 1) % 8) / 2))"
        >
          <span
            v-if="
              state.board[Math.floor((square - 1) / 8) * 4 + Math.floor(((square - 1) % 8) / 2)]
            "
            class="piece"
            :class="{
              red: [1, 3].includes(
                state.board[Math.floor((square - 1) / 8) * 4 + Math.floor(((square - 1) % 8) / 2)]!,
              ),
              king: [3, 4].includes(
                state.board[Math.floor((square - 1) / 8) * 4 + Math.floor(((square - 1) % 8) / 2)]!,
              ),
            }"
            >{{
              [3, 4].includes(
                state.board[Math.floor((square - 1) / 8) * 4 + Math.floor(((square - 1) % 8) / 2)]!,
              )
                ? '♛'
                : ''
            }}</span
          >
        </button>
        <span v-else class="square light" aria-hidden="true" />
      </template>
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
  grid-template-columns: repeat(8, min(10vw, 3.8rem));
  border: 6px solid #78350f;
}
.square {
  display: grid;
  place-items: center;
  width: min(10vw, 3.8rem);
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  border-radius: 0;
}
.light {
  background: #fef3c7;
}
.dark {
  background: #92400e;
  cursor: pointer;
}
.dark.selected {
  background: #f59e0b;
}
.dark.target {
  box-shadow: inset 0 0 0 4px #fde047;
}
.piece {
  display: grid;
  place-items: center;
  width: 78%;
  height: 78%;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #52525b, #18181b 75%);
  color: #fef08a;
  font-size: 1.5rem;
  box-shadow: 0 3px 4px #0008;
}
.piece.red {
  background: radial-gradient(circle at 35% 30%, #f87171, #991b1b 75%);
}
.status {
  font-weight: 700;
}
.actions {
  display: flex;
  gap: 0.5rem;
}
</style>
