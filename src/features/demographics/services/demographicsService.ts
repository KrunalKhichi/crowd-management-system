import { postJson } from '@/services/api/httpClient'
import { demographicsSchema, type DemographicsResponse, type RangeRequest } from '@/types/api'

/** POST /api/analytics/demographics → hourly male/female averages. */
export const fetchDemographics = (range: RangeRequest, signal?: AbortSignal): Promise<DemographicsResponse> =>
  postJson('/api/analytics/demographics', range, demographicsSchema, signal)
