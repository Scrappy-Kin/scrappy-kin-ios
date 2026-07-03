import { describe, expect, it } from 'vitest'
import { shouldCompleteGmailRepairInPlace } from './taskRoutes'

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
