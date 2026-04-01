import type { ReactNode } from 'react'
import './segmented-card.css'

type AppSegmentedCardProps = {
  children: ReactNode
}

type AppSegmentedCardSectionProps = {
  children: ReactNode
}

export function AppSegmentedCardSection({ children }: AppSegmentedCardSectionProps) {
  return <div className="app-segmented-card__section">{children}</div>
}

export default function AppSegmentedCard({ children }: AppSegmentedCardProps) {
  return <section className="app-segmented-card">{children}</section>
}
