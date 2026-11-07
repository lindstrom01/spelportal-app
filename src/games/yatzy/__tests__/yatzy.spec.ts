import { describe, expect, it } from 'vitest'
import { scoreCategory, totalScore } from '../rules'

describe('Yatzy scoring', () => {
  it('scores matching upper-section dice', () => {
    expect(scoreCategory([2, 2, 2, 4, 5], 'twos')).toBe(6)
  })

  it('scores the highest pair and a full house', () => {
    expect(scoreCategory([2, 2, 5, 5, 5], 'pair')).toBe(10)
    expect(scoreCategory([2, 2, 5, 5, 5], 'fullHouse')).toBe(19)
  })

  it('scores straights and Yatzy', () => {
    expect(scoreCategory([1, 2, 3, 4, 5], 'smallStraight')).toBe(15)
    expect(scoreCategory([2, 3, 4, 5, 6], 'largeStraight')).toBe(20)
    expect(scoreCategory([6, 6, 6, 6, 6], 'yatzy')).toBe(50)
  })

  it('adds the upper-section bonus at 63 points', () => {
    expect(totalScore({ ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18 })).toBe(113)
  })
})
