import { describe, expect, it, vi } from 'vitest'
import { RealtimeClient } from '@/services/socket/realtimeClient'
import { alertEventFixture, liveOccupancyFixture } from '../../fixtures/staging'
import { createFakeFactory } from '../../mocks/fakeSocket'

function setup() {
  const fake = createFakeFactory()
  const client = new RealtimeClient('http://socket.test', () => Promise.resolve(fake.factory))
  return { client, fake }
}

describe('RealtimeClient', () => {
  it('connects once per token with the handshake auth', async () => {
    const { client, fake } = setup()
    await client.connect('t1')
    await client.connect('t1')
    expect(fake.factory).toHaveBeenCalledTimes(1)
    expect(fake.options[0]).toMatchObject({ auth: { token: 't1' } })

    await client.connect('t2')
    expect(fake.factory).toHaveBeenCalledTimes(2)
    expect(fake.sockets[0]!.disconnect).toHaveBeenCalled()
  })

  it('registers one native listener per event regardless of subscriber count', async () => {
    const { client, fake } = setup()
    const a = vi.fn()
    const b = vi.fn()
    const offA = client.subscribe('alert', a)
    client.subscribe('alert', b)
    client.subscribe('alert', b) // same handler twice is still one subscription
    await client.connect('t')
    const socket = fake.latest()
    expect(socket.listenerCount('alert')).toBe(1)
    expect(socket.listenerCount('live_occupancy')).toBe(1)

    socket.serverEmit('alert', alertEventFixture)
    expect(a).toHaveBeenCalledWith(alertEventFixture)
    expect(b).toHaveBeenCalledTimes(1)

    offA()
    socket.serverEmit('alert', { ...alertEventFixture, eventId: 'second' })
    expect(a).toHaveBeenCalledTimes(1)
    expect(client.handlerCount('alert')).toBe(1)
  })

  it('drops malformed payloads', async () => {
    const { client, fake } = setup()
    const handler = vi.fn()
    client.subscribe('live_occupancy', handler)
    await client.connect('t')
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    fake.latest().serverEmit('live_occupancy', { ...liveOccupancyFixture, siteOccupancy: 'many' })
    fake.latest().serverEmit('live_occupancy', liveOccupancyFixture)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('tracks connection status through drops, retries and recovery', async () => {
    const { client, fake } = setup()
    const statuses: string[] = []
    client.subscribeStatus(() => statuses.push(client.getStatus()))
    const onReconnect = vi.fn()
    client.onReconnect(onReconnect)

    await client.connect('t')
    const s = fake.latest()
    s.serverEmit('connect')
    s.serverEmit('disconnect', 'transport close') // socket.active stays true → retrying
    s.managerEmit('reconnect_attempt')
    s.serverEmit('connect')
    expect(onReconnect).toHaveBeenCalledTimes(1)
    s.active = false
    s.managerEmit('reconnect_failed')

    expect(statuses).toEqual(['connecting', 'connected', 'reconnecting', 'connected', 'disconnected'])
  })

  it('reports handshake rejection as unauthorized', async () => {
    const { client, fake } = setup()
    const onAuthError = vi.fn()
    await client.connect('expired', { onAuthError })
    fake.latest().serverEmit('connect_error', new Error('Authentication error'))
    expect(client.getStatus()).toBe('unauthorized')
    expect(onAuthError).toHaveBeenCalledTimes(1)
  })

  it('cleans up listeners on disconnect and ignores a connect cancelled mid-import', async () => {
    const fake = createFakeFactory()
    let release: () => void = () => undefined
    const gate = new Promise<void>((r) => (release = r))
    const client = new RealtimeClient('http://socket.test', async () => {
      await gate
      return fake.factory
    })
    const pending = client.connect('t')
    client.disconnect()
    release()
    await pending
    expect(fake.factory).not.toHaveBeenCalled()
    expect(client.getStatus()).toBe('idle')

    await client.connect('t')
    const socket = fake.latest()
    client.disconnect()
    expect(socket.listenerCount('alert')).toBe(0)
    expect(socket.disconnect).toHaveBeenCalled()
  })
})
