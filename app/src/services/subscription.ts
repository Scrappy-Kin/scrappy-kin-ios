import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import {
  SUBSCRIPTION_PRICE_BUTTON_LABEL,
  SUBSCRIPTION_PRICE_DISPLAY,
  SUBSCRIPTION_PRICE_SUBTEXT,
  SUBSCRIPTION_PRODUCT_ID,
  isSubscriptionProductConfigured,
} from '../config/subscription'
import { isDevAppLane } from '../config/buildInfo'

type NativeSubscriptionProduct = {
  id: string
  displayName?: string
  description?: string
  displayPrice?: string
}

type NativeEntitlementResponse = {
  activeProductIds: string[]
}

type NativePurchaseResponse = {
  status: 'purchased' | 'cancelled' | 'pending'
  activeProductIds: string[]
}

type SubscriptionPlugin = {
  getProducts(options: { productIds: string[] }): Promise<{ products: NativeSubscriptionProduct[] }>
  getEntitlement(options: { productIds: string[] }): Promise<NativeEntitlementResponse>
  purchase(options: { productId: string }): Promise<NativePurchaseResponse>
  restorePurchases(): Promise<NativeEntitlementResponse>
  addListener(
    eventName: 'entitlementUpdated',
    listenerFunc: (event: NativeEntitlementResponse) => void,
  ): Promise<PluginListenerHandle>
}

export type SubscriptionProduct = {
  id: string
  displayName: string
  description: string
  displayPrice: string
  buttonPriceLabel: string
  priceSubtext: string
}

export type SubscriptionSnapshot = {
  product: SubscriptionProduct
  active: boolean
  isAvailable: boolean
  isConfigured: boolean
  loadError: string | null
}

export type SubscriptionPurchaseResult =
  | {
      status: 'purchased'
      snapshot: SubscriptionSnapshot
    }
  | {
      status: 'cancelled'
      snapshot: SubscriptionSnapshot
    }
  | {
      status: 'error'
      snapshot: SubscriptionSnapshot
      message: string
    }

export type SubscriptionRestoreResult =
  | {
      status: 'restored'
      snapshot: SubscriptionSnapshot
      message: string
    }
  | {
      status: 'error'
      snapshot: SubscriptionSnapshot
      message: string
    }

const DEV_SUBSCRIPTION_ACTIVE_KEY = 'dev_subscription_active'
const SubscriptionNative = registerPlugin<SubscriptionPlugin>('Subscription')

function buildFallbackProduct(): SubscriptionProduct {
  return {
    id: SUBSCRIPTION_PRODUCT_ID || 'com.scrappykin.subscription.unconfigured',
    displayName: 'Scrappy Kin',
    description: 'Keep sending opt-out emails from your account.',
    displayPrice: SUBSCRIPTION_PRICE_DISPLAY,
    buttonPriceLabel: SUBSCRIPTION_PRICE_BUTTON_LABEL,
    priceSubtext: SUBSCRIPTION_PRICE_SUBTEXT,
  }
}

function normalizeSnapshot(input: {
  active: boolean
  product?: NativeSubscriptionProduct | null
  isAvailable: boolean
  loadError: string | null
}): SubscriptionSnapshot {
  const fallbackProduct = buildFallbackProduct()
  const nativeProduct = input.product

  return {
    active: input.active,
    isAvailable: input.isAvailable,
    isConfigured: isSubscriptionProductConfigured(),
    loadError: input.loadError,
    product: {
      id: nativeProduct?.id ?? fallbackProduct.id,
      displayName: nativeProduct?.displayName?.trim() || fallbackProduct.displayName,
      description: nativeProduct?.description?.trim() || fallbackProduct.description,
      displayPrice: nativeProduct?.displayPrice?.trim() || fallbackProduct.displayPrice,
      buttonPriceLabel: fallbackProduct.buttonPriceLabel,
      priceSubtext: fallbackProduct.priceSubtext,
    },
  }
}

async function shouldUseDevMock() {
  const devLane = await isDevAppLane()
  if (!devLane) {
    return false
  }

  if (!Capacitor.isNativePlatform()) {
    return true
  }

  return !isSubscriptionProductConfigured()
}

async function readDevSubscriptionActive() {
  const stored = await Preferences.get({ key: DEV_SUBSCRIPTION_ACTIVE_KEY })
  return stored.value === 'true'
}

async function getDevSnapshot() {
  return normalizeSnapshot({
    active: await readDevSubscriptionActive(),
    isAvailable: true,
    loadError: null,
  })
}

function extractMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}

async function readNativeSnapshot(): Promise<SubscriptionSnapshot> {
  if (!Capacitor.isNativePlatform()) {
    return normalizeSnapshot({
      active: false,
      isAvailable: false,
      loadError: 'Subscriptions are available in the iOS app only.',
    })
  }

  if (!isSubscriptionProductConfigured()) {
    return normalizeSnapshot({
      active: false,
      isAvailable: false,
      loadError: 'Subscription product isn’t configured yet.',
    })
  }

  try {
    const [productResponse, entitlementResponse] = await Promise.all([
      SubscriptionNative.getProducts({ productIds: [SUBSCRIPTION_PRODUCT_ID] }),
      SubscriptionNative.getEntitlement({ productIds: [SUBSCRIPTION_PRODUCT_ID] }),
    ])

    const product = productResponse.products[0] ?? null
    const active = entitlementResponse.activeProductIds.includes(SUBSCRIPTION_PRODUCT_ID)

    return normalizeSnapshot({
      active,
      product,
      isAvailable: Boolean(product),
      loadError: product ? null : 'Subscription product couldn’t be loaded.',
    })
  } catch (error) {
    return normalizeSnapshot({
      active: false,
      isAvailable: false,
      loadError: extractMessage(error, 'Subscription status could not be loaded.'),
    })
  }
}

export async function getSubscriptionSnapshot() {
  if (await shouldUseDevMock()) {
    return getDevSnapshot()
  }

  return readNativeSnapshot()
}

export async function purchaseSubscription(): Promise<SubscriptionPurchaseResult> {
  if (await shouldUseDevMock()) {
    await Preferences.set({ key: DEV_SUBSCRIPTION_ACTIVE_KEY, value: 'true' })
    return {
      status: 'purchased',
      snapshot: await getDevSnapshot(),
    }
  }

  const snapshot = await getSubscriptionSnapshot()
  if (!snapshot.isAvailable) {
    return {
      status: 'error',
      snapshot,
      message: snapshot.loadError ?? 'Subscription is unavailable right now.',
    }
  }

  try {
    const result = await SubscriptionNative.purchase({ productId: snapshot.product.id })
    const nextSnapshot = await getSubscriptionSnapshot()

    if (result.status === 'cancelled') {
      return { status: 'cancelled', snapshot: nextSnapshot }
    }

    if (result.status === 'pending') {
      return {
        status: 'error',
        snapshot: nextSnapshot,
        message: 'Purchase is pending approval.',
      }
    }

    return {
      status: 'purchased',
      snapshot: nextSnapshot,
    }
  } catch (error) {
    return {
      status: 'error',
      snapshot: await getSubscriptionSnapshot(),
      message: extractMessage(error, 'Purchase did not complete.'),
    }
  }
}

export async function restoreSubscriptionPurchases(): Promise<SubscriptionRestoreResult> {
  if (await shouldUseDevMock()) {
    const snapshot = await getDevSnapshot()
    if (snapshot.active) {
      return {
        status: 'restored',
        snapshot,
        message: 'Subscription restored.',
      }
    }

    return {
      status: 'error',
      snapshot,
      message: 'No active subscription was found to restore.',
    }
  }

  try {
    await SubscriptionNative.restorePurchases()
    const snapshot = await getSubscriptionSnapshot()

    if (snapshot.active) {
      return {
        status: 'restored',
        snapshot,
        message: 'Subscription restored.',
      }
    }

    return {
      status: 'error',
      snapshot,
      message: 'No active subscription was found to restore.',
    }
  } catch (error) {
    return {
      status: 'error',
      snapshot: await getSubscriptionSnapshot(),
      message: extractMessage(error, 'Restore Purchases did not complete.'),
    }
  }
}

export async function setDevSubscriptionEntitled(active: boolean) {
  await Preferences.set({ key: DEV_SUBSCRIPTION_ACTIVE_KEY, value: active ? 'true' : 'false' })
}

export async function clearDevSubscriptionState() {
  await Preferences.remove({ key: DEV_SUBSCRIPTION_ACTIVE_KEY })
}

export async function addSubscriptionUpdateListener(
  callback: (snapshot: SubscriptionSnapshot) => void,
) {
  if (await shouldUseDevMock()) {
    return () => undefined
  }

  const listener = await SubscriptionNative.addListener('entitlementUpdated', () => {
    void getSubscriptionSnapshot().then(callback)
  })

  return () => {
    void listener.remove()
  }
}
