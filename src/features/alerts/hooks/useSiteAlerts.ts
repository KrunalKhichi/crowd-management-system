import { useMemo } from 'react'
import type { AlertEvent } from '@/services/socket'
import { useAlertsState } from '../alertsStore'

export function useSiteAlerts(siteId: string | null): { alerts: AlertEvent[]; unread: number } {
  const { items, readUntil } = useAlertsState()
  return useMemo(() => {
    const alerts = siteId ? items.filter((a) => a.siteId === siteId) : []
    return { alerts, unread: alerts.filter((a) => a.ts > readUntil).length }
  }, [items, readUntil, siteId])
}
