<script setup lang="ts">
import { gamePath, type GameInfo } from '@/games/registry'

defineProps<{ game: GameInfo }>()
</script>

<template>
  <component
    :is="game.status === 'available' ? 'RouterLink' : 'div'"
    :to="game.status === 'available' ? gamePath(game) : undefined"
    class="card"
    :class="{ planned: game.status === 'planned' }"
    :style="{ '--from': game.accent[0], '--to': game.accent[1] }"
  >
    <span class="banner">
      <span class="icon" aria-hidden="true">{{ game.icon }}</span>
      <span v-if="game.status === 'planned'" class="badge">Kommer snart</span>
    </span>
    <span class="body">
      <strong class="title">{{ game.title }}</strong>
      <span class="desc">{{ game.description }}</span>
      <span class="tags">
        <span v-for="tag in game.tags" :key="tag" class="tag">{{ tag }}</span>
      </span>
      <span v-if="game.status === 'available'" class="cta">Spela nu →</span>
    </span>
  </component>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1rem;
  background: #fff;
  color: inherit;
  text-decoration: none;
  box-shadow: 0 1px 3px rgb(15 23 42 / 12%);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
a.card:hover,
a.card:focus-visible {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgb(15 23 42 / 22%);
}
a.card:focus-visible {
  outline: 3px solid var(--from);
  outline-offset: 2px;
}
.banner {
  position: relative;
  display: grid;
  place-items: center;
  height: 7rem;
  background: linear-gradient(135deg, var(--from), var(--to));
}
.icon {
  font-size: 3.2rem;
  filter: drop-shadow(0 2px 4px rgb(0 0 0 / 30%));
}
.badge {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 90%);
  color: #334155;
  font-size: 0.75rem;
  font-weight: 700;
}
.planned .banner {
  filter: grayscale(0.7);
}
.body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
}
.title {
  font-size: 1.15rem;
}
.desc {
  flex: 1;
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.4;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.tag {
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.75rem;
}
.cta {
  color: var(--to);
  font-weight: 700;
}
</style>
