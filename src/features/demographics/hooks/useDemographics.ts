import { useQuery } from '@tanstack/react-query'
import { analyticsKeys } from '@/services/api/queryKeys'
import type { Site } from '@/types/api'
import { dayWindow } from '@/utils/time'
import { fetchDemographics } from '../services/demographicsService'

export function useDemographics(site: Site, dateKey: string) {
  return useQuery({
    queryKey: [...analyticsKeys.metric(site.siteId, dateKey, 'demographics'), site.timezone],
    queryFn: async ({ signal }) => {
      const window = dayWindow(dateKey, site.timezone)
      const data = await fetchDemographics({ siteId: site.siteId, ...window.current }, signal)
      return { ...data, window }
    },
  })
}
