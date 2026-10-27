/** Accept only in-app paths as a post-login destination (prevents open redirects). */
export function safeRedirectPath(value: unknown, fallback = '/overview'): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : fallback
}
