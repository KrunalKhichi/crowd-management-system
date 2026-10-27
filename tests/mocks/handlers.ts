import { http, HttpResponse } from 'msw'
import {
  demographicsFixture,
  dwellFixture,
  entryExitFixture,
  errorBodies,
  footfallFixture,
  makeToken,
  occupancyFixture,
  sitesFixture,
} from '../fixtures/staging'

export const API = 'http://api.test'

/** Test credentials used only against MSW; never real accounts. */
export const VALID_LOGIN = { email: 'user@example.com', password: 'correct-horse' }

const requireAuth = (request: Request) => {
  const header = request.headers.get('authorization')
  if (!header) return HttpResponse.json(errorBodies.missingAuth, { status: 401 })
  if (!header.startsWith('Bearer ') || header.endsWith('expired')) {
    return HttpResponse.json(errorBodies.invalidToken, { status: 403 })
  }
  return null
}

export const handlers = [
  http.post(`${API}/api/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string }
    if (body.email === VALID_LOGIN.email && body.password === VALID_LOGIN.password) {
      return HttpResponse.json({ token: makeToken({ email: body.email }) })
    }
    return HttpResponse.json(errorBodies.invalidCredentials, { status: 401 })
  }),
  http.get(`${API}/api/sites`, ({ request }) => requireAuth(request) ?? HttpResponse.json(sitesFixture)),
  http.post(
    `${API}/api/analytics/footfall`,
    ({ request }) => requireAuth(request) ?? HttpResponse.json(footfallFixture),
  ),
  http.post(
    `${API}/api/analytics/dwell`,
    ({ request }) => requireAuth(request) ?? HttpResponse.json(dwellFixture),
  ),
  http.post(
    `${API}/api/analytics/occupancy`,
    ({ request }) => requireAuth(request) ?? HttpResponse.json(occupancyFixture),
  ),
  http.post(
    `${API}/api/analytics/demographics`,
    ({ request }) => requireAuth(request) ?? HttpResponse.json(demographicsFixture),
  ),
  http.post(`${API}/api/analytics/entry-exit`, async ({ request }) => {
    const denied = requireAuth(request)
    if (denied) return denied
    const body = (await request.json()) as { pageNumber: number; pageSize: number }
    return HttpResponse.json({ ...entryExitFixture, pageNumber: body.pageNumber, pageSize: body.pageSize })
  }),
]
