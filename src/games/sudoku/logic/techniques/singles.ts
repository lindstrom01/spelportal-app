import { UNITS, bit, cellName, maskToDigits, popCount } from '../board'
import type { Technique } from './types'

export const nakedSingle: Technique = {
  id: 'nakedSingle',
  name: 'Naken singel',
  find({ values, cands }) {
    for (let cell = 0; cell < values.length; cell++) {
      if (values[cell] === 0 && popCount(cands[cell]!) === 1) {
        const digit = maskToDigits(cands[cell]!)[0]!
        return {
          technique: 'nakedSingle',
          name: 'Naken singel',
          cells: [cell],
          placements: [{ cell, digit }],
          eliminations: [],
          message: `${cellName(cell)} har bara en möjlig siffra kvar: ${digit}. Alla andra siffror finns redan i cellens rad, kolumn eller ruta.`,
        }
      }
    }
    return null
  },
}

const UNIT_NAMES = ['raden', 'kolumnen', 'rutan']

export const hiddenSingle: Technique = {
  id: 'hiddenSingle',
  name: 'Gömd singel',
  find({ cands }) {
    for (let u = 0; u < UNITS.length; u++) {
      const unit = UNITS[u]!
      for (let digit = 1; digit <= 9; digit++) {
        const spots = unit.filter((c) => cands[c]! & bit(digit))
        if (spots.length === 1) {
          const cell = spots[0]!
          return {
            technique: 'hiddenSingle',
            name: 'Gömd singel',
            cells: [cell],
            placements: [{ cell, digit }],
            eliminations: [],
            message: `I ${UNIT_NAMES[Math.floor(u / 9)]} kan ${digit} bara placeras i ${cellName(cell)}, så där måste den stå.`,
          }
        }
      }
    }
    return null
  },
}
