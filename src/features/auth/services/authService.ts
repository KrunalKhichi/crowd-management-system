import { request } from '@/services/api/httpClient'
import { loginResponseSchema, type LoginResponse } from '@/types/api'

export interface Credentials {
  email: string
  password: string
}

/** POST /api/auth/login → { token }. 401 { errorMessage: "Invalid credentials" } on failure. */
export function login(credentials: Credentials): Promise<LoginResponse> {
  return request('/api/auth/login', {
    method: 'POST',
    body: credentials,
    schema: loginResponseSchema,
    authenticated: false,
  })
}
