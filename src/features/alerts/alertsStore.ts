import { useSyncExternalStore } from 'react'
import { MAX_ALERTS } from '@/constants/config'
import type { AlertEvent } from '@/services/socket'

interface AlertsState {
  /** Newest first, capped at MAX_ALERTS, across all sites. Kept in memory only. */
  items: readonly AlertEvent[]
  /** Alerts at or before this timestamp count as read. */
  readUntil: number
}

let state: AlertsState = { items: [], readUntil: Date.now() }
const listeners = new Set<() => void>()
const addedListeners = new Set<(alert: AlertEvent) => void>()

function setState(next: AlertsState) {
  state = next
  listeners.forEach((fn) => {
    fn()
  })
}

export const alertsStore = {
  getState: (): AlertsState => state,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  /** Subscribe to each newly received alert (used by the toast announcer). */
  onAdded: (listener: (alert: AlertEvent) => void): (() => void) => {
    addedListeners.add(listener)
    return () => {
      addedListeners.delete(listener)
    }
  },
  add: (alert: AlertEvent): void => {
    if (state.items.some((a) => a.eventId === alert.eventId)) return // de-duplicate redeliveries
    setState({ ...state, items: [alert, ...state.items].slice(0, MAX_ALERTS) })
    addedListeners.forEach((fn) => {
      fn(alert)
    })
  },
  markAllRead: (): void => {
    setState({ ...state, readUntil: Date.now() })
  },
  clear: (): void => {
    setState({ items: [], readUntil: Date.now() })
  },
}

export function useAlertsState(): AlertsState {
  return useSyncExternalStore(alertsStore.subscribe, alertsStore.getState)
}
