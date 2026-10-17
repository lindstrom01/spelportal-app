<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { minimaxAi, randomAi } from '@/core/boardgame/ai'
import { useMatch } from '@/core/match/useMatch'
import { heuristic, movesFor, othello, score, type OthelloState } from './rules'

const difficulty = ref<'easy' | 'hard'>('hard')
const humanFirst = ref(true)
const started = ref(false)

const hard = minimaxAi(othello, { maxDepth: 3, heuristic })
const easy = randomAi(othello)
const aiPlayer = (s: OthelloState) => (difficulty.value === 'hard' ? hard(s) : easy(s))

const match = useMatch(othello, {
  seats: ['human', 'ai'],
  ai: [aiPlayer, aiPlayer],
  aiDelayMs: 600,
})

const name = (p: 0 | 1) => (p === 0 ? 'Svart' : 'Vit')
const board = computed(() => match.state.value.board)
const outcome = computed(() => othello.outcome(match.state.value))
const counts = computed(() => score(board.value))
const legal = computed(() => new Set(outcome.value ? [] : movesFor(board.value, match.current())))
const humanTurn = computed(() => match.seats.value[match.current()] === 'human')
const passNote = ref('')

let lastTurn = 0
watch(
  () => match.ply.value,
  (ply) => {
    const turn = match.state.value.turn
    passNote.value = ''
    // The same player moving twice in a row means the opponent had to pass.
    if (ply > 0 && !outcome.value && turn === lastTurn) {
      passNote.value = `${name((1 - turn) as 0 | 1)} saknar drag och passar.`
    }
    lastTurn = turn
  },
  { flush: 'sync' },
)

const status = computed(() => {
  const out = outcome.value
  if (out && 'winner' in out) {
    const [b, w] = counts.value
    return `${name(out.winner)} vann med ${Math.max(b, w)}–${Math.min(b, w)}!`
  }
  if (out) return 'Oavgjort.'
  return humanTurn.value ? `Din tur (${name(match.current())})` : 'Datorn tänker…'
})

function start() {
  started.value = true
  passNote.value = ''
  lastTurn = 0
  match.reset(humanFirst.value ? ['human', 'ai'] : ['ai', 'human'])
}

function play(index: number) {
  match.submit(index)
}
</script>

<template>
  <main class="othello">
    <h1>Othello</h1>

    <form v-if="!started" class="setup" @submit.prevent="start">
      <label>
        Svårighet
        <select v-model="difficulty">
          <option value="easy">Lätt</option>
          <option value="hard">Svår</option>
        </select>
      </label>
      <label>
        Du spelar
        <select v-model="humanFirst">
          <option :value="true">Svart (börjar)</option>
          <option :value="false">Vit</option>
        </select>
      </label>
      <button type="submit">Starta</button>
    </form>

    <template v-else>
      <div class="scores" aria-label="Ställning">
        <div class="score" :class="{ active: !outcome && match.current() === 0 }">
          <span class="chip black" />
          <span>Svart</span>
          <strong data-testid="black-count">{{ counts[0] }}</strong>
        </div>
        <div class="score" :class="{ active: !outcome && match.current() === 1 }">
          <span class="chip white" />
          <span>Vit</span>
          <strong data-testid="white-count">{{ counts[1] }}</strong>
        </div>
      </div>

      <p class="status" role="status">{{ status }}</p>
      <p v-if="passNote" class="note">{{ passNote }}</p>

      <div class="board" role="grid" aria-label="Spelbräde">
        <button
          v-for="(cell, i) in board"
          :key="i"
          class="square"
          :aria-label="`Ruta ${String.fromCharCode(97 + (i % 8))}${Math.floor(i / 8) + 1}${cell === null ? '' : ', ' + name(cell)}`"
          :disabled="!humanTurn || !legal.has(i)"
          @click="play(i)"
        >
          <span v-if="cell !== null" class="disc" :class="cell === 0 ? 'black' : 'white'" />
          <span v-else-if="humanTurn && legal.has(i)" class="hint" />
        </button>
      </div>

      <div class="actions">
        <button @click="start">Ny omgång</button>
        <button @click="started = false">Inställningar</button>
      </div>
    </template>
  </main>
</template>

<style scoped>
.othello {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}
.setup {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 16rem;
}
.scores {
  display: flex;
  gap: 1rem;
}
.score {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.9rem;
  border: 2px solid transparent;
  border-radius: 999px;
  background: #f1f5f9;
  font-size: 1.1rem;
}
.score.active {
  border-color: var(--btn-accent, #4f46e5);
}
.score strong {
  min-width: 1.5rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.chip {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
}
.chip.black,
.disc.black {
  background: radial-gradient(circle at 35% 30%, #4b5563, #111827 70%);
}
.chip.white,
.disc.white {
  background: radial-gradient(circle at 35% 30%, #ffffff, #d4d4d8 75%);
}

/* Classic tournament-board green with darker grid lines. */
.board {
  --size: min(11vw, 4.6rem);
  display: grid;
  grid-template-columns: repeat(8, var(--size));
  grid-template-rows: repeat(8, var(--size));
  gap: 2px;
  padding: 6px;
  background: #0f3d1f;
  border: 6px solid #5b3a1e;
  border-radius: 6px;
  box-shadow: 0 6px 16px rgb(0 0 0 / 0.35);
}
.square {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--size);
  height: var(--size);
  padding: 0;
  border: 0;
  border-radius: 0;
  background: #2a7d3f;
  cursor: pointer;
}
.square:disabled {
  cursor: default;
  opacity: 1;
}
.square:not(:disabled):hover {
  background: #328f49;
}

/* Squashed ellipse seen from slightly above; the stacked shadows form the disc's edge. */
.disc {
  width: 80%;
  height: 80%;
  border-radius: 50%;
  transform: scaleY(0.86);
  transition: background 0.3s;
}
.disc.black {
  box-shadow:
    0 2px 0 #000,
    0 4px 0 #000,
    0 6px 5px rgb(0 0 0 / 0.5);
}
.disc.white {
  box-shadow:
    0 2px 0 #a1a1aa,
    0 4px 0 #8b8b93,
    0 6px 5px rgb(0 0 0 / 0.45);
}
.hint {
  width: 22%;
  height: 22%;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.35);
}
.status {
  font-size: 1.1rem;
  font-weight: 600;
}
.note {
  font-size: 0.9rem;
  opacity: 0.75;
}
.actions {
  display: flex;
  gap: 0.5rem;
}
</style>
