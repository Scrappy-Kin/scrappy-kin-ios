import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QueueItem } from './queueStore'
import type { SentLogEntry } from './sentLog'
import type { Broker } from './brokerStore'

// Mock storage dependencies before importing the module under test
vi.mock('./secureStore', () => ({
  getEncrypted: vi.fn(),
  setEncrypted: vi.fn(),
}))

vi.mock('./queueStore', () => ({
  getQueue: vi.fn(),
}))

import { getEncrypted } from './secureStore'
import { getQueue } from './queueStore'
import { getMergedSentLog } from './sentLog'

const mockGetEncrypted = vi.mocked(getEncrypted)
const mockGetQueue = vi.mocked(getQueue)

function queueItem(brokerId: string, referenceId: string): QueueItem {
  return {
    brokerId,
    status: 'sent',
    referenceId,
    lastAttemptAt: '2025-01-01T00:00:00.000Z',
  }
}

function logEntry(brokerId: string, referenceId: string, brokerName = `Broker ${brokerId}`): SentLogEntry {
  return { brokerId, brokerName, sentAt: '2025-01-01T00:00:00.000Z', referenceId }
}

function broker(id: string, name = `Broker ${id}`): Broker {
  return { id, name, contactEmail: `opt-out@${id}.example` }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getMergedSentLog', () => {
  it('includes sent queue items missing from the durable sentLog', async () => {
    mockGetEncrypted.mockResolvedValue([]) // empty durable log
    mockGetQueue.mockResolvedValue([queueItem('a', 'REF-A')])

    const result = await getMergedSentLog()

    expect(result).toHaveLength(1)
    expect(result[0].brokerId).toBe('a')
    expect(result[0].referenceId).toBe('REF-A')
  })

  it('dedupes queue entries already represented in the durable sentLog', async () => {
    mockGetEncrypted.mockResolvedValue([logEntry('a', 'REF-A')])
    mockGetQueue.mockResolvedValue([queueItem('a', 'REF-A')])

    const result = await getMergedSentLog()

    expect(result).toHaveLength(1)
  })

  it('resolves broker names from the broker catalog when brokers are passed', async () => {
    mockGetEncrypted.mockResolvedValue([])
    mockGetQueue.mockResolvedValue([queueItem('a', 'REF-A')])

    const result = await getMergedSentLog([broker('a', 'Acme Data Corp')])

    expect(result[0].brokerName).toBe('Acme Data Corp')
  })

  it('falls back to broker id for name when no broker catalog is passed', async () => {
    mockGetEncrypted.mockResolvedValue([])
    mockGetQueue.mockResolvedValue([queueItem('a', 'REF-A')])

    const result = await getMergedSentLog()

    expect(result[0].brokerName).toBe('a')
  })

  it('does not include non-sent queue items', async () => {
    mockGetEncrypted.mockResolvedValue([])
    mockGetQueue.mockResolvedValue([
      { brokerId: 'b', status: 'pending', referenceId: 'REF-B' },
      { brokerId: 'c', status: 'failed', referenceId: 'REF-C' },
    ])

    const result = await getMergedSentLog()

    expect(result).toHaveLength(0)
  })

  it('preserves durable recipient routing metadata', async () => {
    mockGetEncrypted.mockResolvedValue([
      {
        ...logEntry('a', 'REF-A'),
        recipientMode: 'app_review_test',
        recipientEmail: 'app-review-redacted-03@example.invalid',
      },
    ])
    mockGetQueue.mockResolvedValue([])

    const result = await getMergedSentLog()

    expect(result[0].recipientMode).toBe('app_review_test')
    expect(result[0].recipientEmail).toBe('app-review-redacted-03@example.invalid')
  })
})
