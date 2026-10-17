<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{ value: number; roll: number; used?: boolean; delay?: number }>()

// Pip positions on a 3x3 grid (1..9, row by row).
const PIPS: Record<number, number[]> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
}

const ROLL_MS = 750
const shown = ref(props.value)
const rolling = ref(false)
const landed = ref(false)
let ticker: ReturnType<typeof setInterval> | undefined
let finish: ReturnType<typeof setTimeout> | undefined
let start: ReturnType<typeof setTimeout> | undefined

function clear() {
  clearInterval(ticker)
  clearTimeout(finish)
  clearTimeout(start)
}

function throwDie() {
  clear()
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    shown.value = props.value
    return
  }
  landed.value = false
  start = setTimeout(() => {
    rolling.value = true
    // The face keeps changing while the die tumbles, then settles on the real value.
    ticker = setInterval(() => (shown.value = 1 + Math.floor(Math.random() * 6)), 75)
    finish = setTimeout(() => {
      clearInterval(ticker)
      shown.value = props.value
      rolling.value = false
      landed.value = true
    }, ROLL_MS)
  }, props.delay ?? 0)
}

onMounted(throwDie)
watch(() => props.roll, throwDie)
onBeforeUnmount(clear)
</script>

<template>
  <span
    class="die"
    :class="{ used, rolling, landed }"
    :style="{ '--tilt': `${((roll + (delay ?? 0)) % 3) * 7 - 7}deg` }"
    role="img"
    :aria-label="`Tärning ${value}${used ? ', använd' : ''}`"
  >
    <span class="face">
      <i
        v-for="p in PIPS[shown]"
        :key="p"
        :style="{ gridArea: `${Math.ceil(p / 3)} / ${((p - 1) % 3) + 1}` }"
      />
    </span>
  </span>
</template>

<style scoped>
.die {
  display: inline-block;
  width: 3.6rem;
  height: 3.6rem;
  transition:
    opacity 0.3s,
    filter 0.3s,
    transform 0.3s;
}
.face {
  display: grid;
  width: 100%;
  height: 100%;
  grid-template: repeat(3, 1fr) / repeat(3, 1fr);
  padding: 0.5rem;
  border-radius: 0.8rem;
  background:
    radial-gradient(circle at 28% 22%, rgb(255 255 255 / 0.4), transparent 55%),
    linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow:
    inset 0 0 0 2px rgb(199 210 254 / 0.55),
    inset 0 -3px 5px rgb(30 27 75 / 0.45),
    0 5px 0 #3730a3,
    0 9px 10px rgb(0 0 0 / 0.45);
}
.face i {
  align-self: center;
  justify-self: center;
  width: 78%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff, #e0e7ff 75%);
  box-shadow: inset 0 -1px 2px rgb(30 27 75 / 0.5);
}
.die.landed {
  transform: rotate(var(--tilt));
  animation: land 0.28s ease-out;
}
.die.used {
  opacity: 0.45;
  filter: saturate(0.5);
  transform: rotate(var(--tilt)) scale(0.9);
}
.die.rolling {
  animation: tumble 0.75s cubic-bezier(0.3, 0.6, 0.4, 1);
}

/* The die flies in from the side, bounces and spins before it settles. */
@keyframes tumble {
  0% {
    transform: translate(-5rem, -3rem) rotate(-300deg) scale(1.35);
  }
  35% {
    transform: translate(-1.4rem, 0.4rem) rotate(-110deg) scale(0.95);
  }
  50% {
    transform: translate(-0.8rem, -1rem) rotate(-40deg) scale(1.15);
  }
  70% {
    transform: translate(0.4rem, 0.2rem) rotate(25deg) scale(0.97);
  }
  85% {
    transform: translate(0, -0.35rem) rotate(-8deg) scale(1.04);
  }
  100% {
    transform: translate(0, 0) rotate(0) scale(1);
  }
}
@keyframes land {
  0% {
    transform: rotate(var(--tilt)) scale(1.1);
  }
  100% {
    transform: rotate(var(--tilt)) scale(1);
  }
}
</style>
