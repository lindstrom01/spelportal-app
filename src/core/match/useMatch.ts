import { onScopeDispose, ref, shallowRef } from 'vue'
import type { AiPlayer } from '../boardgame/ai'
import type { GameRules, Outcome, PlayerId, SeatKind } from '../boardgame/types'

export interface MatchOptions<S, M> {
  seats: [SeatKind, SeatKind]
  /** AI per seat; required for every seat of kind 'ai'. */
  ai?: [AiPlayer<S, M> | null, AiPlayer<S, M> | null]
  aiDelayMs?: number
  /** Called after a local human move so it can be forwarded to a remote peer. */
  onLocalMove?: (move: M, ply: number) => void
}

/**
 * Drives one match: holds the state, accepts moves from the local human,
 * a computer opponent or a remote peer, and keeps them in a consistent order.
 */
export function useMatch<S, M>(rules: GameRules<S, M>, options: MatchOptions<S, M>) {
  const state = shallowRef<S>(rules.initialState())
  const ply = ref(0)
  const seats = ref<[SeatKind, SeatKind]>([...options.seats])
  // Incremented on reset so a pending AI move from an old game is dropped.
  let generation = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  const current = () => rules.currentPlayer(state.value)
  const outcome = (): Outcome => rules.outcome(state.value)

  function apply(move: M) {
    state.value = rules.applyMove(state.value, move)
    ply.value++
    scheduleAi()
  }

  function scheduleAi() {
    clearTimeout(timer)
    if (outcome()) return
    const player: PlayerId = current()
    const ai = options.ai?.[player]
    if (seats.value[player] !== 'ai' || !ai) return
    const gen = generation
    timer = setTimeout(() => {
      if (gen !== generation || outcome()) return
      apply(ai(state.value))
    }, options.aiDelayMs ?? 400)
  }

  /** A move from a human at this device; ignored unless it is a human seat's turn. */
  function submit(move: M): boolean {
    if (outcome() || seats.value[current()] !== 'human' || !rules.isLegal(state.value, move)) {
      return false
    }
    const playedAt = ply.value
    apply(move)
    options.onLocalMove?.(move, playedAt)
    return true
  }

  /** A move from the remote peer; validated and must match the expected ply. */
  function receiveRemote(move: M, remotePly: number): boolean {
    if (
      outcome() ||
      seats.value[current()] !== 'remote' ||
      remotePly !== ply.value ||
      !rules.isLegal(state.value, move)
    ) {
      return false
    }
    apply(move)
    return true
  }

  function reset(newSeats?: [SeatKind, SeatKind]) {
    generation++
    clearTimeout(timer)
    if (newSeats) seats.value = [...newSeats]
    state.value = rules.initialState()
    ply.value = 0
    scheduleAi()
  }

  scheduleAi()
  onScopeDispose(() => {
    generation++
    clearTimeout(timer)
  })

  return { state, ply, seats, submit, receiveRemote, reset, outcome, current }
}
