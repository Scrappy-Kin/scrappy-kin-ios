import type { ReactNode } from 'react'
import AppText from './AppText'
import './list.css'

type AppListProps = {
  header?: string
  children: ReactNode
}

export default function AppList({ header, children }: AppListProps) {
  return (
    <section className="app-list" aria-label={header || undefined}>
      {header ? (
        <div className="app-list__header" aria-hidden="true">
          <AppText intent="label">{header}</AppText>
        </div>
      ) : null}
      <div className="app-list__items">{children}</div>
    </section>
  )
}
