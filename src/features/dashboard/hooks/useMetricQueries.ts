import { useQuery } from '@tanstack/react-query'
import { analyticsKeys } from '@/services/api/queryKeys'
import type { DwellResponse, FootfallResponse, RangeRequest, Site } from '@/types/api'
import { dayWindow } from '@/utils/time'
import { fetchDwell, fetchFootfall } from '../services/metricsService'

type Fetcher<T> = (range: RangeRequest, signal: AbortSignal) => Promise<T>
export type MetricWindow = 'current' | 'previous'

/** Comparison windows move slowly ("same time yesterday"), so they are cached longer. */
const PREVIOUS_WINDOW_STALE_MS = 5 * 60_000

/**
 * One metric for one window. Measured on staging, each analytics call takes 1.3–4.4 s and
 * concurrent calls are processed one after another, so the comparison ("previous") query
 * only starts once the primary value has loaded — the headline number is never queued
 * behind its own comparison.
 */
function useMetricWindow<T>(
  site: Site,
  dateKey: string,
  metric: 'footfall' | 'dwell',
  window: MetricWindow,
  fetcher: Fetcher<T>,
  enabled = true,
) {
  return useQuery({
    queryKey: [...analyticsKeys.metric(site.siteId, dateKey, metric), site.timezone, window],
    queryFn: ({ signal }) => {
      const w = dayWindow(dateKey, site.timezone) // evaluated at request time: "today" ends now
      return fetcher({ siteId: site.siteId, ...(window === 'current' ? w.current : w.previous) }, signal)
    },
    enabled,
    ...(window === 'previous' ? { staleTime: PREVIOUS_WINDOW_STALE_MS } : {}),
  })
}

function useComparedMetric<T>(
  site: Site,
  dateKey: string,
  metric: 'footfall' | 'dwell',
  fetcher: Fetcher<T>,
) {
  const current = useMetricWindow(site, dateKey, metric, 'current', fetcher)
  const previous = useMetricWindow(site, dateKey, metric, 'previous', fetcher, current.isSuccess)
  return { current, previous }
}

export const useFootfall = (site: Site, dateKey: string) =>
  useComparedMetric<FootfallResponse>(site, dateKey, 'footfall', fetchFootfall)

export const useDwell = (site: Site, dateKey: string) =>
  useComparedMetric<DwellResponse>(site, dateKey, 'dwell', fetchDwell)
