import { postJson } from '@/services/api/httpClient'
import { occupancySchema, type OccupancyResponse, type RangeRequest } from '@/types/api'

/** POST /api/analytics/occupancy → hourly average occupancy buckets. */
export const fetchOccupancy = (range: RangeRequest, signal?: AbortSignal): Promise<OccupancyResponse> =>
  postJson('/api/analytics/occupancy', range, occupancySchema, signal)
