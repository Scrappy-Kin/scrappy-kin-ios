const configuredProductId = import.meta.env.VITE_APPLE_SUBSCRIPTION_PRODUCT_ID?.trim() ?? ''

export const SUBSCRIPTION_PRODUCT_ID = configuredProductId
export const SUBSCRIPTION_PRICE_SUBTEXT = 'Early bird price'

export function isSubscriptionProductConfigured() {
  return SUBSCRIPTION_PRODUCT_ID.length > 0
}
