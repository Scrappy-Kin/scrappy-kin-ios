import { checkmarkCircle, createOutline, informationCircle } from 'ionicons/icons'
import type { ReactNode } from 'react'
import AppIcon from '../primitives/AppIcon'
import AppLabelRow from '../primitives/AppLabelRow'
import AppText from '../primitives/AppText'
import ReviewAssetCard from './ReviewAssetCard'
import { SEND_SAFETY_NOTICES, type SendSafetyMode } from '../../services/sendSafety'

type RoundReviewSummaryProps = {
  brokerCount: number
  brokerNames: string[]
  brokerTitle?: string
  gmailAction?: ReactNode
  brokersAction?: ReactNode
  templateAction?: ReactNode
  sendSafetyMode?: SendSafetyMode
}

export function ReviewEditIconButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="review-asset-card__icon-action"
      aria-label={label}
      onClick={onClick}
    >
      <AppIcon icon={createOutline} size="sm" />
    </button>
  )
}

function buildBrokerListAccessibilityLabel(brokerCount: number, brokerNames: string[]) {
  if (brokerNames.length <= 8) return brokerNames.join(', ')

  const previewNames = brokerNames.slice(0, 5).join(', ')
  const remainingCount = Math.max(0, brokerCount - 5)
  return `${brokerCount} brokers selected. Includes ${previewNames}${remainingCount > 0 ? `, and ${remainingCount} more` : ''}.`
}

export default function RoundReviewSummary({
  brokerCount,
  brokerNames,
  brokerTitle,
  gmailAction,
  brokersAction,
  templateAction,
  sendSafetyMode = 'live',
}: RoundReviewSummaryProps) {
  const sendSafetyNotice = SEND_SAFETY_NOTICES[sendSafetyMode]
  const brokerListText = brokerNames.join(', ')
  const brokerListAccessibilityLabel = buildBrokerListAccessibilityLabel(brokerCount, brokerNames)

  return (
    <>
      <ReviewAssetCard
        title="Gmail connected"
        icon={checkmarkCircle}
        action={gmailAction}
      >
        <AppText intent="body">
          Opt-out requests are sent from your Gmail. Scrappy Kin cannot read your inbox.
        </AppText>
      </ReviewAssetCard>
      <ReviewAssetCard
        title={brokerTitle ?? `${brokerCount} brokers selected`}
        icon={checkmarkCircle}
        action={brokersAction}
      >
        <AppText intent="body" accessibilityLabel={brokerListAccessibilityLabel}>
          {brokerListText}
        </AppText>
        {sendSafetyNotice ? (
          <div className="review-asset-card__send-safety-notice">
            <AppLabelRow
              className="review-asset-card__send-safety-title"
              icon={informationCircle}
              tone="danger"
            >
              {sendSafetyNotice.title}
            </AppLabelRow>
            {sendSafetyNotice.body.map((line) => (
              <AppText key={line} intent="body">
                {line}
              </AppText>
            ))}
          </div>
        ) : null}
      </ReviewAssetCard>
      <ReviewAssetCard
        title="Email template setup"
        icon={checkmarkCircle}
        action={templateAction}
      >
        <AppText intent="body">
          Everything is ready to go. Make a last edit if you want, or send this round as is.
        </AppText>
      </ReviewAssetCard>
    </>
  )
}
