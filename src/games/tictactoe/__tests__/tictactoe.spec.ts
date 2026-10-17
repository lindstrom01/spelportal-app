import { describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { minimaxAi, randomAi } from '@/core/boardgame/ai'
import type { AiPlayer } from '@/core/boardgame/ai'
import { useMatch } from '@/core/match/useMatch'
import { createMemoryPair } from '@/core/net/memory'
import { connectRoom } from '@/core/net/room'
import { ticTacToe, type TicTacToeMove, type TicTacToeState } from '../rules'

type Ai = AiPlayer<TicTacToeState, TicTacToeMove>

function play(a: Ai, b: Ai) {
  let s = ticTacToe.initialState()
  while (!ticTacToe.outcome(s)) {
    s = ticTacToe.applyMove(s, (ticTacToe.currentPlayer(s) === 0 ? a : b)(s))
  }
  return ticTacToe.outcome(s)
}

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms))

describe('tic-tac-toe rules', () => {
  it('detects wins and illegal moves', () => {
    let s = ticTacToe.initialState()
    for (const m of [0, 3, 1, 4, 2]) s = ticTacToe.applyMove(s, m)
    expect(ticTacToe.outcome(s)).toEqual({ winner: 0 })
    expect(ticTacToe.legalMoves(s)).toEqual([])
    expect(ticTacToe.isLegal(ticTacToe.initialState(), 9)).toBe(false)
    expect(ticTacToe.isLegal(ticTacToe.applyMove(ticTacToe.initialState(), 4), 4)).toBe(false)
  })

  it('perfect play ends in a draw', () => {
    const ai = minimaxAi(ticTacToe)
    expect(play(ai, ai)).toEqual({ draw: true })
  })

  it('minimax never loses to random play', () => {
    const strong = minimaxAi(ticTacToe)
    const weak = randomAi(ticTacToe)
    for (let i = 0; i < 20; i++) {
      expect(play(strong, weak)).not.toEqual({ winner: 1 })
      expect(play(weak, strong)).not.toEqual({ winner: 0 })
    }
  })
})

describe('match flow', () => {
  it('lets the computer answer a human move', () => {
    vi.useFakeTimers()
    const scope = effectScope()
    const match = scope.run(() =>
      useMatch(ticTacToe, {
        seats: ['human', 'ai'],
        ai: [null, minimaxAi(ticTacToe)],
        aiDelayMs: 10,
      }),
    )!
    expect(match.submit(4)).toBe(true)
    expect(match.submit(0)).toBe(false)
    vi.advanceTimersByTime(20)
    expect(match.ply.value).toBe(2)
    scope.stop()
    vi.useRealTimers()
  })

  it('synchronises two peers through a transport', async () => {
    const [ta, tb] = createMemoryPair<TicTacToeMove>()
    const scope = effectScope()
    const setup = scope.run(() => {
      const host = useMatch(ticTacToe, {
        seats: ['human', 'remote'],
        onLocalMove: (m, p) => roomA.sendMove(m, p),
      })
      const guest = useMatch(ticTacToe, {
        seats: ['remote', 'human'],
        onLocalMove: (m, p) => roomB.sendMove(m, p),
      })
      const roomA = connectRoom(ta, 'host', 'ABCD', { onMove: (m, p) => host.receiveRemote(m, p) })
      const roomB = connectRoom(tb, 'guest', 'ABCD', {
        onMove: (m, p) => guest.receiveRemote(m, p),
      })
      return { host, guest, roomA, roomB }
    })!
    const { host, guest, roomA, roomB } = setup
    await tick(10)
    expect(roomA.status.value).toBe('connected')
    expect(roomB.status.value).toBe('connected')

    host.submit(4)
    await tick()
    expect(guest.ply.value).toBe(1)
    expect(guest.submit(0)).toBe(true)
    await tick()
    expect(host.state.value.board[0]).toBe(1)
    expect(host.receiveRemote(8, 0)).toBe(false)

    roomA.close()
    roomB.close()
    scope.stop()
  })
})
