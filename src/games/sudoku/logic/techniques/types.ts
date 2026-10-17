import type { Grid } from '../types'

export type TechniqueId =
  | 'nakedSingle'
  | 'hiddenSingle'
  | 'nakedPair'
  | 'hiddenPair'
  | 'pointing'
  | 'claiming'
  | 'nakedTriple'
  | 'hiddenTriple'
  | 'xWing'

export interface Placement {
  cell: number
  digit: number
}

/** Remove `digit` from the candidates of `cell`. */
export type Elimination = Placement

export interface Hint {
  technique: TechniqueId
  /** Swedish display name of the technique. */
  name: string
  /** Cells that form the pattern (for highlighting). */
  cells: number[]
  placements: Placement[]
  eliminations: Elimination[]
  /** Swedish explanation of why the move is valid. */
  message: string
}

/** Solver state the techniques work on: current values plus candidate bitmasks. */
export interface TechniqueState {
  values: Grid
  cands: number[]
}

export interface Technique {
  id: TechniqueId
  name: string
  find: (state: TechniqueState) => Hint | null
}
