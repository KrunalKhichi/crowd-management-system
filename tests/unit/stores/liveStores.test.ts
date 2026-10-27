import { describe, expect, it, vi } from 'vitest'
import { MAX_ALERTS } from '@/constants/config'
import { alertsStore } from '@/features/alerts/alertsStore'
import { liveOccupancyStore } from '@/features/occupancy/liveOccupancyStore'
import { alertEventFixture, liveOccupancyFixture, OTHER_SITE_ID, SITE_ID } from '../../fixtures/staging'

describe('alertsStore', () => {
  it('keeps newest first, de-duplicates and caps the list', () => {
    alertsStore.clear()
    alertsStore.add(alertEventFixture)
    alertsStore.add(alertEventFixture)
    expect(alertsStore.getState().items).toHaveLength(1)
    for (let i = 0; i < MAX_ALERTS + 5; i++)
      alertsStore.add({ ...alertEventFixture, eventId: `e${i}`, ts: i })
    const items = alertsStore.getState().items
    expect(items).toHaveLength(MAX_ALERTS)
    expect(items[0]!.eventId).toBe(`e${MAX_ALERTS + 4}`)
  })
})

describe('liveOccupancyStore', () => {
  it('notifies only the affected site and ignores out-of-order events', () => {
    liveOccupancyStore.clear()
    const mine = vi.fn()
    const other = vi.fn()
    liveOccupancyStore.subscribe(SITE_ID, mine)
    liveOccupancyStore.subscribe(OTHER_SITE_ID, other)

    liveOccupancyStore.set({ ...liveOccupancyFixture, ts: 10, siteOccupancy: 5 })
    liveOccupancyStore.set({ ...liveOccupancyFixture, ts: 5, siteOccupancy: 99 })
    expect(liveOccupancyStore.get(SITE_ID)?.siteOccupancy).toBe(5)
    expect(mine).toHaveBeenCalledTimes(1)
    expect(other).not.toHaveBeenCalled()
  })
})
