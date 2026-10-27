/**
 * Hierarchical query keys: invalidating a prefix refreshes everything below it.
 * Leaf keys include every input their query function uses (site time zone, frozen
 * window end, paging) so cached results can never be served for different inputs.
 */
export const analyticsKeys = {
  all: ['analytics'] as const,
  day: (siteId: string, dateKey: string) => [...analyticsKeys.all, siteId, dateKey] as const,
  metric: (
    siteId: string,
    dateKey: string,
    metric: 'footfall' | 'dwell' | 'occupancy' | 'demographics' | 'entries',
  ) => [...analyticsKeys.day(siteId, dateKey), metric] as const,
}
