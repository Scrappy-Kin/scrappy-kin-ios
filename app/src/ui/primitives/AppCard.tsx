import type { ReactNode } from 'react'
import AppLabelRow from './AppLabelRow'
import './surface.css'

type AppCardProps = {
  title?: string
  actions?: ReactNode
  children: ReactNode
}

export default function AppCard({ title, actions, children }: AppCardProps) {
  const hasHeader = Boolean(title || actions)

  return (
    <section className="app-card">
      {hasHeader && (
        <header className="app-card__header">
          {title ? (
            <AppLabelRow className="app-card__title">{title}</AppLabelRow>
          ) : (
            <span />
          )}
          {actions ? <div className="app-card__actions">{actions}</div> : null}
        </header>
      )}
      <div className="app-card__body">{children}</div>
    </section>
  )
}
