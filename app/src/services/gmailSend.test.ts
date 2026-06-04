import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./googleAuth', () => ({
  getAccessToken: vi.fn(),
}))

vi.mock('../config/buildInfo', () => ({
  isQaStoreKitLane: vi.fn(() => false),
  isVerboseDevLane: vi.fn(() => false),
}))

import { APP_REVIEW_TEST_RECIPIENT_EMAILS } from '../config/appReviewTestRecipients'
import { getAccessToken } from './googleAuth'
import { sendEmail } from './gmailSend'

const mockGetAccessToken = vi.mocked(getAccessToken)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('sendEmail App Review recipient guard', () => {
  it('blocks non-test recipients before Gmail token lookup in App Review test-recipient mode', async () => {
    await expect(
      sendEmail({
        to: 'privacy@broker.example',
        subject: 'Personal Data Deletion Request',
        body: 'Body',
        appReviewTestRecipients: true,
      }),
    ).rejects.toThrow('App Review test-recipient mode blocked a non-test broker recipient before Gmail send.')

    expect(mockGetAccessToken).not.toHaveBeenCalled()
  })

  it('allows configured App Review test inboxes through to the normal Gmail send path', async () => {
    mockGetAccessToken.mockResolvedValue('token')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'gmail-message-id' }),
      }),
    )

    await expect(
      sendEmail({
        to: APP_REVIEW_TEST_RECIPIENT_EMAILS[0],
        subject: 'Personal Data Deletion Request',
        body: 'Body',
        appReviewTestRecipients: true,
      }),
    ).resolves.toEqual({ id: 'gmail-message-id' })

    expect(mockGetAccessToken).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledOnce()
    vi.unstubAllGlobals()
  })
})
