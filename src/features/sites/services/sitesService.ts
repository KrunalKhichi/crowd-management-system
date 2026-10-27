import { request } from '@/services/api/httpClient'
import { sitesSchema, type Site } from '@/types/api'

/** GET /api/sites → Site[] (each with its IANA time zone and zones). */
export function fetchSites(signal?: AbortSignal): Promise<Site[]> {
  return request('/api/sites', { schema: sitesSchema, ...(signal ? { signal } : {}) })
}
