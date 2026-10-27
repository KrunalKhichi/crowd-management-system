import { createSession } from '@/features/auth/session'
import { startSession } from '@/features/auth/sessionStore'
import { makeToken } from '../fixtures/staging'

export function signIn(token = makeToken()) {
  startSession(createSession(token, 'user@example.com'))
}
