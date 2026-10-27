import { z } from 'zod'
import { severitySchema } from '@/types/api'

/**
 * Socket.IO server → client events. Names and payloads observed on staging; the
 * server also emits an undocumented `sim:event` (duplicate of `alert`) which is ignored.
 */

export const alertEventSchema = z.object({
  ts: z.number().int(),
  eventId: z.string(),
  direction: z.enum(['entry', 'exit']),
  personId: z.string(),
  personName: z.string(),
  severity: severitySchema,
  zoneId: z.string(),
  zoneName: z.string(),
  siteId: z.string(),
  siteName: z.string(),
})
export type AlertEvent = z.infer<typeof alertEventSchema>

export const liveOccupancyEventSchema = z.object({
  ts: z.number().int(),
  siteId: z.string(),
  siteOccupancy: z.number().int().nonnegative(),
  zoneId: z.string(),
  zoneOccupancy: z.number().int().nonnegative(),
  genderCount: z.object({ male: z.number().int().nonnegative(), female: z.number().int().nonnegative() }),
})
export type LiveOccupancyEvent = z.infer<typeof liveOccupancyEventSchema>

export const serverEventSchemas = {
  alert: alertEventSchema,
  live_occupancy: liveOccupancyEventSchema,
} as const

export type ServerEventName = keyof typeof serverEventSchemas
export interface ServerEvents {
  alert: AlertEvent
  live_occupancy: LiveOccupancyEvent
}

/** Message the server sends via connect_error when the handshake token is missing or invalid. */
export const AUTH_ERROR_MESSAGE = 'Authentication error'
