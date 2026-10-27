export const HOUR_MS = 3_600_000
export const DAY_MS = 86_400_000

const partsFormatters = new Map<string, Intl.DateTimeFormat>()

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = partsFormatters.get(timeZone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    partsFormatters.set(timeZone, f)
  }
  return f
}

interface WallClock {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

/** Wall-clock fields of an instant in a time zone. */
export function zonedParts(ts: number, timeZone: string): WallClock {
  const m: Partial<Record<Intl.DateTimeFormatPartTypes, number>> = {}
  for (const p of partsFormatter(timeZone).formatToParts(new Date(ts))) m[p.type] = Number(p.value)
  return {
    year: m.year ?? 1970,
    month: m.month ?? 1,
    day: m.day ?? 1,
    hour: m.hour ?? 0,
    minute: m.minute ?? 0,
    second: m.second ?? 0,
  }
}

function tzOffset(ts: number, timeZone: string): number {
  const p = zonedParts(ts, timeZone)
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ts / 1000) * 1000
}

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** True for a syntactically valid, real calendar date in YYYY-MM-DD form. */
export function isDateKey(value: string): boolean {
  const m = DATE_KEY_RE.exec(value)
  if (!m) return false
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return d.toISOString().slice(0, 10) === value
}

function parseDateKey(dateKey: string) {
  const m = DATE_KEY_RE.exec(dateKey)
  if (!m) throw new RangeError(`Invalid date key: ${dateKey}`)
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) }
}

/** UTC instant of local midnight for a site-local YYYY-MM-DD date. Handles DST. */
export function zonedMidnight(dateKey: string, timeZone: string): number {
  const { y, m, d } = parseDateKey(dateKey)
  const guess = Date.UTC(y, m - 1, d)
  const first = guess - tzOffset(guess, timeZone)
  return guess - tzOffset(first, timeZone)
}

/** Site-local YYYY-MM-DD of an instant. */
export function dateKeyOf(ts: number, timeZone: string): string {
  const p = zonedParts(ts, timeZone)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

export function shiftDateKey(dateKey: string, days: number): string {
  const { y, m, d } = parseDateKey(dateKey)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export interface TimeRange {
  fromUtc: number
  toUtc: number
}

export interface DayWindow {
  /** The requested range: local midnight → now (today) or → end of day (past days). */
  current: TimeRange
  /** Same-length range on the previous day, for "vs yesterday" comparisons. */
  previous: TimeRange
  dayStart: number
  dayEnd: number
  isToday: boolean
}

/** Analytics window for a site-local day, evaluated at `now`. */
export function dayWindow(dateKey: string, timeZone: string, now = Date.now()): DayWindow {
  const dayStart = zonedMidnight(dateKey, timeZone)
  const dayEnd = zonedMidnight(shiftDateKey(dateKey, 1), timeZone)
  const isToday = now >= dayStart && now < dayEnd
  const toUtc = isToday ? now : dayEnd - 1
  const prevStart = zonedMidnight(shiftDateKey(dateKey, -1), timeZone)
  return {
    current: { fromUtc: dayStart, toUtc },
    previous: { fromUtc: prevStart, toUtc: prevStart + (toUtc - dayStart) },
    dayStart,
    dayEnd,
    isToday,
  }
}

/** Hourly tick positions covering [start, end]. */
export function hourlyTicks(start: number, end: number, stepHours: number): number[] {
  const ticks: number[] = []
  for (let t = start; t <= end; t += stepHours * HOUR_MS) ticks.push(t)
  return ticks
}
