import { useId, type InputHTMLAttributes } from 'react'
import AppText from './AppText'
import './input.css'

type AppInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: InputHTMLAttributes<HTMLInputElement>['type']
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
  maxLength?: number
  fieldId?: string
  required?: boolean
  error?: string
  helpText?: string
  onBlur?: () => void
  autoCapitalize?: InputHTMLAttributes<HTMLInputElement>['autoCapitalize']
  autoCorrect?: string
  autoComplete?: string
  spellCheck?: boolean
}

export default function AppInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  maxLength,
  fieldId,
  required = false,
  error,
  helpText,
  onBlur,
  autoCapitalize,
  autoCorrect,
  autoComplete,
  spellCheck,
}: AppInputProps) {
  const generatedId = useId()
  const baseId = fieldId ?? generatedId
  const descriptionId = error
    ? `${baseId}-error`
    : helpText
      ? `${baseId}-help`
      : undefined

  return (
    <div
      className={`app-input${error ? ' app-input--error' : ''}`}
      data-field-id={fieldId}
    >
      <AppText intent="label">
        <>
          {label}
          {required ? <span className="app-input__required">*</span> : null}
        </>
      </AppText>
      <input
        id={baseId}
        className="app-input__control"
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        autoComplete={autoComplete}
        spellCheck={spellCheck}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-label={label}
        aria-invalid={Boolean(error)}
        aria-required={required}
        aria-describedby={descriptionId}
        aria-errormessage={error ? descriptionId : undefined}
      />
      {error ? (
        <div className="app-input__error" id={descriptionId}>
          <AppText intent="caption" tone="danger">
            {error}
          </AppText>
        </div>
      ) : helpText ? (
        <div id={descriptionId}>
          <AppText intent="caption">{helpText}</AppText>
        </div>
      ) : null}
    </div>
  )
}
