import { IonInput } from '@ionic/react'
import type { InputHTMLAttributes } from 'react'
import AppText from './AppText'
import './input.css'

type AppInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
  error?: string
  helpText?: string
}

export default function AppInput({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  error,
  helpText,
}: AppInputProps) {
  return (
    <div className={`app-input${error ? ' app-input--error' : ''}`}>
      <AppText intent="label">{label}</AppText>
      <IonInput
        className="app-input__control"
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
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
