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

vi.mock('./templateStore', () => ({
  getDeletionTemplateDraft: vi.fn(),
  resolveDeletionTemplate: vi.fn(() => ''),
}))

import { getUserProfile, type UserProfile } from './userProfile'
import { initializeQueue } from './queueStore'
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
