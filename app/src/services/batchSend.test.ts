import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./brokerStore', () => ({
  DEFAULT_ROUND_SIZE: 5,
  getSelectedBrokerIds: vi.fn(),
  getSelectedRoundSize: vi.fn(() => 5),
  loadBrokers: vi.fn(),
  loadStarterBrokerIds: vi.fn(),
  setSelectedBrokerIds: vi.fn(),
  setSelectedRoundSize: vi.fn(),
}))

vi.mock('./flowProgress', () => ({
  setOnboardingSentCount: vi.fn(),
}))

vi.mock('./roundState', () => ({
  computeBrokerEligibility: vi.fn(() => []),
  getEligibleBrokerIds: vi.fn(() => []),
}))

vi.mock('./sendQueue', () => ({
  getSendFailureMessage: vi.fn(),
  sendAll: vi.fn(),
}))

vi.mock('./sentLog', () => ({
  getMergedSentLog: vi.fn(() => []),
}))

vi.mock('./userProfile', () => ({
  clearUserProfileDraft: vi.fn(),
  setUserProfile: vi.fn(),
}))

import { getSelectedBrokerIds, loadBrokers, setSelectedBrokerIds } from './brokerStore'
import { sendAll } from './sendQueue'
import { executeBatchSend } from './batchSend'
import type { UserProfile } from './userProfile'

const mockGetSelectedBrokerIds = vi.mocked(getSelectedBrokerIds)
const mockLoadBrokers = vi.mocked(loadBrokers)
const mockSendAll = vi.mocked(sendAll)
const mockSetSelectedBrokerIds = vi.mocked(setSelectedBrokerIds)

const PROFILE: UserProfile = {
  fullName: 'Test User',
  email: 'me@example.com',
  city: 'Townsville',
  state: 'CA',
  partialZip: '900',
}

const BROKERS = [
  { id: 'b1', name: 'Broker One', domain: 'one.example', contactEmail: 'a@one.example', starterOrder: 1 },
  { id: 'b2', name: 'Broker Two', domain: 'two.example', contactEmail: 'b@two.example', starterOrder: 2 },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockLoadBrokers.mockResolvedValue(BROKERS as never)
})

describe('executeBatchSend empty-selection guard', () => {
  it('fails closed when explicit target list is empty and no stored selection exists', async () => {
    mockGetSelectedBrokerIds.mockResolvedValue([])

    const result = await executeBatchSend(PROFILE, [])

    expect(result.sentCount).toBe(0)
    expect(result.failureMessage).toMatch(/no brokers selected/i)
    expect(mockSendAll).not.toHaveBeenCalled()
  })

  it('fails closed when no target list is provided and no stored selection exists', async () => {
    mockGetSelectedBrokerIds.mockResolvedValue([])

    const result = await executeBatchSend(PROFILE)

    expect(result.sentCount).toBe(0)
    expect(result.failureMessage).toMatch(/no brokers selected/i)
    expect(mockSendAll).not.toHaveBeenCalled()
  })

  it('does not fall back to the full broker catalog on empty selection', async () => {
    mockGetSelectedBrokerIds.mockResolvedValue([])

    await executeBatchSend(PROFILE, [])

    expect(mockSendAll).not.toHaveBeenCalledWith(expect.anything(), ['b1', 'b2'])
  })

  it('sends only explicitly passed starter IDs (onboarding behavior preserved)', async () => {
    mockGetSelectedBrokerIds.mockResolvedValue([])
    mockSendAll.mockResolvedValue({ sent: 1 } as never)

    await executeBatchSend(PROFILE, ['b1'])

    expect(mockSendAll).toHaveBeenCalledOnce()
    expect(mockSendAll).toHaveBeenCalledWith(BROKERS, ['b1'])
    expect(mockSetSelectedBrokerIds).toHaveBeenCalled()
  })

  it('falls back to the stored selection when no explicit target is provided', async () => {
    mockGetSelectedBrokerIds.mockResolvedValue(['b2'])
    mockSendAll.mockResolvedValue({ sent: 1 } as never)

    await executeBatchSend(PROFILE)

    expect(mockSendAll).toHaveBeenCalledWith(BROKERS, ['b2'])
  })
})
