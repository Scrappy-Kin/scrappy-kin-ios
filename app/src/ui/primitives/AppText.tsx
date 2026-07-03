import { IonText } from '@ionic/react'
import type { ReactNode } from 'react'
import './typography.css'

type TextIntent = 'body' | 'supporting' | 'caption' | 'label' | 'intro'
type TextTone = 'default' | 'danger'

type AppTextProps = {
  id?: string
  intent?: TextIntent
  emphasis?: boolean
  tone?: TextTone
  truncate?: boolean
  accessibilityLabel?: string
  accessibilityHidden?: boolean
  className?: string
  children: ReactNode
}

const intentClassMap: Record<TextIntent, string> = {
  body: 't-base lh-md w-400 text-primary',
  supporting: 't-base lh-md w-400 text-secondary',
  caption: 't-sm lh-sm w-400 text-secondary',
  label: 't-sm lh-sm w-600 text-secondary uc ls-wide',
  intro: 't-sm lh-sm w-500 text-secondary',
}

export default function AppText({
  id,
  intent = 'body',
  emphasis = false,
  tone = 'default',
  truncate = false,
  accessibilityLabel,
  accessibilityHidden = false,
  className,
  children,
}: AppTextProps) {
  const hasAccessibilityLabel = accessibilityLabel != null && accessibilityLabel.trim() !== ''
  const classes = [
    'app-text',
    intentClassMap[intent],
    emphasis ? 'w-500' : null,
    tone === 'danger' ? 'text-danger' : null,
    truncate ? 'app-text--truncate' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <IonText
      id={id}
      className={classes}
      aria-label={hasAccessibilityLabel ? accessibilityLabel : undefined}
      aria-hidden={accessibilityHidden}
      role={hasAccessibilityLabel ? 'text' : undefined}
    >
      <span className="app-text__content" aria-hidden={accessibilityHidden || hasAccessibilityLabel}>
        {children}
      </span>
    </IonText>
  )
}
