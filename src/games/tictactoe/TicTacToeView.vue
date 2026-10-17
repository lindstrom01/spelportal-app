<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue'
import { minimaxAi, randomAi } from '@/core/boardgame/ai'
import { useMatch } from '@/core/match/useMatch'
import { createBroadcastTransport } from '@/core/net/broadcast'
import { connectRoom, generateRoomCode } from '@/core/net/room'
import { ticTacToe, winningLine, type TicTacToeMove } from './rules'

type Mode = 'ai' | 'local' | 'online'

const mode = ref<Mode>('ai')
const difficulty = ref<'easy' | 'hard'>('hard')
const humanFirst = ref(true)
const roomCode = ref('')
const joinCode = ref('')
const started = ref(false)
type Room = ReturnType<typeof connectRoom<TicTacToeMove>>
const room = ref<Room | null>(null)
const myRole = ref<'host' | 'guest' | null>(null)

const hard = minimaxAi(ticTacToe)
const easy = randomAi(ticTacToe)
const aiPlayer = (s: Parameters<typeof hard>[0]) =>
  difficulty.value === 'hard' ? hard(s) : easy(s)

const match = useMatch(ticTacToe, {
  seats: ['human', 'human'],
  ai: [aiPlayer, aiPlayer],
  onLocalMove: (move, ply) => room.value?.sendMove(move, ply),
})

const mark = (p: 0 | 1) => (p === 0 ? 'X' : 'O')
const board = computed(() => match.state.value.board)
const outcome = computed(() => ticTacToe.outcome(match.state.value))
const line = computed(() => winningLine(board.value) ?? [])
const mySeat = computed(() => (myRole.value === 'guest' ? 1 : 0))

const status = computed(() => {
  const out = outcome.value
  if (out && 'winner' in out) return `${mark(out.winner)} vann!`
  if (out) return 'Oavgjort.'
  if (mode.value === 'online') {
    if (room.value?.status === 'closed') return 'Motspelaren lämnade spelet.'
    if (room.value?.status === 'waiting') {
      return myRole.value === 'host'
        ? `Väntar på motspelare… Rumskod: ${roomCode.value}`
        : 'Ansluter…'
    }
    return match.current() === mySeat.value
      ? `Din tur (${mark(mySeat.value)})`
      : `Motspelarens tur (${mark(match.current())})`
  }
  return `${mark(match.current())}:s tur`
})

function closeRoom() {
  room.value?.close()
  room.value = null
  myRole.value = null
}

function start() {
  closeRoom()
  started.value = true
  if (mode.value === 'local') match.reset(['human', 'human'])
  else if (mode.value === 'ai') {
    match.reset(humanFirst.value ? ['human', 'ai'] : ['ai', 'human'])
  }
}

function openRoom(role: 'host' | 'guest', code: string) {
  closeRoom()
  started.value = true
  myRole.value = role
  roomCode.value = code
  match.reset(['remote', 'remote'])
  const seats: ['human', 'remote'] | ['remote', 'human'] =
    role === 'host' ? ['human', 'remote'] : ['remote', 'human']
  room.value = connectRoom<TicTacToeMove>(createBroadcastTransport(code), role, code, {
    onMove: (move, ply) => match.receiveRemote(move, ply),
    onConnected: () => match.reset(seats),
  })
}

const createRoom = () => openRoom('host', generateRoomCode())
const joinRoom = () =>
  joinCode.value.trim() && openRoom('guest', joinCode.value.trim().toUpperCase())

function play(index: number) {
  match.submit(index)
}

function backToSetup() {
  closeRoom()
  started.value = false
}

onScopeDispose(closeRoom)
</script>

<template>
  <main class="ttt">
    <h1>Tre-i-rad</h1>

    <form v-if="!started" class="setup" @submit.prevent="mode === 'online' ? undefined : start()">
      <fieldset>
        <legend>Spelläge</legend>
        <label><input v-model="mode" type="radio" value="ai" /> Mot datorn</label>
        <label><input v-model="mode" type="radio" value="local" /> Två spelare, samma enhet</label>
        <label><input v-model="mode" type="radio" value="online" /> Online</label>
      </fieldset>

      <template v-if="mode === 'ai'">
        <label>
          Svårighet
          <select v-model="difficulty">
            <option value="easy">Lätt</option>
            <option value="hard">Svår</option>
          </select>
        </label>
        <label>
          Du spelar
          <select v-model="humanFirst">
            <option :value="true">X (börjar)</option>
            <option :value="false">O</option>
          </select>
        </label>
      </template>

      <template v-if="mode === 'online'">
        <button type="button" @click="createRoom">Skapa rum</button>
        <label>
          Rumskod
          <input v-model="joinCode" maxlength="4" autocomplete="off" />
        </label>
        <button type="button" :disabled="!joinCode.trim()" @click="joinRoom">Gå med</button>
        <p class="note">
          Online fungerar just nu mellan flikar i samma webbläsare. Spel över internet kräver en
          server och är förberett via transportlagret.
        </p>
      </template>

      <button v-else type="submit">Starta</button>
    </form>

    <template v-else>
      <p class="status" role="status">{{ status }}</p>
      <div class="board" role="grid" aria-label="Spelbräde">
        <button
          v-for="(cell, i) in board"
          :key="i"
          class="cell"
          :class="{ win: line.includes(i), o: cell === 1 }"
          :aria-label="`Ruta ${i + 1}${cell === null ? '' : ', ' + mark(cell)}`"
          :disabled="cell !== null || !!outcome"
          @click="play(i)"
        >
          {{ cell === null ? '' : mark(cell) }}
        </button>
      </div>
      <div class="actions">
        <button v-if="mode !== 'online'" @click="start">Ny omgång</button>
        <button @click="backToSetup">Byt spelläge</button>
      </div>
    </template>
  </main>
</template>

<style scoped>
.ttt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}
.setup {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 16rem;
}
fieldset {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.board {
  display: grid;
  grid-template-columns: repeat(3, 5.5rem);
  gap: 0.35rem;
}
.cell {
  width: 5.5rem;
  height: 5.5rem;
  font-size: 2.6rem;
  font-weight: 700;
  color: #2563eb;
  cursor: pointer;
}
.cell.o {
  color: #dc2626;
}
.cell.win {
  background: #bbf7d0;
}
.cell:disabled {
  cursor: default;
}
.status {
  font-size: 1.1rem;
  font-weight: 600;
}
.actions {
  display: flex;
  gap: 0.5rem;
}
.note {
  font-size: 0.85rem;
  opacity: 0.7;
}
</style>
