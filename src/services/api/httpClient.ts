import type { ZodType } from 'zod'
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '@/constants/config'
import { ApiError, messageFromBody } from './errors'

export type AuthFailureReason = 'expired' | 'unauthorized'

interface HttpClientHooks {
  getToken: () => string | null
  /** Called when the backend rejects the session (401 missing / 403 invalid-or-expired token). */
  onAuthFailure: (reason: AuthFailureReason) => void
}

let hooks: HttpClientHooks = { getToken: () => null, onAuthFailure: () => undefined }

/** Wired once by the AuthProvider; the client itself never stores credentials. */
export function configureHttpClient(next: HttpClientHooks): void {
  hooks = next
}

export interface RequestOptions<T> {
  method?: 'GET' | 'POST'
  body?: unknown
  /** Runtime contract for the success response. */
  schema: ZodType<T>
  signal?: AbortSignal
  timeoutMs?: number
  /** Attach the bearer token and treat 401/403 as session loss. Defaults to true. */
  authenticated?: boolean
}

/**
 * Map an HTTP failure to an ApiError. On authenticated routes the backend answers
 * 401 for a missing token and 403 "Invalid or expired token" (verified on staging),
 * so both end the session.
 */
function toApiError(status: number, backendMessage: string | null, authenticated: boolean): ApiError {
  if (authenticated && (status === 401 || status === 403)) {
    hooks.onAuthFailure(status === 403 ? 'expired' : 'unauthorized')
    return new ApiError('unauthorized', 'Your session has expired. Please sign in again.', status)
  }
  if (status === 401) return new ApiError('unauthorized', backendMessage ?? 'Invalid credentials', status)
  if (status >= 500) {
    return new ApiError('server', 'The server is having trouble right now. Please try again shortly.', status)
  }
  if (status === 400)
    return new ApiError('bad_request', backendMessage ?? 'The request was rejected.', status)
  return new ApiError('http', backendMessage ?? `Request failed (${status}).`, status)
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined // non-JSON body
  }
}

export async function request<T>(path: string, options: RequestOptions<T>): Promise<T> {
  const {
    method = 'GET',
    body,
    schema,
    signal,
    timeoutMs = REQUEST_TIMEOUT_MS,
    authenticated = true,
  } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (authenticated) {
    const token = hooks.getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const timeout = AbortSignal.timeout(timeoutMs)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      signal: combined,
      body: body === undefined ? null : JSON.stringify(body),
    })
  } catch (error) {
    if (timeout.aborted && !signal?.aborted) {
      throw new ApiError('timeout', 'The server took too long to respond. Please try again.')
    }
    // Caller cancellation (e.g. TanStack Query superseding a request) propagates untouched.
    if (signal?.aborted) throw error
    throw new ApiError('network', 'Unable to reach the server. Check your connection and try again.')
  }

  const data = await readJson(res)

  if (!res.ok) throw toApiError(res.status, messageFromBody(data), authenticated)

  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    throw new ApiError('invalid_response', 'The server returned data in an unexpected format.', res.status)
  }
  return parsed.data
}

export const postJson = <T>(path: string, body: unknown, schema: ZodType<T>, signal?: AbortSignal) =>
  request(path, { method: 'POST', body, schema, ...(signal ? { signal } : {}) })
