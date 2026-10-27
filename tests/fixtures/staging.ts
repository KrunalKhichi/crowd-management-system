/**
 * Response bodies captured from the staging API on 2026-10-26 (arrays trimmed).
 * Tests use these so mocks follow the real contract rather than an assumed one.
 */
import type { AlertEvent, LiveOccupancyEvent } from '@/services/socket'

export const SITE_ID = '8bd0d580-fdac-44a4-a6e4-367253099c4e'
export const OTHER_SITE_ID = 'd72e36d3-ca6c-4051-8b16-170d220d8df9'

export const sitesFixture = [
  {
    siteId: SITE_ID,
    name: 'Dubai Mall',
    city: 'Dubai',
    country: 'UAE',
    timezone: 'Asia/Dubai',
    zones: [
      { zoneId: '788ab32d-bc8f-4071-9dbc-0bf44ecdb6b1', name: 'Dubai Mall HIGH Zone', securityLevel: 'high' },
      {
        zoneId: '2201d536-2b05-4e47-a971-aba2129a3bbf',
        name: 'Dubai Mall MEDIUM Zone',
        securityLevel: 'medium',
      },
      { zoneId: 'f100dd38-90f3-4e3e-a9f5-a3e40911c99c', name: 'Dubai Mall LOW Zone', securityLevel: 'low' },
    ],
  },
  {
    siteId: OTHER_SITE_ID,
    name: 'San Francisco International Airport',
    city: 'San Francisco',
    country: 'USA',
    timezone: 'America/Los_Angeles',
    zones: [
      {
        zoneId: 'd08ffcea-6a2b-4097-99f7-a136b5d61708',
        name: 'San Francisco International Airport HIGH Zone',
        securityLevel: 'high',
      },
    ],
  },
]

export const footfallFixture = {
  siteId: SITE_ID,
  fromUtc: 1793006312463,
  toUtc: 1793017112463,
  footfall: 926,
}

export const dwellFixture = {
  siteId: SITE_ID,
  fromUtc: 1793006312463,
  toUtc: 1793017112463,
  avgDwellMinutes: 22.08,
  dwellRecords: 939,
}

export const occupancyFixture = {
  siteId: SITE_ID,
  fromUtc: 1793006312463,
  toUtc: 1793017112463,
  timezone: 'Asia/Dubai',
  buckets: [
    { utc: 1793005200000, local: '26/10/2026 13:00:00', avg: 115.3 },
    { utc: 1793008800000, local: '26/10/2026 14:00:00', avg: 116.1 },
    { utc: 1793012400000, local: '26/10/2026 15:00:00', avg: 117.7 },
  ],
}

export const demographicsFixture = {
  siteId: SITE_ID,
  fromUtc: 1793006312463,
  toUtc: 1793017112463,
  timezone: 'Asia/Dubai',
  buckets: [
    { utc: 1793005200000, local: '26/10/2026 13:00:00', male: 63.9, female: 51.4 },
    { utc: 1793008800000, local: '26/10/2026 14:00:00', male: 61.5, female: 54.6 },
    { utc: 1793012400000, local: '26/10/2026 15:00:00', male: 62.1, female: 55.5 },
  ],
}

export const entryInside = {
  personId: '06770572-639a-4f5a-b858-1459bce708d5',
  personName: 'Juan Littel',
  gender: 'male',
  zoneId: 'f100dd38-90f3-4e3e-a9f5-a3e40911c99c',
  zoneName: 'Dubai Mall LOW Zone',
  severity: 'low',
  entryUtc: 1793017098212,
  entryLocal: '26/10/2026 12:18:18',
  exitUtc: null,
  exitLocal: null,
  dwellMinutes: null,
}

export const entryExited = {
  personId: '953fb897-a198-40ba-8e14-110f500598cb',
  personName: 'Andrew Casper',
  gender: 'female',
  zoneId: '788ab32d-bc8f-4071-9dbc-0bf44ecdb6b1',
  zoneName: 'Dubai Mall HIGH Zone',
  severity: 'high',
  entryUtc: 1793016512524,
  entryLocal: '26/10/2026 12:08:32',
  exitUtc: 1793016810900,
  exitLocal: '26/10/2026 12:13:30',
  dwellMinutes: 4.97,
}

export const entryExitFixture = {
  siteId: SITE_ID,
  fromUtc: 1793006312463,
  toUtc: 1793017112463,
  pageSize: 50,
  pageNumber: 1,
  totalRecords: 926,
  totalPages: 19,
  records: [entryInside, entryExited],
}

/** Socket payload shapes observed on staging. */
export const alertEventFixture: AlertEvent = {
  ts: 1792915000238,
  eventId: 'fc9f51e2-25f8-4202-99e0-af2a9750c860',
  direction: 'entry',
  personName: 'Joanne Pacocha',
  severity: 'high',
  zoneName: 'Dubai Mall HIGH Zone',
  zoneId: '788ab32d-bc8f-4071-9dbc-0bf44ecdb6b1',
  siteName: 'Dubai Mall',
  siteId: SITE_ID,
  personId: '50f22d23-2e18-4548-adaf-e1a9d0a641ba',
}

export const liveOccupancyFixture: LiveOccupancyEvent = {
  ts: 1792915000239,
  siteId: SITE_ID,
  siteOccupancy: 122,
  zoneId: 'ad39628e-56d0-4c24-8e1e-598efafce4fb',
  zoneOccupancy: 37,
  genderCount: { male: 48, female: 74 },
}

/** Error bodies observed on staging. */
export const errorBodies = {
  invalidCredentials: { errorMessage: 'Invalid credentials' }, // 401 POST /api/auth/login
  missingAuth: { message: 'Missing Authorization header' }, // 401
  invalidToken: { message: 'Invalid or expired token' }, // 403
  missingSite: { error: 'siteId required' }, // 400
}

/** A syntactically valid JWT whose payload mirrors staging claims (signature is fake). */
export function makeToken(claims: Record<string, unknown> = {}): string {
  const enc = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  const now = Math.floor(Date.now() / 1000)
  return `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc({ sub: 'u1', email: 'user@example.com', name: 'Test User', role: 'viewer', iat: now, exp: now + 3600, ...claims })}.signature`
}
