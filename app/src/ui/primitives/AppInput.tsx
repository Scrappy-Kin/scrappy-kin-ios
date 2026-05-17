import { useId, useRef, type InputHTMLAttributes } from 'react'
import AppText from './AppText'
import { scrollFieldIntoKeyboardSafeView } from './scrollFieldIntoKeyboardSafeView'
import './input.css'

type AppInputProps = {
  label: string
  labelNote?: string
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
  labelNote,
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
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const baseId = fieldId ?? generatedId
  const descriptionId = error
    ? `${baseId}-error`
    : helpText
      ? `${baseId}-help`
      : undefined
  const visibleLabel = required ? `${label} (Required)` : label

  function handleFocus() {
    requestAnimationFrame(() => {
      void scrollFieldIntoKeyboardSafeView(wrapperRef.current)
    })
    window.setTimeout(() => {
      void scrollFieldIntoKeyboardSafeView(wrapperRef.current)
    }, 350)
  }

  return (
    <div
      className={`app-input${error ? ' app-input--error' : ''}`}
      data-field-id={fieldId}
      ref={wrapperRef}
    >
      <label className="app-input__label" htmlFor={baseId}>
        <span className="app-input__label-row">
          <AppText intent="label">{visibleLabel}</AppText>
          {labelNote ? (
            <span className="app-input__label-note">
              <AppText intent="caption">{labelNote}</AppText>
            </span>
          ) : null}
        </span>
      </label>
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
        onFocus={handleFocus}
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
