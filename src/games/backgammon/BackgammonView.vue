<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMatch } from '@/core/match/useMatch'
import DiceFace from './components/DiceFace.vue'
import {
  BAR,
  PASS,
  backgammon,
  greedyAi,
  isPass,
  moveTarget,
  pipCount,
  randomMoveAi,
  type BackgammonMove,
  type BackgammonState,
} from './rules'

const difficulty = ref<'easy' | 'hard'>('hard')
const started = ref(false)

const hard = greedyAi()
const easy = randomMoveAi()
const aiPlayer = (s: BackgammonState) => (difficulty.value === 'hard' ? hard(s) : easy(s))

const match = useMatch(backgammon, {
  seats: ['human', 'ai'],
  ai: [aiPlayer, aiPlayer],
  aiDelayMs: 700,
})

const name = (p: 0 | 1) => (p === 0 ? 'Vit' : 'Svart')
const state = match.state
const outcome = computed(() => backgammon.outcome(state.value))
const humanTurn = computed(() => !outcome.value && match.seats.value[match.current()] === 'human')
const legal = computed<BackgammonMove[]>(() =>
  humanTurn.value ? backgammon.legalMoves(state.value) : [],
)
const mustPass = computed(() => legal.value.length === 1 && isPass(legal.value[0]!))
const sources = computed(() => new Set(legal.value.filter((m) => !isPass(m)).map((m) => m.from)))

const selected = ref<number | null>(null)
watch(
  () => match.ply.value,
  () => (selected.value = null),
)

const targets = computed(() => {
  const map = new Map<number | 'off', BackgammonMove>()
  if (selected.value === null) return map
  for (const m of legal.value) {
    if (m.from !== selected.value) continue
    const t = moveTarget(match.current(), m)
    // For several dice to the same target, prefer the smallest so big dice stay available.
    if (!map.has(t) || m.die < map.get(t)!.die) map.set(t, m)
  }
  return map
})

const status = computed(() => {
  const out = outcome.value
  if (out && 'winner' in out) return `${name(out.winner)} vann!`
  if (!humanTurn.value) return 'Datorn spelar…'
  if (mustPass.value) return 'Du saknar giltiga drag.'
  return selected.value === null ? 'Din tur – välj en bricka' : 'Välj målpunkt'
})

const counts = computed(() =>
  ([0, 1] as const).map((p) => ({
    pips: pipCount(state.value, p),
    off: state.value.off[p],
    bar: state.value.bar[p],
  })),
)

// White's home board is bottom right, so the bottom row runs from point 12 down to 1.
const placed = computed(() =>
  Array.from({ length: 24 }, (_, i) => {
    const top = i >= 12
    const k = top ? i - 12 : 11 - i
    return { i, top, k, col: k < 6 ? k + 1 : k + 2, row: top ? 1 : 2 }
  }),
)

// The seed only changes when a new roll is made, so it marks the start of each turn.
const rolled = ref<number[]>([...state.value.dice])
const rollCount = ref(0)
watch(
  () => state.value.seed,
  () => {
    rolled.value = [...state.value.dice]
    rollCount.value++
  },
)
const shownDice = computed(() => {
  const remaining = [...state.value.dice]
  return rolled.value.map((value) => {
    const at = remaining.indexOf(value)
    if (at >= 0) remaining.splice(at, 1)
    return { value, used: at < 0 }
  })
})

const count = (i: number) => Math.abs(state.value.points[i]!)
const owner = (i: number): 0 | 1 => (state.value.points[i]! > 0 ? 0 : 1)
const visible = (n: number) => Math.min(n, 5)

function click(i: number) {
  const m = targets.value.get(i)
  if (m) return match.submit(m)
  selected.value = sources.value.has(i) && selected.value !== i ? i : null
}
function clickOff() {
  const m = targets.value.get('off')
  if (m) match.submit(m)
}
function clickBar() {
  if (state.value.bar[0] > 0 && sources.value.has(BAR)) {
    selected.value = selected.value === BAR ? null : BAR
  }
}

function start() {
  started.value = true
  selected.value = null
  match.reset(['human', 'ai'])
}
</script>

<template>
  <main class="bg">
    <h1>Backgammon</h1>

    <form v-if="!started" class="setup" @submit.prevent="start">
      <label>
        Svårighet
        <select v-model="difficulty">
          <option value="easy">Lätt</option>
          <option value="hard">Svår</option>
        </select>
      </label>
      <p class="note">Du spelar vit och flyttar mot nedre högra hörnet.</p>
      <button type="submit">Starta</button>
    </form>

    <template v-else>
      <div class="scores" aria-label="Ställning">
        <div
          v-for="p in [0, 1] as const"
          :key="p"
          class="score"
          :class="{ active: !outcome && match.current() === p }"
        >
          <span class="chip" :class="p === 0 ? 'white' : 'black'" />
          <span>{{ name(p) }}</span>
          <span class="stat"
            >Pips <strong>{{ counts[p]!.pips }}</strong></span
          >
          <span class="stat"
            >Borta <strong>{{ counts[p]!.off }}/15</strong></span
          >
        </div>
      </div>

      <p class="status" role="status">{{ status }}</p>

      <div v-if="!outcome" class="dice" :aria-label="`Tärningar för ${name(match.current())}`">
        <span class="chip" :class="match.current() === 0 ? 'white' : 'black'" />
        <DiceFace
          v-for="(d, n) in shownDice"
          :key="n"
          :value="d.value"
          :used="d.used"
          :roll="rollCount"
          :delay="n * 90"
        />
      </div>
      <button v-if="mustPass" class="pass" @click="match.submit(PASS)">Passa</button>

      <div class="board" role="grid" aria-label="Spelbräde">
        <button
          v-for="pt in placed"
          :key="pt.i"
          class="point"
          :class="{
            top: pt.top,
            dark: pt.k % 2 === 1,
            movable: sources.has(pt.i),
            selected: selected === pt.i,
            target: targets.has(pt.i),
          }"
          :style="{ gridColumn: pt.col, gridRow: pt.row }"
          :aria-label="`Punkt ${pt.i + 1}${count(pt.i) ? ', ' + count(pt.i) + ' ' + name(owner(pt.i)).toLowerCase() : ''}`"
          :disabled="!sources.has(pt.i) && !targets.has(pt.i)"
          @click="click(pt.i)"
        >
          <span class="stack">
            <span
              v-for="n in visible(count(pt.i))"
              :key="n"
              class="disc"
              :class="owner(pt.i) === 0 ? 'white' : 'black'"
            >
              <template v-if="n === 5 && count(pt.i) > 5">{{ count(pt.i) }}</template>
            </span>
          </span>
        </button>

        <button
          class="bar"
          :class="{ movable: sources.has(BAR), selected: selected === BAR }"
          :disabled="!sources.has(BAR)"
          aria-label="Barren"
          @click="clickBar"
        >
          <span class="stack">
            <span v-for="n in visible(counts[1]!.bar)" :key="'b1' + n" class="disc black" />
          </span>
          <span class="stack">
            <span v-for="n in visible(counts[0]!.bar)" :key="'b0' + n" class="disc white" />
          </span>
        </button>

        <button
          v-for="p in [1, 0] as const"
          :key="'off' + p"
          class="tray"
          :class="{ target: p === 0 && targets.has('off') }"
          :style="{ gridColumn: 15, gridRow: p === 1 ? 1 : 2 }"
          :disabled="!(p === 0 && targets.has('off'))"
          :aria-label="`Borta ${name(p)}`"
          @click="clickOff"
        >
          <span class="chip" :class="p === 0 ? 'white' : 'black'" />
          <strong>{{ counts[p]!.off }}</strong>
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
.bg {
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
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
}
.score {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.9rem;
  border: 2px solid transparent;
  border-radius: 999px;
  background: #f1f5f9;
}
.score.active {
  border-color: var(--btn-accent, #4f46e5);
}
.stat {
  font-size: 0.9rem;
  opacity: 0.85;
}
.status {
  font-size: 1.1rem;
  font-weight: 600;
}
.note {
  font-size: 0.9rem;
  opacity: 0.75;
}
.dice {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  min-height: 4.6rem;
  padding: 0.4rem 1.4rem;
  border-radius: 1rem;
  background:
    radial-gradient(circle at 20% 20%, rgb(139 92 246 / 35%), transparent 50%),
    linear-gradient(135deg, #1e1b4b, #0f172a);
}
.chip {
  display: inline-block;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
}
.chip.white,
.disc.white {
  background: radial-gradient(circle at 35% 30%, #ffffff, #d6d3d1 75%);
  color: #1c1917;
}
.chip.black,
.disc.black {
  background: radial-gradient(circle at 35% 30%, #57534e, #1c1917 70%);
  color: #fafaf9;
}

.board {
  --w: min(5.2vw, 3.6rem);
  display: grid;
  grid-template-columns: repeat(6, var(--w)) calc(var(--w) * 0.9) repeat(6, var(--w)) 0.4rem calc(
      var(--w) * 1.1
    );
  grid-template-rows: calc(var(--w) * 5) calc(var(--w) * 5);
  gap: 0 2px;
  padding: 8px;
  background: #14532d;
  border: 8px solid #5b3a1e;
  border-radius: 6px;
  box-shadow: 0 6px 16px rgb(0 0 0 / 0.35);
}
.point {
  position: relative;
  display: flex;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  cursor: pointer;
}
.point:disabled {
  cursor: default;
  opacity: 1;
}
.point::before {
  content: '';
  position: absolute;
  inset: 0;
  background: #e7d3a7;
  clip-path: polygon(0 100%, 50% 0, 100% 100%);
}
.point.top::before {
  clip-path: polygon(0 0, 50% 100%, 100% 0);
}
.point.dark::before {
  background: #8f3b1b;
}
.point.target::before {
  background: #facc15;
}
.point.selected::before {
  background: #38bdf8;
}
.point.movable:not(.selected)::after {
  content: '';
  position: absolute;
  left: 20%;
  right: 20%;
  height: 4px;
  border-radius: 2px;
  background: #facc15;
  top: 0;
}
.point.movable:not(.top):not(.selected)::after {
  top: auto;
  bottom: 0;
}
.stack {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.point:not(.top) .stack {
  flex-direction: column-reverse;
  justify-content: flex-start;
}
.bar,
.tray {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 0.3rem 0;
  border: 0;
  border-radius: 0;
  background: #3f2a14;
  color: #fafaf9;
}
.bar {
  grid-column: 7;
  grid-row: 1 / 3;
}
.bar.selected {
  background: #38bdf8;
}
.bar.movable {
  cursor: pointer;
}
.bar:disabled,
.tray:disabled {
  opacity: 1;
  cursor: default;
}
.tray {
  justify-content: center;
  gap: 0.3rem;
}
.tray.target {
  background: #facc15;
  color: #1c1917;
  cursor: pointer;
}
.bar .stack {
  flex-direction: column;
}

/* Squashed ellipse from slightly above; stacked shadows give the checker its thickness. */
.disc {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 86%;
  aspect-ratio: 1;
  margin-bottom: calc(var(--w) * -0.28);
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 700;
  transform: scaleY(0.78);
}
.disc.white {
  box-shadow:
    0 2px 0 #a8a29e,
    0 4px 0 #78716c;
}
.disc.black {
  box-shadow:
    0 2px 0 #000,
    0 4px 0 #000;
}
.point:not(.top) .disc {
  margin-bottom: 0;
  margin-top: calc(var(--w) * -0.28);
}
.actions {
  display: flex;
  gap: 0.5rem;
}
</style>
