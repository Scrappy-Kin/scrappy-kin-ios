import type { ReactNode } from 'react'
import AppNotice from './AppNotice'

type ActionNoticeVariant = 'info' | 'warning' | 'error' | 'success'

type AppActionNoticeProps = {
  variant?: ActionNoticeVariant
  title: string
  children: ReactNode
  actions?: ReactNode
  live?: 'polite' | 'assertive' | false
}

export default function AppActionNotice({
  variant = 'success',
  title,
  children,
  actions,
  live,
}: AppActionNoticeProps) {
  return (
    <AppNotice
      variant={variant}
      title={title}
      actions={actions}
      live={live ?? (variant === 'error' ? 'assertive' : 'polite')}
    >
      {children}
    </AppNotice>
  )
}
