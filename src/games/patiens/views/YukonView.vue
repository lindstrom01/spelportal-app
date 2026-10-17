<script setup lang="ts">
import PileBoard from '../components/PileBoard.vue'
import SolitaireFrame from '../components/SolitaireFrame.vue'
import {
  applyPileMove,
  dealYukon,
  isPileWon,
  type PileMove,
  type PileState,
} from '../core/pileGame'
import { useSolitaire } from '../core/useSolitaire'

const game = useSolitaire<PileState, PileMove>({
  deal: () => dealYukon(),
  apply: applyPileMove,
  isWon: isPileWon,
})
</script>

<template>
  <SolitaireFrame
    title="Yukon"
    :moves="game.moves.value"
    :can-undo="game.canUndo.value"
    :won="game.won.value"
    @undo="game.undo"
    @restart="game.restart"
    @new-game="game.newGame"
  >
    <PileBoard :state="game.state.value" :play="game.play" />
    <p class="help">
      Du får flytta vilket uppvänt kort som helst tillsammans med korten ovanpå det.
    </p>
  </SolitaireFrame>
</template>

<style scoped>
.help {
  font-size: 0.85rem;
  opacity: 0.7;
}
</style>
