import { isQaDeviceLane } from '../../config/buildInfo'
import type { SubscriptionSnapshot } from '../../services/subscription'
import AppNotice from '../primitives/AppNotice'
import './subscription-diagnostics-notice.css'

type SubscriptionDiagnosticsNoticeProps = {
  snapshot: SubscriptionSnapshot | null
}

function formatList(values: string[] | undefined) {
  if (!values || values.length === 0) return 'none'
  return values.join(', ')
}

export default function SubscriptionDiagnosticsNotice({
  snapshot,
}: SubscriptionDiagnosticsNoticeProps) {
  if (!isQaDeviceLane()) {
    return null
  }

  if (!snapshot?.diagnostics) {
    return (
      <AppNotice variant="warning" title="StoreKit diagnostics unavailable">
        StoreKit diagnostics did not load in this QADevice build.
      </AppNotice>
    )
  }

  const diagnostics = snapshot.diagnostics
  const lines = [
    `Bundle: ${diagnostics.bundleIdentifier ?? 'unknown'}`,
    `Version: ${diagnostics.appVersion ?? 'unknown'} (${diagnostics.appBuild ?? 'unknown'})`,
    `Requested: ${formatList(diagnostics.requestedProductIds)}`,
    `Returned: ${diagnostics.returnedProductCount} (${formatList(diagnostics.returnedProductIds)})`,
    `Display prices: ${formatList(diagnostics.productDisplayPrices)}`,
    `Product load: ${diagnostics.productLoadCompleted ? 'completed' : 'not completed'}`,
    `Entitlements: ${diagnostics.entitlementLookupCompleted ? 'checked' : 'not checked'} (${formatList(diagnostics.activeProductIds)})`,
    `Subscription states: ${formatList(diagnostics.subscriptionStatusStates)}`,
  ]

  if (diagnostics.lastPurchaseStatus) {
    lines.push(`Last purchase: ${diagnostics.lastPurchaseStatus} (${formatList(diagnostics.lastPurchaseActiveProductIds)})`)
  }

  if (diagnostics.lastPurchaseErrorMessage) {
    lines.push(`Purchase error: ${diagnostics.lastPurchaseErrorMessage}`)
  }

  if (diagnostics.productLoadErrorDomain || diagnostics.productLoadErrorMessage) {
    lines.push(
      `Error: ${diagnostics.productLoadErrorDomain ?? 'unknown'} ${diagnostics.productLoadErrorCode ?? ''} ${diagnostics.productLoadErrorMessage ?? ''}`.trim(),
    )
  }

  return (
    <AppNotice variant="warning" title="StoreKit diagnostics">
      <span className="subscription-diagnostics-notice">
        {lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </span>
    </AppNotice>
  )
}
