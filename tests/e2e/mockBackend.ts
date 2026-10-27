import type { Page, WebSocketRoute } from '@playwright/test'
import {
  alertEventFixture,
  demographicsFixture,
  dwellFixture,
  entryExitFixture,
  entryInside,
  errorBodies,
  footfallFixture,
  liveOccupancyFixture,
  makeToken,
  occupancyFixture,
  sitesFixture,
  SITE_ID,
} from '../fixtures/staging'

const API = 'http://api.e2e.test'
export const E2E_LOGIN = { email: 'e2e@example.com', password: 'e2e-password' }

/** REST mocks built from captured staging payloads. */
export async function mockRest(page: Page) {
  await page.route(`${API}/api/**`, async (route) => {
    const req = route.request()
    const path = new URL(req.url()).pathname
    const json = (body: unknown, status = 200) => route.fulfill({ status, json: body })

    if (path === '/api/auth/login') {
      const body = req.postDataJSON() as { email: string; password: string }
      return body.email === E2E_LOGIN.email && body.password === E2E_LOGIN.password
        ? json({ token: makeToken({ email: body.email, name: 'E2E User' }) })
        : json(errorBodies.invalidCredentials, 401)
    }
    if (!req.headers().authorization) return json(errorBodies.missingAuth, 401)
    if (path === '/api/sites') return json(sitesFixture)

    const body = req.postDataJSON() as { toUtc: number; pageNumber?: number; pageSize?: number }
    const current = body.toUtc > Date.now() - 60_000
    switch (path) {
      case '/api/analytics/footfall':
        return json({ ...footfallFixture, footfall: current ? 926 : 842 })
      case '/api/analytics/dwell':
        return json(dwellFixture)
      case '/api/analytics/occupancy':
        return json(occupancyFixture)
      case '/api/analytics/demographics':
        return json(demographicsFixture)
      case '/api/analytics/entry-exit': {
        const page = body.pageNumber ?? 1
        return json({
          ...entryExitFixture,
          pageNumber: page,
          pageSize: body.pageSize ?? 10,
          records: [
            { ...entryInside, personId: `p${page}`, personName: `Visitor Page ${page}` },
            ...entryExitFixture.records,
          ],
        })
      }
      default:
        return json({ error: 'not mocked' }, 404)
    }
  })
}

/**
 * Socket.IO server stand-in speaking Engine.IO v4 over WebSocket:
 * "0{…}" open → client "40{auth}" → "40{sid}" connect ack → "42[event, payload]".
 */
export async function mockSocket(page: Page): Promise<{ emit: (event: string, payload: unknown) => void }> {
  let socket: WebSocketRoute | null = null
  const queue: string[] = []
  await page.routeWebSocket(/\/socket\.io\//, (ws) => {
    socket = ws
    ws.send(
      JSON.stringify({
        sid: 'e2e',
        upgrades: [],
        pingInterval: 60_000,
        pingTimeout: 60_000,
        maxPayload: 1e6,
      }).replace(/^/, '0'),
    )
    ws.onMessage((message) => {
      const text = String(message)
      if (text.startsWith('40')) {
        const auth = JSON.parse(text.slice(2) || '{}') as { token?: string }
        if (!auth.token) {
          ws.send('44{"message":"Authentication error"}')
          return
        }
        ws.send('40{"sid":"e2e-socket"}')
        queue.splice(0).forEach((frame) => {
          ws.send(frame)
        })
      }
    })
  })
  return {
    emit(event, payload) {
      const frame = `42${JSON.stringify([event, payload])}`
      if (socket) socket.send(frame)
      else queue.push(frame)
    },
  }
}

export const liveEvent = () => ({ ...liveOccupancyFixture, siteId: SITE_ID, ts: Date.now() })
export const highAlert = () => ({
  ...alertEventFixture,
  siteId: SITE_ID,
  eventId: `e2e-${Date.now()}`,
  ts: Date.now(),
})
