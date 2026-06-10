import { checkmarkCircle, createOutline, informationCircle } from 'ionicons/icons'
import type { ReactNode } from 'react'
import AppIcon from '../primitives/AppIcon'
import AppText from '../primitives/AppText'
import ReviewAssetCard from './ReviewAssetCard'

type RoundReviewSummaryProps = {
  brokerCount: number
  brokerNames: string[]
  brokerTitle?: string
  gmailAction?: ReactNode
  brokersAction?: ReactNode
  templateAction?: ReactNode
  showAppReviewDemoRecipients?: boolean
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

export default function RoundReviewSummary({
  brokerCount,
  brokerNames,
  brokerTitle,
  gmailAction,
  brokersAction,
  templateAction,
  showAppReviewDemoRecipients = false,
}: RoundReviewSummaryProps) {
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
        <AppText intent="body">
          {brokerNames.join(', ')}.
        </AppText>
        {showAppReviewDemoRecipients ? (
          <div className="review-asset-card__app-review-recipients">
            <div className="review-asset-card__app-review-title">
              <AppIcon icon={informationCircle} size="sm" />
              <AppText intent="label" tone="danger">
                APP REVIEW TEST RECIPIENTS
              </AppText>
            </div>
            <AppText intent="body">
              For Apple App Review, these emails are sent to Scrappy Kin test
              inboxes instead of broker inboxes.
            </AppText>
            <AppText intent="body">
              The broker list, email content, Gmail authorization and send flow, and
              sent history work the same as the live app.
            </AppText>
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
