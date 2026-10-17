import type { Component } from 'vue'

export type CategoryId = 'puzzle' | 'solitaire' | 'board'

export interface Category {
  id: CategoryId
  title: string
  description: string
}

export interface GameInfo {
  id: string
  title: string
  description: string
  category: CategoryId
  icon: string
  /** Gradient colours for the game card. */
  accent: [string, string]
  tags: string[]
  status: 'available' | 'planned'
  /** Lazy loader, so each game becomes its own chunk. Omitted for planned games. */
  load?: () => Promise<{ default: Component }>
}

export const categories: Category[] = [
  { id: 'puzzle', title: 'Pussel', description: 'Logik och huvudbry' },
  { id: 'solitaire', title: 'Patienser', description: 'Kortspel att spela själv' },
  { id: 'board', title: 'Brädspel', description: 'Mot dator eller en kompis' },
]

export const games: GameInfo[] = [
  {
    id: 'sudoku',
    title: 'Sudoku',
    description: 'Fyra svårighetsgrader, anteckningar, tips och bildskanning.',
    category: 'puzzle',
    icon: '🔢',
    accent: ['#6366f1', '#8b5cf6'],
    tags: ['Logik', 'Enspelare', 'Skanna tidning'],
    status: 'available',
    load: () => import('./sudoku/SudokuView.vue'),
  },
  {
    id: 'klondike',
    title: 'Klondike',
    description: 'Den klassiska patiensen. Dra ett eller tre kort.',
    category: 'solitaire',
    icon: '♠️',
    accent: ['#16a34a', '#15803d'],
    tags: ['Klassiker', 'Enspelare'],
    status: 'available',
    load: () => import('./patiens/views/KlondikeView.vue'),
  },
  {
    id: 'yukon',
    title: 'Yukon',
    description: 'Alla kort ligger ute från start och sekvenser får flyttas fritt.',
    category: 'solitaire',
    icon: '♥️',
    accent: ['#0d9488', '#0f766e'],
    tags: ['Strategi', 'Enspelare'],
    status: 'available',
    load: () => import('./patiens/views/YukonView.vue'),
  },
  {
    id: 'pyramid',
    title: 'Pyramid',
    description: 'Ta bort par av kort som summerar till 13.',
    category: 'solitaire',
    icon: '🔺',
    accent: ['#d97706', '#b45309'],
    tags: ['Snabbt', 'Enspelare'],
    status: 'available',
    load: () => import('./patiens/views/PyramidView.vue'),
  },
  {
    id: 'tictactoe',
    title: 'Tre-i-rad',
    description: 'Mot dator, mot en vän på samma enhet eller online.',
    category: 'board',
    icon: '⭕',
    accent: ['#e11d48', '#be123c'],
    tags: ['Mot dator', 'Online'],
    status: 'available',
    load: () => import('./tictactoe/TicTacToeView.vue'),
  },
  {
    id: 'othello',
    title: 'Othello',
    description: 'Vänd motståndarens brickor och ta över brädet. Mot datorn.',
    category: 'board',
    icon: '⚫',
    accent: ['#15803d', '#166534'],
    tags: ['Mot dator', 'Strategi'],
    status: 'available',
    load: () => import('./othello/OthelloView.vue'),
  },
  {
    id: 'backgammon',
    title: 'Backgammon',
    description: 'Klassikern med tärningar, mot dator eller online.',
    category: 'board',
    icon: '🎲',
    accent: ['#64748b', '#475569'],
    tags: ['Mot dator', 'Tärningar'],
    status: 'available',
    load: () => import('./backgammon/BackgammonView.vue'),
  },
]

export const gamePath = (game: GameInfo) => `/spel/${game.id}`
