import type { ReactNode } from 'react'
import './sticky-action.css'

type AppStickyActionProps = {
  children: ReactNode
}

export default function AppStickyAction({ children }: AppStickyActionProps) {
  return <div className="app-sticky-action">{children}</div>
}
