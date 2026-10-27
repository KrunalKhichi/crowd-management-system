import { useCallback, useSyncExternalStore } from 'react'
import type { LiveOccupancyEvent } from '@/services/socket'

/**
 * Latest `live_occupancy` event per site. Subscriptions are per site, so a burst of
 * events for other sites never re-renders the dashboard for the selected one.
 */
const latest = new Map<string, LiveOccupancyEvent>()
const listeners = new Map<string, Set<() => void>>()

export const liveOccupancyStore = {
  set: (event: LiveOccupancyEvent): void => {
    const prev = latest.get(event.siteId)
    if (prev && prev.ts > event.ts) return // ignore out-of-order delivery
    latest.set(event.siteId, event)
    listeners.get(event.siteId)?.forEach((fn) => {
      fn()
    })
  },
  get: (siteId: string): LiveOccupancyEvent | null => latest.get(siteId) ?? null,
  subscribe: (siteId: string, listener: () => void): (() => void) => {
    let set = listeners.get(siteId)
    if (!set) {
      set = new Set()
      listeners.set(siteId, set)
    }
    set.add(listener)
    return () => {
      set.delete(listener)
    }
  },
  clear: (): void => {
    const sites = [...latest.keys()]
    latest.clear()
    sites.forEach((id) =>
      listeners.get(id)?.forEach((fn) => {
        fn()
      }),
    )
  },
}

export function useLiveOccupancy(siteId: string | null): LiveOccupancyEvent | null {
  const subscribe = useCallback(
    (listener: () => void) => (siteId ? liveOccupancyStore.subscribe(siteId, listener) : () => undefined),
    [siteId],
  )
  const getSnapshot = useCallback(() => (siteId ? liveOccupancyStore.get(siteId) : null), [siteId])
  return useSyncExternalStore(subscribe, getSnapshot)
}
