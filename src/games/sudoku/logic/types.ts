/** Flat 81-element array, index = row * 9 + col. 0 means empty. */
export type Grid = number[]

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'expert']

export interface Puzzle {
  puzzle: Grid
  solution: Grid
  difficulty: Difficulty
}
