import { randomInt, type Rng } from '@/shared/random'
import type { GameRules, PlayerId } from './types'

export type AiPlayer<S, M> = (state: S) => M

export function randomAi<S, M>(rules: GameRules<S, M>, rng: Rng = Math.random): AiPlayer<S, M> {
  return (state) => {
    const moves = rules.legalMoves(state)
    return moves[randomInt(moves.length, rng)]!
  }
}

/**
 * Generic negamax search with alpha-beta pruning. Scores are from the point of view of
 * `me`: +1 win, -1 loss, 0 draw, shaded by depth so quicker wins are preferred.
 * Suitable for small games; larger games should supply a depth limit and heuristic.
 */
export function minimaxAi<S, M>(
  rules: GameRules<S, M>,
  options: { maxDepth?: number; heuristic?: (state: S, me: PlayerId) => number } = {},
  rng: Rng = Math.random,
): AiPlayer<S, M> {
  const maxDepth = options.maxDepth ?? Infinity
  const heuristic = options.heuristic ?? (() => 0)

  function score(state: S, me: PlayerId, depth: number, alpha: number, beta: number): number {
    const out = rules.outcome(state)
    if (out) return 'winner' in out ? (out.winner === me ? 100 - depth : depth - 100) : 0
    if (depth >= maxDepth) return heuristic(state, me)
    const maximizing = rules.currentPlayer(state) === me
    let best = maximizing ? -Infinity : Infinity
    for (const move of rules.legalMoves(state)) {
      const value = score(rules.applyMove(state, move), me, depth + 1, alpha, beta)
      if (maximizing) {
        best = Math.max(best, value)
        alpha = Math.max(alpha, best)
      } else {
        best = Math.min(best, value)
        beta = Math.min(beta, best)
      }
      if (alpha >= beta) break
    }
    return best
  }

  return (state) => {
    const me = rules.currentPlayer(state)
    let bestScore = -Infinity
    let bestMoves: M[] = []
    for (const move of rules.legalMoves(state)) {
      const value = score(rules.applyMove(state, move), me, 1, -Infinity, Infinity)
      if (value > bestScore) {
        bestScore = value
        bestMoves = [move]
      } else if (value === bestScore) bestMoves.push(move)
    }
    return bestMoves[randomInt(bestMoves.length, rng)]!
  }
}

/** Plays the strong AI with probability `strength`, otherwise a random move. */
export function blendAi<S, M>(
  strong: AiPlayer<S, M>,
  weak: AiPlayer<S, M>,
  strength: number,
  rng: Rng = Math.random,
): AiPlayer<S, M> {
  return (state) => (rng() < strength ? strong(state) : weak(state))
}
