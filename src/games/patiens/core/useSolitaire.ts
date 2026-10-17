import { computed, ref, shallowRef } from 'vue'

/**
 * Generic solitaire session: current state, undo history and move counter.
 * `apply` returns the next state, or null for an illegal move.
 */
export function useSolitaire<S, M>(options: {
  deal: () => S
  apply: (state: S, move: M) => S | null
  isWon: (state: S) => boolean
}) {
  const initial = shallowRef<S>(options.deal())
  const state = shallowRef<S>(initial.value)
  const history = shallowRef<S[]>([])
  const moves = ref(0)

  const won = computed(() => options.isWon(state.value))
  const canUndo = computed(() => history.value.length > 0)

  function play(move: M): boolean {
    if (won.value) return false
    const next = options.apply(state.value, move)
    if (!next) return false
    history.value = [...history.value, state.value]
    state.value = next
    moves.value++
    return true
  }

  function undo() {
    const previous = history.value.at(-1)
    if (previous === undefined) return
    state.value = previous
    history.value = history.value.slice(0, -1)
    moves.value++
  }

  function reset(s: S) {
    state.value = s
    history.value = []
    moves.value = 0
  }

  const newGame = () => {
    initial.value = options.deal()
    reset(initial.value)
  }
  const restart = () => reset(initial.value)

  return { state, moves, won, canUndo, play, undo, newGame, restart }
}
