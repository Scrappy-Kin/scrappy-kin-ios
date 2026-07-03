import type { ReactNode } from 'react'
import AppSectionLabel from './AppSectionLabel'
import './list.css'

type AppListProps = {
  header?: string
  children: ReactNode
}

export default function AppList({ header, children }: AppListProps) {
  return (
    <div className="app-list">
      {header ? (
        <div className="app-list__header">
          <AppSectionLabel>{header}</AppSectionLabel>
        </div>
      ) : null}
      <div className="app-list__items">{children}</div>
    </div>
  )
}
