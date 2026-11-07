<script setup lang="ts">
import { computed, ref } from 'vue'
import { CATEGORIES, scoreCategory, totalScore, type CategoryId, type ScoreCard } from './rules'

const dice = ref<number[]>(Array(5).fill(0))
const held = ref<boolean[]>(Array(5).fill(false))
const rolls = ref(0)
const scoreCard = ref<ScoreCard>({})
const score = computed(() => totalScore(scoreCard.value))
const remaining = computed(
  () => CATEGORIES.filter(({ id }) => scoreCard.value[id] === undefined).length,
)
const gameOver = computed(() => remaining.value === 0)

function roll() {
  if (rolls.value >= 3 || gameOver.value) return
  dice.value = dice.value.map((die, i) =>
    held.value[i] && rolls.value > 0 ? die : Math.floor(Math.random() * 6) + 1,
  )
  rolls.value++
}
function toggle(index: number) {
  if (rolls.value > 0 && rolls.value < 3) held.value[index] = !held.value[index]
}
function save(category: CategoryId) {
  if (!rolls.value || scoreCard.value[category] !== undefined) return
  scoreCard.value = { ...scoreCard.value, [category]: scoreCategory(dice.value, category) }
  dice.value = Array(5).fill(0)
  held.value = Array(5).fill(false)
  rolls.value = 0
}
function restart() {
  scoreCard.value = {}
  dice.value = Array(5).fill(0)
  held.value = Array(5).fill(false)
  rolls.value = 0
}
</script>

<template>
  <main class="game">
    <h1>Yatzy</h1>
    <p class="status" role="status">
      {{
        gameOver
          ? `Spelet är slut! Slutpoäng: ${score}`
          : rolls
            ? `Kast ${rolls} av 3 – välj en kategori att spara poängen i.`
            : 'Kasta tärningarna för att börja.'
      }}
    </p>
    <div class="dice" aria-label="Tärningar">
      <button
        v-for="(die, index) in dice"
        :key="index"
        class="die"
        :class="{ held: held[index] }"
        :disabled="!rolls || rolls === 3 || gameOver"
        :aria-label="`Tärning ${index + 1}: ${die || 'inte kastad'}${held[index] ? ', sparad' : ''}`"
        @click="toggle(index)"
      >
        {{ die || '·' }}
      </button>
    </div>
    <div class="roll-actions">
      <button :disabled="rolls === 3 || gameOver" @click="roll">
        {{ rolls ? 'Kasta igen' : 'Kasta tärningarna' }}
      </button>
      <span>{{ rolls }}/3 kast</span>
    </div>
    <section class="scoresheet" aria-label="Yatzyprotokoll">
      <h2>Protokoll</h2>
      <div v-for="category in CATEGORIES" :key="category.id" class="score-row">
        <span>{{ category.label }}</span>
        <span>{{ scoreCard[category.id] ?? '—' }}</span>
        <button v-if="rolls && scoreCard[category.id] === undefined" @click="save(category.id)">
          Spara {{ scoreCategory(dice, category.id) }}
        </button>
        <span v-else />
      </div>
      <div class="score-row total">
        <strong>Summa</strong><strong>{{ score }}</strong
        ><span>Övre bonus 50 p vid 63 p</span>
      </div>
    </section>
    <div class="actions"><button @click="restart">Nytt spel</button></div>
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
.status {
  font-weight: 700;
  text-align: center;
}
.dice {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
}
.die {
  width: 3.7rem;
  height: 3.7rem;
  padding: 0;
  border: 2px solid #cbd5e1;
  border-radius: 0.8rem;
  background: #fff;
  font-size: 2rem;
  font-weight: 800;
  box-shadow: 0 3px 6px #0002;
}
.die.held {
  border-color: #7c3aed;
  background: #ede9fe;
}
.roll-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.scoresheet {
  width: min(100%, 32rem);
  padding: 1rem;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 1px 5px #0f172a1a;
}
h2 {
  margin: 0.1rem 0 0.7rem;
}
.score-row {
  display: grid;
  grid-template-columns: 1fr 3rem 7rem;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.35rem;
  border-bottom: 1px solid #e2e8f0;
}
.score-row > :nth-child(2) {
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.score-row button {
  padding: 0.3rem 0.5rem;
  font-size: 0.8rem;
}
.score-row.total {
  margin-top: 0.4rem;
  border: 0;
}
.score-row.total span {
  grid-column: 3;
  font-size: 0.7rem;
  color: #64748b;
}
.actions {
  display: flex;
  gap: 0.5rem;
}
</style>
