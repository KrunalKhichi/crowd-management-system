import { postJson } from '@/services/api/httpClient'
import {
  dwellSchema,
  footfallSchema,
  type DwellResponse,
  type FootfallResponse,
  type RangeRequest,
} from '@/types/api'

/** POST /api/analytics/footfall → count of entry events in the range (not unique visitors). */
export const fetchFootfall = (range: RangeRequest, signal?: AbortSignal): Promise<FootfallResponse> =>
  postJson('/api/analytics/footfall', range, footfallSchema, signal)

/** POST /api/analytics/dwell → average dwell minutes over completed visits in the range. */
export const fetchDwell = (range: RangeRequest, signal?: AbortSignal): Promise<DwellResponse> =>
  postJson('/api/analytics/dwell', range, dwellSchema, signal)
