import { act, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  alertEventFixture,
  footfallFixture,
  liveOccupancyFixture,
  occupancyFixture,
} from '../fixtures/staging'
import { API } from '../mocks/handlers'
import { server } from '../mocks/server'
import { fakeIo } from '../mocks/socketModule'
import { renderApp } from '../utils/render'
import { signIn } from '../utils/session'

vi.mock('socket.io-client', async () => ({ io: (await import('../mocks/socketModule')).fakeIo.factory }))

/** The current window ends "now"; the comparison window ends 24h earlier. */
const isCurrentWindow = (body: { toUtc: number }) => body.toUtc > Date.now() - 60_000

beforeEach(() => {
  signIn()
  server.use(
    http.post(`${API}/api/analytics/footfall`, async ({ request }) => {
      const body = (await request.json()) as { toUtc: number }
      return HttpResponse.json({ ...footfallFixture, footfall: isCurrentWindow(body) ? 926 : 842 })
    }),
  )
})

async function socket() {
  await waitFor(() => {
    expect(fakeIo.sockets.length).toBeGreaterThan(0)
  })
  return fakeIo.latest()
}

describe('overview dashboard', () => {
  it('shows backend metrics with comparisons against the same window yesterday', async () => {
    renderApp('/overview')
    expect(await screen.findByText('926')).toBeInTheDocument()
    // The comparison window is a dependent query: it loads after the headline value.
    expect(await screen.findByText('10% more than yesterday')).toBeInTheDocument()
    expect(screen.getByText('22min 05sec')).toHaveAccessibleName('22 minutes 5 seconds')
    expect(screen.getByText('Across 939 completed visits')).toBeInTheDocument()
  })

  it('renders the occupancy series and demographic split from the API', async () => {
    renderApp('/overview')
    const occupancyTable = await screen.findByRole('table', { name: 'Hourly average occupancy' })
    const rows = within(occupancyTable).getAllByRole('row')
    expect(rows).toHaveLength(occupancyFixture.buckets.length + 1)
    expect(rows[1]).toHaveTextContent('13:00') // 09:00Z in Asia/Dubai
    expect(rows[1]).toHaveTextContent('115')

    // Latest bucket: 62.1 male / 55.5 female → 53% / 47%
    expect(await screen.findByText('53%')).toBeInTheDocument()
    expect(screen.getByText('47%')).toBeInTheDocument()
    expect(screen.getByText('Average for 15:00 – 16:00')).toBeInTheDocument()
    expect(
      await screen.findByRole('table', { name: 'Hourly average visitors by gender' }),
    ).toBeInTheDocument()
  })

  it('shows empty and error states, and recovers on retry', async () => {
    let failing = true
    server.use(
      http.post(`${API}/api/analytics/occupancy`, () =>
        HttpResponse.json({ ...occupancyFixture, buckets: [] }),
      ),
      http.post(`${API}/api/analytics/dwell`, () =>
        failing
          ? HttpResponse.json({}, { status: 500 })
          : HttpResponse.json({ siteId: 's', fromUtc: 0, toUtc: 1, avgDwellMinutes: 8.5, dwellRecords: 3 }),
      ),
    )
    const { user } = renderApp('/overview')
    expect(await screen.findByText('No occupancy recorded')).toBeInTheDocument()
    const error = await screen.findByText('Avg Dwell Time unavailable')
    failing = false
    await user.click(within(error.closest('[role="alert"]')!).getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('08min 30sec')).toBeInTheDocument()
  })

  it('updates live occupancy and connection status from socket events', async () => {
    renderApp('/overview')
    expect(
      await screen.findByText(/connecting to the live feed|waiting for the first live update/i),
    ).toBeInTheDocument()
    const s = await socket()
    expect(fakeIo.options.at(-1)).toMatchObject({ auth: { token: expect.any(String) as string } })

    act(() => {
      s.serverEmit('connect')
      s.serverEmit('live_occupancy', { ...liveOccupancyFixture, ts: Date.now() })
      s.serverEmit('live_occupancy', {
        ...liveOccupancyFixture,
        siteId: 'another-site',
        siteOccupancy: 999,
        ts: Date.now(),
      })
    })
    expect(await screen.findByText('122')).toBeInTheDocument()
    expect(screen.queryByText('999')).not.toBeInTheDocument()
    const tile = screen.getByRole('heading', { name: 'Live Occupancy' }).parentElement!.parentElement!
    expect(within(tile).getByText('Live')).toBeInTheDocument()

    act(() => {
      s.serverEmit('disconnect', 'transport close')
    })
    expect(await screen.findByText('Reconnecting…')).toBeInTheDocument()
    expect(within(tile).getByText('Stale')).toBeInTheDocument()
  })

  it('announces only high-severity alerts and counts all of them on the bell', async () => {
    const { user } = renderApp('/overview')
    await screen.findByText('926')
    const s = await socket()
    act(() => {
      s.serverEmit('connect')
      s.serverEmit('alert', { ...alertEventFixture, eventId: 'low-1', severity: 'low', ts: Date.now() + 1 })
    })
    expect(screen.queryByText(/high-severity alert/i)).not.toBeInTheDocument()

    act(() => {
      s.serverEmit('alert', { ...alertEventFixture, eventId: 'high-1', ts: Date.now() + 2 })
      s.serverEmit('alert', {
        ...alertEventFixture,
        eventId: 'high-2',
        personName: 'Second Person',
        ts: Date.now() + 3,
      })
    })
    expect(
      await screen.findByText(/2 high-severity alerts · latest: Second Person entered/),
    ).toBeInTheDocument()

    const bell = screen.getByRole('button', { name: 'Alerts, 3 unread' })
    await user.click(bell)
    const dialog = await screen.findByRole('dialog', { name: 'Alerts' })
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(3)
    expect(within(dialog).getAllByText('High')).toHaveLength(2)
    await user.click(within(dialog).getByRole('button', { name: 'Close alerts' }))
    expect(screen.getByRole('button', { name: 'Alerts' })).toBeInTheDocument()
  })
})

describe('request prioritisation', () => {
  it('requests comparison windows only after the primary values have loaded', async () => {
    const order: string[] = []
    const record =
      (name: string) =>
      async ({ request }: { request: Request }) => {
        const body = (await request.json()) as { toUtc: number }
        order.push(`${name}:${isCurrentWindow(body) ? 'current' : 'previous'}`)
        return HttpResponse.json({
          siteId: 's',
          fromUtc: 0,
          toUtc: 1,
          footfall: 1,
          avgDwellMinutes: 1,
          dwellRecords: 1,
        })
      }
    server.use(
      http.post(`${API}/api/analytics/footfall`, record('footfall')),
      http.post(`${API}/api/analytics/dwell`, record('dwell')),
    )
    renderApp('/overview')
    await waitFor(() => {
      expect(order).toHaveLength(4)
    })
    expect(order.indexOf('footfall:previous')).toBeGreaterThan(order.indexOf('footfall:current'))
    expect(order.indexOf('dwell:previous')).toBeGreaterThan(order.indexOf('dwell:current'))
  })
})
