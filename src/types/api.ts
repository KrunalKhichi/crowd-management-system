import { z } from 'zod'

/**
 * Runtime contracts for the backend REST API, taken from Swagger and checked against
 * live staging responses. Unknown extra fields are stripped; missing or mistyped
 * required fields reject the response (surfaced as an `invalid_response` error).
 */

const epochMs = z.number().int().nonnegative()
const count = z.number()

export const severitySchema = z.enum(['high', 'medium', 'low'])
export type Severity = z.infer<typeof severitySchema>

export const zoneSchema = z.object({
  zoneId: z.string(),
  name: z.string(),
  securityLevel: z.string(),
})

export const siteSchema = z.object({
  siteId: z.string(),
  name: z.string(),
  city: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string(),
  zones: z.array(zoneSchema).default([]),
})
export const sitesSchema = z.array(siteSchema)
export type Site = z.infer<typeof siteSchema>

/** Body shared by every analytics endpoint. */
export interface RangeRequest {
  siteId: string
  fromUtc: number
  toUtc: number
}

const rangeEcho = { siteId: z.string(), fromUtc: epochMs, toUtc: epochMs }

export const footfallSchema = z.object({ ...rangeEcho, footfall: count })
export type FootfallResponse = z.infer<typeof footfallSchema>

export const dwellSchema = z.object({ ...rangeEcho, avgDwellMinutes: count, dwellRecords: count })
export type DwellResponse = z.infer<typeof dwellSchema>

export const occupancyBucketSchema = z.object({ utc: epochMs, local: z.string(), avg: count })
export const occupancySchema = z.object({
  ...rangeEcho,
  timezone: z.string(),
  buckets: z.array(occupancyBucketSchema),
})
export type OccupancyBucket = z.infer<typeof occupancyBucketSchema>
export type OccupancyResponse = z.infer<typeof occupancySchema>

export const demographicsBucketSchema = z.object({
  utc: epochMs,
  local: z.string(),
  // Missing categories are treated as zero rather than rejecting the whole series.
  male: count.default(0),
  female: count.default(0),
})
export const demographicsSchema = z.object({
  ...rangeEcho,
  timezone: z.string(),
  buckets: z.array(demographicsBucketSchema),
})
export type DemographicsBucket = z.infer<typeof demographicsBucketSchema>
export type DemographicsResponse = z.infer<typeof demographicsSchema>

export interface EntryExitRequest extends RangeRequest {
  /** 1-based. */
  pageNumber: number
  pageSize: number
}

export const entryRecordSchema = z.object({
  personId: z.string(),
  personName: z.string(),
  gender: z.string(),
  zoneId: z.string().optional(),
  zoneName: z.string().optional(),
  severity: z.string().optional(),
  entryUtc: epochMs,
  // Note: entryLocal/exitLocal are UTC-formatted on staging, so the UI formats the epoch fields instead.
  exitUtc: epochMs
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  dwellMinutes: count
    .nullable()
    .optional()
    .transform((v) => v ?? null),
})
export type EntryRecord = z.infer<typeof entryRecordSchema>

export const entryExitSchema = z.object({
  siteId: z.string(),
  totalRecords: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  pageNumber: z.number().int(),
  pageSize: z.number().int(),
  records: z.array(entryRecordSchema),
})
export type EntryExitResponse = z.infer<typeof entryExitSchema>

export const loginResponseSchema = z.object({ token: z.string().min(1) })
export type LoginResponse = z.infer<typeof loginResponseSchema>
