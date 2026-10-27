import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { METRIC_REFRESH_THROTTLE_MS } from '@/constants/config'
import { analyticsKeys } from '@/services/api/queryKeys'
import { realtimeClient } from '@/services/socket'
import { HOUR_MS } from '@/utils/time'

/**
 * Keeps today's backend metrics current without polling:
 * - entry/exit alerts for the selected site trigger a throttled refetch of footfall and
 *   dwell (the backend stays the source of truth; nothing is counted client-side);
 * - the hourly series are refetched just after each hour boundary, when a new bucket exists.
 */
export function useRealtimeRefresh(siteId: string | null, dateKey: string, isToday: boolean): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!siteId || !isToday) return undefined
    let lastRun = 0
    let pending: ReturnType<typeof setTimeout> | undefined

    const refreshMetrics = () => {
      lastRun = Date.now()
      pending = undefined
      // Only the current windows: comparison windows have their own, longer staleness.
      for (const metric of ['footfall', 'dwell'] as const) {
        void queryClient.invalidateQueries({
          queryKey: analyticsKeys.metric(siteId, dateKey, metric),
          predicate: (q) => q.queryKey.at(-1) === 'current',
        })
      }
    }

    const off = realtimeClient.subscribe('alert', (alert) => {
      if (alert.siteId !== siteId || pending) return
      const wait = Math.max(0, lastRun + METRIC_REFRESH_THROTTLE_MS - Date.now())
      pending = setTimeout(refreshMetrics, wait)
    })

    // Start the throttle window now: the page has just fetched fresh data.
    lastRun = Date.now()

    let hourTimer: ReturnType<typeof setTimeout>
    const scheduleHourly = () => {
      const now = Date.now()
      const nextHour = Math.ceil((now + 1) / HOUR_MS) * HOUR_MS + 15_000
      hourTimer = setTimeout(() => {
        for (const metric of ['footfall', 'dwell', 'occupancy', 'demographics'] as const) {
          void queryClient.invalidateQueries({ queryKey: analyticsKeys.metric(siteId, dateKey, metric) })
        }
        scheduleHourly()
      }, nextHour - now)
    }
    scheduleHourly()

    return () => {
      off()
      clearTimeout(pending)
      clearTimeout(hourTimer)
    }
  }, [siteId, dateKey, isToday, queryClient])
}
