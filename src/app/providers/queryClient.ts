import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/services/api/errors'

/**
 * The analytics endpoints are POST but read-only (same body → same result), so one
 * retry is safe — but only for transient failures (network, timeout, 5xx). 4xx and
 * contract errors are never retried. Mutations (login) are never retried.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => failureCount < 1 && isApiError(error) && error.retryable,
        retryDelay: 1_000,
      },
      mutations: { retry: false },
    },
  })
}
