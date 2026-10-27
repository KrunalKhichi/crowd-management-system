export type ApiErrorKind =
  'network' | 'timeout' | 'unauthorized' | 'bad_request' | 'server' | 'http' | 'invalid_response'

const RETRYABLE: ReadonlySet<ApiErrorKind> = new Set(['network', 'timeout', 'server'])

/** Normalized error for every failed API call. Never carries request bodies or tokens. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null

  constructor(kind: ApiErrorKind, message: string, status: number | null = null) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }

  /** Transient failures that are safe to retry for read-only requests. */
  get retryable(): boolean {
    return RETRYABLE.has(this.kind)
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError

/** User-facing message for any thrown value. */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) return error.message
  return 'Something went wrong. Please try again.'
}

/** Backend error bodies use `errorMessage`, `message` or `error` depending on the route. */
export function messageFromBody(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null
  const record = body as Record<string, unknown>
  for (const key of ['errorMessage', 'message', 'error'] as const) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return null
}
