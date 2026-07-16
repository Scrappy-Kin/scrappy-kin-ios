import { describe, expect, it } from 'vitest'
import type { SubscriptionSnapshot } from './subscription'
import { buildSubscriptionAccessCopy } from './subscriptionDisplay'

function buildSnapshot(
  input: Pick<SubscriptionSnapshot, 'active' | 'access'>,
): SubscriptionSnapshot {
  return {
    ...input,
    product: {
      id: 'subscription.test',
      displayName: 'Test subscription',
      description: 'Test description',
      displayPrice: '$4.99 / year',
      buttonPriceLabel: '$4.99/year',
      priceSubtext: 'per year',
    },
    isAvailable: true,
    isConfigured: true,
    loadError: null,
    diagnostics: null,
  }
}

describe('subscription access copy', () => {
  it('distinguishes active access with renewal off from inactive access', () => {
    const snapshot = buildSnapshot({
      active: true,
      access: {
        state: 'subscribed',
        expiresAt: '2026-07-16T19:42:00Z',
        willAutoRenew: false,
      },
    })

    expect(buildSubscriptionAccessCopy(snapshot, 'en-US')).toEqual({
      statusLabel: 'Active',
      description: 'Access active until July 16, 2026. Renewal is off.',
    })
  })

  it('shows the renewal date when Apple reports auto-renew on', () => {
    const snapshot = buildSnapshot({
      active: true,
      access: {
        state: 'subscribed',
        expiresAt: '2027-07-16T19:42:00Z',
        willAutoRenew: true,
      },
    })

    expect(buildSubscriptionAccessCopy(snapshot, 'en-US').description).toBe(
      'Access active. Renews on July 16, 2027.',
    )
  })

  it('shows an ended date for expired access', () => {
    const snapshot = buildSnapshot({
      active: false,
      access: {
        state: 'expired',
        expiresAt: '2026-07-16T19:42:00Z',
        willAutoRenew: false,
      },
    })

    expect(buildSubscriptionAccessCopy(snapshot, 'en-US')).toEqual({
      statusLabel: 'Inactive',
      description: 'Access inactive. Ended July 16, 2026.',
    })
  })
})
