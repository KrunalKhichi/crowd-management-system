import { postJson } from '@/services/api/httpClient'
import { entryExitSchema, type EntryExitRequest, type EntryExitResponse } from '@/types/api'

/**
 * POST /api/analytics/entry-exit → one page of entry/exit sessions.
 * The backend is 1-based, has no pageSize cap and mishandles string numbers,
 * so callers must pass bounded integers.
 */
export function fetchEntries(req: EntryExitRequest, signal?: AbortSignal): Promise<EntryExitResponse> {
  const body: EntryExitRequest = {
    ...req,
    pageNumber: Math.max(1, Math.trunc(req.pageNumber)),
    pageSize: Math.min(100, Math.max(1, Math.trunc(req.pageSize))),
  }
  return postJson('/api/analytics/entry-exit', body, entryExitSchema, signal)
}
