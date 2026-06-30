import { useId, useRef, type InputHTMLAttributes, type KeyboardEvent } from 'react'
import AppText from './AppText'
import { scrollFieldIntoKeyboardSafeView } from './scrollFieldIntoKeyboardSafeView'
import './input.css'

const FORM_FIELD_SELECTOR = '[data-app-form-field-control="true"]'

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
  onDone?: () => void
  autoCapitalize?: InputHTMLAttributes<HTMLInputElement>['autoCapitalize']
  autoCorrect?: string
  autoComplete?: string
  spellCheck?: boolean
  enterKeyHint?: InputHTMLAttributes<HTMLInputElement>['enterKeyHint']
}

function getUsableFormFields(currentField: HTMLElement) {
  const root = currentField.closest('form') ?? document
  return Array.from(root.querySelectorAll<HTMLElement>(FORM_FIELD_SELECTOR)).filter((field) => {
    if (field.hasAttribute('disabled')) return false
    if (field.getAttribute('aria-disabled') === 'true') return false
    return true
  })
}

function focusField(field: HTMLElement) {
  field.focus({ preventScroll: true })
  const wrapper = field.closest<HTMLElement>('.app-input')
  requestAnimationFrame(() => {
    void scrollFieldIntoKeyboardSafeView(wrapper ?? field)
  })
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
  onDone,
  autoCapitalize,
  autoCorrect,
  autoComplete,
  spellCheck,
  enterKeyHint,
}: AppInputProps) {
  const generatedId = useId()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const baseId = fieldId ?? generatedId
  const labelId = `${baseId}-label`
  const descriptionId = error
    ? `${baseId}-error`
    : helpText
      ? `${baseId}-help`
      : undefined
  const labelNoteId = labelNote ? `${baseId}-note` : undefined
  const describedBy = [labelNoteId, descriptionId].filter(Boolean).join(' ') || undefined

  function handleFocus() {
    requestAnimationFrame(() => {
      void scrollFieldIntoKeyboardSafeView(wrapperRef.current)
    })
    window.setTimeout(() => {
      void scrollFieldIntoKeyboardSafeView(wrapperRef.current)
    }, 350)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    if (enterKeyHint === 'done') {
      event.preventDefault()
      event.currentTarget.blur()
      onDone?.()
      return
    }
    if (enterKeyHint !== 'next') return

    const fields = getUsableFormFields(event.currentTarget)
    const currentIndex = fields.indexOf(event.currentTarget)
    const nextField = fields[currentIndex + 1]
    if (!nextField) return

    event.preventDefault()
    focusField(nextField)
  }

  return (
    <div
      className={`app-input${error ? ' app-input--error' : ''}`}
      data-field-id={fieldId}
      ref={wrapperRef}
    >
      <span className="app-sr-only" id={labelId}>
        {label}
      </span>
      <label className="app-input__label" htmlFor={baseId} aria-hidden="true">
        <span className="app-input__label-row">
          <AppText intent="label">
            {label}
            {required ? <span aria-hidden="true"> (Required)</span> : null}
          </AppText>
          {labelNote ? (
            <span className="app-input__label-note" aria-hidden="true">
              <AppText intent="caption">{labelNote}</AppText>
            </span>
          ) : null}
        </span>
      </label>
      {labelNote ? (
        <span className="app-sr-only" id={labelNoteId}>
          {labelNote}
        </span>
      ) : null}
      <input
        id={baseId}
        className="app-input__control"
        data-app-form-field-control="true"
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        autoComplete={autoComplete}
        spellCheck={spellCheck}
        enterKeyHint={enterKeyHint}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        required={required}
        aria-labelledby={labelId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
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
