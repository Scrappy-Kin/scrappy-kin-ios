import type { ReactNode } from 'react'
import './segmented-card.css'

type AppSegmentedCardProps = {
  children: ReactNode
}

type AppSegmentedCardSectionProps = {
  children: ReactNode
  accessibilityLabel?: string
}

export function AppSegmentedCardSection({
  children,
  accessibilityLabel,
}: AppSegmentedCardSectionProps) {
  return (
    <div
      className="app-segmented-card__section"
      role={accessibilityLabel ? 'group' : undefined}
      aria-label={accessibilityLabel}
    >
      {children}
    </div>
  )
}

export default function AppSegmentedCard({ children }: AppSegmentedCardProps) {
  return <section className="app-segmented-card">{children}</section>
}
