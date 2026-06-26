import { useRef, useState, type FocusEvent, type ReactNode } from 'react'
import { scrollFieldIntoKeyboardSafeView } from './scrollFieldIntoKeyboardSafeView'
import './form.css'

const FORM_FIELD_SELECTOR = '[data-app-form-field-control="true"]'

type AppFormProps = {
  children: ReactNode
  className?: string
}

function isUsableField(field: HTMLElement) {
  if (field.hasAttribute('disabled')) return false
  if (field.getAttribute('aria-disabled') === 'true') return false
  return true
}

export default function AppForm({ children, className }: AppFormProps) {
  const formRef = useRef<HTMLDivElement | null>(null)
  const toolbarPointerActiveRef = useRef(false)
  const [activeField, setActiveField] = useState<HTMLElement | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [fieldCount, setFieldCount] = useState(0)

  function getFields() {
    return Array.from(
      formRef.current?.querySelectorAll<HTMLElement>(FORM_FIELD_SELECTOR) ?? [],
    ).filter(isUsableField)
  }

  function setActiveFromField(field: HTMLElement) {
    const fields = getFields()
    const index = fields.indexOf(field)
    setActiveField(field)
    setActiveIndex(index)
    setFieldCount(fields.length)
  }

  function handleFocusCapture(event: FocusEvent<HTMLDivElement>) {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (!target.matches(FORM_FIELD_SELECTOR)) return
    setActiveFromField(target)
  }

  function handleBlurCapture() {
    window.setTimeout(() => {
      if (toolbarPointerActiveRef.current) return
      const focused = document.activeElement
      if (focused && formRef.current?.contains(focused)) return
      setActiveField(null)
      setActiveIndex(-1)
    }, 0)
  }

  function moveFocus(direction: -1 | 1) {
    const fields = getFields()
    const currentIndex = activeField ? fields.indexOf(activeField) : activeIndex
    const nextField = fields[currentIndex + direction]
    if (!nextField) return

    nextField.focus({ preventScroll: true })
    setActiveFromField(nextField)
    const wrapper = nextField.closest<HTMLElement>('.app-input')
    requestAnimationFrame(() => {
      void scrollFieldIntoKeyboardSafeView(wrapper ?? nextField)
    })
  }

  function doneEditing() {
    activeField?.blur()
    setActiveField(null)
    setActiveIndex(-1)
  }

  function handleToolbarPointerDown() {
    toolbarPointerActiveRef.current = true
  }

  function handleToolbarPointerUp() {
    window.setTimeout(() => {
      toolbarPointerActiveRef.current = false
    }, 0)
  }

  const hasActiveField = Boolean(activeField)
  const canMovePrevious = activeIndex > 0
  const canMoveNext = activeIndex >= 0 && activeIndex < fieldCount - 1
  const classes = ['app-form', className].filter(Boolean).join(' ')

  return (
    <div
      className={classes}
      ref={formRef}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      {children}
      {hasActiveField ? (
        <div
          className="app-form-editing-bar"
          role="toolbar"
          aria-label="Text field editing controls"
          onPointerDown={handleToolbarPointerDown}
          onPointerUp={handleToolbarPointerUp}
          onPointerCancel={handleToolbarPointerUp}
        >
          <button
            className="app-form-editing-bar__button"
            type="button"
            onClick={() => moveFocus(-1)}
            disabled={!canMovePrevious}
          >
            Previous
          </button>
          <button
            className="app-form-editing-bar__button"
            type="button"
            onClick={() => moveFocus(1)}
            disabled={!canMoveNext}
          >
            Next
          </button>
          <button
            className="app-form-editing-bar__button app-form-editing-bar__button--primary"
            type="button"
            onClick={doneEditing}
          >
            Done editing
          </button>
        </div>
      ) : null}
    </div>
  )
}
