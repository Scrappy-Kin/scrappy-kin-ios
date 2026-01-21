import type { ReactNode } from 'react'
import AppText from './AppText'
import './surface.css'

type AppCardProps = {
  title?: string
  actions?: ReactNode
  children: ReactNode
}

export default function AppCard({ title, actions, children }: AppCardProps) {
  const hasHeader = Boolean(title || actions)

  return (
    <section className={`app-card${hasHeader ? ' app-card--with-header' : ''}`}>
      {hasHeader && (
        <header className="app-card__header">
          {title ? <AppText intent="label">{title}</AppText> : <span />}
          {actions ? <div className="app-card__actions">{actions}</div> : null}
        </header>
      )}
      <div className="app-card__body">{children}</div>
    </section>
  )
}
