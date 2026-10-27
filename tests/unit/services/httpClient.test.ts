import { http, HttpResponse, delay } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ApiError } from '@/services/api/errors'
import { configureHttpClient, request } from '@/services/api/httpClient'
import { errorBodies } from '../../fixtures/staging'
import { API } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const okSchema = z.object({ ok: z.boolean() })
const onAuthFailure = vi.fn()

function setup(token: string | null = 'abc') {
  configureHttpClient({ getToken: () => token, onAuthFailure })
}

async function capture(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise
  } catch (e) {
    if (e instanceof ApiError) return e
    throw e
  }
  throw new Error('expected request to fail')
}

afterEach(() => {
  onAuthFailure.mockReset()
})

describe('httpClient', () => {
  it('sends the bearer token and JSON body, and validates the response', async () => {
    setup('t0ken')
    let seen: { auth: string | null; body: unknown } | null = null
    server.use(
      http.post(`${API}/x`, async ({ request: req }) => {
        seen = { auth: req.headers.get('authorization'), body: await req.json() }
        return HttpResponse.json({ ok: true, extra: 'stripped' })
      }),
    )
    await expect(request('/x', { method: 'POST', body: { a: 1 }, schema: okSchema })).resolves.toEqual({
      ok: true,
    })
    expect(seen).toEqual({ auth: 'Bearer t0ken', body: { a: 1 } })
  })

  it('omits the token on unauthenticated calls and keeps the backend message for 401', async () => {
    setup('t0ken')
    server.use(
      http.post(`${API}/login`, ({ request: req }) =>
        req.headers.get('authorization')
          ? HttpResponse.json({}, { status: 500 })
          : HttpResponse.json(errorBodies.invalidCredentials, { status: 401 }),
      ),
    )
    const err = await capture(
      request('/login', { method: 'POST', body: {}, schema: okSchema, authenticated: false }),
    )
    expect(err).toMatchObject({ kind: 'unauthorized', status: 401, message: 'Invalid credentials' })
    expect(onAuthFailure).not.toHaveBeenCalled()
  })

  it.each([
    [401, errorBodies.missingAuth, 'unauthorized'],
    [403, errorBodies.invalidToken, 'expired'],
  ] as const)('ends the session on %i for authenticated calls', async (status, body, reason) => {
    setup()
    server.use(http.get(`${API}/x`, () => HttpResponse.json(body, { status })))
    const err = await capture(request('/x', { schema: okSchema }))
    expect(err.kind).toBe('unauthorized')
    expect(onAuthFailure).toHaveBeenCalledWith(reason)
  })

  it('normalizes error bodies and classifies status codes', async () => {
    setup()
    server.use(
      http.get(`${API}/bad`, () => HttpResponse.json(errorBodies.missingSite, { status: 400 })),
      http.get(`${API}/boom`, () => HttpResponse.text('oops', { status: 502 })),
      http.get(`${API}/shape`, () => HttpResponse.json({ ok: 'yes' })),
    )
    expect(await capture(request('/bad', { schema: okSchema }))).toMatchObject({
      kind: 'bad_request',
      message: 'siteId required',
    })
    const server5xx = await capture(request('/boom', { schema: okSchema }))
    expect(server5xx).toMatchObject({ kind: 'server', status: 502 })
    expect(server5xx.retryable).toBe(true)
    const shape = await capture(request('/shape', { schema: okSchema }))
    expect(shape).toMatchObject({ kind: 'invalid_response' })
    expect(shape.retryable).toBe(false)
  })

  it('reports network failures and timeouts as retryable', async () => {
    setup()
    server.use(
      http.get(`${API}/down`, () => HttpResponse.error()),
      http.get(`${API}/slow`, async () => {
        await delay(200)
        return HttpResponse.json({ ok: true })
      }),
    )
    expect(await capture(request('/down', { schema: okSchema }))).toMatchObject({ kind: 'network' })
    expect(await capture(request('/slow', { schema: okSchema, timeoutMs: 30 }))).toMatchObject({
      kind: 'timeout',
    })
  })

  it('propagates caller cancellation untouched', async () => {
    setup()
    server.use(
      http.get(`${API}/slow`, async () => {
        await delay(200)
        return HttpResponse.json({ ok: true })
      }),
    )
    const ctrl = new AbortController()
    const pending = request('/slow', { schema: okSchema, signal: ctrl.signal })
    ctrl.abort()
    await expect(pending).rejects.toSatisfy((e: unknown) => !(e instanceof ApiError))
  })
})
