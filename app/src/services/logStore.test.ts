import { beforeEach, describe, expect, it, vi } from 'vitest'

const encryptedStore = new Map<string, unknown>()

vi.mock('./secureStore', () => ({
  getEncrypted: vi.fn((key: string) => Promise.resolve(encryptedStore.get(key) ?? null)),
  setEncrypted: vi.fn((key: string, value: unknown) => {
    encryptedStore.set(key, value)
    return Promise.resolve()
  }),
}))

vi.mock('../config/buildInfo', () => ({
  BUILD_MODE: 'test',
  getExecutionLane: vi.fn(() => 'qa-device'),
  isVerboseDevLane: vi.fn(() => false),
}))

import { exportLogsAsText, getLogOptInStatus, logEvent, setLogOptIn } from './logStore'

beforeEach(() => {
  encryptedStore.clear()
  vi.useRealTimers()
})

describe('diagnostic log opt-in window', () => {
  it('stores a 15-minute expiry from the time diagnostics are enabled', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-03T15:29:00.000Z'))

    await setLogOptIn(true)

    const status = await getLogOptInStatus()

    expect(status).toEqual({
      enabled: true,
      expiresAt: '2026-07-03T15:44:00.000Z',
    })
  })

  it('turns itself off after the 15-minute window expires', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-03T15:29:00.000Z'))
    await setLogOptIn(true)

    vi.setSystemTime(new Date('2026-07-03T15:44:00.000Z'))

    await expect(getLogOptInStatus()).resolves.toEqual({ enabled: false, expiresAt: '' })
  })
})

describe('diagnostic log export', () => {
  it('exports only allowlisted event metadata after diagnostics are enabled', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-03T15:29:00.000Z'))
    await setLogOptIn(true)

    await logEvent('send_batch_started', {
      metadata: {
        count: '5',
        sendSafetyMode: 'demo_recipients',
        email: 'person@example.com',
        brokerName: 'Broker Example',
      },
    })

    const text = await exportLogsAsText()

    expect(text).toContain('send_batch_started')
    expect(text).toContain('"buildMode":"test"')
    expect(text).toContain('"executionLane":"qa-device"')
    expect(text).toContain('"count":"5"')
    expect(text).toContain('"sendSafetyMode":"demo_recipients"')
    expect(text).not.toContain('person@example.com')
    expect(text).not.toContain('Broker Example')
  })
})
