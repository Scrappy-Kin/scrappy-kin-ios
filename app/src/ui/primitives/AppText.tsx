import { IonText } from '@ionic/react'
import type { ReactNode } from 'react'
import './typography.css'

type TextIntent = 'body' | 'supporting' | 'caption' | 'label'
type TextTone = 'default' | 'danger'

type AppTextProps = {
  intent?: TextIntent
  emphasis?: boolean
  tone?: TextTone
  truncate?: boolean
  children: ReactNode
}

const intentClassMap: Record<TextIntent, string> = {
  body: 't-base lh-md w-400 text-primary',
  supporting: 't-base lh-md w-400 text-secondary',
  caption: 't-sm lh-sm w-400 text-secondary',
  label: 't-sm lh-sm w-500 text-secondary uc ls-wide',
}

export default function AppText({
  intent = 'body',
  emphasis = false,
  tone = 'default',
  truncate = false,
  children,
}: AppTextProps) {
  const classes = [
    'app-text',
    intentClassMap[intent],
    emphasis ? 'w-500' : null,
    tone === 'danger' ? 'text-danger' : null,
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
