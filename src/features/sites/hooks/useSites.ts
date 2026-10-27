import { useQuery } from '@tanstack/react-query'
import { fetchSites } from '../services/sitesService'

export const sitesQueryKey = ['sites'] as const

export function useSites() {
  return useQuery({
    queryKey: sitesQueryKey,
    queryFn: ({ signal }) => fetchSites(signal),
    // Site metadata (names, zones, time zones) changes rarely.
    staleTime: 30 * 60_000,
  })
}
