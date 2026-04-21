import {
  SUBSCRIPTION_PRICE_DISPLAY,
  SUBSCRIPTION_PRICE_SUBTEXT,
} from '../../config/subscription'
import type { BrokerCatalogSummary } from '../../services/brokerStore'
import AppBulletRow from '../primitives/AppBulletRow'
import AppProgress from '../primitives/AppProgress'
import AppSegmentedCard, { AppSegmentedCardSection } from '../primitives/AppSegmentedCard'
import AppText from '../primitives/AppText'

type SubscriptionOfferCardProps = {
  brokerSummary: BrokerCatalogSummary
}

export default function SubscriptionOfferCard({ brokerSummary }: SubscriptionOfferCardProps) {
  const progressLabel = `${brokerSummary.starterCount} of ${brokerSummary.totalBrokerCount} brokers`

  return (
    <AppSegmentedCard>
      <AppSegmentedCardSection>
        <AppText intent="body" emphasis>
          {SUBSCRIPTION_PRICE_DISPLAY}
        </AppText>
        <AppText intent="supporting">{SUBSCRIPTION_PRICE_SUBTEXT}</AppText>
      </AppSegmentedCardSection>
      <AppSegmentedCardSection>
        <div className="app-stack">
          <AppBulletRow
            label="Access to our full broker list"
            subtext="Curated, kept current. More coming soon."
          />
          <AppBulletRow label="Covers re-sends, every few months" />
          <AppBulletRow
            label="Your emails go out from your account"
            subtext="We never see what comes back."
          />
        </div>
      </AppSegmentedCardSection>
      <AppSegmentedCardSection>
        <AppProgress
          current={brokerSummary.starterCount}
          total={brokerSummary.totalBrokerCount}
          label={progressLabel}
          tone="success"
        />
      </AppSegmentedCardSection>
    </AppSegmentedCard>
  )
}
