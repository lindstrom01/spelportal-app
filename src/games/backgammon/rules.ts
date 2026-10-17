import type { GameRules, Outcome, PlayerId } from '@/core/boardgame/types'
import type { AiPlayer } from '@/core/boardgame/ai'
import { randomInt, type Rng } from '@/shared/random'

/**
 * Points are indexed 0..23. Positive values are player 0 (white) checkers, negative are
 * player 1 (black). White moves towards index 0 and bears off past it; black the opposite.
 */
export interface BackgammonState {
  points: number[]
  bar: [number, number]
  off: [number, number]
  turn: PlayerId
  /** Dice still to be played this turn (four entries after doubles). */
  dice: number[]
  /** Seed for the next roll. Keeping it in the state keeps the rules pure and replayable. */
  seed: number
}

/** `from` is a point 0..23, BAR to enter from the bar, or PASS when no move is possible. */
export interface BackgammonMove {
  from: number
  die: number
}

export const BAR = 24
export const PASS: BackgammonMove = { from: -1, die: 0 }
export const isPass = (m: BackgammonMove) => m.from === -1

const own = (v: number, p: PlayerId) => (p === 0 ? Math.max(v, 0) : Math.max(-v, 0))
const sign = (p: PlayerId) => (p === 0 ? 1 : -1)
const other = (p: PlayerId) => (1 - p) as PlayerId

function rand(seed: number): number {
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const step = (seed: number) => (seed + 0x6d2b79f5) >>> 0

function roll(seed: number): { dice: number[]; seed: number } {
  const s1 = step(seed)
  const s2 = step(s1)
  const a = 1 + Math.floor(rand(s1) * 6)
  const b = 1 + Math.floor(rand(s2) * 6)
  return { dice: a === b ? [a, a, a, a] : [Math.max(a, b), Math.min(a, b)], seed: s2 }
}

/** Destination point, or 'off' when the checker is borne off. */
export function moveTarget(p: PlayerId, m: BackgammonMove): number | 'off' {
  if (m.from === BAR) return p === 0 ? 24 - m.die : m.die - 1
  const t = p === 0 ? m.from - m.die : m.from + m.die
  return t < 0 || t > 23 ? 'off' : t
}

function allHome(s: BackgammonState, p: PlayerId): boolean {
  if (s.bar[p] > 0) return false
  for (let i = 0; i < 24; i++) {
    if (own(s.points[i]!, p) > 0 && !(p === 0 ? i <= 5 : i >= 18)) return false
  }
  return true
}

function rawMoves(s: BackgammonState): BackgammonMove[] {
  const p = s.turn
  const res: BackgammonMove[] = []
  for (const die of new Set(s.dice)) {
    if (s.bar[p] > 0) {
      const m = { from: BAR, die }
      const t = moveTarget(p, m) as number
      if (own(s.points[t]!, other(p)) < 2) res.push(m)
      continue
    }
    for (let from = 0; from < 24; from++) {
      if (own(s.points[from]!, p) === 0) continue
      const m = { from, die }
      const t = moveTarget(p, m)
      if (t === 'off') {
        if (!allHome(s, p)) continue
        const exact = p === 0 ? from - die === -1 : from + die === 24
        if (!exact) {
          // Overshooting is only allowed when no checker is further from the exit.
          let further = false
          for (let i = 0; i < 24 && !further; i++) {
            if (own(s.points[i]!, p) > 0 && (p === 0 ? i > from : i < from)) further = true
          }
          if (further) continue
        }
        res.push(m)
      } else if (own(s.points[t]!, other(p)) < 2) res.push(m)
    }
  }
  return res
}

/** Plays one checker without any turn handling. */
export function playOne(s: BackgammonState, m: BackgammonMove): BackgammonState {
  const p = s.turn
  const points = s.points.slice()
  const bar: [number, number] = [...s.bar]
  const off: [number, number] = [...s.off]
  if (m.from === BAR) bar[p]--
  else points[m.from]! -= sign(p)
  const t = moveTarget(p, m)
  if (t === 'off') off[p]++
  else {
    if (own(points[t]!, other(p)) === 1) {
      points[t] = 0
      bar[other(p)]++
    }
    points[t]! += sign(p)
  }
  const dice = s.dice.slice()
  dice.splice(dice.indexOf(m.die), 1)
  return { ...s, points, bar, off, dice }
}

function maxUsable(s: BackgammonState): number {
  if (!s.dice.length) return 0
  let best = 0
  for (const m of rawMoves(s)) {
    best = Math.max(best, 1 + maxUsable(playOne(s, m)))
    if (best === s.dice.length) break
  }
  return best
}

function endTurn(s: BackgammonState): BackgammonState {
  const r = roll(s.seed)
  return { ...s, turn: other(s.turn), dice: r.dice, seed: r.seed }
}

export function pipCount(s: BackgammonState, p: PlayerId): number {
  let pips = s.bar[p] * 25
  for (let i = 0; i < 24; i++) pips += own(s.points[i]!, p) * (p === 0 ? i + 1 : 24 - i)
  return pips
}

export const backgammon: GameRules<BackgammonState, BackgammonMove> & {
  initialState(seed?: number): BackgammonState
} = {
  initialState(seed: number = Math.floor(Math.random() * 2 ** 32)) {
    const points = Array<number>(24).fill(0)
    points[23] = 2
    points[12] = 5
    points[7] = 3
    points[5] = 5
    points[0] = -2
    points[11] = -5
    points[16] = -3
    points[18] = -5
    const r = roll(seed)
    return { points, bar: [0, 0], off: [0, 0], turn: 0, dice: r.dice, seed: r.seed }
  },
  currentPlayer: (s) => s.turn,
  outcome(s): Outcome {
    if (s.off[0] === 15) return { winner: 0 }
    if (s.off[1] === 15) return { winner: 1 }
    return null
  },
  legalMoves(s) {
    if (backgammon.outcome(s)) return []
    const raw = rawMoves(s)
    if (!raw.length) return [PASS]
    const total = maxUsable(s)
    let moves = raw.filter((m) => 1 + maxUsable(playOne(s, m)) === total)
    // If only one of two different dice can be played, the larger must be used when possible.
    if (total === 1 && s.dice.length === 2 && s.dice[0] !== s.dice[1]) {
      const larger = moves.filter((m) => m.die === Math.max(...s.dice))
      if (larger.length) moves = larger
    }
    return moves
  },
  isLegal: (s, m) => backgammon.legalMoves(s).some((x) => x.from === m.from && x.die === m.die),
  applyMove(s, m) {
    if (!backgammon.isLegal(s, m)) throw new Error(`Illegal move ${m.from}/${m.die}`)
    if (isPass(m)) return endTurn(s)
    const n = playOne(s, m)
    if (n.off[s.turn] === 15) return { ...n, dice: [] }
    return !n.dice.length || !rawMoves(n).length ? endTurn(n) : n
  },
}

/** Rough evaluation from `me`'s side: race lead, bar, blots and made points. */
export function evaluate(s: BackgammonState, me: PlayerId): number {
  const opp = other(me)
  let score = pipCount(s, opp) - pipCount(s, me)
  score += 25 * (s.bar[opp] - s.bar[me]) + 5 * (s.off[me] - s.off[opp])
  for (let i = 0; i < 24; i++) {
    const n = own(s.points[i]!, me)
    if (n === 1) score -= 8
    else if (n >= 2) score += 4
  }
  return score
}

/** One-ply greedy player: picks the checker move giving the best resulting position. */
export function greedyAi(rng: Rng = Math.random): AiPlayer<BackgammonState, BackgammonMove> {
  return (s) => {
    const moves = backgammon.legalMoves(s)
    if (moves.length === 1) return moves[0]!
    let best = moves[0]!
    let bestScore = -Infinity
    for (const m of moves) {
      const value = evaluate(playOne(s, m), s.turn) + rng() * 0.5
      if (value > bestScore) {
        bestScore = value
        best = m
      }
    }
    return best
  }
}

export function randomMoveAi(rng: Rng = Math.random): AiPlayer<BackgammonState, BackgammonMove> {
  return (s) => {
    const moves = backgammon.legalMoves(s)
    return moves[randomInt(moves.length, rng)]!
  }
}
