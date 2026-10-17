<script setup lang="ts">
import { ref } from 'vue'
import {
  isPyramidWon,
  isFree,
  type PyramidMove,
  type PyramidRef,
  type PyramidState,
} from '../core/pyramid'
import PlayingCard from './PlayingCard.vue'

const props = defineProps<{ state: PyramidState; play: (move: PyramidMove) => boolean }>()

const selected = ref<PyramidRef | null>(null)
const same = (a: PyramidRef | null, b: PyramidRef) =>
  !!a &&
  a.pile === b.pile &&
  (a.pile === 'waste' || (b.pile === 'pyramid' && a.row === b.row && a.col === b.col))

function click(ref: PyramidRef) {
  if (isPyramidWon(props.state)) return
  const card =
    ref.pile === 'waste' ? props.state.waste.at(-1) : props.state.pyramid[ref.row]![ref.col]
  if (!card || (ref.pile === 'pyramid' && !isFree(props.state, ref.row, ref.col))) return
  if (card.rank === 13) {
    selected.value = null
    props.play({ type: 'remove', refs: [ref] })
  } else if (same(selected.value, ref)) {
    selected.value = null
  } else if (selected.value && props.play({ type: 'remove', refs: [selected.value, ref] })) {
    selected.value = null
  } else {
    selected.value = ref
  }
}

function dragStart(event: DragEvent, ref: PyramidRef) {
  selected.value = ref
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', 'card')
  }
}

function drop(target: PyramidRef) {
  const from = selected.value
  selected.value = null
  if (from && !same(from, target)) props.play({ type: 'remove', refs: [from, target] })
}

function drawOrRecycle() {
  selected.value = null
  if (!props.play({ type: 'draw' })) props.play({ type: 'recycle' })
}
</script>

<template>
  <div class="pyramid">
    <div v-for="(row, r) in state.pyramid" :key="r" class="row">
      <div v-for="(card, c) in row" :key="c" class="slot">
        <div
          v-if="card"
          :class="{ blocked: !isFree(state, r, c) }"
          :draggable="isFree(state, r, c)"
          @click="click({ pile: 'pyramid', row: r, col: c })"
          @dragstart="dragStart($event, { pile: 'pyramid', row: r, col: c })"
          @dragend="selected = null"
          @dragover.prevent
          @drop.prevent="drop({ pile: 'pyramid', row: r, col: c })"
        >
          <PlayingCard
            :card="card"
            :selected="same(selected, { pile: 'pyramid', row: r, col: c })"
          />
        </div>
      </div>
    </div>
    <div class="piles">
      <div @click="drawOrRecycle">
        <PlayingCard
          :card="state.stock.length ? { ...state.stock.at(-1)!, faceUp: false } : null"
          :label="state.recyclesLeft > 0 && state.waste.length ? '↻' : ''"
        />
      </div>
      <div
        :draggable="state.waste.length > 0"
        @click="click({ pile: 'waste' })"
        @dragstart="dragStart($event, { pile: 'waste' })"
        @dragend="selected = null"
      >
        <PlayingCard
          :card="state.waste.at(-1)"
          :selected="same(selected, { pile: 'waste' })"
          label=""
        />
      </div>
      <span class="info">Omdelningar kvar: {{ state.recyclesLeft }}</span>
    </div>
  </div>
</template>

<style scoped>
.pyramid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}
.row {
  display: flex;
  gap: 0.4rem;
  margin-top: -2.2rem;
}
.row:first-child {
  margin-top: 0;
}
.slot {
  width: 3.6rem;
  height: 5rem;
}
.blocked {
  opacity: 0.55;
  pointer-events: none;
}
.piles {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 1.5rem;
}
.info {
  margin-left: 1rem;
  font-size: 0.9rem;
}
</style>
