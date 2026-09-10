import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./userProfile', async () => {
  const actual = await vi.importActual<typeof import('./userProfile')>('./userProfile')
  return {
    ...actual,
    getUserProfile: vi.fn(),
  }
})

vi.mock('./queueStore', () => ({
  initializeQueue: vi.fn(),
  resetFailedToPending: vi.fn(() => []),
  setQueue: vi.fn(),
  getQueue: vi.fn(() => []),
  summarizeQueue: vi.fn(() => ({ sent: 0, failed: 0, pending: 0, total: 0 })),
  updateQueueItem: vi.fn(),
}))

vi.mock('./gmailSend', () => ({
  sendEmail: vi.fn(),
}))

vi.mock('./metricsStore', () => ({ incrementTotalSentCount: vi.fn() }))
vi.mock('./sentLog', () => ({ appendSentLogEntries: vi.fn() }))
vi.mock('../config/constants', async (importOriginal) => ({
  ...await importOriginal<typeof import('../config/constants')>(), SEND_DELAY_MS: 0,
}))

vi.mock('./templateStore', () => ({
  getDeletionTemplateDraft: vi.fn(),
  resolveDeletionTemplate: vi.fn(() => ''),
}))

import { getUserProfile, type UserProfile } from './userProfile'
import { initializeQueue, resetFailedToPending, summarizeQueue, updateQueueItem } from './queueStore'
import { sendEmail } from './gmailSend'
import { sendAll } from './sendQueue'

const mockGetUserProfile = vi.mocked(getUserProfile)
const mockInitializeQueue = vi.mocked(initializeQueue)
const mockSendEmail = vi.mocked(sendEmail)

const BROKERS = [
  { id: 'b1', name: 'Broker One', domain: 'one.example', contactEmail: 'a@one.example', starterOrder: 1 },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('sendAll profile validation guard', () => {
  it('reports zero fresh sends when an already-complete queue is reused', async () => {
    mockGetUserProfile.mockResolvedValue({ fullName: 'Test User', email: 'me@example.com', city: 'Townsville', state: 'CA', partialZip: '900' })
    vi.mocked(resetFailedToPending).mockResolvedValueOnce([{ brokerId: 'b1', referenceId: 'REF-1', status: 'sent' }])
    vi.mocked(summarizeQueue).mockReturnValueOnce({ sent: 1, failed: 0, pending: 0, total: 1 })
    expect(await sendAll(BROKERS as never, ['b1'])).toMatchObject({ sent: 1, newlySent: 0 })
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('reports fresh sends separately from historical queue successes', async () => {
    mockGetUserProfile.mockResolvedValue({ fullName: 'Test User', email: 'me@example.com', city: 'Townsville', state: 'CA', partialZip: '900' })
    const item = { brokerId: 'b1', referenceId: 'REF-1', status: 'pending' as const }
    vi.mocked(resetFailedToPending).mockResolvedValueOnce([item])
    vi.mocked(summarizeQueue)
      .mockReturnValueOnce({ sent: 0, failed: 0, pending: 1, total: 1 })
      .mockReturnValueOnce({ sent: 1, failed: 0, pending: 0, total: 1 })
    vi.mocked(updateQueueItem).mockResolvedValueOnce([{ ...item, status: 'sent' }])
    mockSendEmail.mockResolvedValueOnce({ id: 'test-message', threadId: 'test-thread' })
    expect(await sendAll(BROKERS as never, ['b1'])).toMatchObject({ sent: 1, newlySent: 1 })
  })

  it('throws when no profile is set, before queue init or send', async () => {
    mockGetUserProfile.mockResolvedValue(null)

    await expect(sendAll(BROKERS as never, ['b1'])).rejects.toThrow(/profile not set/i)

    expect(mockInitializeQueue).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('throws when the persisted profile fails format validation, before queue init or send', async () => {
    const invalidProfile: UserProfile = {
      fullName: 'Test User',
      email: 'not-an-email',
      city: 'Townsville',
      state: 'CA',
      partialZip: '900',
    }
    mockGetUserProfile.mockResolvedValue(invalidProfile)

    await expect(sendAll(BROKERS as never, ['b1'])).rejects.toThrow(/profile is invalid/i)

    expect(mockInitializeQueue).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('passes the guard for a well-formed profile', async () => {
    const validProfile: UserProfile = {
      fullName: 'Test User',
      email: 'me@example.com',
      city: 'Townsville',
      state: 'CA',
      partialZip: '900',
    }
    mockGetUserProfile.mockResolvedValue(validProfile)

    await sendAll(BROKERS as never, ['b1'])

    expect(mockInitializeQueue).toHaveBeenCalledOnce()
  })
})
