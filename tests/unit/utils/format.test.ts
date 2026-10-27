import { describe, expect, it } from 'vitest'
import {
  describeDwell,
  formatClock,
  formatCount,
  formatDwellClock,
  formatDwellLong,
  initials,
  percentChange,
} from '@/utils/format'

describe('format', () => {
  it('formats dwell like the design', () => {
    expect(formatDwellLong(22.08)).toBe('22min 05sec')
    expect(formatDwellLong(8.5)).toBe('08min 30sec')
    expect(formatDwellLong(75)).toBe('1h 15min')
    expect(formatDwellClock(20.4)).toBe('00:20')
    expect(formatDwellClock(4.97)).toBe('00:05')
    expect(formatDwellClock(null)).toBe('--')
    expect(describeDwell(4.97)).toBe('4 minutes 58 seconds')
  })

  it('formats times in the site time zone', () => {
    // 12:08:32 UTC is 16:08 in Dubai (UTC+4)
    expect(formatClock(1793016512524, 'Asia/Dubai')).toBe('4:08 PM')
  })

  it('handles missing values and initials', () => {
    expect(formatCount(null)).toBe('--')
    expect(formatCount(2436)).toBe('2,436')
    expect(initials('Andrew  Casper')).toBe('AC')
  })

  it('computes comparisons only with a meaningful baseline', () => {
    expect(percentChange(110, 100)).toBeCloseTo(10)
    expect(percentChange(5, 0)).toBeNull()
  })
})
