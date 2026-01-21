import { IonIcon } from '@ionic/react'
import './icon.css'

type IconSize = 'sm' | 'md' | 'lg'
type IconTone = 'neutral' | 'primary' | 'danger'

type AppIconProps = {
  icon: string
  size?: IconSize
  tone?: IconTone
  ariaLabel?: string
}

const sizeClassMap: Record<IconSize, string> = {
  sm: 'app-icon--sm',
  md: 'app-icon--md',
  lg: 'app-icon--lg',
}

const toneClassMap: Record<IconTone, string> = {
  neutral: 'text-secondary',
  primary: 'text-primary',
  danger: 'text-danger',
}

export default function AppIcon({ icon, size = 'md', tone = 'neutral', ariaLabel }: AppIconProps) {
  const classes = ['app-icon', sizeClassMap[size], toneClassMap[tone]].join(' ')

  return (
    <IonIcon className={classes} aria-label={ariaLabel} aria-hidden={!ariaLabel} icon={icon} />
  )
}
