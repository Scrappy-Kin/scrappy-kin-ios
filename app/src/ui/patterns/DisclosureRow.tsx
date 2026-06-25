import { useId, useState, type ReactNode } from 'react'
import disclosureQuestionIcon from '../../assets/ui/disclosure-question.svg'
import disclosureToggleIcon from '../../assets/ui/disclosure-toggle.svg'
import AppText from '../primitives/AppText'
import './disclosure-row.css'

type DisclosureRowProps = {
  label: string
  children: ReactNode
  defaultOpen?: boolean
}

export default function DisclosureRow({
  label,
  children,
  defaultOpen = false,
}: DisclosureRowProps) {
  const generatedId = useId()
  const [open, setOpen] = useState(defaultOpen)
  const contentId = `${generatedId}-content`

  return (
    <div className={`disclosure-row${open ? ' disclosure-row--open' : ''}`}>
      <button
        type="button"
        className="disclosure-row__summary"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
      >
        <img
          className="disclosure-row__icon"
          src={disclosureQuestionIcon}
          alt=""
          aria-hidden="true"
        />
        <span className="disclosure-row__label">
          <AppText intent="body">{label}</AppText>
        </span>
        <img
          className="disclosure-row__chevron"
          src={disclosureToggleIcon}
          alt=""
          aria-hidden="true"
        />
      </button>
      <div id={contentId} className="disclosure-row__content" hidden={!open}>
        {children}
      </div>
    </div>
  )
}
