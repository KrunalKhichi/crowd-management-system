import { useQuery } from '@tanstack/react-query'
import { analyticsKeys } from '@/services/api/queryKeys'
import type { Site } from '@/types/api'
import { dayWindow } from '@/utils/time'
import { fetchOccupancy } from '../services/occupancyService'

export function useOccupancySeries(site: Site, dateKey: string) {
  return useQuery({
    queryKey: [...analyticsKeys.metric(site.siteId, dateKey, 'occupancy'), site.timezone],
    queryFn: async ({ signal }) => {
      const window = dayWindow(dateKey, site.timezone)
      const data = await fetchOccupancy({ siteId: site.siteId, ...window.current }, signal)
      return { ...data, window }
    },
  })
}
