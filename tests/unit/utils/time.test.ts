import { describe, expect, it } from 'vitest'
import { dateKeyOf, dayWindow, hourlyTicks, isDateKey, shiftDateKey, zonedMidnight } from '@/utils/time'

const iso = (ts: number) => new Date(ts).toISOString()

describe('zonedMidnight', () => {
  it('resolves local midnight in the site time zone', () => {
    expect(iso(zonedMidnight('2026-10-26', 'Asia/Dubai'))).toBe('2026-10-25T20:00:00.000Z')
    expect(iso(zonedMidnight('2026-10-26', 'Asia/Kolkata'))).toBe('2026-10-25T18:30:00.000Z')
  })

  it('handles daylight-saving transitions', () => {
    expect(iso(zonedMidnight('2026-03-08', 'America/Los_Angeles'))).toBe('2026-03-08T08:00:00.000Z')
    expect(iso(zonedMidnight('2026-03-09', 'America/Los_Angeles'))).toBe('2026-03-09T07:00:00.000Z')
  })
})

describe('date keys', () => {
  it('derives the site-local calendar day, not the browser one', () => {
    const ts = Date.parse('2026-10-25T21:30:00Z')
    expect(dateKeyOf(ts, 'Asia/Dubai')).toBe('2026-10-26')
    expect(dateKeyOf(ts, 'America/Los_Angeles')).toBe('2026-10-25')
  })

  it('validates and shifts keys', () => {
    expect(isDateKey('2026-02-29')).toBe(false)
    expect(isDateKey('2026-10-26')).toBe(true)
    expect(isDateKey('26/10/2026')).toBe(false)
    expect(shiftDateKey('2026-12-31', 1)).toBe('2027-01-01')
  })
})

describe('dayWindow', () => {
  const tz = 'Asia/Dubai'
  const now = Date.parse('2026-10-26T08:00:00Z') // 12:00 in Dubai

  it('ends "today" at now and mirrors the same span on the previous day', () => {
    const w = dayWindow('2026-10-26', tz, now)
    expect(w.isToday).toBe(true)
    expect(w.current.toUtc).toBe(now)
    expect(w.current.toUtc - w.current.fromUtc).toBe(12 * 3_600_000)
    expect(w.previous.toUtc - w.previous.fromUtc).toBe(12 * 3_600_000)
    expect(w.current.fromUtc - w.previous.fromUtc).toBe(86_400_000)
  })

  it('covers the whole day for past dates', () => {
    const w = dayWindow('2026-10-20', tz, now)
    expect(w.isToday).toBe(false)
    expect(w.current.toUtc).toBe(w.dayEnd - 1)
  })

  it('builds axis ticks across the day', () => {
    const w = dayWindow('2026-10-20', tz, now)
    expect(hourlyTicks(w.dayStart, w.dayEnd, 2)).toHaveLength(13)
  })
})
