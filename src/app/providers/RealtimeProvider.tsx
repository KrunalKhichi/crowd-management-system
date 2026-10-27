import { useQueryClient } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'
import { alertsStore } from '@/features/alerts/alertsStore'
import { useAuth } from '@/features/auth/authContext'
import { liveOccupancyStore } from '@/features/occupancy/liveOccupancyStore'
import { analyticsKeys } from '@/services/api/queryKeys'
import { realtimeClient } from '@/services/socket'

/**
 * Owns the socket lifecycle for the signed-in session and forwards validated events
 * into the in-memory live stores. Mounted once inside the protected layout.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { session, logout } = useAuth()
  const queryClient = useQueryClient()
  const token = session?.token ?? null

  useEffect(() => {
    if (!token) return undefined
    const offAlert = realtimeClient.subscribe('alert', alertsStore.add)
    const offOccupancy = realtimeClient.subscribe('live_occupancy', liveOccupancyStore.set)
    // After a dropped connection, events may have been missed: resync REST analytics.
    const offReconnect = realtimeClient.onReconnect(() => {
      void queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
    })
    void realtimeClient.connect(token, {
      onAuthError: () => {
        logout('expired')
      },
    })
    return () => {
      offAlert()
      offOccupancy()
      offReconnect()
      realtimeClient.disconnect()
      alertsStore.clear()
      liveOccupancyStore.clear()
    }
  }, [token, logout, queryClient])

  return children
}
