import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import {
  SUBSCRIPTION_PRICE_SUBTEXT,
  SUBSCRIPTION_PRODUCT_ID,
  isSubscriptionProductConfigured,
} from '../config/subscription'
import { isDevAppLane, isQaDeviceLane } from '../config/buildInfo'
import { logEvent } from './logStore'

type NativeSubscriptionProduct = {
  id: string
  displayName?: string
  description?: string
  displayPrice?: string
}

export type SubscriptionDiagnostics = {
  requestedProductIds: string[]
  returnedProductIds: string[]
  productDisplayPrices?: string[]
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
  manageSubscriptions(): Promise<void>
  addListener(
    eventName: 'entitlementUpdated',
    listenerFunc: (event: NativeEntitlementResponse) => void,
  ): Promise<PluginListenerHandle>
}

export type SubscriptionProduct = {
  id: string
  displayName: string
  description: string
  displayPrice: string | null
  buttonPriceLabel: string | null
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

export type SubscriptionManageResult =
  | {
      status: 'opened'
      snapshot: SubscriptionSnapshot
    }
  | {
      status: 'error'
      snapshot: SubscriptionSnapshot
      message: string
    }

export type SubscriptionNoticeCopy = {
  variant: 'success' | 'error'
  title: string
  body: string
}

export function isSubscriptionPurchaseReady(snapshot: SubscriptionSnapshot | null) {
  return snapshot?.isAvailable === true
}

export function buildSubscriptionButtonLabel(snapshot: SubscriptionSnapshot | null) {
  if (snapshot?.isAvailable !== true) {
    return null
  }

  return snapshot.product.buttonPriceLabel
}

export function buildSubscriptionAccessibilityPriceLabel(label: string | null | undefined) {
  if (!label) {
    return null
  }

  return label.replace(/\s*\/\s*/g, ' per ').replace(/\s+/g, ' ').trim()
}

export function buildSubscriptionButtonAccessibilityLabel(snapshot: SubscriptionSnapshot | null) {
  const priceLabel = buildSubscriptionButtonLabel(snapshot)
  const spokenPriceLabel = buildSubscriptionAccessibilityPriceLabel(priceLabel)

  return spokenPriceLabel ? `Subscribe, ${spokenPriceLabel}` : 'Loading subscription'
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
const MANAGE_SUBSCRIPTION_FAILED_MESSAGE =
  'Apple could not open subscription settings right now. You can also manage subscriptions in your iPhone Settings under your Apple Account.'
const PRICE_LOAD_FAILED_MESSAGE =
  'Apple did not return the subscription price. Check your connection and try again. If this keeps happening, email support@scrappykin.com. You do not need to tell us who you are to get help.'

function buildFallbackProduct(): SubscriptionProduct {
  return {
    id: SUBSCRIPTION_PRODUCT_ID || 'com.scrappykin.subscription.unconfigured',
    displayName: 'Scrappy Kin',
    description: 'Keep sending opt-out emails from your account.',
    displayPrice: null,
    buttonPriceLabel: null,
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
  const displayPrice = nativeDisplayPrice ? buildAnnualPriceDisplay(nativeDisplayPrice) : null
  const buttonPriceLabel = nativeDisplayPrice ? buildAnnualButtonPriceLabel(nativeDisplayPrice) : null

  return {
    active: input.active,
    isAvailable: input.isAvailable && Boolean(displayPrice),
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

function buildSubscriptionLoadError(error: unknown) {
  const message = extractMessage(error, PRICE_LOAD_FAILED_MESSAGE)
  if (message.includes('support@scrappykin.com')) {
    return message
  }
  return `${message} If this keeps happening, email support@scrappykin.com. You do not need to tell us who you are to get help.`
}

function classifySubscriptionFailure(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (message.includes('timed out')) return 'timeout'
  if (message.includes('cancel')) return 'cancelled'
  if (error instanceof TypeError) return 'network'
  return 'unknown'
}

function getStoreKitStatusCategory(snapshot: SubscriptionSnapshot) {
  if (snapshot.active) return 'active'
  if (snapshot.isAvailable) return 'available'
  if (!snapshot.isConfigured) return 'not_configured'
  return 'unavailable'
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

    const snapshot = normalizeSnapshot({
      active,
      product,
      isAvailable: Boolean(product),
      loadError: product ? null : PRICE_LOAD_FAILED_MESSAGE,
      diagnostics,
    })
    if (product) {
      await logEvent('subscription_product_loaded', {
        metadata: { storekitStatusCategory: getStoreKitStatusCategory(snapshot) },
      })
    } else {
      await logEvent('subscription_product_failed', {
        metadata: {
          storekitStatusCategory: getStoreKitStatusCategory(snapshot),
          failureCategory: 'not_returned',
        },
      })
    }
    return snapshot
  } catch (error) {
    const snapshot = normalizeSnapshot({
      active: false,
      isAvailable: false,
      loadError: buildSubscriptionLoadError(error),
      diagnostics: await readSubscriptionDiagnostics(),
    })
    await logEvent('subscription_product_failed', {
      metadata: {
        storekitStatusCategory: getStoreKitStatusCategory(snapshot),
        failureCategory: classifySubscriptionFailure(error),
      },
    })
    return snapshot
  }
}

export async function getSubscriptionSnapshot() {
  if (await shouldUseDevMock()) {
    return getDevSnapshot()
  }

  return readNativeSnapshot()
}

export async function purchaseSubscription(): Promise<SubscriptionPurchaseResult> {
  await logEvent('subscription_purchase_started')
  if (await shouldUseDevMock()) {
    await Preferences.set({ key: DEV_SUBSCRIPTION_ACTIVE_KEY, value: 'true' })
    const snapshot = await getDevSnapshot()
    await logEvent('subscription_purchase_success', {
      metadata: { storekitStatusCategory: getStoreKitStatusCategory(snapshot) },
    })
    return {
      status: 'purchased',
      snapshot,
    }
  }

  const snapshot = await getSubscriptionSnapshot()
  if (!snapshot.isAvailable) {
    await logEvent('subscription_purchase_failed', {
      metadata: {
        storekitStatusCategory: getStoreKitStatusCategory(snapshot),
        failureCategory: 'unavailable',
      },
    })
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
      await logEvent('subscription_purchase_cancelled', {
        metadata: { storekitStatusCategory: getStoreKitStatusCategory(purchaseSnapshot) },
      })
      return {
        status: 'cancelled',
        snapshot: purchaseSnapshot,
        message: PURCHASE_CANCELLED_MESSAGE,
      }
    }

    if (result.status === 'pending') {
      await logEvent('subscription_purchase_failed', {
        metadata: {
          storekitStatusCategory: getStoreKitStatusCategory(purchaseSnapshot),
          failureCategory: 'pending',
        },
      })
      return {
        status: 'error',
        snapshot: purchaseSnapshot,
        message: 'Purchase is pending approval.',
      }
    }

    if (!nextSnapshot.active) {
      await logEvent('subscription_purchase_failed', {
        metadata: {
          storekitStatusCategory: getStoreKitStatusCategory(purchaseSnapshot),
          failureCategory: 'not_active',
        },
      })
      return {
        status: 'error',
        snapshot: purchaseSnapshot,
        message: 'Purchase finished, but subscription access is not active yet.',
      }
    }

    await logEvent('subscription_purchase_success', {
      metadata: { storekitStatusCategory: getStoreKitStatusCategory(purchaseSnapshot) },
    })
    return {
      status: 'purchased',
      snapshot: purchaseSnapshot,
    }
  } catch (error) {
    const snapshot = await getSubscriptionSnapshot()
    const message = extractMessage(error, 'Purchase did not complete.')
    await logEvent('subscription_purchase_failed', {
      metadata: {
        storekitStatusCategory: getStoreKitStatusCategory(snapshot),
        failureCategory: classifySubscriptionFailure(error),
      },
    })
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
  await logEvent('subscription_restore_started')
  if (await shouldUseDevMock()) {
    const snapshot = await getDevSnapshot()
    if (snapshot.active) {
      await logEvent('subscription_restore_success', {
        metadata: { storekitStatusCategory: getStoreKitStatusCategory(snapshot) },
      })
      return {
        status: 'restored',
        snapshot,
        message: 'Subscription restored.',
      }
    }

    await logEvent('subscription_restore_none', {
      metadata: { storekitStatusCategory: getStoreKitStatusCategory(snapshot) },
    })
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
      await logEvent('subscription_restore_success', {
        metadata: { storekitStatusCategory: getStoreKitStatusCategory(snapshot) },
      })
      return {
        status: 'restored',
        snapshot,
        message: 'Subscription restored.',
      }
    }

    await logEvent('subscription_restore_none', {
      metadata: { storekitStatusCategory: getStoreKitStatusCategory(snapshot) },
    })
    return {
      status: 'error',
      reason: 'none_found',
      snapshot,
      message: RESTORE_NONE_FOUND_MESSAGE,
    }
  } catch {
    const snapshot = await getSubscriptionSnapshot()
    await logEvent('subscription_restore_failed', {
      metadata: {
        storekitStatusCategory: getStoreKitStatusCategory(snapshot),
        failureCategory: 'check_failed',
      },
    })
    return {
      status: 'error',
      reason: 'check_failed',
      snapshot,
      message: RESTORE_CHECK_FAILED_MESSAGE,
    }
  }
}

export async function manageSubscriptionSettings(): Promise<SubscriptionManageResult> {
  if (await shouldUseDevMock()) {
    return {
      status: 'opened',
      snapshot: await getDevSnapshot(),
    }
  }

  try {
    await SubscriptionNative.manageSubscriptions()
    return {
      status: 'opened',
      snapshot: await getSubscriptionSnapshot(),
    }
  } catch (error) {
    return {
      status: 'error',
      snapshot: await getSubscriptionSnapshot(),
      message: extractMessage(error, MANAGE_SUBSCRIPTION_FAILED_MESSAGE),
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
