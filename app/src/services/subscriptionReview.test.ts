import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./reviewPrompt', () => ({ discardReviewOpportunity: vi.fn() }))
vi.mock('./logStore', () => ({ logEvent: vi.fn() }))
vi.mock('../config/buildInfo', () => ({ isDevAppLane: async () => true, isQaDeviceLane: () => false }))
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false }, registerPlugin: () => ({}) }))
vi.mock('@capacitor/preferences', () => ({
  Preferences: { get: vi.fn(async () => ({ value: null })), set: vi.fn() },
}))

import { discardReviewOpportunity } from './reviewPrompt'
import { logEvent } from './logStore'
import { getSubscriptionSnapshot, isSubscriptionPurchaseReady, manageSubscriptionSettings, purchaseSubscription, restoreSubscriptionPurchases } from './subscription'

beforeEach(() => vi.clearAllMocks())

describe('subscription actions suppress the pending review', () => {
  it('provides a purchasable browser fixture without requiring StoreKit pricing', async () => {
    const snapshot = await getSubscriptionSnapshot()
    expect(isSubscriptionPurchaseReady(snapshot)).toBe(true)
    expect(snapshot.product.buttonPriceLabel).toBe('$4.99/year')
  })

  it.each([
    ['purchase', purchaseSubscription],
    ['restore', restoreSubscriptionPurchases],
    ['manage', manageSubscriptionSettings],
  ] as const)('%s suppresses before awaiting any result', async (_name, action) => {
    const result = action()
    expect(discardReviewOpportunity).toHaveBeenCalledOnce()
    await result
  })

  it('does not preserve the opportunity when a purchase attempt fails early', async () => {
    vi.mocked(logEvent).mockRejectedValueOnce(new Error('interrupted'))
    await expect(purchaseSubscription()).rejects.toThrow('interrupted')
    expect(discardReviewOpportunity).toHaveBeenCalledOnce()
  })
})
