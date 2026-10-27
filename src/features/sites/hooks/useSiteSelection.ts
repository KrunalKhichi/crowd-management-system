import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useNow } from '@/hooks/useNow'
import type { Site } from '@/types/api'
import { dateKeyOf, isDateKey } from '@/utils/time'
import { useSites } from './useSites'

export interface SiteSelection {
  site: Site | null
  sites: Site[]
  sitesQuery: ReturnType<typeof useSites>
  /** Site-local YYYY-MM-DD being viewed. */
  dateKey: string
  /** Site-local "today". */
  todayKey: string
  isToday: boolean
  selectSite: (siteId: string) => void
  selectDate: (dateKey: string | null) => void
}

/**
 * Selected site and day, stored in the URL (`?site=…&date=…`) so views are linkable
 * and survive reloads without any global state. Defaults: first site, today.
 */
export function useSiteSelection(): SiteSelection {
  const sitesQuery = useSites()
  const [params, setParams] = useSearchParams()
  const now = useNow(60_000) // roll "today" over at site-local midnight

  const sites = useMemo(() => sitesQuery.data ?? [], [sitesQuery.data])
  const requestedSite = params.get('site')
  const site = sites.find((s) => s.siteId === requestedSite) ?? sites[0] ?? null

  const timeZone = site?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  const todayKey = dateKeyOf(now, timeZone)
  const requestedDate = params.get('date')
  const dateKey =
    requestedDate && isDateKey(requestedDate) && requestedDate <= todayKey ? requestedDate : todayKey

  const update = useCallback(
    (key: 'site' | 'date', value: string | null) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value) next.set(key, value)
          else next.delete(key)
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const selectSite = useCallback(
    (siteId: string) => {
      update('site', siteId)
    },
    [update],
  )
  const selectDate = useCallback(
    (key: string | null) => {
      update('date', key && key !== todayKey ? key : null)
    },
    [update, todayKey],
  )

  return { site, sites, sitesQuery, dateKey, todayKey, isToday: dateKey === todayKey, selectSite, selectDate }
}
