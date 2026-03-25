import { IonIcon } from '@ionic/react'
import type { ReactNode } from 'react'
import AppText from '../primitives/AppText'
import './review-asset-card.css'

type ReviewAssetCardProps = {
  title: string
  icon?: string
  action?: ReactNode
  children: ReactNode
}

export default function ReviewAssetCard({
  title,
  icon,
  action,
  children,
}: ReviewAssetCardProps) {
  return (
    <section className="review-asset-card">
      <header className="review-asset-card__header">
        <div className="review-asset-card__title">
          {icon ? <IonIcon aria-hidden="true" className="review-asset-card__icon" icon={icon} /> : null}
          <AppText intent="label">{title}</AppText>
        </div>
        {action ? <div className="review-asset-card__action">{action}</div> : null}
      </header>
      <div className="review-asset-card__body">{children}</div>
    </section>
  )
}
