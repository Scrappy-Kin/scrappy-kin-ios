import { IonText } from '@ionic/react'
import type { ReactNode } from 'react'
import './typography.css'

type TextVariant = 'body' | 'caption' | 'label' | 'muted'
type TextTone = 'default' | 'muted' | 'danger'

type AppTextProps = {
  variant?: TextVariant
  tone?: TextTone
  truncate?: boolean
  children: ReactNode
}

const variantClassMap: Record<TextVariant, string> = {
  body: 'type-body',
  caption: 'type-caption',
  label: 'type-caption-tight',
  muted: 'type-caption',
}

const toneClassMap: Record<TextTone, string | null> = {
  default: null,
  muted: 'app-text--muted',
  danger: 'app-text--danger',
}

export default function AppText({
  variant = 'body',
  tone = 'default',
  truncate = false,
  children,
}: AppTextProps) {
  const classes = [
    'app-text',
    variantClassMap[variant],
    toneClassMap[tone],
    truncate ? 'app-text--truncate' : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <IonText className={classes}>
      <span className="app-text__content">{children}</span>
    </IonText>
  )
}
