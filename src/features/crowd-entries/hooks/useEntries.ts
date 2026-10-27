import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { analyticsKeys } from '@/services/api/queryKeys'
import type { Site } from '@/types/api'
import { dayWindow } from '@/utils/time'
import { fetchEntries } from '../services/entriesService'

/**
 * Server-paginated entry/exit sessions for one site-day.
 *
 * The range end (`asOf`) is frozen when the view opens so page boundaries stay stable
 * while new visits keep arriving; `refresh()` moves it to "now" and returns to page 1.
 * Each page has its own cache key, so a slow response for an old page can never
 * overwrite the page currently requested.
 */
export function useEntries(site: Site, dateKey: string, pageSize: number) {
  const [page, setPage] = useState(1)
  const [asOf, setAsOf] = useState(() => Date.now())

  const query = useQuery({
    queryKey: [
      ...analyticsKeys.metric(site.siteId, dateKey, 'entries'),
      { timeZone: site.timezone, asOf, page, pageSize },
    ],
    queryFn: ({ signal }) => {
      const { current } = dayWindow(dateKey, site.timezone, asOf)
      return fetchEntries({ siteId: site.siteId, ...current, pageNumber: page, pageSize }, signal)
    },
    placeholderData: keepPreviousData,
    staleTime: Infinity, // a frozen window never changes; refresh() creates a new key
  })

  const totalPages = query.data?.totalPages ?? 0

  const goToPage = useCallback(
    (next: number) => {
      setPage(Math.min(Math.max(1, next), Math.max(1, totalPages)))
    },
    [totalPages],
  )

  const refresh = useCallback(() => {
    setPage(1)
    setAsOf(Date.now())
  }, [])

  return { query, page, totalPages, asOf, goToPage, refresh }
}
