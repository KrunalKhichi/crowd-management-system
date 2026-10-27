const formatters = new Map<string, Intl.DateTimeFormat>()

function dateTimeFormat(timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${timeZone}|${JSON.stringify(options)}`
  let f = formatters.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone, ...options })
    formatters.set(key, f)
  }
  return f
}

const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const percent = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export const PLACEHOLDER = '--'

export function formatCount(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? PLACEHOLDER : integer.format(value)
}

export function formatPercent(value: number): string {
  return `${percent.format(value)}%`
}

/** "11:05 AM" in the site's time zone. */
export function formatClock(ts: number, timeZone: string, withSeconds = false): string {
  return dateTimeFormat(timeZone, {
    hour: 'numeric',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
  }).format(ts)
}

/** "08:00" axis label in the site's time zone. */
export function formatAxisHour(ts: number, timeZone: string): string {
  return dateTimeFormat(timeZone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(ts)
}

/** "Mon, 26 Oct 2026" */
export function formatDay(ts: number, timeZone: string): string {
  return dateTimeFormat(timeZone, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(ts)
}

/** KPI style: 22.08 → "22min 05sec"; ≥ 1h → "1h 05min". */
export function formatDwellLong(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes < 0) return PLACEHOLDER
  const totalSeconds = Math.round(minutes * 60)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}h ${pad(m)}min` : `${pad(m)}min ${pad(s)}sec`
}

/** Table style from the design: hours:minutes, e.g. 20.4 → "00:20". */
export function formatDwellClock(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes < 0) return PLACEHOLDER
  const total = Math.round(minutes)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** Spoken form for screen readers: "4 minutes 58 seconds". */
export function describeDwell(minutes: number): string {
  const totalSeconds = Math.round(minutes * 60)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const parts = [h && `${h} hour${h === 1 ? '' : 's'}`, m && `${m} minute${m === 1 ? '' : 's'}`]
  if (!h) parts.push(`${s} second${s === 1 ? '' : 's'}`)
  return parts.filter(Boolean).join(' ')
}

export function formatRelative(ts: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - ts) / 1000))
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.round(minutes / 60)}h ago`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

/**
 * Percentage change between two backend-provided values of the same metric over
 * equal-length windows. Returns null when there is no meaningful baseline.
 */
export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null
  return ((current - previous) / previous) * 100
}
