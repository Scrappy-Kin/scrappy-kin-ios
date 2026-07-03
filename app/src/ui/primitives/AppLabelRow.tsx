import type { ReactNode } from 'react'
import AppIcon from './AppIcon'
import AppText from './AppText'
import './label-row.css'

type LabelRowTone = 'default' | 'danger'
type LabelRowIconTone = 'neutral' | 'primary' | 'danger'

type AppLabelRowProps = {
  children: string
  icon?: string
  tone?: LabelRowTone
  iconTone?: LabelRowIconTone
  id?: string
  className?: string
  accessibilityLabel?: string
  touchTarget?: boolean
}

export default function AppLabelRow({
  children,
  icon,
  tone = 'default',
  iconTone,
  id,
  className,
  accessibilityLabel,
  touchTarget = false,
}: AppLabelRowProps) {
  const classes = [
    'app-label-row',
    tone === 'danger' ? 'app-label-row--danger' : null,
    touchTarget ? 'app-label-row--touch-target' : null,
    className,
  ].filter(Boolean).join(' ')

  const iconNode: ReactNode = icon ? (
    <AppIcon icon={icon} size="sm" tone={iconTone ?? (tone === 'danger' ? 'danger' : 'neutral')} />
  ) : null

  return (
    <div
      id={id}
      className={classes}
      role="text"
      aria-label={accessibilityLabel ?? children}
    >
      {iconNode}
      <AppText intent="label" tone={tone} accessibilityHidden>
        {children}
      </AppText>
    </div>
  )
}
