<script setup lang="ts">
import { ref, watch } from 'vue'
import PileBoard from '../components/PileBoard.vue'
import SolitaireFrame from '../components/SolitaireFrame.vue'
import {
  applyPileMove,
  dealKlondike,
  isPileWon,
  type PileMove,
  type PileState,
} from '../core/pileGame'
import { useSolitaire } from '../core/useSolitaire'

const drawCount = ref<1 | 3>(1)
const game = useSolitaire<PileState, PileMove>({
  deal: () => dealKlondike(undefined, drawCount.value),
  apply: applyPileMove,
  isWon: isPileWon,
})
watch(drawCount, () => game.newGame())
</script>

<template>
  <SolitaireFrame
    title="Klondike"
    :moves="game.moves.value"
    :can-undo="game.canUndo.value"
    :won="game.won.value"
    @undo="game.undo"
    @restart="game.restart"
    @new-game="game.newGame"
  >
    <template #options>
      <label>
        Dra
        <select v-model="drawCount">
          <option :value="1">1 kort</option>
          <option :value="3">3 kort</option>
        </select>
      </label>
    </template>
    <PileBoard :state="game.state.value" :play="game.play" />
    <p class="help">
      Klicka på ett kort och sedan på målet. Dubbelklicka för att lägga på grundhögen.
    </p>
  </SolitaireFrame>
</template>

<style scoped>
.help {
  font-size: 0.85rem;
  opacity: 0.7;
}
</style>
