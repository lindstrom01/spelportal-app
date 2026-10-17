import type { NetMessage, Transport } from './transport'

/** Connects two transports directly in memory; used in tests. */
export function createMemoryPair<M>(): [Transport<M>, Transport<M>] {
  const handlers: [Set<(m: NetMessage<M>) => void>, Set<(m: NetMessage<M>) => void>] = [
    new Set(),
    new Set(),
  ]
  const make = (self: 0 | 1): Transport<M> => ({
    send(message) {
      const copy = structuredClone(message)
      queueMicrotask(() => handlers[self === 0 ? 1 : 0].forEach((h) => h(copy)))
    },
    onMessage(handler) {
      handlers[self].add(handler)
      return () => handlers[self].delete(handler)
    },
    close() {
      handlers[self].clear()
    },
  })
  return [make(0), make(1)]
}
