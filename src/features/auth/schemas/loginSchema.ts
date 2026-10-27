import { z } from 'zod'

// The login contract takes `email` (Swagger: POST /api/auth/login { email, password }).
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').pipe(z.email('Enter a valid email address')),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
