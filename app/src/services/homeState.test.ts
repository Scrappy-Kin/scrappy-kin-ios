import { describe, expect, it } from 'vitest'
import { deriveEntryTarget } from './homeState'

const cleanLocalState = {
  gmailConnected: false,
  hasProfile: false,
  onboardingSentCount: 0,
  totalSentCount: 0,
  sentReviewItemCount: 0,
}

describe('deriveEntryTarget', () => {
  it('starts normal fresh installs at onboarding intro', () => {
    const target = deriveEntryTarget(
      {
        ...cleanLocalState,
        subscriptionActive: false,
      },
      null,
      false,
    )

    expect(target).toBe('/onboarding/intro')
  })

  it('advances past intro only after the flow was explicitly started', () => {
    const target = deriveEntryTarget(
      {
        ...cleanLocalState,
        subscriptionActive: false,
      },
      'intro',
      true,
    )

    expect(target).toBe('/onboarding/starter-set')
  })

  it('advances past the starter set only after its action was completed', () => {
    const target = deriveEntryTarget(
      {
        ...cleanLocalState,
        subscriptionActive: false,
      },
      'starter-set',
      true,
    )

    expect(target).toBe('/onboarding/request-review')
  })

  it('lets active subscriptions with no local history land on Home', () => {
    const target = deriveEntryTarget(
      {
        ...cleanLocalState,
        subscriptionActive: true,
      },
      null,
      false,
    )

    expect(target).toBeNull()
  })

  it('continues to resume post-send onboarding beats before Home', () => {
    const target = deriveEntryTarget(
      {
        ...cleanLocalState,
        subscriptionActive: true,
        onboardingSentCount: 5,
        totalSentCount: 5,
        sentReviewItemCount: 5,
      },
      'beat-subscribe',
      true,
    )

    expect(target).toBe('/onboarding/beat-subscribe')
  })
})
