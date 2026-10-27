import { describe, expect, it } from 'vitest'
import { createSession, isExpired, loadSession, saveSession } from '@/features/auth/session'
import { makeToken } from '../../fixtures/staging'

describe('session', () => {
  it('reads display claims and expiry from the JWT', () => {
    const exp = Math.floor(Date.now() / 1000) + 60
    const s = createSession(makeToken({ email: 'a@b.co', name: 'Ada', exp }), 'fallback@x.co')
    expect(s).toMatchObject({ email: 'a@b.co', name: 'Ada', expiresAt: exp * 1000 })
  })

  it('discards expired or malformed persisted sessions', () => {
    const expired = createSession(makeToken({ exp: Math.floor(Date.now() / 1000) - 5 }), 'x@y.z')
    expect(isExpired(expired)).toBe(true)
    saveSession(expired)
    expect(loadSession()).toBeNull()
    sessionStorage.setItem('cms.session', '{not json')
    expect(loadSession()).toBeNull()
  })

  it('round-trips a valid session', () => {
    const s = createSession(makeToken(), 'x@y.z')
    saveSession(s)
    expect(loadSession()).toEqual(s)
  })
})
