import { createFakeFactory } from './fakeSocket'

/** Shared fake used by `vi.mock('socket.io-client')` in integration tests. */
export const fakeIo = createFakeFactory()
