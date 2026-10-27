import { z } from 'zod'

/**
 * Session persistence.
 *
 * The backend issues a bearer JWT in the response body (no cookie, no refresh token).
 * It is kept in sessionStorage so a reload keeps the user signed in but closing the tab
 * ends the session. sessionStorage is readable by any script on the origin, so XSS
 * hardening (no raw HTML rendering, strict CSP at the host) is the real protection.
 */

const STORAGE_KEY = 'cms.session'

const claimsSchema = z.object({
  sub: z.string().optional(),
  email: z.string().optional(),
  name: z.string().optional(),
  role: z.string().optional(),
  exp: z.number().optional(),
})

export interface Session {
  token: string
  email: string
  name: string | null
  /** Expiry in epoch ms, from the JWT `exp` claim; null if absent. */
  expiresAt: number | null
}

function decodeClaims(token: string): z.infer<typeof claimsSchema> | null {
  const payload = token.split('.')[1]
  if (!payload) return null
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const parsed = claimsSchema.safeParse(JSON.parse(json))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/** Build a session from a login token. Claims are only used for display and expiry timing. */
export function createSession(token: string, fallbackEmail: string): Session {
  const claims = decodeClaims(token)
  return {
    token,
    email: claims?.email ?? fallbackEmail,
    name: claims?.name ?? null,
    expiresAt: claims?.exp ? claims.exp * 1000 : null,
  }
}

const sessionSchema = z.object({
  token: z.string().min(1),
  email: z.string(),
  name: z.string().nullable(),
  expiresAt: z.number().nullable(),
})

export const isExpired = (s: Session, now = Date.now()) => s.expiresAt !== null && s.expiresAt <= now

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = sessionSchema.safeParse(JSON.parse(raw))
    if (!parsed.success || isExpired(parsed.data)) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed.data
  } catch {
    return null
  }
}

export function saveSession(session: Session | null): void {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable (private mode): the session lives in memory for this page only.
  }
}
