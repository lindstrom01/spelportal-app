import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { PEERS, bit, cellName, emptyGrid, filledArray, findConflicts } from '../logic/board'
import { generatePuzzle } from '../logic/generator'
import { analyzeGrid } from '../logic/analyze'
import { solve } from '../logic/solver'
import { applyHint, createState, findHint, type Hint } from '../logic/techniques'
import type { Difficulty, Grid } from '../logic/types'

interface Snapshot {
  values: Grid
  notes: number[]
  eliminated: number[]
}

export const useGameStore = defineStore('sudoku', () => {
  const difficulty = ref<Difficulty>('easy')
  const givens = ref<Grid>(emptyGrid())
  const solution = ref<Grid>(emptyGrid())
  const values = ref<Grid>(emptyGrid())
  /** Per-cell bitmask of pencil-mark candidates (see bit() in board.ts). */
  const notes = ref<number[]>(emptyGrid())
  /** Candidates ruled out by applied hints that plain row/column/box logic would still allow. */
  const eliminated = ref<number[]>(emptyGrid())
  const hint = ref<Hint | null>(null)
  const hintMessage = ref<string | null>(null)
  const selected = ref<number | null>(null)
  const notesMode = ref(false)
  const history = ref<Snapshot[]>([])
  const hasGame = ref(false)

  const conflicts = computed(() => findConflicts(values.value))
  const isSolved = computed(
    () => hasGame.value && values.value.every((v, i) => v !== 0 && v === solution.value[i]),
  )
  /** Number of placements of each digit (index 1-9), used to disable finished digits. */
  const digitCounts = computed(() => {
    const counts = filledArray(10)
    for (const v of values.value) counts[v]!++
    return counts
  })
  const candidates = computed(() => createState(values.value, eliminated.value).cands)
  /** Cells where the player's digit differs from the solution. */
  const mistakes = computed(() =>
    values.value.flatMap((v, i) => (v !== 0 && v !== solution.value[i] ? [i] : [])),
  )

  const isGiven = (i: number) => givens.value[i] !== 0

  function startGame(puzzle: Grid, full: Grid) {
    givens.value = puzzle
    solution.value = full
    values.value = puzzle.slice()
    notes.value = emptyGrid()
    eliminated.value = emptyGrid()
    clearHint()
    history.value = []
    selected.value = null
    hasGame.value = true
  }

  function newGame(level: Difficulty) {
    const { puzzle, solution: full } = generatePuzzle(level)
    difficulty.value = level
    startGame(puzzle, full)
  }

  /** Start a game from an existing grid (e.g. a scanned newspaper puzzle). Needs a unique solution. */
  function loadPuzzle(puzzle: Grid): boolean {
    const full = solve(puzzle)
    if (!analyzeGrid(puzzle).playable || !full) return false
    startGame(puzzle.slice(), full)
    return true
  }

  function select(i: number | null) {
    selected.value = i
  }

  function move(dRow: number, dCol: number) {
    const cur = selected.value ?? 0
    const row = Math.min(8, Math.max(0, Math.floor(cur / 9) + dRow))
    const col = Math.min(8, Math.max(0, (cur % 9) + dCol))
    selected.value = row * 9 + col
  }

  function pushHistory() {
    history.value.push({
      values: values.value.slice(),
      notes: notes.value.slice(),
      eliminated: eliminated.value.slice(),
    })
  }

  function input(digit: number) {
    const i = selected.value
    if (i === null || isGiven(i) || isSolved.value) return
    if (notesMode.value && values.value[i] !== 0) return
    clearHint()
    pushHistory()
    if (notesMode.value) {
      notes.value[i]! ^= bit(digit)
      return
    }
    if (values.value[i] === digit) {
      values.value[i] = 0
      return
    }
    values.value[i] = digit
    notes.value[i] = 0
    for (const p of PEERS[i]!) notes.value[p]! &= ~bit(digit)
  }

  function erase() {
    const i = selected.value
    if (i === null || isGiven(i) || isSolved.value) return
    if (values.value[i] === 0 && notes.value[i] === 0) return
    clearHint()
    pushHistory()
    values.value[i] = 0
    notes.value[i] = 0
  }

  function undo() {
    const snap = history.value.pop()
    if (!snap) return
    values.value = snap.values
    notes.value = snap.notes
    eliminated.value = snap.eliminated
    clearHint()
  }

  /** Fill every empty cell's notes with all digits still possible. */
  function fillAllNotes() {
    pushHistory()
    notes.value = candidates.value.slice()
  }

  function clearHint() {
    hint.value = null
    hintMessage.value = null
  }

  /** Find the simplest applicable technique, or explain why no hint can be given. */
  function requestHint() {
    clearHint()
    if (mistakes.value.length > 0) {
      hintMessage.value = `Det finns felaktiga siffror i br�det (t.ex. i ${cellName(mistakes.value[0]!)}). R�tta dem innan du ber om ett tips.`
      return
    }
    const found = findHint(createState(values.value, eliminated.value))
    if (found) hint.value = found
    else hintMessage.value = 'Inga av de inbyggda teknikerna hittar n�got drag h�r.'
  }

  function applyCurrentHint() {
    const h = hint.value
    if (!h) return
    pushHistory()
    const state = createState(values.value, eliminated.value)
    applyHint(state, h)
    for (const { cell, digit } of h.placements) {
      notes.value[cell] = 0
      for (const p of PEERS[cell]!) notes.value[p]! &= ~bit(digit)
    }
    for (const { cell, digit } of h.eliminations) {
      eliminated.value[cell]! |= bit(digit)
      notes.value[cell]! &= ~bit(digit)
    }
    values.value = state.values
    selected.value = (h.placements[0] ?? h.eliminations[0])?.cell ?? selected.value
    clearHint()
  }

  return {
    difficulty,
    givens,
    solution,
    values,
    notes,
    selected,
    notesMode,
    history,
    hasGame,
    conflicts,
    isSolved,
    digitCounts,
    candidates,
    mistakes,
    hint,
    hintMessage,
    isGiven,
    newGame,
    loadPuzzle,
    select,
    move,
    input,
    erase,
    undo,
    fillAllNotes,
    requestHint,
    applyCurrentHint,
    clearHint,
  }
})
