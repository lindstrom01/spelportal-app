<script setup lang="ts">
import { computed } from 'vue'
import PyramidBoard from '../components/PyramidBoard.vue'
import SolitaireFrame from '../components/SolitaireFrame.vue'
import {
  applyPyramidMove,
  dealPyramid,
  isPyramidStuck,
  isPyramidWon,
  type PyramidMove,
  type PyramidState,
} from '../core/pyramid'
import { useSolitaire } from '../core/useSolitaire'

const game = useSolitaire<PyramidState, PyramidMove>({
  deal: () => dealPyramid(),
  apply: applyPyramidMove,
  isWon: isPyramidWon,
})
const message = computed(() =>
  isPyramidStuck(game.state.value) ? 'Inga fler drag – ångra eller börja om.' : '',
)
</script>

<template>
  <SolitaireFrame
    title="Pyramid"
    :moves="game.moves.value"
    :can-undo="game.canUndo.value"
    :won="game.won.value"
    :message="message"
    @undo="game.undo"
    @restart="game.restart"
    @new-game="game.newGame"
  >
    <PyramidBoard :state="game.state.value" :play="game.play" />
    <p class="help">
      Para ihop två fria kort som summerar till 13. Knekt = 11, dam = 12, kung = 13 (tas bort
      ensam).
    </p>
  </SolitaireFrame>
</template>

<style scoped>
.help {
  font-size: 0.85rem;
  opacity: 0.7;
  max-width: 28rem;
  text-align: center;
}
</style>
