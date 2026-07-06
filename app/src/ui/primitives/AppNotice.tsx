import { useId, type ReactNode } from 'react'
import { alertCircle, checkmarkCircle, informationCircle, warning } from 'ionicons/icons'
import AppLabelRow from './AppLabelRow'
import AppText from './AppText'
import './notice.css'

type NoticeVariant = 'info' | 'warning' | 'error' | 'success'

type AppNoticeProps = {
  variant: NoticeVariant
  title?: string
  children: ReactNode
  actions?: ReactNode
  accessibilityLabel?: string
  live?: 'polite' | 'assertive' | false
}

const variantTone: Record<NoticeVariant, 'default' | 'danger'> = {
  info: 'default',
  warning: 'default',
  error: 'danger',
  success: 'default',
}

const variantIcon: Record<NoticeVariant, string> = {
  info: informationCircle,
  warning: warning,
  error: alertCircle,
  success: checkmarkCircle,
}

const variantIconTone: Record<NoticeVariant, 'neutral' | 'primary' | 'danger'> = {
  info: 'primary',
  warning: 'neutral',
  error: 'danger',
  success: 'primary',
}

export default function AppNotice({
  variant,
  title,
  children,
  actions,
  accessibilityLabel,
  live,
}: AppNoticeProps) {
  const tone = variantTone[variant]
  const icon = variantIcon[variant]
  const liveSetting = live ?? (variant === 'error' ? 'assertive' : false)
  const role = variant === 'error' ? 'alert' : liveSetting ? 'status' : undefined
  const generatedId = useId()
  const titleId = title ? `${generatedId}-title` : undefined
  const bodyId = `${generatedId}-body`
  const body =
    typeof children === 'string' ? (
      <AppText intent="body" tone={tone}>
        {children}
      </AppText>
    ) : (
      <div className={`app-notice__body app-notice__body--${tone}`}>{children}</div>
    )

  return (
    <section
      className={`app-notice app-notice--${variant}`}
      role={role}
      aria-live={liveSetting || undefined}
      aria-label={accessibilityLabel}
      aria-labelledby={accessibilityLabel ? undefined : titleId}
      aria-describedby={bodyId}
    >
      {title ? (
        <AppLabelRow
          id={titleId}
          className="app-notice__title"
          icon={icon}
          iconTone={variantIconTone[variant]}
          tone={tone}
          touchTarget
        >
          {title}
        </AppLabelRow>
      ) : null}
      <div id={bodyId}>{body}</div>
      {actions ? <div className="app-notice__actions">{actions}</div> : null}
    </section>
  )
}
