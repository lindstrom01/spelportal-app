export type PlayerId = 0 | 1

export type Outcome = { winner: PlayerId } | { draw: true } | null

/**
 * Pure, immutable rules for a two-player turn-based game.
 * Keeping rules free of UI and networking lets the same code drive
 * local play, the computer opponent and online play.
 */
export interface GameRules<S, M> {
  initialState(): S
  currentPlayer(state: S): PlayerId
  legalMoves(state: S): M[]
  /** Returns a new state; must not mutate the input. */
  applyMove(state: S, move: M): S
  /** null while the game is still running. */
  outcome(state: S): Outcome
  isLegal(state: S, move: M): boolean
}

export type SeatKind = 'human' | 'ai' | 'remote'
