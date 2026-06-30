import { IonButton, IonSpinner } from '@ionic/react'
import type { ReactNode } from 'react'
import './button.css'

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

type AppButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  softDisabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  accessibilityLabel?: string
  accessibilityDescriptionId?: string
  onClick?: () => void
  iconStart?: ReactNode
  iconEnd?: ReactNode
  children: ReactNode
}

const variantStyles: Record<ButtonVariant, { color: 'primary' | 'danger'; fill: 'solid' | 'outline' | 'clear' }> = {
  primary: { color: 'primary', fill: 'solid' },
  secondary: { color: 'primary', fill: 'outline' },
  destructive: { color: 'danger', fill: 'solid' },
  ghost: { color: 'primary', fill: 'clear' },
}

export default function AppButton({
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  softDisabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
  accessibilityDescriptionId,
  onClick,
  iconStart,
  iconEnd,
  children,
}: AppButtonProps) {
  const { color, fill } = variantStyles[variant]
  const classes = [
    'app-button',
    `app-button--${size}`,
    fullWidth ? 'app-button--full' : '',
    softDisabled ? 'app-button--soft-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <IonButton
      className={classes}
      color={color}
      fill={fill}
      expand={fullWidth ? 'block' : undefined}
      disabled={disabled || loading}
      type={type}
      onClick={onClick}
      aria-busy={loading}
      aria-disabled={softDisabled || disabled || loading}
      aria-label={accessibilityLabel}
      aria-describedby={accessibilityDescriptionId}
    >
      {loading ? (
        <IonSpinner className="app-button__spinner" name="lines-small" />
      ) : (
        iconStart && <span className="app-button__icon app-button__icon--start">{iconStart}</span>
      )}
      <span className="app-button__label">{children}</span>
      {!loading && iconEnd ? (
        <span className="app-button__icon app-button__icon--end">{iconEnd}</span>
      ) : null}
    </IonButton>
  )
}
