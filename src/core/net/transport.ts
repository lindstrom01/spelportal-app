/** Messages exchanged between two peers in an online match. */
export type NetMessage<M> =
  | { type: 'join'; room: string }
  | { type: 'start'; room: string }
  | { type: 'move'; room: string; ply: number; move: M }
  | { type: 'leave'; room: string }

/**
 * Abstraction over the wire. Implementations: in-memory (tests), BroadcastChannel
 * (tabs in the same browser) and, later, a WebSocket relay for real internet play.
 */
export interface Transport<M> {
  send(message: NetMessage<M>): void
  onMessage(handler: (message: NetMessage<M>) => void): () => void
  close(): void
}
