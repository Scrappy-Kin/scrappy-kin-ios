import { SUBSCRIPTION_PRICE_SUBTEXT } from '../../config/subscription'
import {
  buildSubscriptionAccessibilityPriceLabel,
  type SubscriptionProduct,
} from '../../services/subscription'
import AppBulletRow from '../primitives/AppBulletRow'
import AppSegmentedCard, { AppSegmentedCardSection } from '../primitives/AppSegmentedCard'
import AppText from '../primitives/AppText'

type SubscriptionOfferCardProps = {
  product?: SubscriptionProduct | null
  loading?: boolean
}

export default function SubscriptionOfferCard({ product, loading = false }: SubscriptionOfferCardProps) {
  const displayPrice = product?.displayPrice ?? null
  const priceSubtext = product?.priceSubtext ?? SUBSCRIPTION_PRICE_SUBTEXT
  const priceMatch = displayPrice?.match(/^(.*?)(\s*\/.*)$/)
  const priceAmount = priceMatch?.[1] ?? displayPrice
  const pricePeriod = priceMatch?.[2] ?? ''
  const priceStatus = loading ? 'Loading price from App Store...' : 'Price unavailable'
  const spokenPrice = buildSubscriptionAccessibilityPriceLabel(displayPrice)

  return (
    <AppSegmentedCard>
      <AppSegmentedCardSection>
        <AppText intent="supporting">{priceSubtext}</AppText>
        {displayPrice ? (
          <AppText
            intent="body"
            className="subscription-offer-card__price"
            accessibilityLabel={spokenPrice ?? undefined}
          >
            <span className="subscription-offer-card__price-amount" aria-hidden="true">{priceAmount}</span>
            {pricePeriod ? (
              <span className="subscription-offer-card__price-period" aria-hidden="true">{pricePeriod}</span>
            ) : null}
          </AppText>
        ) : (
          <AppText intent="body" emphasis>
            {priceStatus}
          </AppText>
        )}
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
