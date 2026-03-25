import { IonButton } from '@ionic/react'
import AppIcon from './AppIcon'
import './icon-button.css'

type IconButtonSize = 'sm' | 'md' | 'lg'
type IconButtonTone = 'primary' | 'danger'
type IconButtonVariant = 'outline' | 'ghost'

type AppIconButtonProps = {
  icon: string
  ariaLabel: string
  size?: IconButtonSize
  tone?: IconButtonTone
  variant?: IconButtonVariant
  disabled?: boolean
  onClick?: () => void
}

const sizeClassMap: Record<IconButtonSize, string> = {
  sm: 'app-icon-button--sm',
  md: 'app-icon-button--md',
  lg: 'app-icon-button--lg',
}

const toneColorMap: Record<IconButtonTone, 'primary' | 'danger'> = {
  primary: 'primary',
  danger: 'danger',
}

const iconSizeMap: Record<IconButtonSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
}

export default function AppIconButton({
  icon,
  ariaLabel,
  size = 'md',
  tone = 'primary',
  variant = 'outline',
  disabled = false,
  onClick,
}: AppIconButtonProps) {
  const classes = ['app-icon-button', sizeClassMap[size], `app-icon-button--${variant}`].join(' ')

  return (
    <IonButton
      className={classes}
      color={toneColorMap[tone]}
      fill={variant === 'ghost' ? 'clear' : 'outline'}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <AppIcon icon={icon} size={iconSizeMap[size]} />
    </IonButton>
  )
}
