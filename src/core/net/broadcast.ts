import type { NetMessage, Transport } from './transport'

/** Transport between tabs of the same browser; the channel name is the room code. */
export function createBroadcastTransport<M>(room: string): Transport<M> {
  const channel = new BroadcastChannel(`portal-room-${room}`)
  return {
    send: (message: NetMessage<M>) => channel.postMessage(message),
    onMessage(handler) {
      const listener = (event: MessageEvent<NetMessage<M>>) => handler(event.data)
      channel.addEventListener('message', listener)
      return () => channel.removeEventListener('message', listener)
    },
    close: () => channel.close(),
  }
}
