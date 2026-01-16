import { IonButton, IonSpinner } from '@ionic/react'
import type { ReactNode } from 'react'
import './button.css'

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

type AppButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
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
  disabled = false,
  loading = false,
  onClick,
  iconStart,
  iconEnd,
  children,
}: AppButtonProps) {
  const { color, fill } = variantStyles[variant]
  const classes = ['app-button', `app-button--${size}`].join(' ')

  return (
    <IonButton
      className={classes}
      color={color}
      fill={fill}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
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
