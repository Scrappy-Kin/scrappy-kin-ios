import {
  SUBSCRIPTION_PRICE_DISPLAY,
  SUBSCRIPTION_PRICE_SUBTEXT,
} from '../../config/subscription'
import type { SubscriptionProduct } from '../../services/subscription'
import AppBulletRow from '../primitives/AppBulletRow'
import AppSegmentedCard, { AppSegmentedCardSection } from '../primitives/AppSegmentedCard'
import AppText from '../primitives/AppText'

type SubscriptionOfferCardProps = {
  product?: SubscriptionProduct | null
}

export default function SubscriptionOfferCard({ product }: SubscriptionOfferCardProps) {
  const displayPrice = product?.displayPrice ?? SUBSCRIPTION_PRICE_DISPLAY
  const priceSubtext = product?.priceSubtext ?? SUBSCRIPTION_PRICE_SUBTEXT
  const priceMatch = displayPrice.match(/^(.*?)(\s*\/.*)$/)
  const priceAmount = priceMatch?.[1] ?? displayPrice
  const pricePeriod = priceMatch?.[2] ?? ''

  return (
    <AppSegmentedCard>
      <AppSegmentedCardSection>
        <AppText intent="supporting">{priceSubtext}</AppText>
        <AppText
          intent="body"
          className="subscription-offer-card__price"
          accessibilityLabel={displayPrice}
        >
          <span className="subscription-offer-card__price-amount">{priceAmount}</span>
          {pricePeriod ? (
            <span className="subscription-offer-card__price-period">{pricePeriod}</span>
          ) : null}
        </AppText>
      </AppSegmentedCardSection>
      <AppSegmentedCardSection>
        <div className="app-stack">
          <AppBulletRow
            label="Access to our full broker list"
            subtext="Vetted & maintained. More coming soon."
          />
          <AppBulletRow
            label="Covers unlimited resends"
            subtext="We recommend every 3 months."
          />
          <AppBulletRow
            label="Opt-outs go through your Gmail"
            subtext="We can't see your personal information."
          />
          <AppBulletRow
            label="Apple handles billing"
            subtext="We can't see your card or billing details."
          />
          <AppBulletRow label="Support an indie developer" />
        </div>
      </AppSegmentedCardSection>
    </AppSegmentedCard>
  )
}
