<script setup lang="ts">
import { computed } from 'vue'
import { maskToDigits } from '../logic/board'

const props = defineProps<{
  value: number
  notes: number
  given: boolean
  selected: boolean
  related: boolean
  sameValue: boolean
  conflict: boolean
  hintRole: 'pattern' | 'target' | null
}>()

const noteDigits = computed(() => new Set(maskToDigits(props.notes)))
</script>

<template>
  <button
    type="button"
    class="cell"
    :class="{
      given,
      selected,
      related: related && !selected,
      'same-value': sameValue && !selected,
      conflict,
      'hint-pattern': hintRole === 'pattern',
      'hint-target': hintRole === 'target',
    }"
  >
    <span v-if="value" class="value">{{ value }}</span>
    <span v-else-if="notes" class="notes" aria-hidden="true">
      <span v-for="d in 9" :key="d">{{ noteDigits.has(d) ? d : '' }}</span>
    </span>
  </button>
</template>

<style scoped>
.cell {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  cursor: pointer;
  background: var(--cell-bg);
  color: var(--user-color);
  font-size: clamp(1.1rem, 5vw, 1.9rem);
}
.cell.given {
  color: var(--given-color);
  font-weight: 700;
}
.cell.related {
  background: var(--related-bg);
}
.cell.same-value {
  background: var(--same-bg);
}
.cell.selected {
  background: var(--selected-bg);
}
.cell.hint-pattern {
  background: var(--hint-cell-bg);
}
.cell.hint-target {
  background: var(--hint-target-bg);
}
.cell.conflict .value {
  color: var(--error-color);
}
.cell:focus-visible {
  outline: 3px solid var(--selected-outline);
  outline-offset: -3px;
}
.notes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
  height: 100%;
  font-size: clamp(0.5rem, 2vw, 0.8rem);
  color: var(--notes-color);
  text-align: center;
  align-items: center;
}
</style>
