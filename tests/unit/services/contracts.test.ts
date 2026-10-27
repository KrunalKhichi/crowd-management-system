import { describe, expect, it } from 'vitest'
import { alertEventSchema, liveOccupancyEventSchema } from '@/services/socket/events'
import {
  demographicsSchema,
  dwellSchema,
  entryExitSchema,
  footfallSchema,
  occupancySchema,
  sitesSchema,
} from '@/types/api'
import {
  alertEventFixture,
  demographicsFixture,
  dwellFixture,
  entryExitFixture,
  footfallFixture,
  liveOccupancyFixture,
  occupancyFixture,
  sitesFixture,
} from '../../fixtures/staging'

describe('API contracts accept real staging payloads', () => {
  it.each([
    ['sites', sitesSchema, sitesFixture],
    ['footfall', footfallSchema, footfallFixture],
    ['dwell', dwellSchema, dwellFixture],
    ['occupancy', occupancySchema, occupancyFixture],
    ['demographics', demographicsSchema, demographicsFixture],
    ['entry-exit', entryExitSchema, entryExitFixture],
    ['alert event', alertEventSchema, alertEventFixture],
    ['live_occupancy event', liveOccupancyEventSchema, liveOccupancyFixture],
  ] as const)('%s', (_name, schema, payload) => {
    expect(schema.safeParse(payload).success).toBe(true)
  })

  it('normalizes optional visitor fields', () => {
    const parsed = entryExitSchema.parse({
      ...entryExitFixture,
      records: [{ personId: 'p', personName: 'No Exit', gender: 'female', entryUtc: 1 }],
    })
    expect(parsed.records[0]).toMatchObject({ exitUtc: null, dwellMinutes: null })
  })

  it('treats missing demographic categories as zero', () => {
    const parsed = demographicsSchema.parse({
      ...demographicsFixture,
      buckets: [{ utc: 1, local: 'x', male: 3 }],
    })
    expect(parsed.buckets[0]).toMatchObject({ male: 3, female: 0 })
  })

  it('rejects malformed socket events', () => {
    expect(alertEventSchema.safeParse({ ...alertEventFixture, severity: 'critical' }).success).toBe(false)
    expect(liveOccupancyEventSchema.safeParse({ ...liveOccupancyFixture, siteOccupancy: '12' }).success).toBe(
      false,
    )
  })
})
