import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.url({ message: 'VITE_API_BASE_URL must be an absolute URL' }),
  VITE_SOCKET_URL: z.url({ message: 'VITE_SOCKET_URL must be an absolute URL' }).optional(),
})

const parsed = envSchema.safeParse(import.meta.env)
if (!parsed.success) {
  // Fail fast at startup with an actionable message instead of failing on the first request.
  throw new Error(`Invalid environment configuration: ${z.prettifyError(parsed.error)}. See .env.example.`)
}

const trimSlash = (url: string) => url.replace(/\/+$/, '')

export const API_BASE_URL = trimSlash(parsed.data.VITE_API_BASE_URL)
export const SOCKET_URL = trimSlash(parsed.data.VITE_SOCKET_URL ?? parsed.data.VITE_API_BASE_URL)

/**
 * Per-request timeout for REST calls. Staging analytics calls take 1.3–4.4 s each and are
 * processed one at a time, so a queued request can legitimately take well over 15 s.
 */
export const REQUEST_TIMEOUT_MS = 30_000

export const ENTRIES_PAGE_SIZES = [10, 25, 50] as const
export const DEFAULT_ENTRIES_PAGE_SIZE = 10

/** Socket events for the selected site trigger at most one metrics refetch per window. */
export const METRIC_REFRESH_THROTTLE_MS = 60_000

/** A live occupancy value older than this is shown as stale. */
export const LIVE_STALE_AFTER_MS = 60_000

/** Alerts kept in memory (newest first, all sites). */
export const MAX_ALERTS = 100

/** High-severity alerts arriving within this window are announced as one toast. */
export const TOAST_COALESCE_MS = 8_000
export const TOAST_VISIBLE_MS = 6_000
