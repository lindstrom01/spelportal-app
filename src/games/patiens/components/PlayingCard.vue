<script setup lang="ts">
import { computed } from 'vue'
import { SUIT_SYMBOL, rankLabel, type Card } from '../core/cards'
import { cardBackUrl, cardImageUrl } from '../core/cardImages'

const props = defineProps<{ card?: Card | null; selected?: boolean; label?: string }>()

const faceUp = computed(() => props.card?.faceUp === true)
const text = computed(() =>
  props.card ? `${rankLabel(props.card.rank)}${SUIT_SYMBOL[props.card.suit]}` : '',
)
const image = computed(() => {
  if (!props.card) return undefined
  return props.card.faceUp ? cardImageUrl(props.card.rank, props.card.suit) : cardBackUrl
})
const aria = computed(() =>
  props.card ? (props.card.faceUp ? text.value : 'Nedvänt kort') : (props.label ?? 'Tom hög'),
)
</script>

<template>
  <button
    type="button"
    class="card"
    :class="{ empty: !card, back: card && !faceUp, selected }"
    :aria-label="aria"
    :aria-pressed="selected ? 'true' : undefined"
  >
    <img v-if="image" :src="image" alt="" draggable="false" />
    <span v-else-if="card && faceUp">{{ text }}</span>
    <span v-else-if="!card" class="slot-label">{{ label }}</span>
  </button>
</template>

<style scoped>
.card {
  display: block;
  width: 3.44rem;
  height: 5rem;
  padding: 0;
  border: 0;
  border-radius: 0.35rem;
  background: transparent;
  box-shadow: 0 1px 3px rgb(0 0 0 / 35%);
  cursor: pointer;
  overflow: hidden;
}
img {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.card.back:not(:has(img)) {
  border: 2px solid #fff;
  background: repeating-linear-gradient(45deg, #1d4ed8, #1d4ed8 4px, #3b82f6 4px, #3b82f6 8px);
}
.card.empty {
  border: 2px dashed #94a3b8;
  box-shadow: none;
  color: #94a3b8;
}
.card.selected {
  outline: 3px solid #f59e0b;
  outline-offset: 1px;
}
.slot-label {
  font-size: 1.3rem;
}
</style>
