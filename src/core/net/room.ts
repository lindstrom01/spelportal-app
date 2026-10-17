import { ref } from 'vue'
import type { NetMessage, Transport } from './transport'

export type RoomRole = 'host' | 'guest'
export type RoomStatus = 'waiting' | 'connected' | 'closed'

export const generateRoomCode = (rng: () => number = Math.random) =>
  Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(rng() * 24)]).join('')

/**
 * Two-party room handshake. The host (player 0) waits; the guest repeats `join`
 * until the host answers `start`, so it does not matter who opens first.
 * Moves are forwarded as `move` messages and handed to `onMove`.
 */
export function connectRoom<M>(
  transport: Transport<M>,
  role: RoomRole,
  room: string,
  handlers: { onMove: (move: M, ply: number) => void; onConnected?: () => void },
  retryMs = 500,
) {
  const status = ref<RoomStatus>('waiting')
  let timer: ReturnType<typeof setInterval> | undefined

  const connected = () => {
    if (status.value === 'connected') return
    status.value = 'connected'
    clearInterval(timer)
    handlers.onConnected?.()
  }

  const off = transport.onMessage((message: NetMessage<M>) => {
    if (message.room !== room) return
    if (message.type === 'join' && role === 'host') {
      transport.send({ type: 'start', room })
      connected()
    } else if (message.type === 'start' && role === 'guest') {
      connected()
    } else if (message.type === 'move' && status.value === 'connected') {
      handlers.onMove(message.move, message.ply)
    } else if (message.type === 'leave') {
      status.value = 'closed'
      clearInterval(timer)
    }
  })

  if (role === 'guest') {
    const join = () => transport.send({ type: 'join', room })
    join()
    timer = setInterval(join, retryMs)
  }

  return {
    status,
    sendMove: (move: M, ply: number) => transport.send({ type: 'move', room, ply, move }),
    close() {
      clearInterval(timer)
      if (status.value !== 'closed') transport.send({ type: 'leave', room })
      status.value = 'closed'
      off()
      transport.close()
    },
  }
}
