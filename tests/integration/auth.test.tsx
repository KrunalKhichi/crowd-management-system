import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { errorBodies } from '../fixtures/staging'
import { API, VALID_LOGIN } from '../mocks/handlers'
import { server } from '../mocks/server'
import { renderApp } from '../utils/render'
import { signIn } from '../utils/session'

vi.mock('socket.io-client', async () => ({ io: (await import('../mocks/socketModule')).fakeIo.factory }))

describe('authentication', () => {
  it('redirects protected routes to login and validates required fields', async () => {
    const { user, router } = renderApp('/entries')
    expect(
      await screen.findByRole('heading', { name: /welcome to the crowd management system/i }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')

    await user.click(screen.getByRole('button', { name: 'Login' }))
    expect(await screen.findByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(screen.getByLabelText(/log in/i)).toHaveAttribute('aria-invalid', 'true')

    await user.type(screen.getByLabelText(/log in/i), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Login' }))
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
  })

  it('masks the password with a visibility toggle', async () => {
    const { user } = renderApp('/login')
    const password = await screen.findByLabelText(/^password/i)
    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('shows an inline error for rejected credentials', async () => {
    const { user } = renderApp('/login')
    await user.type(await screen.findByLabelText(/log in/i), 'user@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Login' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.')
    expect(sessionStorage.getItem('cms.session')).toBeNull()
  })

  it('signs in, returns to the requested page, and logs out', async () => {
    const { user, router } = renderApp('/entries')
    await user.type(await screen.findByLabelText(/log in/i), VALID_LOGIN.email)
    await user.type(screen.getByLabelText(/^password/i), VALID_LOGIN.password)
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(await screen.findByRole('heading', { name: 'Crowd Entries', level: 1 })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/entries')
    expect(sessionStorage.getItem('cms.session')).toContain('token')

    await user.click(screen.getByRole('button', { name: 'Logout' }))
    expect(await screen.findByRole('button', { name: 'Login' })).toBeInTheDocument()
    expect(sessionStorage.getItem('cms.session')).toBeNull()
  })

  it('ends the session when the backend reports an expired token (403)', async () => {
    server.use(
      http.get(`${API}/api/sites`, () => HttpResponse.json(errorBodies.invalidToken, { status: 403 })),
    )
    signIn()
    const { router } = renderApp('/overview')
    expect(await screen.findByText('Your session has expired. Please sign in again.')).toBeInTheDocument()
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login')
    })
  })
})
