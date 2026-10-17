<script setup lang="ts">
import { ref } from 'vue'
import { SUIT_SYMBOL, SUITS } from '../core/cards'
import { foundationMoveFor, type PileMove, type PileRef, type PileState } from '../core/pileGame'
import PlayingCard from './PlayingCard.vue'

const props = defineProps<{ state: PileState; play: (move: PileMove) => boolean }>()

interface Selection {
  from: PileRef
  count: number
}
const selected = ref<Selection | null>(null)

const same = (a: PileRef, b: PileRef) =>
  a.pile === b.pile && (!('index' in a) || !('index' in b) || a.index === b.index)

function drawOrRecycle() {
  selected.value = null
  if (!props.play({ type: 'draw' })) props.play({ type: 'recycle' })
}

function tryMoveTo(to: PileRef): boolean {
  const sel = selected.value
  if (!sel) return false
  const ok = props.play({ type: 'move', from: sel.from, count: sel.count, to })
  if (ok) selected.value = null
  return ok
}

function select(from: PileRef, count: number) {
  selected.value =
    selected.value && same(selected.value.from, from) && selected.value.count === count
      ? null
      : { from, count }
}

function clickTableau(col: number, row?: number) {
  const pile = props.state.tableau[col]!
  if (tryMoveTo({ pile: 'tableau', index: col })) return
  if (row === undefined || !pile[row]?.faceUp) {
    selected.value = null
    return
  }
  select({ pile: 'tableau', index: col }, pile.length - row)
}

function clickWaste() {
  if (props.state.waste.length === 0) return
  select({ pile: 'waste' }, 1)
}

function clickFoundation(index: number) {
  if (tryMoveTo({ pile: 'foundation', index })) return
  if (props.state.foundations[index]!.length > 0) select({ pile: 'foundation', index }, 1)
}

function autoFoundation(from: PileRef) {
  const move = foundationMoveFor(props.state, from)
  selected.value = null
  if (move) props.play(move)
}

function dragStart(event: DragEvent, from: PileRef, count: number) {
  selected.value = { from, count }
  const dt = event.dataTransfer
  if (!dt) return
  dt.effectAllowed = 'move'
  dt.setData('text/plain', 'card')
  // Show the whole dragged run, not just the grabbed card.
  const first = event.currentTarget as HTMLElement
  const items = [first]
  for (let n = first.nextElementSibling; n && items.length < count; n = n.nextElementSibling) {
    items.push(n as HTMLElement)
  }
  const ghost = document.createElement('div')
  ghost.style.cssText = 'position:absolute;top:-1000px;left:0;width:3.6rem'
  items.forEach((el) => ghost.appendChild(el.cloneNode(true)))
  document.body.appendChild(ghost)
  dt.setDragImage(ghost, 24, 20)
  setTimeout(() => ghost.remove())
}

const dragEnd = () => (selected.value = null)

function drop(to: PileRef) {
  tryMoveTo(to)
  selected.value = null
}

const isSelected = (ref: PileRef, count?: number) =>
  !!selected.value &&
  same(selected.value.from, ref) &&
  (count === undefined || selected.value.count >= count)
const offset = (faceUp: boolean) => (faceUp ? -3.4 : -4)
</script>

<template>
  <div class="board">
    <div class="top">
      <div v-if="state.variant === 'klondike'" class="row">
        <div @click="drawOrRecycle">
          <PlayingCard :card="state.stock.at(-1)" :label="state.waste.length ? '↻' : ''" />
        </div>
        <div
          :draggable="state.waste.length > 0"
          @click="clickWaste"
          @dblclick="autoFoundation({ pile: 'waste' })"
          @dragstart="dragStart($event, { pile: 'waste' }, 1)"
          @dragend="dragEnd"
        >
          <PlayingCard
            :card="state.waste.at(-1)"
            :selected="isSelected({ pile: 'waste' })"
            label=""
          />
        </div>
      </div>
      <div class="row foundations">
        <div
          v-for="(pile, i) in state.foundations"
          :key="i"
          :draggable="pile.length > 0"
          @click="clickFoundation(i)"
          @dragstart="dragStart($event, { pile: 'foundation', index: i }, 1)"
          @dragend="dragEnd"
          @dragover.prevent
          @drop.prevent="drop({ pile: 'foundation', index: i })"
        >
          <PlayingCard
            :card="pile.at(-1)"
            :selected="isSelected({ pile: 'foundation', index: i })"
            :label="SUIT_SYMBOL[SUITS[i]!]"
          />
        </div>
      </div>
    </div>

    <div class="tableau">
      <div
        v-for="(pile, col) in state.tableau"
        :key="col"
        class="column"
        @dragover.prevent
        @drop.prevent="drop({ pile: 'tableau', index: col })"
      >
        <div v-if="pile.length === 0" @click="clickTableau(col)">
          <PlayingCard :card="null" label="K" />
        </div>
        <div
          v-for="(card, row) in pile"
          :key="`${card.suit}${card.rank}`"
          :style="{ marginTop: row === 0 ? 0 : `${offset(pile[row - 1]!.faceUp)}rem` }"
          :draggable="card.faceUp"
          @dragstart="dragStart($event, { pile: 'tableau', index: col }, pile.length - row)"
          @dragend="dragEnd"
          @click.stop="clickTableau(col, row)"
          @dblclick.stop="
            row === pile.length - 1 && autoFoundation({ pile: 'tableau', index: col })
          "
        >
          <PlayingCard
            :card="card"
            :selected="
              !!selected &&
              same(selected.from, { pile: 'tableau', index: col }) &&
              row >= pile.length - selected.count
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.board {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}
.row {
  display: flex;
  gap: 0.5rem;
}
.foundations {
  margin-left: auto;
}
.column {
  min-height: 24rem;
}
.tableau {
  display: grid;
  grid-template-columns: repeat(7, 3.6rem);
  gap: 0.5rem;
  align-items: start;
  min-height: 24rem;
}
</style>
