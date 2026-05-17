import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import disclosureQuestionIcon from '../../assets/ui/disclosure-question.svg'
import disclosureToggleIcon from '../../assets/ui/disclosure-toggle.svg'
import AppButton from '../primitives/AppButton'
import AppSheet from '../primitives/AppSheet'
import AppText from '../primitives/AppText'
import './disclosure-sheet-row.css'

type DisclosureSheetRowProps = {
  label: string
  sheetTitle?: string
  sheetBody: ReactNode
  accessibilityLabel?: string
  closeLabel?: string
}

export default function DisclosureSheetRow({
  label,
  sheetTitle,
  sheetBody,
  accessibilityLabel,
  closeLabel = 'Close',
}: DisclosureSheetRowProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const closeSheet = () => {
    setOpen(false)
    requestAnimationFrame(() => buttonRef.current?.focus())
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="disclosure-sheet-row"
        aria-label={accessibilityLabel ?? label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <img
          className="disclosure-sheet-row__icon"
          src={disclosureQuestionIcon}
          alt=""
          aria-hidden="true"
        />
        <span className="disclosure-sheet-row__label">
          <AppText intent="body">{label}</AppText>
        </span>
        <img
          className="disclosure-sheet-row__chevron"
          src={disclosureToggleIcon}
          alt=""
          aria-hidden="true"
        />
      </button>
      <AppSheet title={sheetTitle ?? label} open={open} onDismiss={closeSheet}>
        {sheetBody}
        <AppButton variant="secondary" onClick={closeSheet}>
          {closeLabel}
        </AppButton>
      </AppSheet>
    </>
  )
}
