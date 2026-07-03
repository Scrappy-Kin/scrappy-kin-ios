import type { ReactNode } from 'react'
import AppLabelRow from '../primitives/AppLabelRow'
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
        <AppLabelRow className="review-asset-card__title" icon={icon}>
          {title}
        </AppLabelRow>
        {action ? <div className="review-asset-card__action">{action}</div> : null}
      </header>
      <div className="review-asset-card__body">{children}</div>
    </section>
  )
}
