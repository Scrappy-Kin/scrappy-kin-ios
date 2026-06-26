import { IonIcon } from '@ionic/react'
import { isValidElement, useId, type ReactNode } from 'react'
import { alertCircle, checkmarkCircle, informationCircle, warning } from 'ionicons/icons'
import AppText from './AppText'
import './notice.css'

type NoticeVariant = 'info' | 'warning' | 'error' | 'success'

type AppNoticeProps = {
  variant: NoticeVariant
  title?: string
  children: ReactNode
  actions?: ReactNode
  accessibilityLabel?: string
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

type AccessibleElementProps = {
  'aria-label'?: string
  children?: ReactNode
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

function extractAccessibleText(node: ReactNode): string[] {
  if (typeof node === 'string' || typeof node === 'number') {
    const text = normalizeText(String(node))
    return text ? [text] : []
  }

  if (Array.isArray(node)) {
    return node.flatMap(extractAccessibleText)
  }

  if (isValidElement<AccessibleElementProps>(node)) {
    const ariaLabel = node.props['aria-label']
    if (ariaLabel) {
      return [normalizeText(ariaLabel)]
    }

    return extractAccessibleText(node.props.children)
  }

  return []
}

function buildNoticeAccessibilityLabel(title: string | undefined, children: ReactNode) {
  const parts = [
    title ? normalizeText(title) : '',
    ...extractAccessibleText(children),
  ].filter(Boolean)

  return parts.length > 0 ? parts.join('. ') : undefined
}

export default function AppNotice({
  variant,
  title,
  children,
  actions,
  accessibilityLabel,
}: AppNoticeProps) {
  const tone = variantTone[variant]
  const icon = variantIcon[variant]
  const role = variant === 'error' ? 'alert' : 'status'
  const announcementId = useId()
  const noticeAccessibilityLabel =
    accessibilityLabel ?? buildNoticeAccessibilityLabel(title, children)

  return (
    <section
      className={`app-notice app-notice--${variant}`}
      role={role}
      aria-live={role === 'alert' ? 'assertive' : 'polite'}
      aria-labelledby={noticeAccessibilityLabel ? announcementId : undefined}
    >
      {noticeAccessibilityLabel ? (
        <span id={announcementId} className="app-notice__sr-only">
          {noticeAccessibilityLabel}
        </span>
      ) : null}
      {title ? (
        <div className="app-notice__title">
          <IonIcon aria-hidden="true" className={`app-notice__icon app-notice__icon--${variant}`} icon={icon} />
          <AppText intent="label" tone={tone} accessibilityHidden>
            {title}
          </AppText>
        </div>
      ) : null}
      <AppText intent="body" tone={tone} accessibilityHidden={Boolean(noticeAccessibilityLabel)}>
        {children}
      </AppText>
      {actions ? <div className="app-notice__actions">{actions}</div> : null}
    </section>
  )
}
