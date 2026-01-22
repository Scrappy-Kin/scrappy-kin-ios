import { IonIcon } from '@ionic/react'
import type { ReactNode } from 'react'
import { chevronForward } from 'ionicons/icons'
import AppText from './AppText'
import './list.css'

type AppListRowProps = {
  title: ReactNode
  description?: string
  left?: ReactNode
  right?: ReactNode
  onClick?: () => void
  tone?: 'neutral' | 'primary' | 'danger'
  disabled?: boolean
  emphasis?: boolean
}

const toneClassMap: Record<NonNullable<AppListRowProps['tone']>, string> = {
  neutral: 'text-primary',
  primary: 'text-primary',
  danger: 'text-danger',
}

export default function AppListRow({
  title,
  description,
  left,
  right,
  onClick,
  tone = 'neutral',
  disabled = false,
  emphasis = true,
}: AppListRowProps) {
  const classes = [
    'app-list__row',
    onClick ? 'app-list__row--interactive' : null,
    disabled ? 'app-list__row--disabled' : null,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {left ? <div className="app-list__left">{left}</div> : null}
      <div className="app-list__content">
        <AppText intent="body" emphasis={emphasis}>
          <span className={`app-list__title ${toneClassMap[tone]}`}>{title}</span>
        </AppText>
        {description ? (
          <AppText intent="supporting">
            <span className="app-list__description">{description}</span>
          </AppText>
        ) : null}
      </div>
      {right || onClick ? (
        <div className="app-list__right">
          {right ?? <IonIcon aria-hidden="true" className="app-list__chevron" icon={chevronForward} />}
        </div>
      ) : null}
    </>
  )

  if (onClick) {
    return (
      <button className={classes} type="button" onClick={disabled ? undefined : onClick} disabled={disabled}>
        {content}
      </button>
    )
  }

  return (
    <div className={classes} aria-disabled={disabled || undefined}>
      {content}
    </div>
  )
}
