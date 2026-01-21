import { IonIcon } from '@ionic/react'
import type { ReactNode } from 'react'
import { alertCircle, checkmarkCircle, informationCircle, warning } from 'ionicons/icons'
import AppText from './AppText'
import './notice.css'

type NoticeVariant = 'info' | 'warning' | 'error' | 'success'

type AppNoticeProps = {
  variant: NoticeVariant
  title?: string
  children: ReactNode
  actions?: ReactNode
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

export default function AppNotice({ variant, title, children, actions }: AppNoticeProps) {
  const tone = variantTone[variant]
  const icon = variantIcon[variant]

  return (
    <section className={`app-notice app-notice--${variant}`}>
      {title ? (
        <div className="app-notice__title">
          <IonIcon aria-hidden="true" className={`app-notice__icon app-notice__icon--${variant}`} icon={icon} />
          <AppText intent="label" tone={tone}>
            {title}
          </AppText>
        </div>
      ) : null}
      <AppText intent="body" tone={tone}>
        {children}
      </AppText>
      {actions ? <div className="app-notice__actions">{actions}</div> : null}
    </section>
  )
}
