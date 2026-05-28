import type { ReactNode } from 'react'
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
  return (
    <details className="disclosure-row" open={defaultOpen}>
      <summary className="disclosure-row__summary">
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
      </summary>
      <div className="disclosure-row__content">
        {children}
      </div>
    </details>
  )
}
