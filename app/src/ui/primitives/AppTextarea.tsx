import { IonTextarea } from '@ionic/react'
import AppText from './AppText'
import './input.css'

type AppTextareaProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  error?: string
  helpText?: string
}

export default function AppTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows,
  error,
  helpText,
}: AppTextareaProps) {
  return (
    <div className={`app-input${error ? ' app-input--error' : ''}`}>
      <AppText intent="label">{label}</AppText>
      <IonTextarea
        className="app-input__control"
        value={value}
        placeholder={placeholder}
        rows={rows}
        onIonChange={(event) => onChange(event.detail.value ?? '')}
        aria-invalid={Boolean(error)}
      />
      {error ? (
        <AppText intent="caption" tone="danger">
          {error}
        </AppText>
      ) : helpText ? (
        <AppText intent="caption">{helpText}</AppText>
      ) : null}
    </div>
  )
}
