import { useId, useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react'
import AppText from './AppText'
import { scrollFieldIntoKeyboardSafeView } from './scrollFieldIntoKeyboardSafeView'
import './input.css'

type AppTextareaProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  fieldId?: string
  error?: string
  helpText?: string
  enterKeyHint?: TextareaHTMLAttributes<HTMLTextAreaElement>['enterKeyHint']
}

export default function AppTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows,
  fieldId,
  error,
  helpText,
  enterKeyHint,
}: AppTextareaProps) {
  const generatedId = useId()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const baseId = fieldId ?? generatedId
  const descriptionId = error
    ? `${baseId}-error`
    : helpText
      ? `${baseId}-help`
      : undefined

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [value])

  function handleFocus() {
    requestAnimationFrame(() => {
      void scrollFieldIntoKeyboardSafeView(wrapperRef.current)
    })
    window.setTimeout(() => {
      void scrollFieldIntoKeyboardSafeView(wrapperRef.current)
    }, 350)
  }

  return (
    <div className={`app-input${error ? ' app-input--error' : ''}`} data-field-id={fieldId} ref={wrapperRef}>
      <label className="app-input__label" htmlFor={baseId} aria-hidden="true">
        <AppText intent="label">{label}</AppText>
      </label>
      <textarea
        ref={textareaRef}
        id={baseId}
        className="app-input__control"
        data-app-form-field-control="true"
        value={value}
        placeholder={placeholder}
        rows={rows}
        enterKeyHint={enterKeyHint}
        style={{
          minHeight: rows
            ? `calc(${rows} * var(--line-height-control) + (2 * var(--space-3)))`
            : undefined,
        }}
        onChange={(event) => onChange(event.target.value)}
        onFocus={handleFocus}
        aria-label={label}
        aria-invalid={Boolean(error)}
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
