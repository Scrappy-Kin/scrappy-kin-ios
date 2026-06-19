import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import {
  SUBSCRIPTION_PRICE_BUTTON_LABEL,
  SUBSCRIPTION_PRICE_DISPLAY,
  SUBSCRIPTION_PRICE_SUBTEXT,
  SUBSCRIPTION_PRODUCT_ID,
  isSubscriptionProductConfigured,
} from '../config/subscription'
import { isDevAppLane, isQaDeviceLane } from '../config/buildInfo'

type NativeSubscriptionProduct = {
  id: string
  displayName?: string
  description?: string
  displayPrice?: string
}

export type SubscriptionDiagnostics = {
  requestedProductIds: string[]
  returnedProductIds: string[]
  activeProductIds: string[]
  subscriptionStatusStates?: string[]
  lastPurchaseStatus?: 'purchased' | 'cancelled' | 'pending' | 'error'
  lastPurchaseActiveProductIds?: string[]
  lastPurchaseErrorMessage?: string
  bundleIdentifier?: string
  appVersion?: string
  appBuild?: string
  productLoadCompleted: boolean
  returnedProductCount: number
  entitlementLookupCompleted: boolean
  productLoadErrorDomain?: string
  productLoadErrorCode?: number
  productLoadErrorMessage?: string
}

type NativeEntitlementResponse = {
  activeProductIds: string[]
}

type NativePurchaseResponse = {
  status: 'purchased' | 'cancelled' | 'pending'
  activeProductIds: string[]
}

type SubscriptionPlugin = {
  getProducts(options: { productIds: string[] }): Promise<{
    products: NativeSubscriptionProduct[]
    diagnostics?: SubscriptionDiagnostics
  }>
  diagnoseProducts(options: { productIds: string[] }): Promise<{ diagnostics: SubscriptionDiagnostics }>
  getEntitlement(options: { productIds: string[] }): Promise<NativeEntitlementResponse>
  purchase(options: { productId: string }): Promise<NativePurchaseResponse>
  restorePurchases(options: { productIds: string[] }): Promise<NativeEntitlementResponse>
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
  diagnostics: SubscriptionDiagnostics | null
}

export type SubscriptionPurchaseResult =
  | {
      status: 'purchased'
      snapshot: SubscriptionSnapshot
    }
  | {
      status: 'cancelled'
      snapshot: SubscriptionSnapshot
      message: string
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
      reason: 'none_found' | 'check_failed'
      snapshot: SubscriptionSnapshot
      message: string
    }

export type SubscriptionNoticeCopy = {
  variant: 'success' | 'error'
  title: string
  body: string
}

const DEV_SUBSCRIPTION_ACTIVE_KEY = 'dev_subscription_active'
const NATIVE_SUBSCRIPTION_TIMEOUT_MS = 4000
const SubscriptionNative = registerPlugin<SubscriptionPlugin>('Subscription')
const PURCHASE_CANCELLED_MESSAGE =
  'Purchase did not finish. You were not charged. Try again, or email support@scrappykin.com if you need a hand. You do not need to tell us who you are to get support.'
const RESTORE_NONE_FOUND_MESSAGE =
  'Apple did not show an active Scrappy Kin subscription for this Apple Account. Check your iPhone subscription settings, or email support@scrappykin.com if you need help.'
const RESTORE_CHECK_FAILED_MESSAGE =
  'Apple could not check purchases right now. Try again in a minute. If your subscription looks active in your iPhone subscription settings, email support@scrappykin.com and we’ll help.'

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

function includesAnnualPeriod(label: string) {
  return /\b(year|annual|annually)\b/i.test(label)
}

function buildAnnualPriceDisplay(displayPrice: string) {
  return includesAnnualPeriod(displayPrice) ? displayPrice : `${displayPrice} / year`
}

function buildAnnualButtonPriceLabel(displayPrice: string) {
  return includesAnnualPeriod(displayPrice) ? displayPrice : `${displayPrice}/year`
}

function normalizeSnapshot(input: {
  active: boolean
  product?: NativeSubscriptionProduct | null
  isAvailable: boolean
  loadError: string | null
  diagnostics?: SubscriptionDiagnostics | null
}): SubscriptionSnapshot {
  const fallbackProduct = buildFallbackProduct()
  const nativeProduct = input.product
  const nativeDisplayPrice = nativeProduct?.displayPrice?.trim()
  const displayPrice = nativeDisplayPrice
    ? buildAnnualPriceDisplay(nativeDisplayPrice)
    : fallbackProduct.displayPrice
  const buttonPriceLabel = nativeDisplayPrice
    ? buildAnnualButtonPriceLabel(nativeDisplayPrice)
    : fallbackProduct.buttonPriceLabel

  return {
    active: input.active,
    isAvailable: input.isAvailable,
    isConfigured: isSubscriptionProductConfigured(),
    loadError: input.loadError,
    diagnostics: input.diagnostics ?? null,
    product: {
      id: nativeProduct?.id ?? fallbackProduct.id,
      displayName: nativeProduct?.displayName?.trim() || fallbackProduct.displayName,
      description: nativeProduct?.description?.trim() || fallbackProduct.description,
      displayPrice,
      buttonPriceLabel,
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

function withNativeSubscriptionTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('Subscription status timed out.'))
    }, NATIVE_SUBSCRIPTION_TIMEOUT_MS)

    promise
      .then(resolve, reject)
      .finally(() => window.clearTimeout(timeout))
  })
}

async function readSubscriptionDiagnostics(): Promise<SubscriptionDiagnostics | null> {
  if (!isQaDeviceLane() || !Capacitor.isNativePlatform() || !isSubscriptionProductConfigured()) {
    return null
  }

  try {
    const response = await withNativeSubscriptionTimeout(
      SubscriptionNative.diagnoseProducts({
        productIds: [SUBSCRIPTION_PRODUCT_ID],
      }),
    )
    return response.diagnostics
  } catch {
    return null
  }
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
      withNativeSubscriptionTimeout(
        SubscriptionNative.getProducts({ productIds: [SUBSCRIPTION_PRODUCT_ID] }),
      ),
      withNativeSubscriptionTimeout(
        SubscriptionNative.getEntitlement({ productIds: [SUBSCRIPTION_PRODUCT_ID] }),
      ),
    ])

    const product = productResponse.products[0] ?? null
    const active = entitlementResponse.activeProductIds.includes(SUBSCRIPTION_PRODUCT_ID)
    const productDiagnostics = product
      ? productResponse.diagnostics ?? null
      : (await readSubscriptionDiagnostics()) ?? productResponse.diagnostics ?? null
    const diagnostics = productDiagnostics
      ? {
          ...productDiagnostics,
          entitlementLookupCompleted: true,
          activeProductIds: entitlementResponse.activeProductIds,
        }
      : null

    return normalizeSnapshot({
      active,
      product,
      isAvailable: Boolean(product),
      loadError: product ? null : 'Subscription product couldn’t be loaded.',
      diagnostics,
    })
  } catch (error) {
    return normalizeSnapshot({
      active: false,
      isAvailable: false,
      loadError: extractMessage(error, 'Subscription status could not be loaded.'),
      diagnostics: await readSubscriptionDiagnostics(),
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
    const diagnostics = nextSnapshot.diagnostics
      ? {
          ...nextSnapshot.diagnostics,
          lastPurchaseStatus: result.status,
          lastPurchaseActiveProductIds: result.activeProductIds,
        }
      : null
    const purchaseSnapshot = {
      ...nextSnapshot,
      diagnostics,
    }

    if (result.status === 'cancelled') {
      return {
        status: 'cancelled',
        snapshot: purchaseSnapshot,
        message: PURCHASE_CANCELLED_MESSAGE,
      }
    }

    if (result.status === 'pending') {
      return {
        status: 'error',
        snapshot: purchaseSnapshot,
        message: 'Purchase is pending approval.',
      }
    }

    if (!nextSnapshot.active) {
      return {
        status: 'error',
        snapshot: purchaseSnapshot,
        message: 'Purchase finished, but subscription access is not active yet.',
      }
    }

    return {
      status: 'purchased',
      snapshot: purchaseSnapshot,
    }
  } catch (error) {
    const snapshot = await getSubscriptionSnapshot()
    const message = extractMessage(error, 'Purchase did not complete.')
    return {
      status: 'error',
      snapshot: {
        ...snapshot,
        diagnostics: snapshot.diagnostics
          ? {
              ...snapshot.diagnostics,
              lastPurchaseStatus: 'error',
              lastPurchaseErrorMessage: message,
            }
          : null,
      },
      message,
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
      reason: 'none_found',
      snapshot,
      message: RESTORE_NONE_FOUND_MESSAGE,
    }
  }

  try {
    await SubscriptionNative.restorePurchases({ productIds: [SUBSCRIPTION_PRODUCT_ID] })
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
      reason: 'none_found',
      snapshot,
      message: RESTORE_NONE_FOUND_MESSAGE,
    }
  } catch {
    return {
      status: 'error',
      reason: 'check_failed',
      snapshot: await getSubscriptionSnapshot(),
      message: RESTORE_CHECK_FAILED_MESSAGE,
    }
  }
}

export function buildRestoreSubscriptionNotice(result: SubscriptionRestoreResult): SubscriptionNoticeCopy {
  if (result.status === 'restored') {
    return {
      variant: 'success',
      title: 'Purchases restored',
      body: result.message,
    }
  }

  return {
    variant: 'error',
    title:
      result.reason === 'none_found'
        ? 'No active subscription found'
        : 'Purchases could not be checked',
    body: result.message,
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
