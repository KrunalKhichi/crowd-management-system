import { useSyncExternalStore } from 'react'
import { SOCKET_URL } from '@/constants/config'
import { RealtimeClient, type ConnectionStatus, type SocketFactory } from './realtimeClient'

// socket.io-client is loaded on first connect (after sign-in), keeping it out of the login bundle.
const loadFactory = async (): Promise<SocketFactory> => (await import('socket.io-client')).io

export const realtimeClient = new RealtimeClient(SOCKET_URL, loadFactory)

export function useConnectionStatus(): ConnectionStatus {
  return useSyncExternalStore(realtimeClient.subscribeStatus, realtimeClient.getStatus)
}

export type { ConnectionStatus }
export type { AlertEvent, LiveOccupancyEvent } from './events'
