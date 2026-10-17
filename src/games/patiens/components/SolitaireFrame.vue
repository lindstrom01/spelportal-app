<script setup lang="ts">
defineProps<{
  title: string
  moves: number
  canUndo: boolean
  won: boolean
  message?: string
}>()
defineEmits<{ undo: []; restart: []; newGame: [] }>()
</script>

<template>
  <main class="frame">
    <h1>{{ title }}</h1>
    <div class="toolbar">
      <button @click="$emit('newGame')">Ny giv</button>
      <button @click="$emit('restart')">Börja om</button>
      <button :disabled="!canUndo" @click="$emit('undo')">Ångra</button>
      <slot name="options" />
      <span class="moves">Drag: {{ moves }}</span>
    </div>
    <p v-if="won" class="msg win" role="status">Grattis, du klarade det! 🎉</p>
    <p v-else-if="message" class="msg" role="status">{{ message }}</p>
    <slot />
  </main>
</template>

<style scoped>
.frame {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
.msg {
  font-weight: 600;
  margin: 0;
}
.win {
  font-size: 1.3rem;
  color: #15803d;
}
</style>
