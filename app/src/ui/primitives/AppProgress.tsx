import { IonProgressBar } from '@ionic/react'
import AppText from './AppText'
import './progress.css'

type AppProgressProps = {
  current: number
  total: number
  label?: string
  tone?: 'default' | 'success'
  accessibilityHidden?: boolean
  accessibilityLabel?: string
  accessibilityValueText?: string
}

export default function AppProgress({
  current,
  total,
  label,
  tone = 'default',
  accessibilityHidden = false,
  accessibilityLabel = 'Progress',
  accessibilityValueText,
}: AppProgressProps) {
  const value = total > 0 ? Math.min(current / total, 1) : 0
  const roundedPercent = Math.round(value * 100)
  // If visible text already explains progress, avoid a duplicate percent stop in VoiceOver.
  const hideVisualBarFromAccessibility = accessibilityHidden || Boolean(label)

  return (
    <div
      className={`app-progress app-progress--${tone}`}
      aria-hidden={accessibilityHidden || undefined}
    >
      {label ? <AppText intent="label">{label}</AppText> : null}
      <IonProgressBar
        value={value}
        aria-hidden={hideVisualBarFromAccessibility || undefined}
        aria-label={hideVisualBarFromAccessibility ? undefined : accessibilityLabel}
        aria-valuetext={
          hideVisualBarFromAccessibility
            ? undefined
            : accessibilityValueText ?? `${roundedPercent}%`
        }
      />
    </div>
  )
}
