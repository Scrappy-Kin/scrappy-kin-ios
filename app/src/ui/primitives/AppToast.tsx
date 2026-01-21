import { IonToast } from '@ionic/react'

type ToastVariant = 'neutral' | 'success' | 'error'

type AppToastProps = {
  open: boolean
  onDismiss: () => void
  variant?: ToastVariant
  message: string
  durationMs?: number
}

const variantColor: Record<ToastVariant, 'primary' | 'danger'> = {
  neutral: 'primary',
  success: 'primary',
  error: 'danger',
}

export default function AppToast({
  open,
  onDismiss,
  variant = 'neutral',
  message,
  durationMs = 2400,
}: AppToastProps) {
  return (
    <IonToast
      isOpen={open}
      onDidDismiss={onDismiss}
      color={variantColor[variant]}
      message={message}
      duration={durationMs}
      position="bottom"
    />
  )
}
