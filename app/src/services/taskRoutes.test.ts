import { describe, expect, it } from 'vitest'
import { readBackTo, readReturnTo } from './navigation'
import {
  deriveNextBatchTaskTarget,
  deriveReviewBatchTaskRedirect,
  shouldCompleteGmailRepairInPlace,
} from './taskRoutes'

describe('shouldCompleteGmailRepairInPlace', () => {
  it('keeps Settings-origin Gmail repairs on the Gmail connection page', () => {
    expect(shouldCompleteGmailRepairInPlace('/settings?returnTo=%2Fhome')).toBe(true)
    expect(
      shouldCompleteGmailRepairInPlace(
        '/settings?returnTo=%2Fhome',
        '/settings?returnTo=%2Fhome',
      ),
    ).toBe(true)
  })

  it('lets task and onboarding flows continue to their success route', () => {
    expect(shouldCompleteGmailRepairInPlace('/home', '/review-batch?returnTo=%2Fhome')).toBe(
      false,
    )
    expect(
      shouldCompleteGmailRepairInPlace(
        '/review-batch?returnTo=%2Fhome',
        '/review-batch?returnTo=%2Fhome',
      ),
    ).toBe(false)
    expect(shouldCompleteGmailRepairInPlace('/onboarding/gmail-send', '/onboarding/review')).toBe(
      false,
    )
  })
})

describe('next batch task route', () => {
  it('sends fresh dashboard setup from profile to Gmail, with back/cancel to Home', () => {
    const href = deriveNextBatchTaskTarget({
      gmailConnected: false,
      hasProfile: false,
    }, '/home')
    const search = new URL(`https://example.test${href}`).search

    expect(href).toContain('/settings?')
    expect(href).toContain('view=profile')
    expect(readReturnTo(search)).toBe(
      '/gmail?returnTo=%2Fhome&successTo=%2Freview-batch%3FreturnTo%3D%252Fhome',
    )
    expect(readBackTo(search)).toBe('/home')
  })

  it('continues from profile directly to review when Gmail is already connected', () => {
    const href = deriveNextBatchTaskTarget({
      gmailConnected: true,
      hasProfile: false,
    }, '/home')
    const search = new URL(`https://example.test${href}`).search

    expect(readReturnTo(search)).toBe('/review-batch?returnTo=%2Fhome')
    expect(readBackTo(search)).toBe('/home')
  })
})

describe('review batch task route', () => {
  it('returns unpaid users to the subscription-gated dashboard', () => {
    expect(
      deriveReviewBatchTaskRedirect(
        {
          gmailConnected: true,
          hasProfile: true,
          subscriptionActive: false,
        },
        '/review-batch?returnTo=%2Fhome',
        '/home',
      ),
    ).toBe('/home')
  })

  it('keeps an entitled, fully configured round on the review screen', () => {
    expect(
      deriveReviewBatchTaskRedirect(
        {
          gmailConnected: true,
          hasProfile: true,
          subscriptionActive: true,
        },
        '/review-batch?returnTo=%2Fhome',
        '/home',
      ),
    ).toBeNull()
  })
})
