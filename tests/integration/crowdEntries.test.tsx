import { screen, waitFor, within } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { entryExitFixture, entryInside } from '../fixtures/staging'
import { API } from '../mocks/handlers'
import { server } from '../mocks/server'
import { renderApp } from '../utils/render'
import { signIn } from '../utils/session'

vi.mock('socket.io-client', async () => ({ io: (await import('../mocks/socketModule')).fakeIo.factory }))

beforeEach(() => {
  signIn()
})

describe('crowd entries', () => {
  it('renders visitor rows, formatting times in the site time zone and handling missing exits', async () => {
    renderApp('/entries')
    const table = await screen.findByRole('table', { name: /visitor entry and exit records/i })
    const juan = await within(table).findByRole('row', { name: /juan littel/i })
    expect(juan).toHaveTextContent('Male')
    expect(within(juan).getByLabelText('Not exited yet')).toHaveTextContent('--')

    const andrew = within(table).getByRole('row', { name: /andrew casper/i })
    expect(andrew).toHaveTextContent('Female')
    expect(andrew).toHaveTextContent('4:08 PM') // 12:08Z in Asia/Dubai
    expect(andrew).toHaveTextContent('4:13 PM')
    expect(within(andrew).getByLabelText('4 minutes 58 seconds')).toHaveTextContent('00:05')
    expect(screen.getByText(/showing/i)).toHaveTextContent('Showing 1–2 of 926 visits')
  })

  it('requests pages from the server with bounded integer paging', async () => {
    const bodies: { pageNumber: unknown; pageSize: unknown }[] = []
    server.use(
      http.post(`${API}/api/analytics/entry-exit`, async ({ request }) => {
        const body = (await request.json()) as { pageNumber: number; pageSize: number }
        bodies.push(body)
        return HttpResponse.json({
          ...entryExitFixture,
          pageNumber: body.pageNumber,
          pageSize: body.pageSize,
        })
      }),
    )
    const { user } = renderApp('/entries')
    const nav = await screen.findByRole('navigation', { name: 'Crowd entries pages' })
    expect(within(nav).getByRole('button', { name: 'Previous page' })).toBeDisabled()
    await user.click(within(nav).getByRole('button', { name: 'Page 2' }))
    await waitFor(() => {
      expect(within(nav).getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
    })
    expect(bodies.map((b) => b.pageNumber)).toEqual([1, 2])
    expect(bodies.every((b) => b.pageSize === 10)).toBe(true)

    await user.selectOptions(screen.getByLabelText('Rows per page'), '25')
    await waitFor(() => {
      expect(bodies.at(-1)).toMatchObject({ pageNumber: 1, pageSize: 25 })
    })
  })

  it('never lets a slow, superseded page overwrite the latest one', async () => {
    server.use(
      http.post(`${API}/api/analytics/entry-exit`, async ({ request }) => {
        const body = (await request.json()) as { pageNumber: number; pageSize: number }
        if (body.pageNumber === 2) await delay(300)
        return HttpResponse.json({
          ...entryExitFixture,
          pageNumber: body.pageNumber,
          records: [
            { ...entryInside, personId: `p${body.pageNumber}`, personName: `Visitor P${body.pageNumber}` },
          ],
        })
      }),
    )
    const { user } = renderApp('/entries')
    const nav = await screen.findByRole('navigation', { name: 'Crowd entries pages' })
    await user.click(within(nav).getByRole('button', { name: 'Page 2' }))
    await user.click(within(nav).getByRole('button', { name: 'Page 3' }))
    expect(await screen.findByText('Visitor P3')).toBeInTheDocument()
    await new Promise((r) => setTimeout(r, 400))
    expect(screen.getByText('Visitor P3')).toBeInTheDocument()
    expect(screen.queryByText('Visitor P2')).not.toBeInTheDocument()
  })

  it('shows empty and error states with retry', async () => {
    let mode: 'error' | 'empty' = 'error'
    server.use(
      http.post(`${API}/api/analytics/entry-exit`, () =>
        mode === 'error'
          ? HttpResponse.json({}, { status: 503 })
          : HttpResponse.json({ ...entryExitFixture, totalRecords: 0, totalPages: 0, records: [] }),
      ),
    )
    const { user } = renderApp('/entries')
    expect(await screen.findByText('Couldn’t load entries')).toBeInTheDocument()
    mode = 'empty'
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('No visits recorded')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Crowd entries pages' })).not.toBeInTheDocument()
  })
})
